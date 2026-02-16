import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import RiskGauge from "../components/RiskGauge";
import { postJSON } from "../lib/api";

type Mode = "sms" | "email" | "url";

type AnalyzeResponse = {
  type: string;
  risk_score: number;
  risk_level: string;
  ml: { prob_phish: number; confidence: number; model_version: string };
  intel: {
    urls_found: string[];
    shortener: boolean;
    domain_age_days?: number | null;
    reputation_hit: boolean;
    redirects: string[];
    notes: Record<string, any>;
  };
  reasons: string[];
  recommended_actions: string[];
  analysis_id: string;
};

const sampleSMS =
  "M-PESA: Your account will be locked. Verify now at http://example-login-secure.com/verify to avoid suspension.";
const sampleEmail =
  "Subject: Account Verification Required\nFrom: Support <support@secure-mail.example>\n\nDear customer, your account will be suspended within 24 hours. Verify now: http://bit.ly/abc";
const sampleURL = "http://paypal.com.verify-user.security-update.xyz/login";

export default function AnalyzeScreen() {
  const [mode, setMode] = useState<Mode>("sms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const [smsText, setSmsText] = useState(sampleSMS);
  const [emailBody, setEmailBody] = useState(sampleEmail);
  const [url, setUrl] = useState(sampleURL);

  const endpoint = useMemo(() => {
    if (mode === "email") return "/api/v1/analyze-email";
    if (mode === "sms") return "/api/v1/analyze-sms";
    return "/api/v1/analyze-url";
  }, [mode]);

  async function analyze() {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      let payload: any = {};
      if (mode === "sms") payload = { text: smsText };
      if (mode === "email") payload = { body: emailBody };
      if (mode === "url") payload = { url };
      const res = await postJSON<AnalyzeResponse>(endpoint, payload);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.h1}>Analyze suspicious content</Text>
          <Text style={styles.h2}>Email, SMS (M-Pesa scams), or URLs — get an actionable risk score.</Text>
        </View>

        <View style={styles.tabs}>
          <Text onPress={() => setMode("email")} style={[styles.tab, mode === "email" && styles.tabActive]}>Email</Text>
          <Text onPress={() => setMode("sms")} style={[styles.tab, mode === "sms" && styles.tabActive]}>SMS</Text>
          <Text onPress={() => setMode("url")} style={[styles.tab, mode === "url" && styles.tabActive]}>URL</Text>
        </View>

        <GlassCard title="Input" subtitle="Paste content below. The system runs ML + cyber rules + intel.">
          {mode === "sms" ? (
            <TextInput
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste SMS here..."
              placeholderTextColor="rgba(231,236,255,0.45)"
              multiline
              style={[styles.input, { height: 140 }]}
            />
          ) : null}
          {mode === "email" ? (
            <TextInput
              value={emailBody}
              onChangeText={setEmailBody}
              placeholder="Paste email text here..."
              placeholderTextColor="rgba(231,236,255,0.45)"
              multiline
              style={[styles.input, { height: 140 }]}
            />
          ) : null}
          {mode === "url" ? (
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste URL here..."
              placeholderTextColor="rgba(231,236,255,0.45)"
              style={[styles.input]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ marginTop: 12 }}>
            <PrimaryButton label="Analyze" onPress={analyze} loading={loading} />
          </View>
        </GlassCard>

        <View style={{ height: 14 }} />

        <GlassCard title="Result" subtitle={result ? `Analysis ID: ${result.analysis_id}` : "Run an analysis to see results."}>
          {!result ? (
            <Text style={styles.hint}>No result yet. Paste content and tap Analyze.</Text>
          ) : (
            <>
              <RiskGauge score={result.risk_score} level={result.risk_level} />

              <View style={styles.row2}>
                <View style={styles.mini}>
                  <Text style={styles.miniLabel}>ML Probability</Text>
                  <Text style={styles.miniVal}>{(result.ml.prob_phish * 100).toFixed(1)}%</Text>
                  <Text style={styles.miniSub}>Confidence: {(result.ml.confidence * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.mini}>
                  <Text style={styles.miniLabel}>Link intelligence</Text>
                  <Text style={styles.miniSub}>Shortener: <Text style={styles.bold}>{String(result.intel.shortener)}</Text></Text>
                  <Text style={styles.miniSub}>Reputation hit: <Text style={styles.bold}>{String(result.intel.reputation_hit)}</Text></Text>
                  <Text style={styles.miniSub}>Domain age: <Text style={styles.bold}>
                    {result.intel.domain_age_days === null || result.intel.domain_age_days === undefined ? "Unknown" : `${result.intel.domain_age_days} days`}
                  </Text></Text>
                </View>
              </View>

              <View style={{ height: 10 }} />

              <View style={styles.row2}>
                <View style={styles.mini}>
                  <Text style={styles.miniTitle}>Why it was flagged</Text>
                  {result.reasons.map((r, i) => (
                    <Text key={i} style={styles.bullet}>• {r}</Text>
                  ))}
                </View>
                <View style={styles.mini}>
                  <Text style={styles.miniTitle}>Recommended actions</Text>
                  {result.recommended_actions.map((a, i) => (
                    <Text key={i} style={styles.bullet}>• {a}</Text>
                  ))}
                </View>
              </View>

              {result.intel.urls_found?.length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.miniTitle}>URLs found</Text>
                  {result.intel.urls_found.map((u, i) => (
                    <Text key={i} style={styles.urlItem}>{u}</Text>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 12 },
  h1: { color: "#E7ECFF", fontSize: 22, fontWeight: "800" },
  h2: { color: "rgba(231,236,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 18 },
  tabs: { flexDirection: "row", gap: 10, marginBottom: 12 },
  tab: {
    color: "rgba(231,236,255,0.72)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    fontWeight: "700",
  },
  tabActive: {
    color: "#07121A",
    borderColor: "rgba(167,139,250,0.55)",
    backgroundColor: "rgba(167,139,250,0.95)",
  },
  input: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
    padding: 12,
    color: "#E7ECFF",
  },
  error: {
    marginTop: 10,
    color: "#FDA4AF",
    backgroundColor: "rgba(244,63,94,0.15)",
    borderColor: "rgba(244,63,94,0.25)",
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  hint: { color: "rgba(231,236,255,0.75)" },
  row2: { flexDirection: "row", gap: 10, marginTop: 8 },
  mini: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  miniLabel: { color: "rgba(231,236,255,0.65)", fontSize: 12 },
  miniVal: { color: "#E7ECFF", fontSize: 18, fontWeight: "800", marginTop: 4 },
  miniSub: { color: "rgba(231,236,255,0.7)", fontSize: 12, marginTop: 4 },
  miniTitle: { color: "#E7ECFF", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  bullet: { color: "rgba(231,236,255,0.78)", fontSize: 12, marginTop: 4, lineHeight: 16 },
  bold: { color: "#E7ECFF", fontWeight: "800" },
  urlItem: {
    color: "#A78BFA",
    fontSize: 12,
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: "rgba(167,139,250,0.08)",
  },
});
