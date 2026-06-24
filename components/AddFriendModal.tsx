import { useEffect, useRef, useState } from "react";
import { FlatList, Image, Modal, Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { searchUsers, getFriendRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest, getFriends, type Friend, type FriendRequest } from "../lib/friends";

type Props = { visible: boolean; onClose: () => void };

export function AddFriendModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"search" | "requests">("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;
    getFriendRequests().then(setRequests).catch(() => {});
    getFriends().then(setFriends).catch(() => {});
  }, [visible]);

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
    try { await sendFriendRequest(toUid); getFriendRequests().then(setRequests); }
    catch (e: any) {}
  }

  async function handleAccept(fromUid: string) {
    try { await acceptFriendRequest(fromUid); getFriendRequests().then(setRequests); getFriends().then(setFriends); }
    catch (e: any) {}
  }

  async function handleReject(fromUid: string) {
    try { await rejectFriendRequest(fromUid); getFriendRequests().then(setRequests); }
    catch (e: any) {}
  }

  function openProfile(uid: string) {
    onClose();
    setTimeout(() => router.push(`/user/${uid}`), 200);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 20 }}>
          <Pressable onPress={(e: any) => e.stopPropagation()}
            style={{ marginHorizontal: 16, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingBottom: 20, borderWidth: 1, borderColor: colors.border }}>

            <View style={{ flexDirection: "row", padding: 16, gap: 8 }}>
              <Pressable onPress={() => setTab("search")}
                style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "search" ? colors.accent : colors.input, borderWidth: 1, borderColor: tab === "search" ? colors.accent : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "search" ? "#fff" : colors.muted }}>Search</Text>
              </Pressable>
              <Pressable onPress={() => setTab("requests")}
                style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "requests" ? colors.accent : colors.input, borderWidth: 1, borderColor: tab === "requests" ? colors.accent : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "requests" ? "#fff" : colors.muted }}>Requests ({requests.length})</Text>
              </Pressable>
            </View>

            {tab === "search" ? (
              <View style={{ paddingHorizontal: 16 }}>
                <View style={{ flexDirection: "row", backgroundColor: colors.input, borderRadius: 12, alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                  <MaterialIcons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
                  <TextInput value={search} onChangeText={setSearch} placeholder="Search username..." placeholderTextColor={colors.muted} autoCapitalize="none" autoFocus style={{ flex: 1, fontSize: 14, color: colors.text }} />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")}>
                      <MaterialIcons name="close" size={16} color={colors.muted} />
                    </Pressable>
                  )}
                </View>

                {searching ? (
                  <Text style={{ textAlign: "center", color: colors.muted, padding: 20, fontSize: 13 }}>Searching...</Text>
                ) : results.length === 0 ? (
                  <Text style={{ textAlign: "center", color: colors.muted, padding: 20, fontSize: 13 }}>{search.trim() ? "No users found" : "Type a username to search"}</Text>
                ) : (
                  <FlatList data={results} keyExtractor={(item) => item.uid} style={{ maxHeight: 300 }} renderItem={({ item }) => {
                    const isFriend = friendUids.has(item.uid);
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Pressable onPress={() => openProfile(item.uid)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 10, overflow: "hidden" }}>
                            {item.photoURL ? <Image source={{ uri: item.photoURL }} style={{ width: 40, height: 40, borderRadius: 12 }} /> : <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>{item.username.slice(0, 1).toUpperCase()}</Text>}
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.username}</Text>
                        </Pressable>
                        {isFriend ? (
                          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, paddingHorizontal: 12 }}>Friends</Text>
                        ) : (
                          <Pressable onPress={() => handleSendRequest(item.uid)}
                            style={{ backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Add</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  }} />
                )}
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {requests.length === 0 ? (
                  <Text style={{ textAlign: "center", color: colors.muted, padding: 20, fontSize: 13 }}>No pending requests</Text>
                ) : (
                  <FlatList data={requests} keyExtractor={(item) => item.fromUid} style={{ maxHeight: 300 }} renderItem={({ item }) => (
                    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Pressable onPress={() => openProfile(item.fromUid)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 10, overflow: "hidden" }}>
                          {item.fromPhotoURL ? <Image source={{ uri: item.fromPhotoURL }} style={{ width: 40, height: 40, borderRadius: 12 }} /> : <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>{item.fromUsername.slice(0, 1).toUpperCase()}</Text>}
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.fromUsername}</Text>
                      </Pressable>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable onPress={() => handleReject(item.fromUid)}
                          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                          <MaterialIcons name="close" size={16} color={colors.muted} />
                        </Pressable>
                        <Pressable onPress={() => handleAccept(item.fromUid)}
                          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                          <MaterialIcons name="check" size={16} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  )} />
                )}
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
