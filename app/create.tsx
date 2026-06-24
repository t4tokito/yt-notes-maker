import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../lib/theme";
import { hapticMedium } from "../lib/haptics";
import { Header } from "../components/Header";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CreateScreen() {
  const { colors, gradient } = useTheme();
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="CREATE" onProfilePress={() => router.push("/profile")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>

          {/* Hero */}
          <Pressable
            onPress={() => { hapticMedium(); router.push("/new"); }}
            style={({ pressed }) => ({ marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }] })}
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

          {/* Tools Grid */}
          <View style={{ marginHorizontal: 20, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {/* Quiz */}
            <Pressable
              onPress={() => { hapticMedium(); router.push("/test"); }}
              style={({ pressed }) => ({ width: (SCREEN_WIDTH - 50) / 2, backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: pressed ? "#64C878" : colors.border, transform: [{ scale: pressed ? 0.97 : 1 }] })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#64C878" + "18", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialIcons name="quiz" size={20} color="#64C878" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Test</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>Test preparation</Text>
            </Pressable>

            {/* PDF */}
            <Pressable
              onPress={() => { hapticMedium(); router.push("/pdf-notes"); }}
              style={({ pressed }) => ({ width: (SCREEN_WIDTH - 50) / 2, backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: pressed ? "#E85D5D" : colors.border, transform: [{ scale: pressed ? 0.97 : 1 }] })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#E85D5D" + "18", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialIcons name="picture-as-pdf" size={20} color="#E85D5D" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>PDF Notes</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>From documents</Text>
            </Pressable>

            {/* Flashcards */}
            <Pressable
              onPress={() => { hapticMedium(); router.push("/flashcards"); }}
              style={({ pressed }) => ({ width: (SCREEN_WIDTH - 50) / 2, backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: pressed ? "#9B8A70" : colors.border, transform: [{ scale: pressed ? 0.97 : 1 }] })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#9B8A70" + "18", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialIcons name="style" size={20} color="#9B8A70" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Flashcards</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>Auto-generated</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
