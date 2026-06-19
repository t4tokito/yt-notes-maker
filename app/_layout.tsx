import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { initDb } from "../lib/db";

export default function RootLayout() {
  useEffect(() => {
    initDb().catch((e) => console.error("DB init failed", e));
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "My Notes" }} />
        <Stack.Screen name="new" options={{ title: "New Note" }} />
        <Stack.Screen name="note/[id]" options={{ title: "Note" }} />
      </Stack>
    </>
  );
}
