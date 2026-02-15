import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { Audio } from "expo-av";
import { STORIES, STORY_IMAGES } from "./stories";

export default function GameScreen({ storyId, onExit }) {
  const story = STORIES[storyId];
  const images = story ? STORY_IMAGES[story.id] : null;

  const [keyPath, setKeyPath] = useState("1");
  const [fullText, setFullText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const typingTimer = useRef(null);

  const sfxBtn = useRef(null);
  const sfxLose = useRef(null);
  const sfxWin = useRef(null);
  const lineSound = useRef(null);
  const lineSoundKey = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;





  // загрузка системных звуков
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const btn = await Audio.Sound.createAsync(require("./sounds/1.mp3"));
        const lose = await Audio.Sound.createAsync(require("./sounds/2.mp3"));
        const win = await Audio.Sound.createAsync(require("./sounds/3.mp3"));
        if (!mounted) return;
        sfxBtn.current = btn.sound;
        sfxLose.current = lose.sound;
        sfxWin.current = win.sound;
      } catch (e) {
        console.log("Sound load error:", e);
      }
    })();
    return () => {
      mounted = false;
      sfxBtn.current?.unloadAsync();
      sfxLose.current?.unloadAsync();
      sfxWin.current?.unloadAsync();
      stopLineSound();
    };
  }, []);

  const playBtn = async () => {
    if (isCooldown) return;
    try {
      await sfxBtn.current?.replayAsync();
    } catch {}
  };
  const playLose = async () => {
    try {
      await sfxLose.current?.replayAsync();
    } catch {}
  };
  const playWin = async () => {
    try {
      await sfxWin.current?.replayAsync();
    } catch {}
  };

  const stopLineSound = () => {
    if (lineSound.current) {
      try {
        lineSound.current.stopAsync();
        lineSound.current.unloadAsync();
      } catch {}
      lineSound.current = null;
      lineSoundKey.current = null;
    }
  };

  const playLineForKey = async (k) => {
    if (!story?.sounds) return;
    const clip = story.sounds[k];
    if (!clip) return;
    if (lineSoundKey.current === k && lineSound.current) return;
    stopLineSound();
    try {
      const { sound } = await Audio.Sound.createAsync(clip);
      lineSound.current = sound;
      lineSoundKey.current = k;
      await sound.playAsync();
    } catch (e) {
      console.log("Line sound error:", e);
    }
  };

  const lines = story?.lines || {};
  const text = lines[keyPath] || "";

  const children = useMemo(() => {
    const ks = Object.keys(lines);
    const len = keyPath.length + 1;
    const out = ks.filter((k) => k.startsWith(keyPath) && k.length === len);
    return out.sort((a, b) => a.localeCompare(b));
  }, [lines, keyPath]);

  const choices = children.filter((k) => story?.choiceMeta?.[k]);
  const currentImage = images?.[story?.images?.[keyPath]];

  const isWin = /СЕН ЖЕҢІСКЕ ЖЕТТІҢ!?/i.test(text);
  const isLose = /Ойын сәтсіз аяқталды/i.test(text);
  const isGameEnd = /Ойын аяқталды/i.test(text);
  const isEnding = isWin || isLose || isGameEnd;

  // Плавное отображение текста
  useEffect(() => {
    clearInterval(typingTimer.current);
    setFullText(text);
    setDisplayedText("");
    if (text) {
      setIsTyping(true);
      const total = 1500;
      const step = Math.max(8, Math.floor(total / text.length));
      let i = 0;
      typingTimer.current = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typingTimer.current);
          setIsTyping(false);
        }
      }, step);
    } else {
      setIsTyping(false);
    }

    stopLineSound();
    playLineForKey(keyPath);
    return () => clearInterval(typingTimer.current);
  }, [keyPath, text]);

  useEffect(() => {
    if (!text) return;
    if (isWin) playWin();
    else if (isLose || isGameEnd) playLose();

    if (isEnding) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else fadeAnim.setValue(0);
  }, [text]);

  // ===== КНОПКИ С КУЛДАУНОМ =====
  const startCooldown = () => {
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 1500);
  };

  const goNext = async () => {
    if (isCooldown) return;
    if (isTyping) {
      clearInterval(typingTimer.current);
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }
    startCooldown();
    await playBtn();
    stopLineSound();
    if (isEnding) return;
    const preferred = keyPath + "1";
    if (lines[preferred]) setKeyPath(preferred);
  };

  const choose = async (childKey) => {
    if (isCooldown) return;
    startCooldown();
    await playBtn();
    stopLineSound();
    const next = childKey + "1";
    if (lines[next]) setKeyPath(next);
    else if (lines[childKey]) setKeyPath(childKey);
  };

  const restart = async () => {
    if (isCooldown) return;
    startCooldown();
    await playBtn();
    stopLineSound();
    setKeyPath("1");
  };

  const goBackHome = async () => {
    await playBtn();
    stopLineSound();
    onExit?.();
  };

  const toggleWords = () => {
    // 🔇 Без звука
    setShowWords((v) => !v);
  };

  // === Сөзтаным фильтр ===
  const wordList = useMemo(() => {
    if (!story?.words || !text) return [];
    const lowerText = text.toLowerCase();
    return story.words.filter((item) =>
      lowerText.includes(item.word.toLowerCase())
    );
  }, [story, text]);

  // === Подсветка слов в тексте ===
  const highlightWords = (txt) => {
    if (!story?.words) return txt;
    let parts = [txt];
    story.words.forEach(({ word }) => {
      const regex = new RegExp(`(${word})`, "gi");
      parts = parts.flatMap((part) =>
        typeof part === "string"
          ? part.split(regex).map((piece, i) =>
              regex.test(piece)
                ? <Text key={`${word}-${i}`} style={{ color: "#10B5B8", fontWeight: "700" }}>{piece}</Text>
                : piece
            )
          : part
      );
    });
    return parts;
  };

  if (!story)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Story not found</Text>
      </View>
    );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {currentImage && (
        <Image source={currentImage} style={styles.bg} resizeMode="cover" />
      )}

      {/* === Фиксированная верхняя панель === */}
      <View style={styles.topBar}>
        <Pressable style={styles.exitBtn} onPress={goBackHome}>
          <Text style={styles.exitTxt}>⟵</Text>
        </Pressable>
        <Text style={styles.storyTitle} numberOfLines={1}>
          {story?.title || "Ойын"}
        </Text>
        <Pressable style={styles.wordsBtn} onPress={toggleWords}>
          <Text style={styles.wordsTxt}>Сөзтаным</Text>
        </Pressable>
      </View>

      {/* === Диалоговая зона === */}
      <View style={styles.dialog}>
        <ScrollView style={styles.textArea}>
          <Text style={styles.text}>{highlightWords(displayedText)}</Text>
        </ScrollView>

        {isEnding ? (
          <Animated.View style={[styles.endingContainer, { opacity: fadeAnim }]}>
            <Text style={styles.endingText}>Ойын аяқталды...</Text>
            <Pressable style={styles.nextBtn} onPress={restart}>
              <Text style={styles.nextTxt}>Қайта бастау ↻</Text>
            </Pressable>
          </Animated.View>
        ) : choices.length > 0 ? (
          <View style={styles.choices}>
            {choices.map((k) => (
              <Pressable key={k} style={styles.choiceBtn} onPress={() => choose(k)}>
                <Text style={styles.choiceTxt}>{story.choiceMeta[k]}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextTxt}>
              {isTyping ? "Мәтінді аяқтау" : "Әрі қарай ▶"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* === Модальное окно сөзтаным === */}
      <Modal visible={showWords} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Сөзтаным</Text>
            <ScrollView style={{ maxHeight: "70%" }}>
              {wordList.length > 0 ? (
                wordList.map((item, idx) => (
                  <View key={idx} style={styles.wordItem}>
                    <Text style={styles.wordKey}>{item.word}</Text>
                    <Text style={styles.wordValue}>{item.meaning}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#ccc", textAlign: "center", marginTop: 20 }}>
                  Бұл репликада сөзтанымға арналған сөздер жоқ.
                </Text>
              )}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={toggleWords}>
              <Text style={styles.closeTxt}>Жабу ✖</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// === СТИЛИ ===
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", justifyContent: "flex-end" },
  bg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
    paddingBottom: 6,
    backgroundColor: "rgba(16,181,184,0.9)",
    zIndex: 999,
  },
  exitBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  exitTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
  storyTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "#fff",
  },
  wordsBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  wordsTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  dialog: {
    backgroundColor: "rgba(0,0,0,0.58)",
    padding: 16,
    marginTop: 60,
  },
  textArea: { maxHeight: "42%", marginBottom: 12 },
  text: { color: "#fff", fontSize: 18, lineHeight: 26 },
  choices: { gap: 10 },
  choiceBtn: {
    backgroundColor: "#10B5B8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  choiceTxt: {
    color: "#001517",
    fontWeight: "700",
    fontSize: 17,
    textAlign: "center",
  },
  nextBtn: {
    alignSelf: "center",
    backgroundColor: "#10B5B8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  nextTxt: { color: "#001517", fontWeight: "800", fontSize: 18 },
  endingContainer: { alignItems: "center", justifyContent: "center", marginTop: 10 },
  endingText: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    width: "90%",
  },
  modalTitle: {
    color: "#10B5B8",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  wordItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 6,
  },
  wordKey: { color: "#fff", fontWeight: "700", fontSize: 17 },
  wordValue: { color: "#ccc", fontSize: 15, marginTop: 2 },
  closeBtn: {
    marginTop: 12,
    backgroundColor: "#10B5B8",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeTxt: { color: "#001517", fontSize: 16, fontWeight: "700" },
});
