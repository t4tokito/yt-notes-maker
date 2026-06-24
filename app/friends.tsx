import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { hapticMedium, hapticSuccess } from "../lib/haptics";
import { getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest, unfriend, subscribeFriends, subscribeFriendRequests, syncAcceptedRequests, type Friend, type FriendRequest } from "../lib/friends";
import { Header } from "../components/Header";

type Tab = "friends" | "requests";

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    syncAcceptedRequests().catch(() => {});
    const unsubFriends = subscribeFriends(setFriends);
    const unsubRequests = subscribeFriendRequests(setRequests);
    return () => { unsubFriends(); unsubRequests(); };
  }, [user]);

  async function handleAccept(fromUid: string) {
    hapticMedium();
    try { await acceptFriendRequest(fromUid); getFriendRequests().then(setRequests); } catch (e: any) {}
  }

  async function handleReject(fromUid: string) {
    hapticMedium();
    try { await rejectFriendRequest(fromUid); getFriendRequests().then(setRequests); } catch (e: any) {}
  }

  async function handleUnfriend(friendUid: string, username: string) {
    hapticMedium();
    Alert.alert("Unfriend", `Remove ${username} from friends?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unfriend", style: "destructive", onPress: async () => { hapticSuccess(); try { await unfriend(friendUid); } catch (e: any) {} } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="MANAGE" onProfilePress={() => router.push("/profile")} />

      <View style={{ marginHorizontal: 20, marginTop: 20, flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => { hapticMedium(); setTab("friends"); }}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "friends" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "friends" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "friends" ? "#fff" : colors.muted }}>Friends List</Text>
        </Pressable>
        <Pressable onPress={() => { hapticMedium(); setTab("requests"); }}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "requests" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "requests" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "requests" ? "#fff" : colors.muted }}>Requests</Text>
        </Pressable>
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 16, flex: 1 }}>
        {tab === "friends" ? (
          friends.length === 0 ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
              <MaterialIcons name="people-outline" size={48} color={colors.muted} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 }}>No friends yet</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>Add friends to connect and chat</Text>
            </View>
          ) : (
            <FlatList data={friends} keyExtractor={(item) => item.uid} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/user/${item.uid}`)}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{item.username.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.username}</Text>
                  </View>
                  <Pressable onPress={() => handleUnfriend(item.uid, item.username)}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.errorBg, alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="person-remove" size={18} color={colors.errorText} />
                  </Pressable>
                </Pressable>
              )}
            />
          )
        ) : (
          requests.length === 0 ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
              <MaterialIcons name="mail-outline" size={48} color={colors.muted} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 }}>No pending requests</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>Friend requests will appear here</Text>
            </View>
          ) : (
            <FlatList data={requests} keyExtractor={(item) => item.fromUid} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{item.fromUsername.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.fromUsername}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => handleReject(item.fromUid)}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="close" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => handleAccept(item.fromUid)}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )
        )}
      </View>
    </View>
  );
}
