// Level1Home.js
import React from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import { LEVEL1_STORIES } from "./level1/stories";

export default function Level1Home({ onBack, onOpenStory }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#10B5B8" />
      <View style={styles.appbar}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backTxt}>❮</Text>
        </Pressable>
        <Text style={styles.title}>1 деңгей</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>
          Карточкаларды дұрыс ретке келтір. Дұрыс болса — ойын іске қосылады.
        </Text>

        {LEVEL1_STORIES.map((s) => (
          <Pressable key={s.id} style={styles.storyBtn} onPress={() => onOpenStory(s.id)}>
            <Text style={styles.storyTxt}>{s.title}</Text>
          </Pressable>
        ))}
      </View>
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
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  backBtn: {
    width: 32, height: 32,
    alignItems: "center", justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backTxt: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: -2 },

  body: { flex: 1, padding: 16, gap: 14 },
  hint: { color: "#222", fontSize: 14, lineHeight: 20, opacity: 0.85 },

  storyBtn: {
    backgroundColor: "#EEDCD7",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  storyTxt: { fontSize: 18, fontWeight: "800", color: "#001517", textAlign: "center" },
});
