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
import { deleteNote, getNote, updateNote, type Note } from "../../lib/db";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = Number(id);
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
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-slate-400">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      <Stack.Screen
        options={{
          title: "Note",
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10}>
              <Text className="text-base font-semibold text-red-400">Delete</Text>
            </Pressable>
          ),
        }}
      />

      {editingTitle ? (
        <TextInput
          value={titleDraft}
          onChangeText={setTitleDraft}
          onBlur={saveTitle}
          onSubmitEditing={saveTitle}
          autoFocus
          multiline
          className="mb-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-2xl font-bold text-slate-50"
        />
      ) : (
        <Pressable onPress={() => setEditingTitle(true)}>
          <Text className="text-2xl font-bold text-slate-50">{note.title}</Text>
          <Text className="mt-1 text-xs text-slate-500">Tap title to edit</Text>
        </Pressable>
      )}

      <View className="my-4 h-px bg-slate-700" />

      <Markdown content={note.content} />
    </ScrollView>
  );
}
