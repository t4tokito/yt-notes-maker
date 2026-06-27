import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { searchGifs, trendingGifs, type TenorGif } from "../lib/tenor";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function GifPicker({ visible, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      setQuery("");
      loadTrending();
    }
  }, [visible]);

  async function loadTrending() {
    setLoading(true);
    const results = await trendingGifs(24);
    setGifs(results);
    setLoading(false);
  }

  async function doSearch() {
    setLoading(true);
    const results = query.trim() ? await searchGifs(query, 24) : await trendingGifs(24);
    setGifs(results);
    setLoading(false);
  }

  function handleClose() {
    onClose();
  }

  function handleSelect(gif: TenorGif) {
    onSelect(gif.url);
    handleClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={{ flex: 1 }} onPress={handleClose}>
        <View style={{ flex: 1, backgroundColor: "transparent", justifyContent: "flex-end" }}>
          <Pressable onPress={(e: any) => e.stopPropagation()}
            style={{
              height: "65%",
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              paddingBottom: insets.bottom,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.input, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                <MaterialIcons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={doSearch}
                  placeholder="Search GIFs..."
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  style={{ flex: 1, fontSize: 14, color: colors.text }}
                />
              </View>
              <Pressable onPress={handleClose} style={{ marginLeft: 12, padding: 4 }}>
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            {/* GIF Grid */}
            {loading ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <FlatList
                data={gifs}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={{ padding: 8 }}
                columnWrapperStyle={{ gap: 6 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => handleSelect(item)} style={{ flex: 1, margin: 3, borderRadius: 10, overflow: "hidden", backgroundColor: colors.input }}>
                    <Image source={{ uri: item.preview }} style={{ width: "100%", height: 110 }} resizeMode="cover" />
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
