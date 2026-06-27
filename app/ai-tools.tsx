import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { hapticMedium } from "../lib/haptics";
import { runAiTool, type AiTool } from "../lib/api";
import { Markdown } from "../lib/markdown";

type Flashcard = { front: string; back: string };

export default function AiToolsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  const tools: { key: AiTool; label: string; desc: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
    { key: "summarize", label: "Summarize", desc: "Get a quick summary", icon: "summarize", color: colors.greenText },
    { key: "explain", label: "Explain", desc: "Simple explanations", icon: "lightbulb-outline", color: colors.toolExplain },
    { key: "flashcards", label: "Flashcards", desc: "Study flashcards", icon: "style", color: colors.toolFlashcards },
  ];

  async function handleTool(toolKey: AiTool) {
    if (!topic.trim()) {
      setError("Enter a topic or paste some text first.");
      return;
    }
    setError(null);
    setResult(null);
    setCards(null);
    setActiveCard(null);
    setLoading(true);
    hapticMedium();
    try {
      const res = await runAiTool(toolKey, topic);
      if (toolKey === "flashcards" && res.cards) {
        setCards(res.cards);
      } else if (res.result) {
        setResult(res.result);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View style={{ marginTop: 40, marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ marginBottom: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>AI Study Tools</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: colors.muted }}>Enter a topic or paste text to get started</Text>
          </View>

          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="Enter a topic or paste text..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              fontSize: 14,
              color: colors.text,
              minHeight: 100,
              textAlignVertical: "top",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 }}>
            {tools.map((tool) => (
              <Pressable
                key={tool.key}
                onPress={() => handleTool(tool.key)}
                disabled={loading}
                style={({ pressed }) => ({
                  flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: "center",
                  borderWidth: 1, borderColor: pressed ? tool.color : colors.border,
                  opacity: loading ? 0.5 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tool.color + "18", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <MaterialIcons name={tool.icon} size={18} color={tool.color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
              <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {loading && (
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>Thinking...</Text>
            </View>
          )}

          {result && !loading && (
            <View style={{ marginTop: 20, backgroundColor: colors.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border }}>
              <Markdown content={result} />
            </View>
          )}

          {cards && !loading && (
            <View style={{ marginTop: 20, gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>{cards.length} CARDS — TAP TO FLIP</Text>
              {cards.map((card, i) => {
                const flipped = activeCard === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => { hapticMedium(); setActiveCard(flipped ? null : i); }}
                    style={{ backgroundColor: colors.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: flipped ? colors.accent : colors.border, minHeight: 80, justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>{flipped ? "BACK" : "FRONT"}</Text>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, lineHeight: 22 }}>{flipped ? card.back : card.front}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
