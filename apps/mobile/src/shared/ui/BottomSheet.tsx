import { useEffect } from "react";
import {
  BackHandler,
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
   * Altura do sheet:
   * - número (0–1): fração da altura da tela (default: 40%);
   * - `"auto"`: até 80% da tela (para conteúdos longos com ScrollView);
   * - `"content"`: ajusta-se exatamente ao conteúdo, sem altura mínima
   *   (ideal para menus curtos — evita o vão vazio embaixo).
   */
  height?: number | "auto" | "content";
  testID?: string;
}

/**
 * Bottom sheet padrão do app — substitui `Alert` e `Modal` central.
 *
 * Renderiza COMO OVERLAY DENTRO DA TELA (não via `Modal` do RN). Isso é
 * intencional: o `Modal` do RN sobe numa camada acima de tudo e cobriria a
 * tab bar. Como overlay in-screen, o backdrop cobre apenas a área de conteúdo
 * (acima da tab bar do Expo Router), deixando a tab bar visível — fiel ao
 * protótipo Urban Flow, onde o sheet é irmão do conteúdo e a tab bar fica
 * fora, visível abaixo.
 *
 * Características:
 * - Slide up/down animado via Reanimated
 * - Backdrop com `expo-blur`
 * - Handle bar no topo (padrão nativo iOS/Android)
 * - Fecha ao tocar no backdrop (anima a saída e então chama `onClose`)
 * - Back-button do Android fecha o sheet (via `BackHandler`)
 * - `accessibilityViewIsModal` para leitores de tela
 *
 * z-order: `root` zIndex 20 / elevation 20 (acima do FAB zIndex 10 e do
 * conteúdo, abaixo de nada dentro da tela).
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

  // `content` → sem altura fixa (o conteúdo manda). Demais modos calculam uma
  // altura proporcional. `hideOffset` é o deslocamento para esconder o sheet
  // (em `content` não sabemos a altura, então usamos a tela inteira — o
  // overshoot fica invisível abaixo da borda inferior).
  const isContent = height === "content";
  const sheetHeight = isContent
    ? undefined
    : height === "auto"
      ? screenHeight * 0.8
      : screenHeight * height;
  const hideOffset = sheetHeight ?? screenHeight;

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(hideOffset, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, hideOffset, translateY]);

  // Back-button do Android fecha o sheet (substitui `onRequestClose` do Modal).
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handleBackdropPress() {
    translateY.value = withTiming(
      hideOffset,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }

  if (!visible) return null;

  return (
    <View
      style={styles.root}
      testID={testID ?? "bottom-sheet"}
      accessibilityViewIsModal
    >
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
        testID={`${testID ?? "bottom-sheet"}-panel`}
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceHigh,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
            // `content`: sem altura fixa — abraça o conteúdo, com teto de 85%
            // da tela (conteúdo longo rola via ScrollView do filho, que deve
            // usar flexGrow:0 + flexShrink:1).
            ...(sheetHeight === undefined
              ? { maxHeight: screenHeight * 0.85 }
              : { height: sheetHeight }),
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
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
    elevation: 20,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 21,
    elevation: 21,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: "center",
  },
});
