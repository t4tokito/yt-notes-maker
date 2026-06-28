import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { useNotifications } from "../lib/notifications";
import { hapticMedium } from "../lib/haptics";
import { getFriends, subscribeFriends, updateLastSeen, type Friend } from "../lib/friends";
import { getMyGroups, subscribeMyGroups, type Group } from "../lib/groups";
import { Header } from "../components/Header";
import { AddFriendModal } from "../components/AddFriendModal";

type Tab = "friends" | "groups";

export default function ChatListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { hasNewMsg, clearNewMsg } = useNotifications();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendVisible, setAddFriendVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [nicknameVisible, setNicknameVisible] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    updateLastSeen().catch(() => {});
    const unsubGroups = subscribeMyGroups(setGroups);
    const unsubFriends = subscribeFriends((f) => { setFriends(f); setLoading(false); });
    return () => { unsubGroups(); unsubFriends(); };
  }, [user]);

  const sortedFriends = [...friends].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  function openMenu(friend: Friend) {
    setSelectedFriend(friend);
    setMenuVisible(true);
  }

  function handleSetNickname() {
    if (!selectedFriend) return;
    setNicknameDraft(nicknames[selectedFriend.uid] || "");
    setMenuVisible(false);
    setNicknameVisible(true);
  }

  function saveNickname() {
    if (!selectedFriend) return;
    if (nicknameDraft.trim()) {
      setNicknames((prev) => ({ ...prev, [selectedFriend.uid]: nicknameDraft.trim() }));
    } else {
      setNicknames((prev) => { const next = { ...prev }; delete next[selectedFriend.uid]; return next; });
    }
    setNicknameVisible(false);
  }

  function getDisplayName(friend: Friend) {
    return nicknames[friend.uid] || friend.username;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="CHAT" onProfilePress={() => router.push("/profile")} />

      <View style={{ marginHorizontal: 20, marginTop: 20, flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => { hapticMedium(); setTab("friends"); }}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "friends" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "friends" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "friends" ? "#fff" : colors.muted }}>Friends</Text>
        </Pressable>
        <Pressable onPress={() => { hapticMedium(); setTab("groups"); }}
          style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: tab === "groups" ? colors.accent : colors.card, borderWidth: 1, borderColor: tab === "groups" ? colors.accent : colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: tab === "groups" ? "#fff" : colors.muted }}>Groups</Text>
        </Pressable>
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 16, flex: 1 }}>
        {loading ? (
          <View style={{ gap: 10 }}>
            <View style={{ height: 80, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
            <View style={{ height: 80, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
            <View style={{ height: 80, borderRadius: 16, backgroundColor: colors.input, opacity: 0.4 }} />
          </View>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
              <MaterialIcons name="chat-bubble-outline" size={48} color={colors.muted} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 }}>No friends to chat</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>Add friends to start chatting</Text>
            </View>
          ) : (
            <FlatList data={sortedFriends} keyExtractor={(item) => item.uid} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}
              ListHeaderComponent={
                <Pressable onPress={() => { hapticMedium(); setAddFriendVisible(true); }}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentLight, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <MaterialIcons name="person-add" size={22} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>Add Friend</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Find and add new friends</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </Pressable>
              }
              renderItem={({ item }) => {
                const isNew = hasNewMsg[item.uid] || false;
                return (
                  <Pressable onPress={() => { clearNewMsg(item.uid); router.push(`/chat/${item.uid}`); }}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: isNew ? colors.accentLight : colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: isNew ? colors.accent : colors.border }}>
                    <View style={{ marginRight: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {item.photoURL ? (
                          <Image source={{ uri: item.photoURL }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                        ) : (
                          <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{item.username.slice(0, 2).toUpperCase()}</Text>
                        )}
                      </View>
                      {item.online && (
                        <View style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.greenText, borderWidth: 2, borderColor: isNew ? colors.accentLight : colors.card }} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: isNew ? "700" : "600", color: colors.text }}>{getDisplayName(item)}</Text>
                      <Text style={{ fontSize: 12, color: item.online ? colors.greenText : colors.muted, marginTop: 2 }}>{item.online ? "Online" : "Tap to chat"}</Text>
                    </View>
                    {isNew ? (
                      <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>NEW</Text>
                      </View>
                    ) : (
                      <Pressable onPress={(e) => { e.stopPropagation(); openMenu(item); }} hitSlop={10} style={{ padding: 8 }}>
                        <MaterialIcons name="more-vert" size={20} color={colors.muted} />
                      </Pressable>
                    )}
                  </Pressable>
                );
              }}
            />
          )
        ) : (
          groups.length === 0 ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: 40 }}>
              <MaterialIcons name="group" size={48} color={colors.muted} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 }}>No groups yet</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center", marginBottom: 16 }}>Create a group to chat with multiple friends</Text>
              <Pressable onPress={() => router.push("/create-group")}
                style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Create Group</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList data={groups} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => {
                const unread = groupUnreads[item.id] || 0;
                return (
                  <Pressable onPress={() => router.push(`/group/${item.id}`)}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: unread > 0 ? colors.accentLight : colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: unread > 0 ? colors.accent : colors.border }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 14, overflow: "hidden" }}>
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                      ) : (
                        <MaterialIcons name="group" size={24} color={colors.accent} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: unread > 0 ? "700" : "600", color: colors.text }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.members.length} members</Text>
                    </View>
                    {unread > 0 ? (
                      <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{unread > 99 ? "99+" : unread}</Text>
                      </View>
                    ) : (
                      <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                    )}
                  </Pressable>
                );
              }}
            />
          )
        )}
      </View>

      {/* Friend Menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 40 }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: colors.card, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              {selectedFriend && (
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {selectedFriend.photoURL ? (
                      <Image source={{ uri: selectedFriend.photoURL }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{selectedFriend.username.slice(0, 2).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 }}>{getDisplayName(selectedFriend)}</Text>
                </View>
              )}
              <Pressable onPress={handleSetNickname}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
                <MaterialIcons name="badge" size={20} color={colors.text} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, flex: 1 }}>{nicknames[selectedFriend?.uid || ""] ? "Edit Nickname" : "Set Nickname"}</Text>
                {nicknames[selectedFriend?.uid || ""] && (
                  <Text style={{ fontSize: 12, color: colors.muted }}>{nicknames[selectedFriend?.uid || ""]}</Text>
                )}
              </Pressable>
              <Pressable onPress={() => { setMenuVisible(false); router.push(`/user/${selectedFriend?.uid}`); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
                <MaterialIcons name="person" size={20} color={colors.text} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>View Profile</Text>
              </Pressable>
              <Pressable onPress={() => { setMenuVisible(false); router.push(`/chat/${selectedFriend?.uid}`); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                <MaterialIcons name="chat" size={20} color={colors.text} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Send Message</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Nickname Modal */}
      <Modal visible={nicknameVisible} transparent animationType="fade" onRequestClose={() => setNicknameVisible(false)}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
          <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 }}>Set Nickname</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Only you will see this nickname</Text>
            <TextInput value={nicknameDraft} onChangeText={setNicknameDraft} placeholder={selectedFriend?.username || "Nickname"} placeholderTextColor={colors.muted} autoFocus
              style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text }} />
            <View style={{ marginTop: 16, flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setNicknameVisible(false)} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: colors.input, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveNickname} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: colors.accent, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AddFriendModal visible={addFriendVisible} onClose={() => setAddFriendVisible(false)} />
    </View>
  );
}
