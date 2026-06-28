import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getFriendStatus, sendFriendRequest, unfriend, cancelFriendRequest, type FriendStatus } from "../../lib/friends";

type UserProfile = {
  username: string;
  email: string;
  photoURL?: string | null;
  bio?: string;
  notesCount?: number;
  friendsCount?: number;
};

export default function OtherProfileScreen() {
  const { id: targetUid } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUid) return;
    setLoadError(null);
    Promise.all([
      getDoc(doc(db, "users", targetUid)),
      getFriendStatus(targetUid),
    ]).then(([snap, status]) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ username: d.username || "", email: d.email || "", photoURL: d.photoURL || null, bio: d.bio || "", notesCount: d.notesCount || 0, friendsCount: d.friendsCount || 0 });
      }
      setFriendStatus(status);
    }).catch((e: any) => {
      setLoadError(e?.message || "Failed to load profile.");
    }).finally(() => setLoading(false));
  }, [targetUid]);

  async function handleAddFriend() {
    setActionLoading(true);
    try {
      await sendFriendRequest(targetUid!);
      setFriendStatus("pending_sent");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send request.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnfriend() {
    Alert.alert("Unfriend", `Remove ${profile?.username} from friends?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unfriend", style: "destructive", onPress: async () => {
        setActionLoading(true);
        try { await unfriend(targetUid!); setFriendStatus(null); } catch {}
        finally { setActionLoading(false); }
      }},
    ]);
  }

  async function handleCancelRequest() {
    setActionLoading(true);
    try { await cancelFriendRequest(targetUid!); setFriendStatus(null); } catch {}
    finally { setActionLoading(false); }
  }

  const initials = profile?.username ? profile.username.slice(0, 1).toUpperCase() : "?";

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialIcons name="wifi-off" size={48} color={colors.muted} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 12, textAlign: "center" }}>Couldn't load profile</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" }}>{loadError}</Text>
        <Pressable onPress={() => router.back()}
          style={{ marginTop: 20, height: 44, paddingHorizontal: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Header */}
          <View style={{ marginHorizontal: 20, marginTop: 56, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="arrow-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>{profile?.username || "User"}</Text>
          </View>

          {/* Avatar + Stats */}
          <View style={{ marginHorizontal: 20, marginTop: 24, alignItems: "center" }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.input, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={{ width: 90, height: 90, borderRadius: 45 }} />
              ) : (
                <Text style={{ fontSize: 34, fontWeight: "700", color: colors.accent }}>{initials}</Text>
              )}
            </View>

            <Text style={{ marginTop: 14, fontSize: 20, fontWeight: "700", color: colors.text }}>{profile?.username || "User"}</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: profile?.bio ? colors.textSecondary : colors.muted, textAlign: "center" }}>{profile?.bio || "No bio yet"}</Text>
          </View>

          {/* Stats */}
          <View style={{ marginHorizontal: 40, marginTop: 20, flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>{(profile?.notesCount ?? 0) + 1}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: colors.muted }}>Notes</Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: colors.border }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>{(profile?.friendsCount ?? 0) + 1}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: colors.muted }}>Friends</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginHorizontal: 20, marginTop: 24 }}>
            {actionLoading ? (
              <View style={{ height: 48, borderRadius: 14, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Loading...</Text>
              </View>
            ) : friendStatus === "friends" ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => router.push(`/chat/${targetUid}`)}
                  style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MaterialIcons name="chat" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Message</Text>
                </Pressable>
                <Pressable onPress={handleUnfriend}
                  style={{ height: 48, paddingHorizontal: 20, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name="person-remove" size={18} color={colors.errorText} />
                </Pressable>
              </View>
            ) : friendStatus === "pending_sent" ? (
              <Pressable onPress={handleCancelRequest}
                style={{ height: 48, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MaterialIcons name="hourglass-empty" size={18} color={colors.muted} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>Request Pending</Text>
              </Pressable>
            ) : friendStatus === "pending_received" ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => { router.push(`/friends`); }}
                  style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>View Request</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleAddFriend}
                style={{ height: 48, borderRadius: 14, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MaterialIcons name="person-add" size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Add Friend</Text>
              </Pressable>
            )}
          </View>

          {/* Mutual Info */}
          {friendStatus === "friends" && (
            <View style={{ marginHorizontal: 20, marginTop: 24, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenText + "18", alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="check-circle" size={20} color={colors.greenText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Friends</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>You are connected with {profile?.username}</Text>
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </View>
  );
}
