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
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { runAiTool } from "../lib/api";
import { Markdown } from "../lib/markdown";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";

export default function ExplainScreen() {
  const { colors, gradient } = useTheme();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExplain() {
    if (!topic.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await runAiTool("explain", topic.trim());
      if (res.result) {
        setResult(res.result);
        hapticSuccess();
      } else {
        setError("No explanation returned. Try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTopic("");
    setResult(null);
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Explain Topic</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>AI-powered explanations</Text>
          </View>
        </View>

        {/* Input */}
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(139, 107, 74, 0.15)", alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="lightbulb" size={18} color={colors.accent} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>What do you want to learn?</Text>
          </View>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Neural Networks, Photosynthesis, Blockchain..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            multiline
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.input,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.text,
              minHeight: 56,
              textAlignVertical: "top",
            }}
          />

          {error && (
            <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
              <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={onExplain}
            disabled={loading || !topic.trim()}
            style={{ marginTop: 14, borderRadius: 14, overflow: "hidden" }}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                opacity: loading || !topic.trim() ? 0.5 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="auto-awesome" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Explain</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Result */}
        {result && (
          <View style={{ marginTop: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(100, 200, 120, 0.15)", alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="check-circle" size={18} color={colors.greenText} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Explanation</Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={reset} style={{ padding: 6 }}>
                <MaterialIcons name="refresh" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <Markdown content={result} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
