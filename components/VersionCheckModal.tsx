import { Linking, Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

const DOWNLOAD_URL = "https://tokitoflix.netlify.app/";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function VersionCheckModal({ visible, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: colors.menuOverlay, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <Pressable onPress={(e: any) => e.stopPropagation()} style={{ width: "100%", borderRadius: 16, backgroundColor: colors.card, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>Update Available</Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 20 }}>
              A new version of TokitoFlix is available. Please update to get the latest features and improvements.
            </Text>
            <Pressable
              onPress={() => { Linking.openURL(DOWNLOAD_URL); onClose(); }}
              style={{ height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Update Now</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
