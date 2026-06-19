import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { getNotes, type Note } from "../lib/db";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    getNotes()
      .then(setNotes)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-4">
      {notes.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-semibold text-slate-200">
            No notes yet
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            Paste a YouTube link and let AI turn the video into notes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              className="mb-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 active:opacity-70"
            >
              <Text
                numberOfLines={2}
                className="text-base font-semibold text-slate-100"
              >
                {item.title}
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                {formatDate(item.created_at)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Link href="/new" asChild>
        <Pressable className="absolute bottom-6 right-5 h-14 items-center justify-center rounded-full bg-indigo-500 px-6 shadow-lg active:opacity-80">
          <Text className="text-base font-bold text-white">＋ New Note</Text>
        </Pressable>
      </Link>
    </View>
  );
}
