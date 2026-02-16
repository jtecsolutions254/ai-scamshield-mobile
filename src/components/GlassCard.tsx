import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

export default function GlassCard({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle) ? (
        <View style={{ marginBottom: 10 }}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: { color: "#E7ECFF", fontSize: 16, fontWeight: "700" },
  subtitle: { color: "rgba(231,236,255,0.72)", marginTop: 4, fontSize: 12 },
});
