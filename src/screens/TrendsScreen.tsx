import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Text, StyleSheet, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import { getJSON } from "../lib/api";
import { LineChart } from "react-native-chart-kit";

export default function TrendsScreen() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getJSON<any>("/api/v1/stats");
        setData(res);
      } catch (e: any) {
        setErr(e?.message || "Failed to load trends");
      }
    })();
  }, []);

  const series = useMemo(() => {
    const t = data?.timeline || data?.daily || data?.last_7d || [];
    if (!Array.isArray(t) || !t.length) return { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], values: [0,0,0,0,0,0,0] };
    const labels = t.map((x: any) => x.day || x.date || "").slice(-7);
    const values = t.map((x: any) => x.count || x.total || 0).slice(-7);
    return { labels, values };
  }, [data]);

  const width = Dimensions.get("window").width - 32;

  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Trends</Text>
        <Text style={styles.h2}>Scan volume over time (best-effort from /api/v1/stats).</Text>
        {err ? <Text style={styles.err}>{err}</Text> : null}

        <GlassCard title="Weekly scans" subtitle="If the API doesn't provide timeline, the chart shows zeros.">
          <View style={{ marginTop: 10 }}>
            <LineChart
              data={{ labels: series.labels, datasets: [{ data: series.values }] }}
              width={width}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "rgba(0,0,0,0)",
                backgroundGradientTo: "rgba(0,0,0,0)",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(167, 139, 250, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(231, 236, 255, ${opacity})`,
                propsForDots: { r: "4" },
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Raw stats payload" subtitle="Useful for debugging output shape.">
          <Text style={styles.small}>{JSON.stringify(data, null, 2)}</Text>
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
  small: { color: "rgba(231,236,255,0.6)", fontSize: 12, marginTop: 8, fontFamily: "monospace" },
});
