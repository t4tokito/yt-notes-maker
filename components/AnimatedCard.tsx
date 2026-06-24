import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View, type ViewStyle } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../lib/theme";

type AnimatedCardProps = {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: ViewStyle;
  swipeEnabled?: boolean;
};

export function AnimatedCard({
  children,
  index,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  style,
  swipeEnabled = true,
}: AnimatedCardProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    if (!onSwipeLeft) return null;
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
    return (
      <Animated.View style={{ transform: [{ translateX }], justifyContent: "center", alignItems: "flex-end", paddingRight: 16, marginBottom: 12 }}>
        <View style={{ backgroundColor: colors.errorText, borderRadius: 12, padding: 12 }}>
          <Animated.Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Delete</Animated.Text>
        </View>
      </Animated.View>
    );
  }

  function renderLeftActions(progress: Animated.AnimatedInterpolation<number>) {
    if (!onSwipeRight) return null;
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });
    return (
      <Animated.View style={{ transform: [{ translateX }], justifyContent: "center", alignItems: "flex-start", paddingLeft: 16, marginBottom: 12 }}>
        <View style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 12 }}>
          <Animated.Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Rename</Animated.Text>
        </View>
      </Animated.View>
    );
  }

  const card = (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim, marginBottom: 12, ...style }}>
      <Pressable onPress={onPress} onLongPress={onLongPress}>
        {children}
      </Pressable>
    </Animated.View>
  );

  if (!swipeEnabled || (!onSwipeLeft && !onSwipeRight)) return card;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={() => swipeableRef.current?.close()}
      overshootRight={false}
      overshootLeft={false}
    >
      {card}
    </Swipeable>
  );
}
