import React from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { LEVEL2_STORIES } from "./level2/level2Stories";

export default function Level2Home({ onBack, onOpenStory }) {
  const data = Object.values(LEVEL2_STORIES);

  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
        <Pressable style={styles.topBtn} onPress={onBack}>
          <Text style={styles.topBtnTxt}>❮</Text>
        </Pressable>

        <Text style={styles.title}>2 деңгей</Text>

        <View style={{ width: 44 }} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={data}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => onOpenStory(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {item.intro}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  topbar: {
    height: 56,
    backgroundColor: "#10B5B8",
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnTxt: { color: "#fff", fontSize: 22, fontWeight: "800" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },

  card: {
    backgroundColor: "#EEDCD7",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  cardSub: { marginTop: 6, color: "#333", lineHeight: 18 },
});
