import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, Switch, ScrollView, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

import GlassCard from "../components/GlassCard";
import { clearGmailAccessToken, getGmailAccessToken, getSettings, setSettings, saveGmailAccessToken } from "../lib/storage";
import { scanLatestGmail } from "../lib/gmailScan";

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";

  const [appSettings, setAppSettingsState] = useState({ autoAnalyzeShared: true, watchClipboard: true });
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; expiresInMin?: number }>({ connected: false });

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const redirectUri = useMemo(() => makeRedirectUri({ scheme: "scamshield" }), []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    webClientId,
    redirectUri,
    scopes: ["openid", "profile", "email", "https://www.googleapis.com/auth/gmail.readonly"],
  });

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setAppSettingsState(s);
      await refreshGmailStatus();
    })();
  }, []);

  async function refreshGmailStatus() {
    const tok = await getGmailAccessToken();
    if (!tok) return setGmailStatus({ connected: false });
    const msLeft = tok.expiresAtMs - Date.now();
    setGmailStatus({ connected: msLeft > 0, expiresInMin: Math.max(0, Math.round(msLeft / 60000)) });
  }

  useEffect(() => {
    (async () => {
      if (response?.type !== "success") return;
      const auth = response.authentication as any;
      const accessToken: string | undefined = auth?.accessToken;
      const expiresInSec: number | undefined = auth?.expiresIn;
      if (!accessToken || !expiresInSec) {
        Alert.alert("Gmail sign-in", "Login succeeded but token data was missing. Try again.");
        return;
      }
      const expiresAtMs = Date.now() + expiresInSec * 1000 - 60_000;
      await saveGmailAccessToken(accessToken, expiresAtMs);
      await refreshGmailStatus();
      Alert.alert("Gmail connected", "You can now scan recent emails.");
    })();
  }, [response]);

  async function toggleSetting(key: "autoAnalyzeShared" | "watchClipboard") {
    const next = await setSettings({ [key]: !appSettings[key] } as any);
    setAppSettingsState(next);
  }

  async function connectGmail() {
    if (!androidClientId && !webClientId) {
      Alert.alert(
        "Missing Google Client IDs",
        "Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and/or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env, then restart Expo."
      );
      return;
    }

    try {
      const res = await promptAsync({ useProxy: false, showInRecents: true });
      if (res.type !== "success" && res.type !== "dismiss") {
        Alert.alert("Gmail sign-in", "Login did not complete.");
      }
    } catch (e: any) {
      Alert.alert("Gmail sign-in failed", e?.message || "Unknown error");
    }
  }

  async function disconnectGmail() {
    await clearGmailAccessToken();
    await refreshGmailStatus();
    Alert.alert("Disconnected", "Gmail access token removed.");
  }

  async function scanGmailNow() {
    const tok = await getGmailAccessToken();
    if (!tok) {
      Alert.alert("Gmail not connected", "Tap Connect Gmail first.");
      return;
    }
    if (tok.expiresAtMs <= Date.now()) {
      Alert.alert("Token expired", "Reconnect Gmail to continue scanning.");
      return;
    }

    setGmailBusy(true);
    try {
      const { scanned, flagged } = await scanLatestGmail(tok.token, 5);
      Alert.alert("Gmail scan complete", `Scanned ${scanned} email(s). Flagged ${flagged}.`);
    } catch (e: any) {
      Alert.alert("Gmail scan failed", e?.message || "Unknown error");
    } finally {
      setGmailBusy(false);
    }
  }

  const shareIntentNote =
    "To scan incoming SMS, emails, or links: open the message → Share → AI ScamShield. For links, you can also copy and use Paste on the Analyze screen.";

  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.h2}>Configure how ScamShield receives and scans content.</Text>

        <GlassCard title="How to scan incoming content" subtitle="SMS, emails, WhatsApp, browser links, etc.">
          <Text style={styles.value}>{shareIntentNote}</Text>
          <Text style={styles.note}>
            Note: Share-intent receiving requires a custom build (EAS APK). It will not work inside stock Expo Go.
          </Text>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Automation" subtitle="What should happen when you share content into the app">
          <Row label="Auto-analyze shared content" value={appSettings.autoAnalyzeShared} onToggle={() => toggleSetting("autoAnalyzeShared")} />
          <Row label="Watch clipboard for URLs (on app open)" value={appSettings.watchClipboard} onToggle={() => toggleSetting("watchClipboard")} />
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Gmail scanning" subtitle="Connect Gmail to scan your recent emails">
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {gmailStatus.connected ? `Connected (token ~${gmailStatus.expiresInMin} min left)` : "Not connected"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={gmailStatus.connected ? disconnectGmail : connectGmail}
              disabled={!request && !gmailStatus.connected}
              style={[styles.smallBtn, { backgroundColor: gmailStatus.connected ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.25)", opacity: !request && !gmailStatus.connected ? 0.6 : 1 }]}
            >
              <Text style={styles.smallBtnText}>{gmailStatus.connected ? "Disconnect" : "Connect"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={scanGmailNow}
            disabled={!gmailStatus.connected || gmailBusy}
            style={[styles.primaryAction, { opacity: !gmailStatus.connected || gmailBusy ? 0.6 : 1 }]}
          >
            <Text style={styles.primaryActionText}>{gmailBusy ? "Scanning…" : "Scan latest emails now"}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Gmail access uses Google OAuth + the Gmail readonly scope. For a full production app you typically use a backend to securely refresh tokens.
          </Text>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="API Backend" subtitle="Where the app sends content for analysis">
          <Text style={styles.label}>EXPO_PUBLIC_API_URL</Text>
          <Text style={styles.value}>{apiUrl || "(not set)"}</Text>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Build info" subtitle="Helpful for troubleshooting">
          <Text style={styles.value}>App ownership: {Constants.appOwnership || "unknown"}</Text>
          <Text style={styles.value}>SDK: {Constants.expoConfig?.sdkVersion || "n/a"}</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://docs.expo.dev/build/introduction/")}>
            <Text style={[styles.value, { color: "#93C5FD", marginTop: 8, fontWeight: "800" }]}>EAS Build docs</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="About" subtitle="Safety & privacy notes">
          <Text style={styles.value}>
            AI ScamShield scans the content you submit (or share into the app) using your configured backend and returns a risk score, reasons, and recommended actions.
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

function Row({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.rowBetween, { marginTop: 10 }]}>
      <Text style={[styles.value, { flex: 1, paddingRight: 12 }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  h1: { color: "#E7ECFF", fontSize: 22, fontWeight: "800" },
  h2: { color: "rgba(231,236,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  label: { color: "rgba(231,236,255,0.6)", fontSize: 12, fontWeight: "800", marginTop: 6 },
  value: { color: "rgba(231,236,255,0.85)", marginTop: 6, lineHeight: 18 },
  note: { color: "rgba(231,236,255,0.55)", marginTop: 10, fontSize: 12, lineHeight: 17 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  smallBtnText: { color: "#E7ECFF", fontWeight: "900" },
  primaryAction: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.22)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.45)",
    alignItems: "center",
  },
  primaryActionText: { color: "#E7ECFF", fontWeight: "900" },
});
