import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { generateNotes, type NoteStyle } from "../lib/api";
import { insertNote } from "../lib/notes";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";

const STYLES: { key: NoteStyle; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: "summary", label: "Summary", icon: "summarize" },
  { key: "detailed", label: "Detailed", icon: "auto-stories" },
  { key: "bullets", label: "Bullets", icon: "format-list-bulleted" },
];

function deriveTitle(markdown: string, fallback: string) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = markdown.split("\n").find((l) => l.trim().length > 0);
  return firstLine ? firstLine.replace(/^#+\s*/, "").slice(0, 80) : fallback;
}

export default function NewNote() {
  const { colors } = useTheme();
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onGenerate() {
    if (!url.trim()) { setError("Paste a YouTube link first."); return; }
    setError(null);
    setLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => { setProgress((p) => { if (p >= 90) return 90; return p + Math.random() * 15; }); }, 800);
    try {
      const result = await generateNotes(url.trim(), style);
      clearInterval(progressInterval);
      setProgress(100);
      const title = result.title || deriveTitle(result.notes, "Untitled note");
      const id = await insertNote({ video_id: result.videoId, title, url: result.url, content: result.notes });
      hapticSuccess();
      setTimeout(() => router.replace(`/note/${id}`), 500);
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e?.message || "Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ marginTop: 40, marginBottom: 24 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Generate Notes</Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: colors.muted }}>Paste a YouTube video link to create AI-powered notes</Text>
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>YOUTUBE URL</Text>
        <TextInput value={url} onChangeText={setUrl} placeholder="https://youtube.com/watch?v=..." placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!loading}
          style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }} />
      </View>

      <Text style={{ marginBottom: 12, fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>NOTE STYLE</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {STYLES.map((s) => {
          const active = s.key === style;
          return (
            <Pressable key={s.key} onPress={() => { hapticMedium(); setStyle(s.key); }} disabled={loading}
              style={{ flex: 1, alignItems: "center", borderRadius: 16, borderWidth: active ? 2 : 1, paddingVertical: 16, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentLight : colors.card }}>
              <MaterialIcons name={s.icon} size={28} color={active ? colors.accent : colors.muted} />
              <Text style={{ marginTop: 6, fontSize: 13, fontWeight: "600", color: active ? colors.accent : colors.muted }}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View style={{ marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialIcons name="error-outline" size={18} color={colors.errorText} />
          <Text style={{ fontSize: 14, color: colors.errorText, flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      {loading && (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Generating notes...</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{Math.min(Math.round(progress), 100)}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.accent, width: `${Math.min(progress, 100)}%` }} />
          </View>
          <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
            {progress < 30 ? "Fetching transcript..." : progress < 60 ? "Reading content..." : progress < 90 ? "AI is writing notes..." : "Almost done..."}
          </Text>
        </View>
      )}

      <Pressable onPress={onGenerate} disabled={loading}
        style={{ marginTop: 28, height: 52, borderRadius: 14, backgroundColor: loading ? colors.muted : colors.accent, alignItems: "center", justifyContent: "center", shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ marginLeft: 12, fontSize: 15, fontWeight: "700", color: "#fff" }}>Generating...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="auto-fix-high" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Generate Notes</Text>
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}
