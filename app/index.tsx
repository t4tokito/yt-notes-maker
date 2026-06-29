import { useCallback, useEffect, useState } from "react";
import { Pressable, Image, ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "../components/Header";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { hapticMedium } from "../lib/haptics";
import { getNotes, getWeeklyActivity, type Note, type WeekDay } from "../lib/notes";
import { getFriends, subscribeFriends, syncAcceptedRequests, updateLastSeen, type Friend } from "../lib/friends";
import { getFlashcardSets, type FlashcardSet } from "../lib/flashcards";
import { getTestResults, type TestResult } from "../lib/testResults";

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

function ProductivityGraph({ colors, weekData }: { colors: any; weekData: WeekDay[] }) {
  const max = Math.max(...weekData.map((d) => d.count), 1);
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  const total = weekData.reduce((a, b) => a + b.count, 0);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <View>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Activity</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{total} this week</Text>
        </View>
        <View style={{ backgroundColor: colors.accentLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{total}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80, gap: 6 }}>
        {weekData.map((day, i) => {
          const h = max > 0 ? (day.count / max) * 60 : 0;
          return (
            <View key={i} style={{ alignItems: "center", flex: 1 }}>
              <View style={{ width: 20, height: h || 4, borderRadius: 4, backgroundColor: i === todayIdx ? colors.accent : colors.border }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        {weekData.map((day, i) => (
          <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: i === todayIdx ? "700" : "500", color: i === todayIdx ? colors.accent : colors.muted }}>{day.label}</Text>
        ))}
      </View>
    </View>
  );
}

function AddFriendIcon({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
        <MaterialIcons name="person-add" size={22} color={colors.accent} />
      </View>
    </Pressable>
  );
}

function FriendAvatar({ friend, onPress }: { friend: Friend; onPress: () => void }) {
  const { colors } = useTheme();
  const initials = friend.username.slice(0, 1).toUpperCase();
  return (
    <Pressable onPress={onPress}>
      <View>
        <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {friend.photoURL ? (
            <Image source={{ uri: friend.photoURL }} style={{ width: 58, height: 58, borderRadius: 16 }} />
          ) : (
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.accent }}>{initials}</Text>
          )}
        </View>
        {friend.online && (
          <View style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.greenText, borderWidth: 2.5, borderColor: colors.card }} />
        )}
      </View>
    </Pressable>
  );
}

function PinnedNote({ note, onPress }: { note: Note; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 10 }}>
      <View style={{ backgroundColor: colors.input, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 4, height: 24, borderRadius: 2, backgroundColor: colors.accent }} />
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: colors.text, flex: 1 }}>{note.title}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { colors, gradient } = useTheme();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      getNotes().then(setNotes).catch(() => {}),
      getWeeklyActivity().then(setWeekData).catch(() => {}),
      getFlashcardSets().then(setFlashcardSets).catch(() => {}),
      getTestResults().then(setTestResults).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    updateLastSeen().catch(() => {});
    syncAcceptedRequests().catch(() => {});

    const interval = setInterval(() => {
      getFriends().then(setFriends).catch(() => {});
    }, 30000);

    const unsub = subscribeFriends(setFriends);
    return () => { unsub(); clearInterval(interval); };
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pinnedNotes = notes.filter((n) => n.pinned);
  const pinnedFlashcards = flashcardSets.filter((s) => s.pinned);
  const sortedFriends = [...friends].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
  const totalNotes = notes.length;
  const totalFlashcards = flashcardSets.length;
  const streak = calculateStreak(testResults);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Header title="HOME" onProfilePress={() => router.push("/profile")} />

          {/* Hero — App Purpose */}
          <Pressable
            onPress={() => { hapticMedium(); router.push("/new"); }}
            style={({ pressed }) => ({ marginHorizontal: 20, marginTop: 16, borderRadius: 20, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name="smart-display" size={24} color="#fff" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#C4BBF0" }} />
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>AI</Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 14 }}>Turn Videos into Notes</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, lineHeight: 18 }}>Paste any YouTube link — AI creates comprehensive study notes for you</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Create Notes</Text>
                <MaterialIcons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Quick Stats */}
          <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
              <MaterialIcons name="description" size={22} color={colors.toolFlashcards} />
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700", color: colors.text }}>{totalNotes}</Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: colors.muted }}>Notes</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
              <MaterialIcons name="style" size={22} color={colors.toolFlashcards} />
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700", color: colors.text }}>{totalFlashcards}</Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: colors.muted }}>Flashcards</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
              <MaterialIcons name="people" size={22} color={colors.toolFlashcards} />
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700", color: colors.text }}>{friends.length}</Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: colors.muted }}>Friends</Text>
            </View>
          </View>

          {/* Friends */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>FRIENDS</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, alignItems: "center" }}>
              <AddFriendIcon onPress={() => { hapticMedium(); router.push("/add-friend"); }} />
              {loading ? (
                <>
                  <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
                  <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
                  <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
                </>
              ) : (
                <>
                  {sortedFriends.map((friend) => (
                    <FriendAvatar key={friend.uid} friend={friend} onPress={() => { hapticMedium(); router.push(`/chat/${friend.uid}`); }} />
                  ))}
                  {friends.length === 0 && (
                    <>
                      <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, opacity: 0.3 }} />
                      <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, opacity: 0.3 }} />
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>

          {/* Streak Banner */}
          {streak > 0 && (
            <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.toolExplain + "18", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{streak} Day Streak!</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Keep it up — take a quiz daily</Text>
              </View>
            </View>
          )}

          {/* Activity */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            <ProductivityGraph colors={colors} weekData={weekData} />
          </View>

          {/* Pinned */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
              <MaterialIcons name="push-pin" size={12} color={colors.accent} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>PINNED</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {loading ? (
              <View style={{ gap: 10 }}>
                <View style={{ height: 52, borderRadius: 12, backgroundColor: colors.input, opacity: 0.4 }} />
                <View style={{ height: 52, borderRadius: 12, backgroundColor: colors.input, opacity: 0.4 }} />
              </View>
            ) : pinnedNotes.length === 0 && pinnedFlashcards.length === 0 ? (
              <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 24, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                <MaterialIcons name="push-pin" size={28} color={colors.border} />
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>No pinned items</Text>
              </View>
            ) : (
              <>
                {pinnedNotes.map((note) => (
                  <PinnedNote key={note.id} note={note} onPress={() => router.push(`/note/${note.id}`)} />
                ))}
                {pinnedFlashcards.map((fc) => (
                  <Pressable key={fc.id} onPress={() => router.push("/flashcards")} style={{ marginBottom: 10 }}>
                    <View style={{ backgroundColor: colors.input, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border }}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ width: 4, height: 24, borderRadius: 2, backgroundColor: colors.accent }} />
                        <MaterialIcons name="style" size={16} color={colors.accent} />
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: colors.text, flex: 1 }}>{fc.title}</Text>
                        <Text style={{ fontSize: 11, color: colors.muted }}>{fc.cards.length} cards</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
