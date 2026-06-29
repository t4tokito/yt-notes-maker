import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../lib/firebase";
import { authErrorMessage } from "../lib/auth";
import { useTheme } from "../lib/theme";

export default function ForgotPassword() {
  const { colors } = useTheme();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError(null);
    if (!identifier.trim()) { setError("Please enter your email or username."); return; }
    setLoading(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const { resolveUsernameToEmail } = await import("../lib/usernames");
        const resolved = await resolveUsernameToEmail(email);
        if (!resolved) { setError("No account found with that username."); setLoading(false); return; }
        email = resolved;
      }
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (e) { setError(authErrorMessage(e)); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={{ position: "absolute", top: 56, left: 20, padding: 8 }}>
          <MaterialIcons name="arrow-back" size={22} color={colors.accent} />
        </Pressable>

        <View style={{ marginBottom: 36, alignItems: "center" }}>
          <View style={{ marginBottom: 16, width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialIcons name="lock-reset" size={28} color={colors.accent} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Forgot Password?</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: colors.muted, textAlign: "center" }}>
            Enter your email or username and we'll send you a reset link
          </Text>
        </View>

        {sent ? (
          <View style={{ alignItems: "center", padding: 24 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.greenBg, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <MaterialIcons name="mark-email-read" size={28} color={colors.greenText} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 6 }}>Check your inbox</Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 }}>
              We sent a password reset link to your email address. Follow the link to set a new password.
            </Text>
            <Pressable onPress={() => router.back()}
              style={{ marginTop: 24, height: 48, paddingHorizontal: 32, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Back to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={{ marginBottom: 6, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>EMAIL OR USERNAME</Text>
            <TextInput value={identifier} onChangeText={setIdentifier} placeholder="yourname or you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} editable={!loading}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }} />

            {error ? (
              <View style={{ marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
                <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Pressable onPress={handleReset} disabled={loading}
              style={{ marginTop: 24, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: loading ? colors.muted : colors.accent }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Send Reset Link</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
