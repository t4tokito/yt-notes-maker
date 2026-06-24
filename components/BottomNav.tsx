import { Pressable, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { hapticLight } from "../lib/haptics";

type Tab = {
  key: string;
  route: string;
  isCreate?: boolean;
};

const TABS: Tab[] = [
  { key: "home", route: "/" },
  { key: "chat", route: "/chat" },
  { key: "create", route: "/create", isCreate: true },
  { key: "notes", route: "/notes" },
  { key: "profile", route: "/profile" },
];

export function BottomNav() {
  const { colors, gradient } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentRoute = "/" + (segments[0] || "");

  function renderIcon(key: string, active: boolean) {
    const color = active ? colors.accent : colors.muted;
    const size = key === "create" ? 22 : 20;
    switch (key) {
      case "home": return <MaterialIcons name="home" size={size} color={color} />;
      case "chat": return <MaterialIcons name="chat-bubble-outline" size={size} color={color} />;
      case "notes": return <MaterialIcons name="notes" size={size} color={color} />;
      case "profile": return <MaterialIcons name="person-outline" size={size} color={color} />;
      default: return null;
    }
  }

  return (
    <View style={{ position: "absolute", bottom: 16 + insets.bottom, left: 16, right: 16 }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.cardSolid,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 8,
        justifyContent: "space-between",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}>
        {TABS.map((tab) => {
          const active = currentRoute === tab.route ||
            (tab.route === "/" && currentRoute === "/") ||
            (tab.route !== "/" && currentRoute.startsWith(tab.route));

          if (tab.isCreate) {
            return (
              <Pressable
                key={tab.key}
                onPress={() => { if (!active) { hapticLight(); router.push(tab.route); } }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: active ? 0.5 : 1,
                }}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 12 }}
                >
                  <MaterialIcons name="add" size={22} color="#fff" />
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.key}
              onPress={() => { if (!active) { hapticLight(); router.push(tab.route); } }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 44, opacity: active ? 0.5 : 1 }}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {renderIcon(tab.key, active)}
                {active && (
                  <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: 4 }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
