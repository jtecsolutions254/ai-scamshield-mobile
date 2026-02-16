import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import { getJSON } from "../lib/api";

export default function HistoryScreen() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getJSON<any>("/api/v1/stats");
        setData(res);
      } catch (e: any) {
        setErr(e?.message || "Failed to load stats/history");
      }
    })();
  }, []);

  const recent = data?.recent || data?.history || data?.items || [];

  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>History</Text>
        <Text style={styles.h2}>Recent analyses saved by the backend database.</Text>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <GlassCard title="Overview" subtitle="High-level scan totals (from /api/v1/stats).">
          <Text style={styles.kv}>If you want a richer history list, add a dedicated `/api/v1/history` endpoint later.</Text>
          <Text style={styles.small}>{JSON.stringify({ totals: data?.totals || data?.summary || null }, null, 2)}</Text>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Recent analyses" subtitle={Array.isArray(recent) ? `${recent.length} items` : "Unavailable"}>
          {Array.isArray(recent) && recent.length ? (
            recent.slice(0, 20).map((it: any, idx: number) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.itemTitle}>{it.type || it.input_type || "analysis"}</Text>
                <Text style={styles.itemSub}>risk: {it.risk_score ?? it.risk ?? "?"} • {it.risk_level ?? it.level ?? ""}</Text>
                <Text style={styles.itemText} numberOfLines={2}>{it.input_preview || it.preview || it.text || it.url || it.body || ""}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.kv}>No recent items returned by the API.</Text>
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  h1: { color: "#E7ECFF", fontSize: 22, fontWeight: "800" },
  h2: { color: "rgba(231,236,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  err: { color: "#FCA5A5", backgroundColor: "rgba(239,68,68,0.15)", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginBottom: 12 },
  kv: { color: "rgba(231,236,255,0.78)" },
  small: { color: "rgba(231,236,255,0.6)", fontSize: 12, marginTop: 10, fontFamily: "monospace" },
  item: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  itemTitle: { color: "#E7ECFF", fontWeight: "800" },
  itemSub: { color: "rgba(231,236,255,0.65)", marginTop: 2, fontSize: 12 },
  itemText: { color: "rgba(231,236,255,0.78)", marginTop: 6, fontSize: 12 },
});
