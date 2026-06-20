import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { generateNotes, type NoteStyle } from "../lib/api";
import { insertNote } from "../lib/notes";

const STYLES: { key: NoteStyle; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "detailed", label: "Detailed" },
  { key: "bullets", label: "Bullets" },
];

function deriveTitle(markdown: string, fallback: string) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = markdown.split("\n").find((l) => l.trim().length > 0);
  return firstLine ? firstLine.replace(/^#+\s*/, "").slice(0, 80) : fallback;
}

export default function NewNote() {
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onGenerate() {
    if (!url.trim()) {
      setError("Paste a YouTube link first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generateNotes(url.trim(), style);
      const title = deriveTitle(result.notes, "Untitled note");
      const id = await insertNote({
        video_id: result.videoId,
        title,
        url: result.url,
        content: result.notes,
      });
      router.replace(`/note/${id}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-6 rounded-2xl bg-white/70 p-5"
        style={{
          shadowColor: "#659287",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="mb-2 text-sm font-medium text-text-primary">
          YouTube link
        </Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor="#B1D3B9"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
          className="rounded-xl border border-leaf-100 bg-white/60 px-4 py-3 text-base text-text-primary"
        />
      </View>

      <View className="mb-2 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-text-primary">
          Note style
        </Text>
      </View>
      <View className="flex-row gap-2">
        {STYLES.map((s) => {
          const active = s.key === style;
          return (
            <Pressable
              key={s.key}
              onPress={() => setStyle(s.key)}
              disabled={loading}
              className={`flex-1 items-center rounded-xl border px-3 py-2.5 ${
                active
                  ? "border-leaf-200 bg-leaf-200"
                  : "border-leaf-100 bg-white/60"
              }`}
              style={active ? {
                shadowColor: "#659287",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              } : {}}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-leaf-200"
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3">
          <Text className="text-sm text-red-500">{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onGenerate}
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
          <>
            <ActivityIndicator color="#ffffff" />
            <Text className="ml-3 text-base font-bold text-white">
              Generating notes…
            </Text>
          </>
        ) : (
          <Text className="text-base font-bold text-white">Generate Notes</Text>
        )}
      </Pressable>

      {loading ? (
        <Text className="mt-3 text-center text-xs text-leaf-200">
          Fetching transcript and summarizing — this can take a few seconds.
        </Text>
      ) : null}
    </ScrollView>
  );
}
