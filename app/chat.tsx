import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { hapticMedium } from "../lib/haptics";
import { getFriends, subscribeFriends, updateLastSeen, type Friend } from "../lib/friends";
import { getMyGroups, subscribeMyGroups, type Group } from "../lib/groups";
import { Header } from "../components/Header";

type Tab = "friends" | "groups";

export default function ChatListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    updateLastSeen().catch(() => {});
    const unsubGroups = subscribeMyGroups(setGroups);
    const unsubFriends = subscribeFriends((f) => { setFriends(f); setLoading(false); });
    return () => { unsubGroups(); unsubFriends(); };
  }, [user]);

  const sortedFriends = [...friends].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

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
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/chat/${item.uid}`)}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ marginRight: 14 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                      ) : (
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{item.username.slice(0, 2).toUpperCase()}</Text>
                      )}
                    </View>
                    {item.online && (
                      <View style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: "#64C878", borderWidth: 2, borderColor: colors.card }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.username}</Text>
                    <Text style={{ fontSize: 12, color: item.online ? "#64C878" : colors.muted, marginTop: 2 }}>{item.online ? "Online" : "Tap to chat"}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </Pressable>
              )}
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
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/group/${item.id}`)}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 14, overflow: "hidden" }}>
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    ) : (
                      <MaterialIcons name="group" size={24} color={colors.accent} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.members.length} members</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </Pressable>
              )}
            />
          )
        )}
      </View>
    </View>
  );
}
