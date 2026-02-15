import React, { useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
} from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { LEVEL1_STORIES } from "./level1/stories";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export default function Level1OrderGame({ storyId, onBack }) {
  const story = useMemo(() => LEVEL1_STORIES.find((s) => s.id === storyId), [storyId]);

  const original = useMemo(() => {
    if (!story) return [];
    return story.cards.map((text, idx) => ({
      id: String(idx + 1),
      text,
    }));
  }, [story]);

  const [data, setData] = useState(() => shuffleArray(original));
  const [activeIndex, setActiveIndex] = useState(null);

  const reset = useCallback(() => {
    setData(shuffleArray(original));
  }, [original]);

  const check = useCallback(() => {
    const ok =
      data.length === original.length &&
      data.every((item, idx) => item.id === original[idx].id);

    Alert.alert(
      ok ? "Дұрыс жауап!" : "Қайтадан көр!",
      ok ? "Жарайсың! Енді ойын іске қосуға болады." : "Карточкалардың ретін қайта тексеріп көр."
    );
  }, [data, original]);

  if (!story) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 16 }}>Story not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#10B5B8" />

      {/* Top bar */}
      <View style={styles.appbar}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backTxt}>❮</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {story.title}
        </Text>

        <Pressable style={styles.checkBtn} onPress={check}>
          <Text style={styles.checkTxt}>Тексеру</Text>
        </Pressable>
      </View>

      <View style={styles.subbar}>
        <Text style={styles.subText}>
          Карточканы басып ұстап, жоғары/төмен жылжыт.
        </Text>

        <Pressable onPress={reset} style={styles.resetBtn}>
          <Text style={styles.resetTxt}>Араластыру ↻</Text>
        </Pressable>
      </View>

      <DraggableFlatList
        data={data}
        keyExtractor={(item) => item.id}
        onDragBegin={(index) => setActiveIndex(index)}
        onDragEnd={({ data }) => {
          setData(data);
          setActiveIndex(null);
        }}
        activationDistance={0} // чтобы после удержания движение начиналось сразу
        containerStyle={styles.list}
        contentContainerStyle={styles.listContent}
        dragHitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        renderItem={({ item, drag, isActive, index }) => {
          const hasActive = activeIndex !== null;
          const dist = hasActive ? Math.abs(index - activeIndex) : 999;

          const isNeighbor = hasActive && dist === 1; // сверху/снизу
          const isFar = hasActive && dist >= 2;

          return (
            <ScaleDecorator>
              {/* ВАЖНО: TouchableOpacity обычно лучше держит drag-жест, чем Pressable */}
              <TouchableOpacity
                activeOpacity={0.95}
                onLongPress={drag}
                delayLongPress={120}
                style={styles.cardWrap}
              >
                <View
                  style={[
                    styles.card,

                    // Активная карточка — выше/длиннее
                    isActive && styles.cardActive,

                    // Соседние (сверху/снизу) — чуть “сжимаем”
                    isNeighbor && styles.cardNeighbor,

                    // Остальные — слегка приглушаем, чтобы фокус был на активной
                    isFar && styles.cardFar,
                  ]}
                >
                  <Text style={styles.cardText}>{item.text}</Text>
                </View>
              </TouchableOpacity>
            </ScaleDecorator>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  appbar: {
    minHeight: 56,
    backgroundColor: "#10B5B8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backTxt: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: -2 },
  title: {
    flex: 1,
    marginHorizontal: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  checkBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkTxt: { color: "#fff", fontWeight: "900", fontSize: 14 },

  subbar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  subText: { flex: 1, color: "#333", fontSize: 12, opacity: 0.85 },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EEDCD7",
  },
  resetTxt: { fontWeight: "900", color: "#001517" },

  list: { flex: 1 },
  listContent: { paddingVertical: 18, paddingBottom: 40 },

  cardWrap: { width: "100%", alignItems: "center" },

  // Базовая “hoverboard” карточка
  card: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,

    borderWidth: 2,
    borderColor: "rgba(30,144,255,0.55)",

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  // Активная — длиннее (визуально)
  cardActive: {
    paddingVertical: 22,
    shadowOpacity: 0.25,
    elevation: 7,
    transform: [{ scale: 1.03 }],
  },

  // Соседи сверху/снизу — “сжимаем”
  cardNeighbor: {
    paddingVertical: 9,
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  // Дальние — приглушаем
  cardFar: {
    opacity: 0.78,
  },

  cardText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#111",
    textAlign: "center",
    fontWeight: "600",
  },
});
