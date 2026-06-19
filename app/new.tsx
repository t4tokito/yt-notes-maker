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
import { insertNote } from "../lib/db";

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
      className="flex-1 bg-slate-900"
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-2 text-sm font-medium text-slate-300">
        YouTube link
      </Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://youtube.com/watch?v=..."
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!loading}
        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-slate-300">
        Note style
      </Text>
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
                  ? "border-indigo-400 bg-indigo-500"
                  : "border-slate-700 bg-slate-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-slate-300"
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onGenerate}
        disabled={loading}
        className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
          loading ? "bg-indigo-500/60" : "bg-indigo-500 active:opacity-80"
        }`}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text className="ml-3 text-base font-bold text-white">
              Generating notes…
            </Text>
          </>
        ) : (
          <Text className="text-base font-bold text-white">Generate Notes</Text>
        )}
      </Pressable>

      {loading ? (
        <Text className="mt-3 text-center text-xs text-slate-500">
          Fetching transcript and summarizing — this can take a few seconds.
        </Text>
      ) : null}
    </ScrollView>
  );
}
