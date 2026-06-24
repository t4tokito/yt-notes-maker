import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../lib/theme";
import { hapticMedium, hapticSuccess } from "../lib/haptics";
import { getFriends, type Friend } from "../lib/friends";
import { createGroup } from "../lib/groups";

export default function CreateGroupScreen() {
  const { colors, gradient } = useTheme();
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { getFriends().then(setFriends).finally(() => setLoading(false)); }, []);

  function toggle(uid: string) {
    hapticMedium();
    setSelected((prev) => { const next = new Set(prev); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
  }

  async function handleCreate() {
    if (!groupName.trim()) { Alert.alert("Error", "Enter a group name."); return; }
    if (selected.size === 0) { Alert.alert("Error", "Select at least one friend."); return; }
    setCreating(true);
    try { const groupId = await createGroup(groupName.trim(), Array.from(selected)); hapticSuccess(); router.replace(`/group/${groupId}`); }
    catch (e: any) { Alert.alert("Error", e?.message || "Failed to create group."); }
    finally { setCreating(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Bar */}
      <View style={{
        marginHorizontal: 20,
        marginTop: 56,
        height: 80,
        borderRadius: 999,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 16,
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={22} color={colors.accent} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.accent, letterSpacing: 2, fontFamily: "PressStart2P", flex: 1 }}>NEW GROUP</Text>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>GROUP NAME</Text>
        <TextInput value={groupName} onChangeText={setGroupName} placeholder="Enter group name..." placeholderTextColor={colors.muted} autoCapitalize="none"
          style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }} />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>SELECT FRIENDS</Text>
          {selected.size > 0 && <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>{selected.size} selected</Text>}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.muted }}>Loading friends...</Text></View>
      ) : friends.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <MaterialIcons name="people-outline" size={48} color={colors.muted} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 }}>No friends yet</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8 }}>Add friends first to create a group</Text>
        </View>
      ) : (
        <FlatList data={friends} keyExtractor={(item) => item.uid} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.uid);
            return (
              <Pressable onPress={() => toggle(item.uid)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{item.username.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}><Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.username}</Text></View>
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: isSelected ? colors.accent : colors.border, backgroundColor: isSelected ? colors.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: colors.bg }}>
        {selected.size > 0 ? (
          <Pressable onPress={handleCreate} disabled={creating}
            style={{ borderRadius: 16, overflow: "hidden", shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <MaterialIcons name="group-add" size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{creating ? "Creating..." : `Create Group (${selected.size})`}</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={{ borderRadius: 16, backgroundColor: colors.muted, paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: 0.5 }}>
            <MaterialIcons name="group-add" size={20} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Select friends</Text>
          </View>
        )}
      </View>
    </View>
  );
}
