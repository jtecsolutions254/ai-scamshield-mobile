import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Pill from "./Pill";

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export default function RiskGauge({ score, level }: { score: number; level: string }) {
  const size = 160;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(score, 0, 100) / 100;
  const dash = c * (1 - pct);

  const tone = useMemo(() => {
    const L = (level || "").toLowerCase();
    if (L.includes("critical")) return "critical";
    if (L.includes("high")) return "high";
    if (L.includes("medium")) return "medium";
    return "low";
  }, [level]);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(231,236,255,0.12)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#A78BFA"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.score}>{Math.round(score)}</Text>
        <Text style={styles.sub}>Risk Score</Text>
        <View style={{ marginTop: 10 }}>
          <Pill label={level} tone={tone as any} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  center: { position: "absolute", alignItems: "center" },
  score: { fontSize: 36, fontWeight: "900", color: "#E7ECFF" },
  sub: { fontSize: 12, color: "rgba(231,236,255,0.7)" },
});
