// LevelMenu.js
import React from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";

export default function LevelMenu({ onSelectLevel }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#10B5B8" />

      <Text style={styles.title}>Ойын деңгейлері</Text>

      <Pressable style={styles.btn} onPress={() => onSelectLevel(1)}>
        <Text style={styles.btnText}>1 деңгей</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => onSelectLevel(2)}>
        <Text style={styles.btnText}>2 деңгей</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.mainBtn]}
        onPress={() => onSelectLevel(3)}
      >
        <Text style={styles.btnText}>3 деңгей</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#10B5B8",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 32,
  },
  btn: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  mainBtn: {
    backgroundColor: "#FFD166",
  },
  btnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#001517",
  },
});
