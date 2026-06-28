import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View, Share } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { getNotes } from "../lib/notes";
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
    if (hasQuiz) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const { colors, gradient } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const initials = profile?.username ? profile.username.slice(0, 1).toUpperCase() : "?";

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      getNotes().then(setNotes).catch(() => {}),
      getFriends().then(setFriends).catch(() => {}),
      getTestResults().then(setResults).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []));

  const streak = calculateStreak(results);
  const avgScore = results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.score / r.total) * 100, 0) / results.length) : 0;

  async function handleShare() {
    try {
      await Share.share({ message: `Check out my profile on Notes Maker! @${profile?.username || "user"}` });
    } catch {}
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Top Bar */}
          <View style={{ marginHorizontal: 20, marginTop: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Profile</Text>
            <Pressable onPress={() => signOut().catch(() => {})} hitSlop={10} style={{ padding: 6 }}>
              <MaterialIcons name="logout" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Avatar + Name */}
          <View style={{ marginHorizontal: 20, marginTop: 24, alignItems: "center" }}>
            <Pressable onPress={() => setEditVisible(true)}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.input, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {profile?.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                ) : (
                  <Text style={{ fontSize: 34, fontWeight: "700", color: colors.accent }}>{initials}</Text>
                )}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bg }}>
                <MaterialIcons name="edit" size={14} color="#fff" />
              </View>
            </Pressable>
            <Text style={{ marginTop: 12, fontSize: 20, fontWeight: "700", color: colors.text }}>{profile?.username || "username"}</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: profile?.bio ? colors.textSecondary : colors.muted }}>{profile?.bio || "No bio yet"}</Text>
          </View>

          {/* Stats */}
          <View style={{ marginHorizontal: 20, marginTop: 24, flexDirection: "row", gap: 10 }}>
            {[
              { label: "Notes", value: notes.length, icon: "description", color: colors.accent },
              { label: "Friends", value: friends.length, icon: "people", color: colors.greenText },
              { label: "Quizzes", value: results.length, icon: "quiz", color: colors.toolExplain },
              { label: "Avg Score", value: `${avgScore}%`, icon: "emoji-events", color: colors.toolFlashcards },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: stat.color + "18", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <MaterialIcons name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{stat.value}</Text>
                <Text style={{ marginTop: 2, fontSize: 10, color: colors.muted }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => setEditVisible(true)} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Edit Profile</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MaterialIcons name="share" size={16} color={colors.text} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Share</Text>
            </Pressable>
          </View>

          {/* Streak Banner */}
          {streak > 0 && (
            <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.toolExplain + "18", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{streak} Day Streak!</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Keep it up — take a quiz today</Text>
              </View>
            </View>
          )}

          {/* Settings Links */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5, marginBottom: 10 }}>SETTINGS</Text>
            {[
              { icon: "edit", label: "Edit Profile", onPress: () => setEditVisible(true) },
              { icon: "notifications-none", label: "Notifications", onPress: () => {} },
              { icon: "help-outline", label: "Help & Support", onPress: () => {} },
              { icon: "info-outline", label: "About", onPress: () => {} },
            ].map((item) => (
              <Pressable key={item.label} onPress={item.onPress}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <MaterialIcons name={item.icon as any} size={20} color={colors.muted} style={{ marginRight: 14 }} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text }}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </View>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}
