import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import { AnimatedCard } from "../components/AnimatedCard";
import { SkeletonCard } from "../components/Skeleton";
import { Header } from "../components/Header";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";
import { deleteNote, getNotes, updateNote, type Note } from "../lib/notes";
import { getFlashcardSets, deleteFlashcardSet, updateFlashcardSet, type FlashcardSet } from "../lib/flashcards";

type Tab = "notes" | "flashcards";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function NotesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [fcMenuVisible, setFcMenuVisible] = useState(false);
  const [selectedFc, setSelectedFc] = useState<FlashcardSet | null>(null);
  const [fcRenameVisible, setFcRenameVisible] = useState(false);
  const [fcRenameDraft, setFcRenameDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      getNotes().then(setNotes).catch(() => {}),
      getFlashcardSets().then(setFlashcardSets).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredNotes = search.trim()
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : notes;

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.created_at - a.created_at;
  });

  const filteredCards = search.trim()
    ? flashcardSets.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : flashcardSets;

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.created_at - a.created_at;
  });

  function handleDelete(note: Note) {
    setMenuVisible(false);
    Alert.alert("Delete note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { hapticSuccess(); await deleteNote(note.id); load(); } },
    ]);
  }

  function handleRename(note: Note) {
    setMenuVisible(false);
    setSelectedNote(note);
    setRenameDraft(note.title);
    setRenameVisible(true);
  }

  async function saveRename() {
    if (selectedNote && renameDraft.trim()) {
      await updateNote(selectedNote.id, { title: renameDraft.trim() });
      hapticSuccess();
      load();
    }
    setRenameVisible(false);
  }

  async function handlePin(note: Note) {
    setMenuVisible(false);
    await updateNote(note.id, { pinned: !note.pinned });
    hapticSuccess();
    load();
  }

  function handleDeleteFlashcard(set: FlashcardSet) {
    setFcMenuVisible(false);
    Alert.alert("Delete flashcards", `Delete "${set.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { hapticSuccess(); await deleteFlashcardSet(set.id); load(); } },
    ]);
  }

  function handlePinFlashcard(set: FlashcardSet) {
    setFcMenuVisible(false);
    updateFlashcardSet(set.id, { pinned: !set.pinned }).then(() => { hapticSuccess(); load(); });
  }

  function handleRenameFlashcard(set: FlashcardSet) {
    setFcMenuVisible(false);
    setSelectedFc(set);
    setFcRenameDraft(set.title);
    setFcRenameVisible(true);
  }

  async function saveFcRename() {
    if (selectedFc && fcRenameDraft.trim()) {
      await updateFlashcardSet(selectedFc.id, { title: fcRenameDraft.trim() });
      hapticSuccess();
      load();
    }
    setFcRenameVisible(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <Header title="NOTES" onProfilePress={() => router.push("/profile")} />

        {/* Tabs */}
        <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => { hapticMedium(); setTab("notes"); setSearch(""); }}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: tab === "notes" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "notes" ? colors.accent : colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "notes" ? "#fff" : colors.muted }}>Notes ({notes.length})</Text>
          </Pressable>
          <Pressable onPress={() => { hapticMedium(); setTab("flashcards"); setSearch(""); }}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: tab === "flashcards" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "flashcards" ? colors.accent : colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "flashcards" ? "#fff" : colors.muted }}>Flashcards ({flashcardSets.length})</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: colors.card, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
          <MaterialIcons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false}
            style={{ flex: 1, fontSize: 13, color: colors.text }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Content */}
        <View style={{ marginHorizontal: 20, marginTop: 12, flex: 1 }}>
          {loading ? (
            <View><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
          ) : tab === "notes" ? (
            sortedNotes.length === 0 ? (
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 28, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
                <MaterialIcons name="note-add" size={32} color={colors.border} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 8 }}>No notes yet</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" }}>Create from the Create tab</Text>
              </View>
            ) : (
              <FlatList
                data={sortedNotes}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item, index }) => (
                  <AnimatedCard index={index} onPress={() => router.push(`/note/${item.id}`)} swipeEnabled={false}>
                    <View style={{
                      backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      borderWidth: 1, borderColor: item.pinned ? colors.accent + "60" : colors.border,
                    }}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {item.pinned && <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: colors.accent }} />}
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.title}</Text>
                          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{formatDate(item.created_at)}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => { hapticMedium(); setSelectedNote(item); setMenuVisible(true); }} hitSlop={10} style={{ padding: 6 }}>
                        <MaterialIcons name="more-vert" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  </AnimatedCard>
                )}
              />
            )
          ) : (
            sortedCards.length === 0 ? (
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 28, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
                <MaterialIcons name="style" size={32} color={colors.border} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 8 }}>No flashcards yet</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" }}>Generate from the Create tab</Text>
              </View>
            ) : (
              <FlatList
                data={sortedCards}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item, index }) => (
                  <AnimatedCard index={index} swipeEnabled={false}>
                    <View style={{
                      backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      borderWidth: 1, borderColor: item.pinned ? colors.accent + "60" : colors.border,
                    }}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {item.pinned && <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: colors.accent }} />}
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: "center", justifyContent: "center" }}>
                          <MaterialIcons name="style" size={18} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.title}</Text>
                          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{item.cards.length} cards · {formatDate(item.created_at)}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => { hapticMedium(); setSelectedFc(item); setFcMenuVisible(true); }} hitSlop={10} style={{ padding: 6 }}>
                        <MaterialIcons name="more-vert" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  </AnimatedCard>
                )}
              />
            )
          )}
        </View>

        {/* Note Menu */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
            <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 40 }}>
              <Pressable onPress={(e: any) => e.stopPropagation()}
                style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: colors.card, overflow: "hidden", padding: 6, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{selectedNote?.title}</Text>
                </View>
                <Pressable onPress={() => { hapticMedium(); handlePin(selectedNote!); }}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <MaterialIcons name="push-pin" size={18} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{selectedNote?.pinned ? "Unpin" : "Pin"}</Text>
                </Pressable>
                <Pressable onPress={() => handleRename(selectedNote!)}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <MaterialIcons name="edit" size={18} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Rename</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(selectedNote!)}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.errorText} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.errorText }}>Delete</Text>
                </Pressable>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Rename Modal */}
        <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
            <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 18, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ marginBottom: 12, fontSize: 15, fontWeight: "600", color: colors.text }}>Rename</Text>
              <TextInput value={renameDraft} onChangeText={setRenameDraft} onSubmitEditing={saveRename} autoFocus
                style={{ borderRadius: 10, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
              />
              <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => setRenameVisible(false)} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.input, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveRename} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Flashcard Menu */}
        <Modal visible={fcMenuVisible} transparent animationType="fade" onRequestClose={() => setFcMenuVisible(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setFcMenuVisible(false)}>
            <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 40 }}>
              <Pressable onPress={(e: any) => e.stopPropagation()}
                style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: colors.card, overflow: "hidden", padding: 6, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{selectedFc?.title}</Text>
                </View>
                <Pressable onPress={() => { hapticMedium(); handlePinFlashcard(selectedFc!); }}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <MaterialIcons name="push-pin" size={18} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{selectedFc?.pinned ? "Unpin" : "Pin"}</Text>
                </Pressable>
                <Pressable onPress={() => handleRenameFlashcard(selectedFc!)}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <MaterialIcons name="edit" size={18} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Rename</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteFlashcard(selectedFc!)}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.errorText} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.errorText }}>Delete</Text>
                </Pressable>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Flashcard Rename Modal */}
        <Modal visible={fcRenameVisible} transparent animationType="fade" onRequestClose={() => setFcRenameVisible(false)}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
            <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 18, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ marginBottom: 12, fontSize: 15, fontWeight: "600", color: colors.text }}>Rename</Text>
              <TextInput value={fcRenameDraft} onChangeText={setFcRenameDraft} onSubmitEditing={saveFcRename} autoFocus
                style={{ borderRadius: 10, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
              />
              <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => setFcRenameVisible(false)} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.input, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveFcRename} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}
