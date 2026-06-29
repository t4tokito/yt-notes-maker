import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { authErrorMessage, useAuth } from "../lib/auth";
import { validateUsername } from "../lib/usernames";
import { useTheme } from "../lib/theme";

type Mode = "login" | "signup";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === "login";

  async function onSubmit() {
    setError(null);
    if (isLogin) {
      if (!identifier.trim() || !password) { setError("Enter your username/email and password."); return; }
    } else {
      if (!email.trim() || !username.trim() || !password) { setError("Enter an email, username, and password."); return; }
      const uErr = validateUsername(username);
      if (uErr) { setError(uErr); return; }
    }
    setLoading(true);
    try {
      if (isLogin) { await signIn(identifier, password); }
      else { await signUp(email, username, password); }
    } catch (e) { setError(authErrorMessage(e)); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 48, alignItems: "center" }}>
          <View style={{ marginBottom: 16, width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialIcons name="edit-note" size={28} color={colors.accent} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>TokitoFlix</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: colors.muted, textAlign: "center" }}>
            {isLogin ? "Welcome back" : "Create an account"}
          </Text>
        </View>

        {isLogin ? (
          <>
            <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>USERNAME OR EMAIL</Text>
            <TextInput value={identifier} onChangeText={setIdentifier} placeholder="yourname or you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} editable={!loading}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }} />
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>EMAIL</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!loading}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }} />
            <Text style={{ marginBottom: 6, marginTop: 16, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>USERNAME</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="6-15 characters" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} maxLength={15} editable={!loading}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }} />
          </>
        )}

        <Text style={{ marginBottom: 6, marginTop: 16, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>PASSWORD</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} secureTextEntry editable={!loading} onSubmitEditing={onSubmit}
          style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }} />

        {isLogin && (
          <Pressable onPress={() => router.push("/forgot-password")} disabled={loading} style={{ marginTop: 12, alignSelf: "flex-end" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Forgot Password?</Text>
          </Pressable>
        )}

        {error ? (
          <View style={{ marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
            <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable onPress={onSubmit} disabled={loading}
          style={{ marginTop: 24, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: loading ? colors.muted : colors.accent }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{isLogin ? "Sign In" : "Create Account"}</Text>}
        </Pressable>

        <Pressable onPress={() => { setError(null); setMode(isLogin ? "signup" : "login"); }} disabled={loading} style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {isLogin ? "New here? " : "Already have an account? "}
            <Text style={{ fontWeight: "600", color: colors.accent }}>{isLogin ? "Create account" : "Sign in"}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
