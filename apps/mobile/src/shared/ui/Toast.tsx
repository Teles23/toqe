import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

export type ToastTone = "success" | "info" | "warn" | "error";

type FeatherIconName = keyof typeof Feather.glyphMap;

const TONE_CONFIG: Record<ToastTone, { color: string; icon: FeatherIconName }> =
  {
    success: { color: "#1db954", icon: "check-circle" },
    info: { color: "#4da3ff", icon: "info" },
    warn: { color: "#ff9500", icon: "alert-triangle" },
    error: { color: "#ff3b30", icon: "x-circle" },
  };

export interface ToastVisualProps {
  message: string;
  tone: ToastTone;
  opacity: Animated.Value;
}

export function ToastOverlay({ message, tone, opacity }: ToastVisualProps) {
  const insets = useSafeAreaInsets();
  const { color, icon } = TONE_CONFIG[tone];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + 12, opacity }]}
    >
      <View style={[styles.toast, { borderLeftColor: color }]}>
        <Feather name={icon} size={16} color={color} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#171717",
    borderRadius: 12,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#f5f5f5",
    lineHeight: 18,
  },
});
