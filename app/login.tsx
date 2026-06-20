import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { authErrorMessage, useAuth } from "../lib/auth";

type Mode = "login" | "signup";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-leaf-100">
            <Text className="text-4xl">📝</Text>
          </View>
          <Text className="text-3xl font-bold text-text-primary">Notes Maker</Text>
          <Text className="mt-2 text-base text-leaf-200">
            {isLogin
              ? "Welcome back — sign in to your notes."
              : "Create an account to save your notes."}
          </Text>
        </View>

        <Text className="mb-2 text-sm font-medium text-text-primary">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#B1D3B9"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
          className="rounded-xl border border-leaf-100 bg-white/60 px-4 py-3 text-base text-text-primary"
        />

        <Text className="mb-2 mt-5 text-sm font-medium text-text-primary">
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#B1D3B9"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={onSubmit}
          className="rounded-xl border border-leaf-100 bg-white/60 px-4 py-3 text-base text-text-primary"
        />

        {error ? (
          <View className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3">
            <Text className="text-sm text-red-500">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
            loading ? "bg-leaf-200/60" : "bg-leaf-200 active:opacity-80"
          }`}
          style={{
            shadowColor: "#659287",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-bold text-white">
              {isLogin ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(isLogin ? "signup" : "login");
          }}
          disabled={loading}
          className="mt-6 items-center"
        >
          <Text className="text-sm text-leaf-200">
            {isLogin ? "New here? " : "Already have an account? "}
            <Text className="font-semibold text-leaf-300">
              {isLogin ? "Create an account" : "Sign in"}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
