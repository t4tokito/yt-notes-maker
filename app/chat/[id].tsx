import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Keyboard, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { sendMessage, subscribeMessages, editMessage, deleteMessage, type Message } from "../../lib/chat";
import { GifPicker } from "../../components/GifPicker";

type UserProfile = { username: string; photoURL?: string | null };

export default function ChatScreen() {
  const { id: friendUid } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [friendProfile, setFriendProfile] = useState<UserProfile | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [msgMenuVisible, setMsgMenuVisible] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [gifVisible, setGifVisible] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => { setKbOpen(true); setKbHeight(e.endCoordinates.height); });
    const hide = Keyboard.addListener("keyboardDidHide", () => { setKbOpen(false); setKbHeight(0); });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => { if (!friendUid) return; getDoc(doc(db, "users", friendUid)).then((snap) => { if (snap.exists()) { const d = snap.data(); setFriendProfile({ username: d.username, photoURL: d.photoURL }); } }); }, [friendUid]);
  useEffect(() => { if (!friendUid) return; const unsub = subscribeMessages(friendUid, setMessages); return unsub; }, [friendUid]);
  useEffect(() => { if (messages.length > 0) { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); } }, [messages]);

  async function handleSend() {
    if (!text.trim() || !friendUid) return;
    const msg = text.trim(); setText("");
    try { await sendMessage(friendUid, msg); } catch (e: any) { console.error("send failed", e); }
  }

  function formatTime(ts: number) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  const initials = friendProfile?.username ? friendProfile.username.slice(0, 2).toUpperCase() : "??";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Pressable onPress={() => router.push(`/user/${friendUid}`)}>
        <View style={{
          marginHorizontal: 20, marginTop: 56, height: 80, borderRadius: 999,
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
          flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 8,
          shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
        }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={colors.accent} />
          </Pressable>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden", marginRight: 12 }}>
            {friendProfile?.photoURL ? (
              <Image source={{ uri: friendProfile.photoURL }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent }}>{initials}</Text>
            )}
          </View>
          <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>{friendProfile?.username || "Chat"}</Text>
        </View>
      </Pressable>

      {/* Messages */}
      <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.fromUid === user?.uid;
          const isGif = (item.text.includes("giphy.com") || item.text.includes("tenor.com")) && item.text.includes(".gif");
          return (
            <Pressable onLongPress={() => { if (mine) { setSelectedMsg(item); setMsgMenuVisible(true); } }}>
              <View style={{ marginBottom: 8, alignItems: mine ? "flex-end" : "flex-start" }}>
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
            </Pressable>
          );
        }}
        ListEmptyComponent={<View style={{ alignItems: "center", marginTop: 80 }}><MaterialIcons name="chat-bubble-outline" size={48} color={colors.muted} /><Text style={{ fontSize: 15, color: colors.muted, marginTop: 8 }}>Say hello!</Text></View>}
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
                  if (selectedMsg && friendUid) { try { await deleteMessage(friendUid, selectedMsg.id); } catch {} }
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
                if (!editText.trim() || !selectedMsg || !friendUid) return;
                try { await editMessage(friendUid, selectedMsg.id, editText); setEditVisible(false); } catch (e: any) { Alert.alert("Error", e?.message || "Failed to edit."); }
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
        if (!friendUid) return;
        try { await sendMessage(friendUid, url); } catch {}
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
    </View>
  );
}
