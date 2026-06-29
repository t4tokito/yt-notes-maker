import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { searchUsers, getFriendRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest, getFriends, getSentRequestUids, type Friend, type FriendRequest } from "../lib/friends";
import { useCallback } from "react";

export default function AddFriendScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"search" | "requests">("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<any>(null);

  useFocusEffect(useCallback(() => {
    getFriendRequests().then(setRequests).catch(() => {});
    getFriends().then(setFriends).catch(() => {});
    getSentRequestUids().then(setSentIds).catch(() => {});
    if (search.trim()) {
      searchUsers(search.trim())
        .then((users) => setResults(users.filter((u) => u.uid !== user?.uid)))
        .catch(() => {});
    }
  }, [search, user?.uid]));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      searchUsers(search.trim())
        .then((users) => setResults(users.filter((u) => u.uid !== user?.uid)))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, user?.uid]);

  const friendUids = new Set(friends.map((f) => f.uid));

  async function handleSendRequest(toUid: string) {
    if (sentIds.has(toUid)) return;
    setSentIds((prev) => new Set(prev).add(toUid));
    try { await sendFriendRequest(toUid); }
    catch (e: any) {}
  }

  async function handleAccept(fromUid: string) {
    try {
      await acceptFriendRequest(fromUid);
      getFriendRequests().then(setRequests);
      getFriends().then(setFriends);
    } catch (e: any) {}
  }

  async function handleReject(fromUid: string) {
    try { await rejectFriendRequest(fromUid); getFriendRequests().then(setRequests); }
    catch (e: any) {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={{ marginHorizontal: 20, marginTop: 56, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>Add Friend</Text>
      </View>

      {/* Tabs */}
      <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => setTab("search")}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "search" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "search" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "search" ? "#fff" : colors.muted }}>Search</Text>
        </Pressable>
        <Pressable onPress={() => setTab("requests")}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "requests" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "requests" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "requests" ? "#fff" : colors.muted }}>Requests ({requests.length})</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginHorizontal: 20, marginTop: 16 }}>
        {tab === "search" ? (
          <>
            <View style={{ flexDirection: "row", backgroundColor: colors.input, borderRadius: 12, alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search username..." placeholderTextColor={colors.muted} autoCapitalize="none" autoFocus onSubmitEditing={() => Keyboard.dismiss()} style={{ flex: 1, fontSize: 14, color: colors.text }} />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <MaterialIcons name="close" size={16} color={colors.muted} />
                </Pressable>
              )}
            </View>

            {searching ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
            ) : results.length === 0 ? (
              <Text style={{ textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 13 }}>{search.trim() ? "No users found" : "Type a username to search"}</Text>
            ) : (
              <FlatList data={results} keyExtractor={(item) => item.uid} keyboardShouldPersistTaps="handled" renderItem={({ item }) => {
                const isFriend = friendUids.has(item.uid);
                const alreadySent = sentIds.has(item.uid);
                return (
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Pressable onPress={() => router.push(`/user/${item.uid}`)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" }}>
                        {item.photoURL ? <Image source={{ uri: item.photoURL }} style={{ width: 44, height: 44, borderRadius: 14 }} /> : <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>{item.username.slice(0, 1).toUpperCase()}</Text>}
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{item.username}</Text>
                    </Pressable>
                    {isFriend ? (
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.greenText }}>Friends</Text>
                    ) : alreadySent ? (
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Sent</Text>
                    ) : (
                      <Pressable onPress={() => handleSendRequest(item.uid)}
                        style={{ backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Add</Text>
                      </Pressable>
                    )}
                  </View>
                );
              }} />
            )}
          </>
        ) : (
          <>
            {requests.length === 0 ? (
              <Text style={{ textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 13 }}>No pending requests</Text>
            ) : (
              <FlatList data={requests} keyExtractor={(item) => item.fromUid} renderItem={({ item }) => (
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Pressable onPress={() => router.push(`/user/${item.fromUid}`)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" }}>
                      {item.fromPhotoURL ? <Image source={{ uri: item.fromPhotoURL }} style={{ width: 44, height: 44, borderRadius: 14 }} /> : <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>{item.fromUsername.slice(0, 1).toUpperCase()}</Text>}
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{item.fromUsername}</Text>
                  </Pressable>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => handleReject(item.fromUid)}
                      style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="close" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => handleAccept(item.fromUid)}
                      style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              )} />
            )}
          </>
        )}
      </View>
    </View>
  );
}
