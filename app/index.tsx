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
import { Link, Stack, useFocusEffect, useRouter } from "expo-router";
import { deleteNote, getNotes, updateNote, type Note } from "../lib/notes";
import { useAuth } from "../lib/auth";

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
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<Note | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const router = useRouter();
  const { signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert("Sign out", "Sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => signOut().catch((e) => console.error(e)),
      },
    ]);
  }

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

  const filtered = search.trim()
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  function onLongPress(note: Note) {
    Alert.alert(note.title, "What would you like to do?", [
      {
        text: "Rename",
        onPress: () => {
          setRenameTarget(note);
          setRenameDraft(note.title);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete note", "This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                await deleteNote(note.id);
                load();
              },
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function saveRename() {
    if (renameTarget && renameDraft.trim()) {
      await updateNote(renameTarget.id, { title: renameDraft.trim() });
      load();
    }
    setRenameTarget(null);
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.push("/test")} hitSlop={10}>
              <Text className="text-base font-semibold text-leaf-300">📝 Test</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={confirmSignOut} hitSlop={10}>
              <Text className="text-base font-semibold text-leaf-300">
                Sign out
              </Text>
            </Pressable>
          ),
        }}
      />
      {notes.length > 0 && (
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes…"
          placeholderTextColor="#B1D3B9"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="mb-4 rounded-xl border border-leaf-100 bg-white/60 px-4 py-3 text-base text-text-primary"
        />
      )}

      {notes.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-leaf-100">
            <Text className="text-4xl text-leaf-300">📝</Text>
          </View>
          <Text className="text-center text-lg font-semibold text-text-primary">
            No notes yet
          </Text>
          <Text className="mt-2 text-center text-sm text-leaf-200">
            Paste a YouTube link and let AI turn the video into notes.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-leaf-200">
            No notes match "{search}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              onLongPress={() => onLongPress(item)}
              className="mb-3 rounded-2xl bg-white/70 p-4 active:opacity-70"
              style={{
                shadowColor: "#659287",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                numberOfLines={2}
                className="text-base font-semibold text-text-primary"
              >
                {item.title}
              </Text>
              <Text className="mt-1 text-xs text-leaf-200">
                {formatDate(item.created_at)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Link href="/new" asChild>
        <Pressable className="absolute bottom-6 right-5 h-14 items-center justify-center rounded-full bg-leaf-200 px-6 active:opacity-80"
          style={{
            shadowColor: "#659287",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-base font-bold text-white">＋ New Note</Text>
        </Pressable>
      </Link>

      <Modal
        visible={!!renameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <View className="flex-1 items-center justify-center bg-leaf-300/40 px-6">
          <View className="w-full rounded-2xl bg-white p-5"
            style={{
              shadowColor: "#659287",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="mb-4 text-lg font-bold text-text-primary">
              Rename note
            </Text>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
              onSubmitEditing={saveRename}
              autoFocus
              className="rounded-xl border border-leaf-100 bg-leaf-50 px-4 py-3 text-base text-text-primary"
            />
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => setRenameTarget(null)}
                className="flex-1 items-center rounded-xl border border-leaf-100 py-3"
              >
                <Text className="text-sm font-semibold text-leaf-200">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={saveRename}
                className="flex-1 items-center rounded-xl bg-leaf-200 py-3"
              >
                <Text className="text-sm font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
