import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, authErrorMessage, useAuth } from "../lib/auth";
import { ThemeProvider, useTheme } from "../lib/theme";
import { NotificationProvider } from "../lib/notifications";
import { BottomNav } from "../components/BottomNav";
import { VersionCheckModal } from "../components/VersionCheckModal";
import { checkVersion } from "../lib/api";
import { APP_VERSION } from "../config";

function UsernamePrompt() {
  const { user, needsUsername, setUsername } = useAuth();
  const { colors } = useTheme();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visible = !!user && needsUsername;

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await setUsername(value);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
        <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Choose a username
          </Text>
          <Text style={{ marginBottom: 14, marginTop: 4, fontSize: 12, color: colors.muted }}>
            6-15 characters, letters, numbers, underscore
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="yourname"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={15}
            editable={!saving}
            onSubmitEditing={save}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
          />
          {error ? (
            <Text style={{ marginTop: 10, fontSize: 12, color: colors.errorText }}>{error}</Text>
          ) : null}
          <Pressable
            onPress={save}
            disabled={saving}
            style={{ marginTop: 14, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: saving ? colors.muted : colors.accent }}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();
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
      <UsernamePrompt />
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
