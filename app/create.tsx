import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../lib/theme";
import { hapticMedium } from "../lib/haptics";
import { Header } from "../components/Header";

const { width: W } = Dimensions.get("window");
const GAP = 20;
const CARD = (W - 40 - GAP) / 2;

function ToolCard({ icon, color, label, sub, route }: { icon: string; color: string; label: string; sub: string; route: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => { hapticMedium(); router.push(route as any); }}
      style={({ pressed }) => ({
        width: CARD,
        height: 270,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 22,
        justifyContent: "space-between",
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{ width: 65, height: 65, borderRadius: 18, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
        <MaterialIcons name={icon as any} size={30} color={color} />
      </View>
      <View>
        <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{label}</Text>
        <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 13, color: colors.muted }}>{sub}</Text>
      </View>
      <View style={{ alignSelf: "flex-end" }}>
        <MaterialIcons name="arrow-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function CreateScreen() {
  const { colors, gradient } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="CREATE" onProfilePress={() => router.push("/profile")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>

          {/* Hero */}
          <Pressable
            onPress={() => { hapticMedium(); router.push("/new"); }}
            style={({ pressed }) => ({ marginHorizontal: 20, marginBottom: 28, borderRadius: 20, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name="smart-display" size={26} color="#fff" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#A5D6A7" }} />
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>AI</Text>
                </View>
              </View>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff", marginTop: 20 }}>YouTube to Notes</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, lineHeight: 18 }}>Paste a link, get structured notes</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Start</Text>
                <MaterialIcons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Tools */}
          <View style={{ marginHorizontal: 20, marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: GAP }}>
              <ToolCard icon="quiz" color={colors.greenText} label="Test" sub="Quiz yourself with AI" route="/test" />
              <View style={{ width: GAP }} />
              <ToolCard icon="picture-as-pdf" color={colors.toolPdf} label="PDF Notes" sub="From any document" route="/pdf-notes" />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <ToolCard icon="style" color={colors.toolFlashcards} label="Flashcards" sub="Auto-generated cards" route="/flashcards" />
              <View style={{ width: GAP }} />
              <ToolCard icon="lightbulb" color={colors.toolExplain} label="Explain" sub="Any topic explained" route="/explain" />
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
