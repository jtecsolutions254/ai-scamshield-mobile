import React, { useEffect, useMemo, useRef } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import AnalyzeScreen from "./src/screens/AnalyzeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import TrendsScreen from "./src/screens/TrendsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

import { getClipboardUrl } from "./src/lib/clipboard";
import { classifyShareIntent } from "./src/lib/shareClassifier";
import { getSettings } from "./src/lib/storage";

const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

// expo-share-intent requires a custom build (EAS). In Expo Go it won't be available.
let ShareIntentProvider: React.ComponentType<any> | null = null;
let useShareIntent: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("expo-share-intent");
  ShareIntentProvider = mod.ShareIntentProvider;
  useShareIntent = mod.useShareIntent;
} catch {
  ShareIntentProvider = null;
  useShareIntent = null;
}

function ShareIntentHandler() {
  if (!useShareIntent) return null;

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    (async () => {
      if (!hasShareIntent) return;
      if (!navigationRef.isReady()) return;

      const s = await getSettings();
      const autoAnalyze = s.autoAnalyzeShared;

      const payload = classifyShareIntent(shareIntent);
      if (payload) {
        if (payload.mode === "url") {
          navigationRef.navigate("Analyze" as never, { prefillMode: "url", prefillUrl: payload.url, autoAnalyze } as never);
        } else if (payload.mode === "email") {
          navigationRef.navigate("Analyze" as never, { prefillMode: "email", prefillEmailBody: payload.body, autoAnalyze } as never);
        } else {
          navigationRef.navigate("Analyze" as never, { prefillMode: "sms", prefillText: payload.text, autoAnalyze } as never);
        }
      }

      if (typeof resetShareIntent === "function") resetShareIntent();
    })();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  return null;
}

function ClipboardWatcher() {
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function maybePromptClipboardUrl() {
      try {
        const s = await getSettings();
        if (!s.watchClipboard) return;

        const u = await getClipboardUrl();
        if (!u) return;
        if (lastUrlRef.current === u) return;
        lastUrlRef.current = u;

        Alert.alert("Scan this link?", u, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Analyze",
            onPress: () => {
              if (!navigationRef.isReady()) return;
              navigationRef.navigate("Analyze" as never, { prefillMode: "url", prefillUrl: u } as never);
            },
          },
        ]);
      } catch {
        // ignore
      }
    }

    function onAppStateChange(state: AppStateStatus) {
      if (!mounted) return;
      if (state === "active") maybePromptClipboardUrl();
    }

    const sub = AppState.addEventListener("change", onAppStateChange);
    // Run once on mount
    maybePromptClipboardUrl();

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return null;
}

export default function App() {
  const Container: React.ComponentType<any> = useMemo(() => {
    // Only wrap provider if native module exists (i.e., custom dev/EAS build).
    return ShareIntentProvider || (({ children }: any) => children);
  }, []);

  return (
    <Container>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <ClipboardWatcher />
        <ShareIntentHandler />

        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: "#070A12" },
            headerTintColor: "#E7ECFF",
            tabBarStyle: { backgroundColor: "#070A12", borderTopColor: "rgba(255,255,255,0.08)" },
            tabBarActiveTintColor: "#60A5FA",
            tabBarInactiveTintColor: "rgba(231,236,255,0.55)",
            tabBarIcon: ({ color, size }) => {
              let iconName: any = "shield-checkmark";
              if (route.name === "Analyze") iconName = "shield-checkmark";
              if (route.name === "History") iconName = "time";
              if (route.name === "Trends") iconName = "bar-chart";
              if (route.name === "Settings") iconName = "settings";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Analyze" component={AnalyzeScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Trends" component={TrendsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </Container>
  );
}
