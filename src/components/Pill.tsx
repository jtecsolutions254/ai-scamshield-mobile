import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Pill({ label, tone }: { label: string; tone: "low" | "medium" | "high" | "critical" }) {
  const bg = tone === "low" ? "rgba(34,197,94,0.20)"
    : tone === "medium" ? "rgba(245,158,11,0.20)"
    : tone === "high" ? "rgba(244,63,94,0.20)"
    : "rgba(239,68,68,0.22)";
  const border = tone === "low" ? "rgba(34,197,94,0.35)"
    : tone === "medium" ? "rgba(245,158,11,0.35)"
    : tone === "high" ? "rgba(244,63,94,0.35)"
    : "rgba(239,68,68,0.38)";
  const text = tone === "low" ? "#86EFAC" : tone === "medium" ? "#FCD34D" : tone === "high" ? "#FDA4AF" : "#FCA5A5";

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },
});
