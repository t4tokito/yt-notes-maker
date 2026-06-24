import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View, Share } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { getNotes, type Note } from "../lib/notes";
import { getTestResults, type TestResult } from "../lib/testResults";
import { getFriends, type Friend } from "../lib/friends";
import { EditProfileModal } from "../components/EditProfileModal";

function calculateStreak(results: TestResult[]): number {
  if (results.length === 0) return 0;
  const sorted = [...results].sort((a, b) => b.created_at - a.created_at);
  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayMs = day.getTime();
    const nextDayMs = dayMs + 86400000;
    const hasQuiz = sorted.some((r) => r.created_at >= dayMs && r.created_at < nextDayMs);
    if (hasQuiz) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const initials = profile?.username
    ? profile.username.slice(0, 1).toUpperCase()
    : "?";

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      getNotes().then(setNotes).catch(() => {}),
      getFriends().then(setFriends).catch(() => {}),
      getTestResults().then(setResults).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []));

  const streak = calculateStreak(results);

  async function handleShare() {
    try {
      await Share.share({
        message: `Check out my profile on Notes Maker! @${profile?.username || "user"}`,
      });
    } catch {}
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Top Bar */}
          <View style={{ marginHorizontal: 20, marginTop: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{profile?.username || "username"}</Text>
            <Pressable onPress={() => signOut().catch(() => {})} hitSlop={10}>
              <MaterialIcons name="logout" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* Profile Section */}
          <View style={{ marginHorizontal: 20, marginTop: 24, flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => setEditVisible(true)}>
              <View style={{
                width: 86, height: 86, borderRadius: 43,
                backgroundColor: colors.input, borderWidth: 2, borderColor: colors.border,
                alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {profile?.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={{ width: 86, height: 86, borderRadius: 43 }} />
                ) : (
                  <Text style={{ fontSize: 32, fontWeight: "600", color: colors.accent }}>{initials}</Text>
                )}
              </View>
            </Pressable>

            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 24 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{notes.length}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Notes</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{friends.length}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Friends</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{streak}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Streak</Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginHorizontal: 20, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{profile?.username || "username"}</Text>
            <Text style={{ fontSize: 13, color: profile?.bio ? colors.textSecondary : colors.muted, marginTop: 4, lineHeight: 20 }}>{profile?.bio || "No bio yet"}</Text>
          </View>

          {/* Action Buttons */}
          <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setEditVisible(true)}
              style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Edit Profile</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Share Profile</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={{ marginHorizontal: 20, marginTop: 20, height: 1, backgroundColor: colors.border }} />

          {/* Notes Grid Header */}
          <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="grid-view" size={18} color={colors.muted} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>NOTES</Text>
          </View>

          {/* Notes Grid */}
          <View style={{ marginHorizontal: 20, marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
            {notes.length === 0 ? (
              <View style={{ width: "100%", padding: 32, alignItems: "center" }}>
                <MaterialIcons name="note-add" size={32} color={colors.border} />
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>No notes yet</Text>
              </View>
            ) : (
              notes.slice(0, 9).map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => router.push(`/note/${note.id}`)}
                  style={{ width: "32.66%", aspectRatio: 1, backgroundColor: colors.card, borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}
                >
                  <View style={{ flex: 1, padding: 8, justifyContent: "flex-end" }}>
                    <Text numberOfLines={3} style={{ fontSize: 11, fontWeight: "600", color: colors.text, lineHeight: 14 }}>{note.title}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          {notes.length > 9 && (
            <Pressable onPress={() => router.push("/notes")} style={{ marginHorizontal: 20, marginTop: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>View All</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </GestureHandlerRootView>
  );
}
