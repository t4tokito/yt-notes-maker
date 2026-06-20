import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Markdown } from "../../lib/markdown";
import { deleteNote, getNote, updateNote, type Note } from "../../lib/notes";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id;
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useFocusEffect(
    useCallback(() => {
      getNote(noteId).then((n) => {
        setNote(n);
        setTitleDraft(n?.title ?? "");
      });
    }, [noteId])
  );

  async function saveTitle() {
    const next = titleDraft.trim();
    if (note && next && next !== note.title) {
      await updateNote(note.id, { title: next });
      setNote({ ...note, title: next });
    } else {
      setTitleDraft(note?.title ?? "");
    }
    setEditingTitle(false);
  }

  function confirmDelete() {
    Alert.alert("Delete note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteNote(noteId);
          router.back();
        },
      },
    ]);
  }

  if (!note) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-leaf-200">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      <Stack.Screen
        options={{
          title: "Note",
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10}>
              <Text className="text-base font-semibold text-leaf-300">Delete</Text>
            </Pressable>
          ),
        }}
      />

      <View className="rounded-2xl bg-white/70 p-5"
        style={{
          shadowColor: "#659287",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {editingTitle ? (
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            onBlur={saveTitle}
            onSubmitEditing={saveTitle}
            autoFocus
            multiline
            className="mb-1 rounded-xl border border-leaf-100 bg-white/60 px-3 py-2 text-2xl font-bold text-text-primary"
          />
        ) : (
          <Pressable onPress={() => setEditingTitle(true)}>
            <Text className="text-2xl font-bold text-text-primary">{note.title}</Text>
            <Text className="mt-1 text-xs text-leaf-200">Tap title to edit</Text>
          </Pressable>
        )}
      </View>

      <View className="my-4 h-px bg-leaf-100" />

      <View className="rounded-2xl bg-white/70 p-5"
        style={{
          shadowColor: "#659287",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Markdown content={note.content} />
      </View>

      <Pressable
        onPress={() => router.push(`/test?noteId=${note.id}`)}
        className="mt-6 h-14 items-center justify-center rounded-2xl bg-leaf-300 active:opacity-80"
        style={{
          shadowColor: "#659287",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text className="text-base font-bold text-white">📝 Test me on this note</Text>
      </Pressable>
    </ScrollView>
  );
}
