import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Markdown } from "../../lib/markdown";
import { deleteNote, getNote, updateNote, type Note } from "../../lib/notes";
import { useTheme } from "../../lib/theme";
import { hapticMedium, hapticSuccess } from "../../lib/haptics";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id;
  const router = useRouter();
  const { colors } = useTheme();
  const contentRef = useRef<TextInput>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState("");
  const [exporting, setExporting] = useState(false);

  useFocusEffect(useCallback(() => { getNote(noteId).then((n) => { setNote(n); setTitleDraft(n?.title ?? ""); setContentDraft(n?.content ?? ""); }); }, [noteId]));

  async function saveTitle() {
    const next = titleDraft.trim();
    if (note && next && next !== note.title) { await updateNote(note.id, { title: next }); setNote({ ...note, title: next }); hapticSuccess(); }
    else { setTitleDraft(note?.title ?? ""); }
    setEditingTitle(false);
  }

  async function saveContent() {
    if (note && contentDraft !== note.content) { await updateNote(note.id, { content: contentDraft }); setNote({ ...note, content: contentDraft }); hapticSuccess(); }
    setEditingContent(false);
  }

  function confirmDelete() {
    Alert.alert("Delete note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { hapticMedium(); await deleteNote(noteId); router.back(); } },
    ]);
  }

  async function exportToPdf() {
    if (!note) return;
    setExporting(true);
    hapticMedium();
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:40px;color:#333;line-height:1.6}h1,h2,h3{color:#4A3A70}h1{font-size:28px;border-bottom:2px solid #5C4A8C;padding-bottom:8px}h2{font-size:22px;margin-top:24px}h3{font-size:18px}strong{color:#4A3A70}code{background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:14px}blockquote{border-left:4px solid #5C4A8C;padding-left:16px;color:#666;margin:16px 0}ul,ol{padding-left:24px}li{margin:4px 0}hr{border:none;border-top:1px solid #E0E0E0;margin:24px 0}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #E0E0E0;font-size:12px;color:#999}</style></head><body><h1>${note.title}</h1>${markdownToHtml(note.content)}<div class="footer">Exported from Notes Maker</div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      hapticSuccess();
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to export PDF."); }
    finally { setExporting(false); }
  }

  if (!note) {
    return (<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}><ActivityIndicator color={colors.accent} /><Text style={{ marginTop: 12, color: colors.muted }}>Loading...</Text></View>);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ marginTop: 40, marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MaterialIcons name="arrow-back" size={18} color={colors.accent} />
          <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "600" }}>Back</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable onPress={exportToPdf} disabled={exporting} hitSlop={10}>
            {exporting ? <ActivityIndicator color={colors.accent} size="small" /> : <MaterialIcons name="file-download" size={22} color={colors.accent} />}
          </Pressable>
          <Pressable onPress={confirmDelete} hitSlop={10}>
            <MaterialIcons name="delete-outline" size={22} color={colors.errorText} />
          </Pressable>
        </View>
      </View>

      <View style={{ borderRadius: 20, backgroundColor: colors.card, padding: 20, borderWidth: 1, borderColor: colors.border }}>
        {editingTitle ? (
          <TextInput value={titleDraft} onChangeText={setTitleDraft} onBlur={saveTitle} onSubmitEditing={saveTitle} autoFocus multiline
            style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 10, fontSize: 22, fontWeight: "700", color: colors.text }} />
        ) : (
          <Pressable onPress={() => { hapticMedium(); setEditingTitle(true); }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>{note.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <MaterialIcons name="edit" size={12} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.muted }}>Tap to edit title</Text>
            </View>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: colors.card, padding: 20, borderWidth: 1, borderColor: colors.border }}>
        {editingContent ? (
          <View>
            <TextInput ref={contentRef} value={contentDraft} onChangeText={setContentDraft} multiline autoFocus
              style={{ fontSize: 15, lineHeight: 24, color: colors.text, minHeight: 200, textAlignVertical: "top" }} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => { setContentDraft(note.content); setEditingContent(false); }}
                style={{ flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveContent} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: colors.accent, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => { hapticMedium(); setEditingContent(true); setContentDraft(note.content); }}>
            <Markdown content={note.content} />
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialIcons name="edit" size={12} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.muted }}>Tap to edit content</Text>
            </View>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 20, flexDirection: "row", gap: 12 }}>
        <Pressable onPress={() => { hapticMedium(); router.push(`/test?noteId=${note.id}`); }}
          style={{ flex: 1, height: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
          <MaterialIcons name="school" size={20} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Test me</Text>
        </Pressable>
        <Pressable onPress={exportToPdf} disabled={exporting}
          style={{ flex: 1, height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
          {exporting ? <ActivityIndicator color={colors.accent} /> : <><MaterialIcons name="picture-as-pdf" size={20} color={colors.accent} /><Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>Export PDF</Text></>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function markdownToHtml(md: string): string {
  return md.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>").replace(/^---$/gm, "<hr>").replace(/^- (.+)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`).replace(/^\d+\. (.+)$/gm, "<li>$1</li>").replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
}
