import { useState } from "react";
import { Alert, Image, Modal, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { EditProfileModal } from "./EditProfileModal";

export function ProfileMenu() {
  const { user, profile, signOut } = useAuth();
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  function handleSignOut() {
    Alert.alert("Sign out", "Sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut().catch((e) => console.error(e)) },
    ]);
  }

  return (
    <>
      <Pressable onPress={() => setMenuVisible(true)}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={{ width: 52, height: 52, borderRadius: 26 }} />
          ) : (
            <MaterialIcons name="person" size={28} color="#DDAAAA" />
          )}
        </View>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 64 }}>
            <Pressable onPress={(e: any) => e.stopPropagation()}
              style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: colors.cardSolid, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{profile?.username || "User"}</Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: colors.muted }}>{user?.email}</Text>
              </View>
              <Pressable onPress={() => { setMenuVisible(false); setEditVisible(true); }}
                style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20, paddingVertical: 14 }}>
                <MaterialIcons name="person-outline" size={20} color={colors.text} style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, color: colors.text }}>Edit Profile</Text>
              </Pressable>
              <Pressable onPress={() => { setMenuVisible(false); handleSignOut(); }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
                <MaterialIcons name="logout" size={20} color={colors.errorText} style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, color: colors.errorText }}>Sign Out</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </>
  );
}
