import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = !!disabled || !!loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={{ opacity: isDisabled ? 0.6 : 1 }}>
      <LinearGradient colors={["#7C3AED", "#22D3EE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {loading ? <ActivityIndicator color="#07121A" /> : <Text style={styles.text}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#07121A", fontWeight: "800", letterSpacing: 0.2 },
});
