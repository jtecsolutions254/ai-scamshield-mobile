import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";

import AnalyzeScreen from "./src/screens/AnalyzeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import TrendsScreen from "./src/screens/TrendsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#070A12",
    card: "#0B1020",
    text: "#E7ECFF",
    border: "rgba(255,255,255,0.08)",
    primary: "#7C3AED",
    notification: "#22C55E",
  },
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0B1020" },
          headerTitleStyle: { color: "#E7ECFF" },
          tabBarStyle: { backgroundColor: "#0B1020", borderTopColor: "rgba(255,255,255,0.08)" },
          tabBarActiveTintColor: "#A78BFA",
          tabBarInactiveTintColor: "rgba(231,236,255,0.6)",
        }}
      >
        <Tab.Screen name="Analyze" component={AnalyzeScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Trends" component={TrendsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
