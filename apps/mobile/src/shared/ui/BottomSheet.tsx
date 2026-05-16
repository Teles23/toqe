import { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/shared/theme";

import { SafeBlurView } from "./SafeBlurView";

export interface BottomSheetProps {
  /** Controla visibilidade externamente. */
  visible: boolean;
  /** Callback ao fechar (tap no backdrop ou hardware back). */
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Altura do sheet em % da tela. Default: 40%.
   * Use `auto` para que o conteúdo defina a altura (até 80% máx.).
   */
  height?: number | "auto";
  testID?: string;
}

/**
 * Bottom sheet padrão do app — substitui `Alert` e `Modal` central.
 *
 * Características:
 * - Slide up/down animado via Reanimated
 * - Backdrop com `expo-blur` (estética Urban Flow)
 * - Handle bar no topo (padrão nativo iOS/Android)
 * - Fecha ao tocar no backdrop
 * - `accessibilityViewIsModal` para leitores de tela
 *
 * Nota: usa `Modal` do RN para z-order correto sobre tab bars/headers e
 * para captura de back-button no Android (`onRequestClose`).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  height = 0.4,
  testID,
}: BottomSheetProps) {
  const { palette, radius, spacing, isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);

  const sheetHeight =
    height === "auto" ? screenHeight * 0.8 : screenHeight * height;

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(sheetHeight, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, sheetHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handleBackdropPress() {
    translateY.value = withTiming(
      sheetHeight,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID ?? "bottom-sheet"}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
        >
          <SafeBlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.overlay },
            ]}
          />
        </Pressable>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surfaceHigh,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.sm,
              paddingBottom: spacing.xl,
              paddingHorizontal: spacing.lg,
              height: sheetHeight,
            },
            animatedStyle,
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor: palette.borderStrong,
                borderRadius: radius.full,
                marginBottom: spacing.md,
              },
            ]}
          />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: "center",
  },
});
