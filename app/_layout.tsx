import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth";

function RootNavigator() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const onLoginScreen = segments[0] === "login";
    if (!user && !onLoginScreen) {
      router.replace("/login");
    } else if (user && onLoginScreen) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#88BDA4" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#B1D3B9" },
        headerTintColor: "#659287",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#E6F2DD" },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "My Notes" }} />
      <Stack.Screen name="new" options={{ title: "New Note" }} />
      <Stack.Screen name="note/[id]" options={{ title: "Note" }} />
      <Stack.Screen name="test/index" options={{ title: "Test Yourself" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
