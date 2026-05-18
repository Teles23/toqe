import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/src/shared/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BaseButtonProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  label: string;
  loading?: boolean;
  /** Cor de fundo do botão. */
  bg: string;
  /** Cor do texto e do spinner. */
  fg: string;
  /** Cor da borda (opcional). Se omitida, sem borda. */
  border?: string;
  /** Se `true`, dispara `Haptics.selectionAsync` no onPress. Default: `true`. */
  haptic?: boolean;
}

/**
 * Botão base reutilizável do design system Toqe (Urban Flow Native).
 *
 * Características compartilhadas por todas as variantes (Amber/Ghost/Danger):
 * - Touch target ≥ 44pt (acessibilidade WCAG AA)
 * - Loading com ActivityIndicator e bloqueio de onPress
 * - Disabled com opacidade reduzida e bloqueio de onPress
 * - Haptic feedback (selectionAsync) ao tocar
 * - Animação de "press" via Reanimated (scale 0.97)
 * - `accessibilityRole="button"` e `accessibilityState.busy` quando loading
 *
 * Wrappers em `AmberButton.tsx`, `GhostButton.tsx`, `DangerButton.tsx` apenas
 * fixam cores — toda lógica vive aqui (DRY).
 */
export function BaseButton({
  label,
  loading = false,
  disabled,
  bg,
  fg,
  border,
  haptic = true,
  onPress,
  accessibilityLabel,
  accessibilityState,
  ...rest
}: BaseButtonProps) {
  const { radius } = useTheme();
  const scale = useSharedValue(1);

  const isDisabled = !!disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }
  function handlePress(event: GestureResponderEvent) {
    if (isDisabled) return;
    if (haptic) {
      void Haptics.selectionAsync();
    }
    onPress?.(event);
  }

  return (
    <AnimatedPressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        busy: loading,
        disabled: isDisabled,
        ...accessibilityState,
      }}
      style={[
        styles.base,
        {
          borderRadius: radius.md,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border ?? "transparent",
          opacity: isDisabled ? 0.6 : 1,
        },
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} testID="button-loading" />
      ) : (
        <Text style={[styles.text, { color: fg }]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
  },
});
