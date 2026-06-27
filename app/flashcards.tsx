import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";
import { getNotes, type Note } from "../lib/notes";
import { runAiTool, type Flashcard } from "../lib/api";
import { saveFlashcardSet } from "../lib/flashcards";

export default function FlashcardsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [selected, setSelected] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    setNotesLoading(true);
    getNotes().then(setNotes).catch(() => {}).finally(() => setNotesLoading(false));
  }, []));

  async function generate() {
    if (!selected) return;
    setError(null);
    setCards(null);
    setActiveCard(null);
    setFlipped(false);
    setLoading(true);
    hapticMedium();
    try {
      const res = await runAiTool("flashcards", selected.content);
      if (res.cards && res.cards.length > 0) {
        setCards(res.cards);
        setActiveCard(0);
        setSaved(false);
        saveFlashcardSet(selected.title, res.cards).then(() => setSaved(true)).catch(() => {});
        hapticSuccess();
      } else {
        setError("No flashcards could be generated from this note.");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function flipCard() {
    if (activeCard === null || !cards) return;
    hapticMedium();
    setFlipped(!flipped);
  }

  function nextCard() {
    if (!cards || activeCard === null) return;
    hapticMedium();
    if (activeCard < cards.length - 1) {
      setActiveCard(activeCard + 1);
      setFlipped(false);
    }
  }

  function prevCard() {
    if (activeCard === null || activeCard > 0) {
      hapticMedium();
      setActiveCard(activeCard! - 1);
      setFlipped(false);
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
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Flashcards</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: colors.muted }}>Pick a note to generate flashcards from</Text>
          </View>

          {!cards && (
            <>
              {notesLoading ? (
                <View style={{ gap: 8 }}>
                  <View style={{ height: 48, borderRadius: 12, backgroundColor: colors.input, opacity: 0.4 }} />
                  <View style={{ height: 48, borderRadius: 12, backgroundColor: colors.input, opacity: 0.4 }} />
                  <View style={{ height: 48, borderRadius: 12, backgroundColor: colors.input, opacity: 0.4 }} />
                </View>
              ) : notes.length === 0 ? (
                <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 28, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                  <MaterialIcons name="note-add" size={32} color={colors.border} />
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>Create a note first</Text>
                </View>
              ) : (
                notes.map((note) => {
                  const isActive = selected?.id === note.id;
                  return (
                    <Pressable
                      key={note.id}
                      onPress={() => { hapticMedium(); setSelected(note); }}
                      style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: isActive ? colors.accent : colors.border }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <MaterialIcons name="description" size={18} color={isActive ? colors.accent : colors.muted} />
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "500", color: isActive ? colors.accent : colors.text }}>{note.title}</Text>
                        {isActive && <MaterialIcons name="check-circle" size={18} color={colors.accent} />}
                      </View>
                    </Pressable>
                  );
                })
              )}

              {selected && (
                <Pressable
                  onPress={generate}
                  disabled={loading}
                  style={{ marginTop: 16, height: 52, borderRadius: 14, backgroundColor: loading ? colors.muted : colors.accent, alignItems: "center", justifyContent: "center" }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialIcons name="style" size={18} color="#fff" />
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Generate Flashcards</Text>
                    </View>
                  )}
                </Pressable>
              )}
            </>
          )}

          {error ? (
            <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
              <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {cards && activeCard !== null && (
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>{activeCard + 1} / {cards.length}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {saved && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <MaterialIcons name="check" size={12} color={colors.greenText} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.greenText }}>Saved</Text>
                    </View>
                  )}
                  <Pressable onPress={() => { setCards(null); setActiveCard(null); setSelected(null); setFlipped(false); setSaved(false); }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>New Set</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 20, overflow: "hidden" }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.accent, width: `${((activeCard + 1) / cards.length) * 100}%` }} />
              </View>

              <Pressable
                onPress={flipCard}
                style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: flipped ? colors.accent : colors.border, minHeight: 180, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 12, letterSpacing: 0.5 }}>{flipped ? "ANSWER" : "QUESTION"}</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, textAlign: "center", lineHeight: 26 }}>
                  {flipped ? cards[activeCard].back : cards[activeCard].front}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 16 }}>Tap to flip</Text>
              </Pressable>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <Pressable
                  onPress={prevCard}
                  disabled={activeCard === 0}
                  style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", opacity: activeCard === 0 ? 0.4 : 1 }}
                >
                  <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={nextCard}
                  disabled={activeCard === cards.length - 1}
                  style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: activeCard === cards.length - 1 ? colors.muted : colors.accent, alignItems: "center", justifyContent: "center", opacity: activeCard === cards.length - 1 ? 0.4 : 1 }}
                >
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
