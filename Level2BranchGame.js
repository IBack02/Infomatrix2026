// Level2BranchGame.js
// 2-деңгей: 2 веткаға бөлу (горизонтальные ряды + вертикальный скролл страницы)
// ✅ Вся страница скроллится вверх/вниз (один общий ScrollView)
// ✅ Ряды (1-нұсқа / Карталар / 2-нұсқа) — горизонтальные ScrollView
// ✅ 1 и 2 варианты "раскрыты" сразу: отображаются как поля-колонки (всегда видны, не сворачиваются)
// ✅ Перетаскивание: long-press → ведёшь палец, карточка “летит” поверх, ряды динамично перестраиваются
// ✅ Подсказка убрана, шрифт авто-подгоняется, чтобы строки не “проваливались”
// ⚠️ Требует level2Stories.js: LEVEL2_STORIES + buildLevel2Deck(story) как ты показывал

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  Modal,
  StatusBar,
} from "react-native";

import { LEVEL2_STORIES, buildLevel2Deck } from "./level2/level2Stories";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CARD_W = Math.min(380, SCREEN_W * 0.82);
const CARD_H = 156;
const CARD_GAP = 12;

const TOPBAR_H = 56;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch (e) {
    // ignore
  }
}

export default function Level2BranchGame({ storyId, onBack }) {
  const story = useMemo(() => LEVEL2_STORIES?.[storyId] || null, [storyId]);

  const allCards = useMemo(() => {
    if (!story) return [];
    return buildLevel2Deck(story); // shuffled deck
  }, [story]);

  const byId = useMemo(() => {
    const m = {};
    for (const c of allCards) m[c.id] = c;
    return m;
  }, [allCards]);

  // ===== старт: всё в центре =====
  const [centerIds, setCenterIds] = useState(() => allCards.map((c) => c.id));
  const [topIds, setTopIds] = useState([]); // 1-нұсқа
  const [bottomIds, setBottomIds] = useState([]); // 2-нұсқа

  useEffect(() => {
    setCenterIds(allCards.map((c) => c.id));
    setTopIds([]);
    setBottomIds([]);
  }, [allCards]);

  // ===== UI: диалог проверки =====
  const [result, setResult] = useState(null); // "ok" | "no" | null

  // ===== измерение root в окне =====
  const rootRef = useRef(null);
  const rootWin = useRef({ x: 0, y: 0 }); // левый верх root в окне

  const measureRoot = useCallback(() => {
    if (!rootRef.current) return;
    rootRef.current.measureInWindow((x, y) => {
      rootWin.current = { x, y };
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(measureRoot, 120);
    return () => clearTimeout(t);
  }, [measureRoot]);

  // ===== вертикальный скролл всей страницы =====
  const pageScrollY = useRef(0);

  // ===== горизонтальные скроллы (по рядам) =====
  const scrollTopX = useRef(0);
  const scrollCenterX = useRef(0);
  const scrollBottomX = useRef(0);

  // ===== drag overlay =====
  const [dragId, setDragId] = useState(null);
  const [dragFrom, setDragFrom] = useState(null); // "top" | "center" | "bottom"

  const dragAbs = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  const startOffset = useRef({ x: 0, y: 0 }); // палец относительно карточки
  const dragCardLayout = useRef({ w: CARD_W, h: CARD_H });
  const lastPointer = useRef({ x: 0, y: 0 });

  // ===== утилиты списков =====
  const getList = useCallback(
    (name) => {
      if (name === "top") return topIds;
      if (name === "bottom") return bottomIds;
      return centerIds;
    },
    [topIds, bottomIds, centerIds]
  );

  const setList = useCallback((name, nextIds) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (name === "top") setTopIds(nextIds);
    else if (name === "bottom") setBottomIds(nextIds);
    else setCenterIds(nextIds);
  }, []);

  const removeFromList = useCallback(
    (name, id) => {
      const list = getList(name);
      const idx = list.indexOf(id);
      if (idx === -1) return list;
      const next = list.slice();
      next.splice(idx, 1);
      return next;
    },
    [getList]
  );

  const insertIntoList = useCallback(
    (name, id, index) => {
      const list = getList(name);
      const next = list.slice();
      const safeIndex = Math.max(0, Math.min(index, next.length));
      next.splice(safeIndex, 0, id);
      return next;
    },
    [getList]
  );

  // ===== row bounds (в окне) для точного определения рядов =====
  const rowBounds = useRef({
    top: { y0: 0, y1: 0 },
    center: { y0: 0, y1: 0 },
    bottom: { y0: 0, y1: 0 },
  });

  const topRowRef = useRef(null);
  const centerRowRef = useRef(null);
  const bottomRowRef = useRef(null);

  const measureRows = useCallback(() => {
    const m = (ref, key) => {
      if (!ref.current) return;
      ref.current.measureInWindow((_x, y, _w, h) => {
        rowBounds.current[key] = { y0: y, y1: y + h };
      });
    };
    m(topRowRef, "top");
    m(centerRowRef, "center");
    m(bottomRowRef, "bottom");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      measureRoot();
      measureRows();
    }, 200);
    return () => clearTimeout(t);
  }, [measureRoot, measureRows, topIds.length, centerIds.length, bottomIds.length]);

  const getDropRow = (absY) => {
    const b = rowBounds.current;
    // если измерения ещё не готовы — fallback по процентам
    if (!(b.top.y1 && b.center.y1 && b.bottom.y1)) {
      const p = absY / SCREEN_H;
      if (p < 0.42) return "top";
      if (p < 0.70) return "center";
      return "bottom";
    }

    if (absY >= b.top.y0 && absY <= b.top.y1) return "top";
    if (absY >= b.center.y0 && absY <= b.center.y1) return "center";
    if (absY >= b.bottom.y0 && absY <= b.bottom.y1) return "bottom";

    // если между зонами — выбираем ближайшую
    const midTop = (b.top.y0 + b.top.y1) / 2;
    const midCenter = (b.center.y0 + b.center.y1) / 2;
    const midBottom = (b.bottom.y0 + b.bottom.y1) / 2;

    const dTop = Math.abs(absY - midTop);
    const dCenter = Math.abs(absY - midCenter);
    const dBottom = Math.abs(absY - midBottom);

    if (dTop <= dCenter && dTop <= dBottom) return "top";
    if (dCenter <= dBottom) return "center";
    return "bottom";
  };

  // ===== индекс вставки по absX (горизонтально) =====
  const guessInsertIndex = (rowName, absX) => {
    const xInWindow = absX - rootWin.current.x; // внутри root
    const scrollX =
      rowName === "top" ? scrollTopX.current : rowName === "bottom" ? scrollBottomX.current : scrollCenterX.current;

    const xIn = xInWindow + scrollX - 22; // padding ряда
    const step = CARD_W + CARD_GAP;
    const idx = Math.round(xIn / step);
    return Math.max(0, idx);
  };

  // ===== начать drag =====
  const beginDrag = useCallback(
    (id, fromName, layout, pressAbs) => {
      setDragId(id);
      setDragFrom(fromName);

      dragCardLayout.current = { w: layout.w, h: layout.h };
      startOffset.current = { x: pressAbs.x - layout.x, y: pressAbs.y - layout.y };

      // overlay стартует там же
      dragAbs.setValue({ x: layout.x, y: layout.y });

      Animated.spring(dragScale, {
        toValue: 1.06,
        useNativeDriver: true,
        speed: 28,
        bounciness: 6,
      }).start();

      const nextFrom = removeFromList(fromName, id);
      setList(fromName, nextFrom);
    },
    [dragAbs, dragScale, removeFromList, setList]
  );

  // ===== движение drag =====
  const moveDrag = useCallback(
    (absX, absY) => {
      if (!dragId) return;

      lastPointer.current = { x: absX, y: absY };

      const x = absX - startOffset.current.x;
      const y = absY - startOffset.current.y;

      dragAbs.setValue({ x, y });

      const dropRow = getDropRow(absY);
      const insertIdx = guessInsertIndex(dropRow, absX);

      const curList = getList(dropRow);

      if (curList.includes(dragId)) {
        const curIdx = curList.indexOf(dragId);
        if (curIdx === insertIdx) return;

        const next = curList.slice();
        next.splice(curIdx, 1);
        next.splice(insertIdx, 0, dragId);
        setList(dropRow, next);
        return;
      }

      // вставить в новый ряд
      setList(dropRow, insertIntoList(dropRow, dragId, insertIdx));

      // удалить из остальных
      for (const r of ["top", "center", "bottom"]) {
        if (r === dropRow) continue;
        const l = getList(r);
        if (l.includes(dragId)) setList(r, l.filter((x) => x !== dragId));
      }
    },
    [dragId, dragAbs, getList, insertIntoList, setList]
  );

  // ===== завершить drag =====
  const endDrag = useCallback(() => {
    if (!dragId) return;

    Animated.spring(dragScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();

    setDragId(null);
    setDragFrom(null);
  }, [dragId, dragScale]);

  const overlayResponder = useMemo(() => {
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        moveDrag(pageX, pageY);
      },
      onResponderRelease: () => endDrag(),
      onResponderTerminate: () => endDrag(),
    };
  }, [moveDrag, endDrag]);

  // ===== проверка правильности =====
  const isCorrect = useCallback(() => {
    if (!story) return false;

    const correct1 = story.variant1.map((t) => `v1_${hash(t)}`);
    const correct2 = story.variant2.map((t) => `v2_${hash(t)}`);

    const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

    if (centerIds.length !== 0) return false;

    const normal = same(topIds, correct1) && same(bottomIds, correct2);
    const swapped = same(topIds, correct2) && same(bottomIds, correct1);

    return normal || swapped;
  }, [story, centerIds, topIds, bottomIds]);

  const onCheck = () => setResult(isCorrect() ? "ok" : "no");

  if (!story) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: "900", marginBottom: 10 }}>Story not found</Text>
        <Pressable onPress={onBack} style={styles.btn}>
          <Text style={styles.btnTxt}>Артқа</Text>
        </Pressable>
      </View>
    );
  }

  const renderRowCards = (ids, from) =>
    ids.map((id) => {
      const c = byId[id];
      if (!c) return null;
      return (
        <Card
          key={id}
          id={id}
          from={from}
          text={c.text}
          onBegin={beginDrag}
          isDimmed={!!dragId && dragId !== id}
        />
      );
    });

  const overlayText = dragId ? byId[dragId]?.text : "";

  return (
    <View ref={rootRef} style={styles.root} onLayout={measureRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#10B5B8" />
      {/* TOP BAR (фиксированный) */}
      <View style={styles.topBar}>
        <Pressable style={styles.topBtn} onPress={onBack}>
          <Text style={styles.topBtnTxt}>❮ Артқа</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {story.title}
        </Text>

        <Pressable style={styles.topBtn} onPress={onCheck}>
          <Text style={styles.topBtnTxt}>Тексеру</Text>
        </Pressable>
      </View>

      {/* Вся страница скроллится вертикально */}
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        onScroll={(e) => {
          pageScrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={styles.introBox}>
          <Text style={styles.sectionTitle}>Оқиғаның басталуы</Text>
          <Text style={styles.sectionText}>{story.intro}</Text>
        </View>

        {/* TOP ROW */}
        <View style={styles.rowBlock} ref={topRowRef} collapsable={false}>
          <Text style={styles.rowTitle}>1 нұсқа</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            onScroll={(e) => (scrollTopX.current = e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            contentContainerStyle={styles.rowList}
          >
            {renderRowCards(topIds, "top")}
            <View style={{ width: 18 }} />
          </ScrollView>
          {/* поле-область видно всегда */}
          <Text style={styles.rowHint}>Осы жерге 1-нұсқаның карталарын тастаңыз</Text>
        </View>

        {/* CENTER ROW */}
        <View style={styles.rowBlock} ref={centerRowRef} collapsable={false}>
          <Text style={styles.rowTitle}>Карталар</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            onScroll={(e) => (scrollCenterX.current = e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            contentContainerStyle={styles.rowList}
          >
            {renderRowCards(centerIds, "center")}
            <View style={{ width: 18 }} />
          </ScrollView>
          <Text style={styles.rowHint}>Карталарды ұстап тұрып, жоғары/төменге апарыңыз</Text>
        </View>

        {/* BOTTOM ROW */}
        <View style={styles.rowBlock} ref={bottomRowRef} collapsable={false}>
          <Text style={styles.rowTitle}>2 нұсқа</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            onScroll={(e) => (scrollBottomX.current = e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            contentContainerStyle={styles.rowList}
          >
            {renderRowCards(bottomIds, "bottom")}
            <View style={{ width: 18 }} />
          </ScrollView>
          <Text style={styles.rowHint}>Осы жерге 2-нұсқаның карталарын тастаңыз</Text>
        </View>

        {/* Outro */}
        <View style={styles.outroBox}>
          <Text style={styles.sectionTitle}>Оқиғаның шешімі</Text>
          <Text style={styles.sectionText}>{story.outro}</Text>
        </View>

        <View style={{ height: 26 }} />
      </ScrollView>

      {/* Drag overlay поверх всего (не внутри ScrollView) */}
      {dragId ? (
        <Animated.View
          {...overlayResponder}
          style={[
            styles.dragOverlay,
            {
              width: dragCardLayout.current.w || CARD_W,
              height: dragCardLayout.current.h || CARD_H,
              transform: [
                { translateX: dragAbs.x },
                { translateY: dragAbs.y },
                { scale: dragScale },
              ],
            },
          ]}
        >
          <View style={styles.cardInner}>
            <Text
              style={styles.dragText}
              numberOfLines={7}
              adjustsFontSizeToFit
              minimumFontScale={0.70}
              allowFontScaling
            >
              {overlayText}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Result modal */}
      <Modal visible={!!result} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {result === "ok" ? "Дұрыс жауап!" : "Қайтадан көр!"}
            </Text>
            <Pressable style={styles.btn} onPress={() => setResult(null)}>
              <Text style={styles.btnTxt}>Жабу</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Card({ id, text, from, onBegin, isDimmed }) {
  const ref = useRef(null);

  const onLongPress = (e) => {
    if (!ref.current) return;

    ref.current.measureInWindow((x, y, w, h) => {
      const pressAbs = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      onBegin(id, from, { x, y, w, h }, pressAbs);
    });
  };

  return (
    <Pressable
      ref={ref}
      collapsable={false}
      onLongPress={onLongPress}
      delayLongPress={140}
      style={[styles.card, isDimmed && styles.cardDimmed]}
    >
      <View style={styles.cardInner}>
        <Text
          style={styles.cardText}
          numberOfLines={7}
          adjustsFontSizeToFit
          minimumFontScale={0.70}
          allowFontScaling
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

// same hash, что и в buildLevel2Deck
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6F6F6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  topBar: {
    height: TOPBAR_H,
    paddingHorizontal: 10,
    backgroundColor: "#10B5B8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    minWidth: 76,
    alignItems: "center",
  },
  topBtnTxt: { color: "#fff", fontWeight: "900" },
  title: { flex: 1, textAlign: "center", color: "#fff", fontWeight: "900", fontSize: 16 },

  page: { flex: 1 },
  pageContent: { paddingBottom: 18 },

  introBox: { padding: 12, backgroundColor: "#fff", margin: 10, borderRadius: 12 },
  outroBox: { padding: 12, backgroundColor: "#fff", margin: 10, borderRadius: 12 },

  sectionTitle: { fontWeight: "900", marginBottom: 6, fontSize: 14, color: "#0b2b2c" },
  sectionText: { color: "#111", lineHeight: 20, fontSize: 14, fontWeight: "600" },

  rowBlock: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  rowTitle: {
    fontWeight: "900",
    color: "#0b2b2c",
    marginBottom: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  rowList: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  rowHint: {
    marginTop: 10,
    paddingHorizontal: 12,
    color: "#567",
    fontWeight: "700",
    fontSize: 12,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#7bbfc1",
    marginRight: CARD_GAP,
    overflow: "hidden",
  },
  cardDimmed: { opacity: 0.55 },

  cardInner: { flex: 1, justifyContent: "center" },

  cardText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 22,
  },

  dragOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#10B5B8",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  dragText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 22,
  },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  modalCard: { width: "78%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 },

  btn: {
    marginTop: 6,
    backgroundColor: "#10B5B8",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  btnTxt: { color: "#001517", fontWeight: "900" },
});
