import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";
import { generatePdfNotes, type NoteStyle } from "../lib/api";
import { insertNote } from "../lib/notes";

const STYLES: { key: NoteStyle; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: "summary", label: "Summary", icon: "summarize" },
  { key: "detailed", label: "Detailed", icon: "auto-stories" },
  { key: "bullets", label: "Bullets", icon: "format-list-bulleted" },
];

export default function PdfNotesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [pdf, setPdf] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) {
      setPdf(res.assets[0]);
      setError(null);
    }
  }

  async function onGenerate() {
    if (!pdf) { setError("Choose a PDF first."); return; }
    setError(null);
    setLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => { setProgress((p) => { if (p >= 90) return 90; return p + Math.random() * 15; }); }, 800);
    try {
      const result = await generatePdfNotes({ uri: pdf.uri, name: pdf.name, mimeType: pdf.mimeType }, style);
      clearInterval(progressInterval);
      setProgress(100);
      const title = pdf.name?.replace(/\.pdf$/i, "") || "PDF Notes";
      const id = await insertNote({ video_id: null, title, url: null, content: result.notes });
      hapticSuccess();
      setTimeout(() => router.replace(`/note/${id}`), 500);
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ marginTop: 40, marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ marginBottom: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>PDF to Notes</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: colors.muted }}>Upload a PDF and get AI-generated notes</Text>
          </View>

          <Pressable onPress={pickPdf}
            style={{ backgroundColor: colors.card, borderRadius: 16, padding: 28, alignItems: "center", borderWidth: 2, borderStyle: "dashed", borderColor: colors.border }}>
            <MaterialIcons name="upload-file" size={40} color={colors.accent} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 10 }}>{pdf ? pdf.name : "Choose a PDF"}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{pdf ? "Tap to change" : "Text-based PDFs only"}</Text>
          </Pressable>

          <Text style={{ marginTop: 20, marginBottom: 10, fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>NOTE STYLE</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STYLES.map((s) => {
              const active = s.key === style;
              return (
                <Pressable key={s.key} onPress={() => { hapticMedium(); setStyle(s.key); }} disabled={loading}
                  style={{ flex: 1, alignItems: "center", borderRadius: 12, borderWidth: active ? 2 : 1, paddingVertical: 14, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentLight : colors.card }}>
                  <MaterialIcons name={s.icon} size={24} color={active ? colors.accent : colors.muted} />
                  <Text style={{ marginTop: 4, fontSize: 12, fontWeight: "600", color: active ? colors.accent : colors.muted }}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View style={{ marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="error-outline" size={16} color={colors.errorText} />
              <Text style={{ fontSize: 13, color: colors.errorText, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {loading && (
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>Generating...</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>{Math.min(Math.round(progress), 100)}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.accent, width: `${Math.min(progress, 100)}%` }} />
              </View>
              <Text style={{ marginTop: 6, fontSize: 11, color: colors.muted }}>
                {progress < 30 ? "Reading PDF..." : progress < 60 ? "Analyzing content..." : progress < 90 ? "AI is writing notes..." : "Almost done..."}
              </Text>
            </View>
          )}

          <Pressable onPress={onGenerate} disabled={loading || !pdf}
            style={{ marginTop: 24, height: 52, borderRadius: 14, backgroundColor: loading || !pdf ? colors.muted : colors.accent, alignItems: "center", justifyContent: "center" }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="auto-fix-high" size={18} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Generate Notes</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
