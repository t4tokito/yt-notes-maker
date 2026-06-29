import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider, useTheme } from "../lib/theme";
import { NotificationProvider } from "../lib/notifications";
import { BottomNav } from "../components/BottomNav";
import { VersionCheckModal } from "../components/VersionCheckModal";
import { checkVersion } from "../lib/api";
import { APP_VERSION } from "../config";

function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const onLoginScreen = segments[0] === "login";
    const onForgotPassword = segments[0] === "forgot-password";
    if (!user && !onLoginScreen && !onForgotPassword) {
      router.replace("/login");
    } else if (user && onLoginScreen) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="add-friend" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notes" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ title: "Note" }} />
      <Stack.Screen name="test/index" options={{ title: "Test Yourself" }} />
      <Stack.Screen name="friends" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="create-group" options={{ title: "Create Group" }} />
      <Stack.Screen name="group/[id]" options={{ title: "Group Chat" }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pdf-notes" options={{ headerShown: false }} />
      <Stack.Screen name="flashcards" options={{ headerShown: false }} />
      <Stack.Screen name="explain" options={{ headerShown: false }} />
      <Stack.Screen name="ai-tools" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppShell() {
  const { user } = useAuth();
  const segments = useSegments();
  const onLoginScreen = segments[0] === "login";
  const onChatDetail = segments[0] === "chat" && segments.length > 1;
  const isNewScreen = segments[0] === "new";
  const onGroupScreen = segments[0] === "group" || segments[0] === "create-group";
  const onUserScreen = segments[0] === "user";
  const onNoteDetail = segments[0] === "note";
  const onTestScreen = segments[0] === "test";
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      checkVersion().then((serverVersion) => {
        if (serverVersion && serverVersion !== APP_VERSION) {
          setUpdateAvailable(true);
        }
      }).catch(() => {});
    } catch {}
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      {user && !onLoginScreen && !onChatDetail && !isNewScreen && !onGroupScreen && !onUserScreen && !onNoteDetail && !onTestScreen && <BottomNav />}
      <VersionCheckModal visible={updateAvailable} onClose={() => setUpdateAvailable(false)} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PressStart2P: require("@expo-google-fonts/press-start-2p/400Regular/PressStart2P_400Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1E2030" }}>
        <ActivityIndicator color="#927FBF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <StatusBar style="light" />
            <AppShell />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
