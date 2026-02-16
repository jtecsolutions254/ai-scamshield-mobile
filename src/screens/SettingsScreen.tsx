import React from "react";
import { ScrollView, Text, StyleSheet, View, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { API_BASE } from "../lib/api";

export default function SettingsScreen() {
  return (
    <LinearGradient colors={["#070A12", "#0B1020", "#0E2B3A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.h2}>App configuration and quick links.</Text>

        <GlassCard title="Backend API" subtitle="This is the API base URL the app calls.">
          <Text style={styles.kv}>{API_BASE}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton label="Open API Docs" onPress={() => Linking.openURL(`${API_BASE}/docs`)} />
        </GlassCard>

        <View style={{ height: 12 }} />

        <GlassCard title="Privacy" subtitle="Avoid pasting personal data. Use anonymized samples for demos.">
          <Text style={styles.kv}>
            For production, add anonymization and optional reporting consent. Do not store sensitive identifiers unless required.
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  h1: { color: "#E7ECFF", fontSize: 22, fontWeight: "800" },
  h2: { color: "rgba(231,236,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  kv: { color: "rgba(231,236,255,0.78)" },
});
