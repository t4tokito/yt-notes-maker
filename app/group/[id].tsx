import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { useNotifications } from "../../lib/notifications";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { sendGroupMessage, subscribeGroupMessages, updateGroup, getGroupMembers, leaveGroup, kickMember, editGroupMessage, deleteGroupMessage, setSubadmin, removeSubadmin, markGroupMessagesRead, type GroupMessage } from "../../lib/groups";
import { getFriends, type Friend } from "../../lib/friends";
import { GifPicker } from "../../components/GifPicker";

type GroupInfo = { name: string; members: string[]; createdBy: string; subadmins: string[]; photoURL?: string | null };

export default function GroupChatScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { clearGroupUnread } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Friend[]>([]);
  const [logoLoading, setLogoLoading] = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [membersList, setMembersList] = useState<{ uid: string; username: string; photoURL?: string | null }[]>([]);
  const [msgMenuVisible, setMsgMenuVisible] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<GroupMessage | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [gifVisible, setGifVisible] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => { setKbOpen(true); setKbHeight(e.endCoordinates.height); });
    const hide = Keyboard.addListener("keyboardDidHide", () => { setKbOpen(false); setKbHeight(0); });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const isCreator = groupInfo?.createdBy === user?.uid;
  const isSubadmin = !!groupInfo?.subadmins?.includes(user?.uid || "");
  const hasAdminPerms = isCreator || isSubadmin;

  async function openMembersList() {
    if (!groupInfo) return;
    setMenuVisible(false);
    try {
      const list = await getGroupMembers(groupInfo.members);
      const sorted = [...list].sort((a, b) => {
        if (a.uid === groupInfo.createdBy) return -1;
        if (b.uid === groupInfo.createdBy) return 1;
        return 0;
      });
      setMembersList(sorted);
      setMembersVisible(true);
    } catch {}
  }

  async function handleLeaveGroup() {
    if (!groupId) return;
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
        try { await leaveGroup(groupId); router.back(); } catch {}
      }},
    ]);
  }

  useEffect(() => { if (!groupId) return; getDoc(doc(db, "groups", groupId)).then((snap) => { if (snap.exists()) { const d = snap.data(); setGroupInfo({ name: d.name, members: d.members, createdBy: d.createdBy, subadmins: d.subadmins || [], photoURL: d.photoURL || null }); } }); }, [groupId]);
  useEffect(() => {
    if (!groupId) return;
    setLoadingMessages(true);
    const unsub = subscribeGroupMessages(groupId, (msgs) => { setMessages(msgs); setLoadingMessages(false); });
    markGroupMessagesRead(groupId).catch(() => {});
    clearGroupUnread(groupId);
    return unsub;
  }, [groupId]);
  useEffect(() => { if (messages.length > 0) { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); } }, [messages]);

  // Auto-load all friends when Add Member modal opens
  useEffect(() => {
    if (addMemberVisible) {
      setMemberSearch("");
      loadFriends();
    }
  }, [addMemberVisible]);

  async function handleSend() {
    if (!text.trim() || !groupId) return;
    const msg = text.trim(); setText("");
    try { await sendGroupMessage(groupId, msg); } catch (e: any) { console.error("send failed", e); }
  }

  function formatTime(ts: number) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  async function saveRename() {
    if (!groupId || !renameDraft.trim()) return;
    await updateGroup(groupId, { name: renameDraft.trim() });
    setGroupInfo((prev) => prev ? { ...prev, name: renameDraft.trim() } : prev);
    setRenameVisible(false);
  }

  async function loadFriends() {
    try {
      const { getFriends } = await import("../../lib/friends");
      const friends = await getFriends();
      setMemberResults(friends.filter((u) => !groupInfo?.members.includes(u.uid)));
    } catch {}
  }

  async function searchMembers() {
    if (!memberSearch.trim()) {
      loadFriends();
      return;
    }
    try {
      const { getFriends } = await import("../../lib/friends");
      const friends = await getFriends();
      const q = memberSearch.trim().toLowerCase();
      setMemberResults(friends.filter((u) => !groupInfo?.members.includes(u.uid) && u.username.toLowerCase().includes(q)));
    } catch {}
  }

  async function addMember(uid: string) {
    if (!groupId) return;
    const { addGroupMembers } = await import("../../lib/groups");
    await addGroupMembers(groupId, [uid]);
    setGroupInfo((prev) => prev ? { ...prev, members: [...prev.members, uid] } : prev);
    setMemberSearch("");
    setMemberResults([]);
    setAddMemberVisible(false);
  }

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    setLogoLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      let base64 = manipulated.base64 ? `data:image/jpeg;base64,${manipulated.base64}` : "";
      if (!base64) {
        const res = await fetch(manipulated.uri);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      if (groupId) {
        await updateGroup(groupId, { photoURL: base64 });
        setGroupInfo((prev) => prev ? { ...prev, photoURL: base64 } : prev);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to upload logo.");
    } finally {
      setLogoLoading(false);
    }
  }

  const initials = groupInfo?.name ? groupInfo.name.slice(0, 1).toUpperCase() : "G";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View style={{
        marginHorizontal: 20, marginTop: 56, height: 64, borderRadius: 16,
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
        flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 8, marginBottom: 8,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginRight: 10 }}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden", marginRight: 10 }}>
          {groupInfo?.photoURL ? (
            <Image source={{ uri: groupInfo.photoURL }} style={{ width: 40, height: 40, borderRadius: 12 }} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>{initials}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{groupInfo?.name || "Group"}</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>{groupInfo?.members.length || 0} members</Text>
        </View>

        <Pressable onPress={() => setMenuVisible(true)} hitSlop={10} style={{ padding: 8 }}>
          <MaterialIcons name="more-vert" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.fromUid === user?.uid;
          const isGif = (item.text.includes("giphy.com") || item.text.includes("tenor.com")) && item.text.includes(".gif");
          return (
            <Pressable onLongPress={() => { if (mine) { setSelectedMsg(item); setMsgMenuVisible(true); } }}>
              <View style={{ marginBottom: 12 }}>
                {!mine && <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent, marginBottom: 4, marginLeft: 4 }}>{item.fromUsername}</Text>}
                <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                  <View style={{ maxWidth: "78%", borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, backgroundColor: mine ? colors.accent : colors.card, overflow: "hidden", borderWidth: mine ? 0 : 1, borderColor: colors.border }}>
                    {isGif ? (
                      <Image source={{ uri: item.text }} style={{ width: 200, height: 150, borderRadius: 12 }} resizeMode="cover" />
                    ) : (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                        <Text style={{ fontSize: 15, lineHeight: 20, color: mine ? "#fff" : colors.text }}>{item.text}</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : colors.muted, marginTop: 4, textAlign: "right", paddingHorizontal: isGif ? 8 : 0, paddingBottom: isGif ? 6 : 0 }}>{formatTime(item.created_at)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={loadingMessages ? (
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 80 }}><MaterialIcons name="chat-bubble-outline" size={48} color={colors.muted} /><Text style={{ fontSize: 15, color: colors.muted, marginTop: 8 }}>Start the conversation!</Text></View>
        )}
      />

      {/* Message Action Menu */}
      <Modal visible={msgMenuVisible} transparent animationType="fade" onRequestClose={() => setMsgMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMsgMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "center", alignItems: "center" }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ borderRadius: 16, backgroundColor: colors.card, overflow: "hidden", padding: 6, borderWidth: 1, borderColor: colors.border, minWidth: 180 }}>
              {selectedMsg && (Date.now() - selectedMsg.created_at < 5 * 60 * 1000) && (
                <Pressable onPress={() => { setMsgMenuVisible(false); setEditText(selectedMsg!.text); setEditVisible(true); }}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <MaterialIcons name="edit" size={18} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Edit</Text>
                </Pressable>
              )}
              <Pressable onPress={() => { setMsgMenuVisible(false); Alert.alert("Unsend", "Delete this message permanently?", [
                { text: "Cancel", style: "cancel" },
                { text: "Unsend", style: "destructive", onPress: async () => {
                  if (selectedMsg && groupId) { try { await deleteGroupMessage(groupId, selectedMsg.id); } catch {} }
                }},
              ]); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                <MaterialIcons name="delete-outline" size={18} color={colors.errorText} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.errorText }}>Unsend</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Message Modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
          <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 18, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ marginBottom: 12, fontSize: 15, fontWeight: "600", color: colors.text }}>Edit Message</Text>
            <TextInput value={editText} onChangeText={setEditText} autoFocus
              style={{ borderRadius: 10, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }} />
            <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => setEditVisible(false)} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.input, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={async () => {
                if (!editText.trim() || !selectedMsg || !groupId) return;
                try { await editGroupMessage(groupId, selectedMsg.id, editText); setEditVisible(false); } catch (e: any) { Alert.alert("Error", e?.message || "Failed to edit."); }
              }} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Original input - hidden when gif picker open */}
      {!gifVisible && (
        <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 + insets.bottom, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <TextInput value={text} onChangeText={setText} placeholder="Type a message..." placeholderTextColor={colors.muted} multiline maxLength={500}
          style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 }} />
        <Pressable onPress={() => { setText(""); Keyboard.dismiss(); setTimeout(() => setGifVisible(true), 1000); }}
          style={{ marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="gif" size={22} color={colors.muted} />
        </Pressable>
        <Pressable onPress={handleSend} disabled={!text.trim()}
          style={{ marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? colors.accent : colors.muted, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
      )}

      <GifPicker visible={gifVisible} onClose={() => setGifVisible(false)} onSelect={async (url) => {
        if (!groupId) return;
        try { await sendGroupMessage(groupId, url); } catch {}
      }} />

      {/* Floating input above keyboard */}
      {kbOpen && !gifVisible && (
        <View style={{ position: "absolute", bottom: kbHeight + insets.bottom, left: 0, right: 0, flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
          <TextInput value={text} onChangeText={setText} placeholder="Type a message..." placeholderTextColor={colors.muted} multiline maxLength={500}
            style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 }} />
          <Pressable onPress={() => { setText(""); Keyboard.dismiss(); setTimeout(() => setGifVisible(true), 1000); }}
            style={{ marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="gif" size={22} color={colors.muted} />
          </Pressable>
          <Pressable onPress={handleSend} disabled={!text.trim()}
            style={{ marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? colors.accent : colors.muted, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Group Menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 40 }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: colors.card, overflow: "hidden", padding: 6, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{groupInfo?.name}</Text>
              </View>
              <Pressable onPress={() => { setMenuVisible(false); openMembersList(); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <MaterialIcons name="group" size={18} color={colors.text} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>View Members</Text>
              </Pressable>
              {hasAdminPerms && (
                <>
                  <Pressable onPress={() => { setMenuVisible(false); setRenameDraft(groupInfo?.name || ""); setRenameVisible(true); }}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <MaterialIcons name="edit" size={18} color={colors.text} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Rename Group</Text>
                  </Pressable>
                  <Pressable onPress={() => { setMenuVisible(false); pickLogo(); }} disabled={logoLoading}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: logoLoading ? 0.5 : 1 }}>
                    <MaterialIcons name="camera-alt" size={18} color={colors.text} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{logoLoading ? "Uploading..." : "Change Logo"}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setMenuVisible(false); setAddMemberVisible(true); }}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <MaterialIcons name="person-add" size={18} color={colors.text} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Add Member</Text>
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => { setMenuVisible(false); handleLeaveGroup(); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                <MaterialIcons name="exit-to-app" size={18} color={colors.errorText} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.errorText }}>Leave Group</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
          <View style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 18, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ marginBottom: 12, fontSize: 15, fontWeight: "600", color: colors.text }}>Rename Group</Text>
            <TextInput value={renameDraft} onChangeText={setRenameDraft} onSubmitEditing={saveRename} autoFocus
              style={{ borderRadius: 10, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }} />
            <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => setRenameVisible(false)} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.input, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveRename} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={addMemberVisible} transparent animationType="fade" onRequestClose={() => setAddMemberVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setAddMemberVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 20 }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ marginHorizontal: 16, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingBottom: 20 }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Add Member</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <View style={{ flexDirection: "row", backgroundColor: colors.input, borderRadius: 10, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                  <MaterialIcons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
                  <TextInput value={memberSearch} onChangeText={setMemberSearch} onSubmitEditing={searchMembers} placeholder="Search username..." placeholderTextColor={colors.muted} autoCapitalize="none" style={{ flex: 1, fontSize: 14, color: colors.text }} />
                </View>
              </View>
              <FlatList data={memberResults} keyExtractor={(item) => item.uid} style={{ marginTop: 8, maxHeight: 300 }} paddingHorizontal={16}
                renderItem={({ item }) => (
                  <Pressable onPress={() => addMember(item.uid)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 10, overflow: "hidden" }}>
                      {item.photoURL ? <Image source={{ uri: item.photoURL }} style={{ width: 36, height: 36, borderRadius: 10 }} /> : <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>{item.username.slice(0, 1).toUpperCase()}</Text>}
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text }}>{item.username}</Text>
                    <MaterialIcons name="person-add" size={18} color={colors.accent} />
                  </Pressable>
                )}
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Members List Modal */}
      <Modal visible={membersVisible} transparent animationType="fade" onRequestClose={() => setMembersVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMembersVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "flex-end", paddingBottom: 20 }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ marginHorizontal: 16, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Members ({membersList.length})</Text>
              </View>
              <FlatList data={membersList} keyExtractor={(item) => item.uid} style={{ marginTop: 4, maxHeight: 400 }}
                renderItem={({ item }) => {
                  const isMe = item.uid === user?.uid;
                  const isItemCreator = item.uid === groupInfo?.createdBy;
                  const isItemSubadmin = groupInfo?.subadmins?.includes(item.uid) || false;
                  const canKick = hasAdminPerms && !isMe && !isItemCreator && (!isSubadmin || isCreator);
                  const canToggleSubadmin = isCreator && !isMe && !isItemCreator;
                  return (
                    <Pressable onPress={() => { setMembersVisible(false); router.push(isMe ? "/profile" : `/user/${item.uid}`); }}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" }}>
                        {item.photoURL ? (
                          <Image source={{ uri: item.photoURL }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>{item.username.slice(0, 1).toUpperCase()}</Text>
                        )}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text }}>{item.username}{isMe ? " (You)" : ""}</Text>
                      {isItemCreator && (
                        <View style={{ backgroundColor: colors.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>Admin</Text>
                        </View>
                      )}
                      {isItemSubadmin && !isItemCreator && (
                        <View style={{ backgroundColor: "rgba(100, 200, 120, 0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.greenText }}>Subadmin</Text>
                        </View>
                      )}
                      {canToggleSubadmin && (
                        <Pressable onPress={() => {
                          setMembersVisible(false);
                          const action = isItemSubadmin ? "Remove Subadmin" : "Make Subadmin";
                          const msg = isItemSubadmin
                            ? `Remove ${item.username}'s subadmin status?`
                            : `Make ${item.username} a subadmin? They will get admin permissions.`;
                          Alert.alert(action, msg, [
                            { text: "Cancel", style: "cancel" },
                            { text: isItemSubadmin ? "Remove" : "Confirm", style: isItemSubadmin ? "destructive" : "default", onPress: async () => {
                              try {
                                if (isItemSubadmin) { await removeSubadmin(groupId!, item.uid); }
                                else { await setSubadmin(groupId!, item.uid); }
                                setGroupInfo((prev) => prev ? {
                                  ...prev,
                                  subadmins: isItemSubadmin
                                    ? prev.subadmins.filter((s) => s !== item.uid)
                                    : [...prev.subadmins, item.uid],
                                } : prev);
                              } catch {}
                            }},
                          ]);
                        }} hitSlop={8} style={{ padding: 6, marginRight: 4 }}>
                          <MaterialIcons name={isItemSubadmin ? "star" : "star-outline"} size={20} color={isItemSubadmin ? colors.greenText : colors.muted} />
                        </Pressable>
                      )}
                      {canKick && (
                        <Pressable onPress={() => {
                          setMembersVisible(false);
                          Alert.alert("Kick Member", `Remove ${item.username} from the group?`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Kick", style: "destructive", onPress: async () => {
                              try { await kickMember(groupId!, item.uid); } catch {}
                            }},
                          ]);
                        }} hitSlop={8} style={{ padding: 6 }}>
                          <MaterialIcons name="person-remove" size={20} color={colors.errorText} />
                        </Pressable>
                      )}
                      {!hasAdminPerms && (
                        <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                      )}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
