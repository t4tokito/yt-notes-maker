import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../lib/auth";
import { validateUsername, isUsernameAvailable } from "../lib/usernames";
import { useTheme } from "../lib/theme";

type Props = { visible: boolean; onClose: () => void };

export function EditProfileModal({ visible, onClose }: Props) {
  const { profile, updateUsername, updateBio, changePassword, uploadPhoto, removePhoto } = useAuth();
  const { colors } = useTheme();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const hasPhoto = !!profile?.photoURL;

  useEffect(() => {
    if (visible) {
      setUsername(profile?.username || "");
      setBio(profile?.bio || "");
      setError(null);
      setShowPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
    }
  }, [visible, profile?.username, profile?.bio]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) { setSaving(true); setError(null); try { await uploadPhoto(result.assets[0].uri); } catch (e: any) { setError(e?.message || "Failed to upload photo."); } finally { setSaving(false); } }
  }

  function handleRemovePhoto() {
    Alert.alert("Remove photo", "Remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { setSaving(true); try { await removePhoto(); } catch (e: any) { setError(e?.message || "Failed to remove photo."); } finally { setSaving(false); } } },
    ]);
  }

  async function save() {
    const trimmedUsername = username.trim();
    const trimmedBio = bio.trim();

    if (trimmedUsername && trimmedUsername !== profile?.username) {
      const err = validateUsername(trimmedUsername);
      if (err) { setError(err); return; }
      const available = await isUsernameAvailable(trimmedUsername);
      if (!available) { setError("That username is already taken."); return; }
    }

    setSaving(true); setError(null);
    try {
      if (trimmedUsername && trimmedUsername !== profile?.username) {
        await updateUsername(trimmedUsername);
      }
      if (trimmedBio !== (profile?.bio || "")) {
        await updateBio(trimmedBio);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    if (!currentPassword) { setPasswordError("Enter your current password."); return; }
    if (!newPassword) { setPasswordError("Enter a new password."); return; }
    if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords don't match."); return; }
    if (newPassword === currentPassword) { setPasswordError("New password must be different."); return; }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("Done", "Password updated successfully!");
      setShowPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      const msg = e?.message || "Failed to change password.";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setPasswordError("Current password is incorrect.");
      } else {
        setPasswordError(msg);
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  const initials = profile?.username ? profile.username.slice(0, 1).toUpperCase() : "?";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.menuOverlay, paddingHorizontal: 24 }}>
          <Pressable onPress={(e: any) => e.stopPropagation()}
            style={{ width: "100%", maxHeight: "85%", borderRadius: 16, backgroundColor: colors.card, padding: 20, borderWidth: 1, borderColor: colors.border }}>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>Edit Profile</Text>
              <Pressable onPress={onClose}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={{ alignItems: "center" }}>
              <Pressable onPress={pickImage} disabled={saving}>
                <View style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center", borderRadius: 36, backgroundColor: colors.input, borderWidth: 2, borderColor: colors.accent, overflow: "hidden" }}>
                  {profile?.photoURL ? <Image source={{ uri: profile.photoURL }} style={{ width: 72, height: 72, borderRadius: 36 }} /> : <Text style={{ fontSize: 26, fontWeight: "600", color: colors.accent }}>{initials}</Text>}
                </View>
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}>
                  <MaterialIcons name="camera-alt" size={12} color="#fff" />
                </View>
              </Pressable>
              {hasPhoto ? (
                <Pressable onPress={handleRemovePhoto} disabled={saving} style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.errorText }}>Remove photo</Text>
                </Pressable>
              ) : (
                <Pressable onPress={pickImage} disabled={saving} style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.accent }}>{saving ? "Uploading..." : "Upload photo"}</Text>
                </Pressable>
              )}
            </View>

            <Text style={{ marginBottom: 5, marginTop: 16, fontSize: 11, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>USERNAME</Text>
            <TextInput value={username} onChangeText={(t) => { setUsername(t); setError(null); }} placeholder="yourname" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} maxLength={15} editable={!saving}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text }} />

            <Text style={{ marginBottom: 5, marginTop: 12, fontSize: 11, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>BIO</Text>
            <TextInput value={bio} onChangeText={setBio} placeholder="Tell something about yourself" placeholderTextColor={colors.muted} multiline maxLength={150} editable={!saving}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, minHeight: 50, textAlignVertical: "top" }} />
            <Text style={{ fontSize: 10, color: colors.muted, textAlign: "right", marginTop: 3 }}>{bio.length}/150</Text>

            {error ? (
              <View style={{ marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialIcons name="error-outline" size={13} color={colors.errorText} />
                <Text style={{ fontSize: 11, color: colors.errorText, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
              <Pressable onPress={onClose} disabled={saving} style={{ flex: 1, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} disabled={saving} style={{ flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingVertical: 10 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Save</Text>}
              </Pressable>
            </View>

            {/* Change Password */}
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
              <Pressable onPress={() => setShowPassword(!showPassword)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="lock-outline" size={16} color={colors.muted} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, flex: 1 }}>Change Password</Text>
                <MaterialIcons name={showPassword ? "expand-less" : "expand-more"} size={20} color={colors.muted} />
              </Pressable>

              {showPassword && (
                <View style={{ marginTop: 12 }}>
                  <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor={colors.muted} secureTextEntry editable={!passwordSaving}
                    style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, marginBottom: 8 }} />
                  <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={colors.muted} secureTextEntry editable={!passwordSaving}
                    style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, marginBottom: 8 }} />
                  <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={colors.muted} secureTextEntry editable={!passwordSaving}
                    style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text }} />

                  {passwordError ? (
                    <View style={{ marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg, padding: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MaterialIcons name="error-outline" size={13} color={colors.errorText} />
                      <Text style={{ fontSize: 11, color: colors.errorText, flex: 1 }}>{passwordError}</Text>
                    </View>
                  ) : null}

                  <Pressable onPress={handleChangePassword} disabled={passwordSaving}
                    style={{ marginTop: 10, height: 40, borderRadius: 10, backgroundColor: passwordSaving ? colors.muted : colors.accent, alignItems: "center", justifyContent: "center" }}>
                    {passwordSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Update Password</Text>}
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
