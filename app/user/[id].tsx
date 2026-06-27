import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
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
      setLoadError(e?.message || "Failed to load profile. Check your internet connection.");
    }).finally(() => setLoading(false));
  }, [targetUid]);

  async function handleAddFriend() {
    setActionLoading(true);
    try {
      await sendFriendRequest(targetUid!);
      setFriendStatus("pending_sent");
      Alert.alert("Sent", "Friend request sent!");
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
        try {
          await unfriend(targetUid!);
          setFriendStatus(null);
        } catch (e: any) {
          Alert.alert("Error", e?.message || "Failed.");
        } finally {
          setActionLoading(false);
        }
      }},
    ]);
  }

  async function handleCancelRequest() {
    setActionLoading(true);
    try {
      await cancelFriendRequest(targetUid!);
      setFriendStatus(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  const initials = profile?.username ? profile.username.slice(0, 1).toUpperCase() : "?";

  function renderActionButton() {
    if (actionLoading) {
      return (
        <View style={{ height: 36, borderRadius: 10, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Loading...</Text>
        </View>
      );
    }

    switch (friendStatus) {
      case "friends":
        return (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => router.push(`/chat/${targetUid}`)}
              style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Message</Text>
            </Pressable>
            <Pressable onPress={handleUnfriend}
              style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.errorText }}>Unfriend</Text>
            </Pressable>
          </View>
        );
      case "pending_sent":
        return (
          <Pressable onPress={handleCancelRequest}
            style={{ height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Cancel Request</Text>
          </Pressable>
        );
      case "pending_received":
        return (
          <View style={{ height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Request Pending</Text>
          </View>
        );
      default:
        return (
          <Pressable onPress={handleAddFriend}
            style={{ height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Add Friend</Text>
          </Pressable>
        );
    }
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <MaterialIcons name="wifi-off" size={48} color={colors.muted} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 12, textAlign: "center" }}>Couldn't load profile</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" }}>{loadError}</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 20, height: 44, paddingHorizontal: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcons name="person" size={32} color={colors.muted} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Top Bar */}
          <View style={{ marginHorizontal: 20, marginTop: 56, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <MaterialIcons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{profile?.username || "username"}</Text>
          </View>

          {/* Profile Section */}
          <View style={{ marginHorizontal: 20, marginTop: 24, flexDirection: "row", alignItems: "center" }}>
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

            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 24 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{(profile?.notesCount ?? 0) + 1}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Notes</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{(profile?.friendsCount ?? 0) + 1}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Friends</Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginHorizontal: 20, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{profile?.username || "username"}</Text>
            <Text style={{ fontSize: 13, color: profile?.bio ? colors.textSecondary : colors.muted, marginTop: 4, lineHeight: 20 }}>{profile?.bio || "No bio yet"}</Text>
          </View>

          {/* Action Buttons */}
          <View style={{ marginHorizontal: 20, marginTop: 16 }}>
            {renderActionButton()}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
