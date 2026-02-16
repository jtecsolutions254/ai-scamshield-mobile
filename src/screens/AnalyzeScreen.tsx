import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import RiskGauge from "../components/RiskGauge";
import { postJSON } from "../lib/api";
import { getClipboardText, getClipboardUrl } from "../lib/clipboard";
import { useRoute } from "@react-navigation/native";

type AnalyzeMode = "email" | "sms" | "url";

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
  "Subject: Account Verification Required\\nFrom: Support <support@secure-mail.example>\\n\\nDear customer, your account will be suspended within 24 hours. Verify now: http://bit.ly/abc";
const sampleURL = "http://paypal.com.verify-user.security-update.xyz/login";

type RouteParams = {
  prefillMode?: AnalyzeMode;
  prefillText?: string;
  prefillEmailBody?: string;
  prefillUrl?: string;
  autoAnalyze?: boolean;
};

export default function AnalyzeScreen() {
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;

  const [mode, setMode] = useState<AnalyzeMode>(params.prefillMode || "sms");
  const [smsText, setSmsText] = useState(params.prefillText || sampleSMS);
  const [emailBody, setEmailBody] = useState(params.prefillEmailBody || sampleEmail);
  const [url, setUrl] = useState(params.prefillUrl || sampleURL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    if (params.prefillMode) setMode(params.prefillMode);
    if (params.prefillText) setSmsText(params.prefillText);
    if (params.prefillEmailBody) setEmailBody(params.prefillEmailBody);
    if (params.prefillUrl) setUrl(params.prefillUrl);
  }, [params.prefillMode, params.prefillText, params.prefillEmailBody, params.prefillUrl]);

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
      const payload =
        mode === "sms" ? { text: smsText } : mode === "email" ? { body: emailBody } : { url };
      const res = await postJSON<AnalyzeResponse>(endpoint, payload);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  // Optional auto-run when arriving from Share Intent
  useEffect(() => {
    if (!params.autoAnalyze) return;
    const t = setTimeout(() => analyze(), 150);
    return () => clearTimeout(t);
  }, [params.autoAnalyze]);

  async function pasteFromClipboard() {
    try {
      const clipUrl = await getClipboardUrl();
      const clipText = await getClipboardText();

      if (clipUrl) {
        setMode("url");
        setUrl(clipUrl);
        Alert.alert("Clipboard detected", "Found a URL in your clipboard.");
        return;
      }

      if (clipText) {
        setMode("sms");
        setSmsText(clipText);
        Alert.alert("Clipboard pasted", "Pasted clipboard text into SMS analyzer.");
        return;
      }

      Alert.alert("Clipboard empty", "No text found in your clipboard.");
    } catch {
      Alert.alert("Clipboard error", "Could not read clipboard.");
    }
  }

  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Analyze</Text>
        <Text style={styles.h2}>
          Paste text/links, or share SMS/email content to AI ScamShield. We compute a risk score + recommendations.
        </Text>

        <GlassCard title="Mode" subtitle="Select what you want to analyze.">
          <View style={styles.modeRow}>
            <ModePill label="Email" active={mode === "email"} onPress={() => setMode("email")} />
            <ModePill label="SMS" active={mode === "sms"} onPress={() => setMode("sms")} />
            <ModePill label="URL" active={mode === "url"} onPress={() => setMode("url")} />
          </View>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Input" subtitle="Paste suspicious content below.">
          {mode === "sms" && (
            <TextInput
              style={styles.input}
              multiline
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste SMS…"
              placeholderTextColor="rgba(231,236,255,0.35)"
            />
          )}
          {mode === "email" && (
            <TextInput
              style={styles.input}
              multiline
              value={emailBody}
              onChangeText={setEmailBody}
              placeholder="Paste email…"
              placeholderTextColor="rgba(231,236,255,0.35)"
            />
          )}
          {mode === "url" && (
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              placeholder="Paste URL…"
              placeholderTextColor="rgba(231,236,255,0.35)"
            />
          )}

          {error ? <Text style={styles.err}>{error}</Text> : null}

          <View style={{ height: 10 }} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={loading ? "Analyzing…" : "Analyze"} onPress={analyze} disabled={loading} />
            </View>
            <TouchableOpacity onPress={pasteFromClipboard} style={styles.secondaryBtn} disabled={loading}>
              <Text style={styles.secondaryBtnText}>Paste</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Result" subtitle={result ? `Analysis ID: ${result.analysis_id}` : "Run an analysis to see results."}>
          {result ? (
            <View style={{ gap: 12 }}>
              <RiskGauge score={result.risk_score} level={result.risk_level} />

              <Text style={styles.kv}>
                ML Probability: {(result.ml.prob_phish * 100).toFixed(1)}% • Confidence: {(result.ml.confidence * 100).toFixed(1)}% (model {result.ml.model_version})
              </Text>

              <Text style={styles.section}>Why flagged</Text>
              {result.reasons.map((r, idx) => (
                <Text key={idx} style={styles.bullet}>
                  • {r}
                </Text>
              ))}

              <Text style={styles.section}>Recommended actions</Text>
              {result.recommended_actions.map((a, idx) => (
                <Text key={idx} style={styles.bullet}>
                  • {a}
                </Text>
              ))}

              {result.intel.urls_found?.length ? (
                <>
                  <Text style={styles.section}>URLs found</Text>
                  {result.intel.urls_found.map((u, idx) => (
                    <Text key={idx} style={styles.urlItem}>
                      {u}
                    </Text>
                  ))}
                </>
              ) : null}
            </View>
          ) : (
            <Text style={styles.kv}>No result yet.</Text>
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

function ModePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  h1: { color: "#E7ECFF", fontSize: 22, fontWeight: "800" },
  h2: { color: "rgba(231,236,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  modeRow: { flexDirection: "row", gap: 10 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillActive: { backgroundColor: "rgba(59,130,246,0.25)", borderColor: "rgba(59,130,246,0.55)" },
  pillText: { color: "rgba(231,236,255,0.8)", fontWeight: "700", fontSize: 13 },
  pillTextActive: { color: "#E7ECFF" },
  input: {
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    color: "#E7ECFF",
    backgroundColor: "rgba(7,10,18,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  err: { marginTop: 10, color: "#FB7185", fontWeight: "700" },
  kv: { color: "rgba(231,236,255,0.78)", lineHeight: 18 },
  section: { marginTop: 10, color: "#E7ECFF", fontWeight: "800" },
  bullet: { color: "rgba(231,236,255,0.78)", marginTop: 6, lineHeight: 18 },
  urlItem: { color: "#93C5FD", marginTop: 6, fontSize: 12 },
  secondaryBtn: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  secondaryBtnText: { color: "rgba(231,236,255,0.88)", fontWeight: "800" },
});
