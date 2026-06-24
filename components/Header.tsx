import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

type Props = {
  title: string;
  onProfilePress?: () => void;
};

export function Header({ title, onProfilePress }: Props) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 56,
        height: 80,
        borderRadius: 999,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 8,
        paddingRight: 8,
        paddingVertical: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View
        style={{
          flex: 7,
          height: 64,
          borderRadius: 999,
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: "center",
          paddingLeft: 24,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.accent,
            letterSpacing: 4,
            fontFamily: "PressStart2P",
          }}
        >
          {title}
        </Text>
      </View>

      <Pressable
        onPress={onProfilePress}
        style={{
          flex: 3,
          height: 64,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.input,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <MaterialIcons name="person" size={24} color={colors.accent} />
          )}
        </View>
      </Pressable>
    </View>
  );
}
