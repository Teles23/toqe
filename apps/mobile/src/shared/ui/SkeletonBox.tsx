import { useEffect } from "react";
import { type DimensionValue, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/shared/theme";

export interface SkeletonBoxProps {
  /** Largura. Aceita number (px) ou string ("100%"). */
  width: DimensionValue;
  /** Altura. */
  height: DimensionValue;
  /** Border radius. Default: `radius.sm`. */
  borderRadius?: number;
  testID?: string;
}

/**
 * Placeholder de loading com efeito shimmer.
 *
 * Reanimated translate-X de um "highlight" sobre o fundo base — não usa
 * gradiente real (evita dep externa); um overlay com `shimmer2` mais claro
 * percorre o box em loop.
 *
 * Usado em listas, cards de agenda enquanto a request carrega.
 *
 * O testID fica no `View` externo (regular) — o `Animated.View` do reanimated
 * não forwarda `testID` confiavelmente em alguns mocks de teste.
 */
export function SkeletonBox({
  width,
  height,
  borderRadius,
  testID,
}: SkeletonBoxProps) {
  const { palette, radius } = useTheme();
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 100}%` as const }],
  }));

  // Decorativo (loading placeholder) — a11y fica a cargo do container
  // (ex.: `accessibilityLabel="Carregando agenda"` no parent).
  return (
    <View
      testID={testID ?? "skeleton-box"}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: borderRadius ?? radius.sm,
          backgroundColor: palette.shimmer1,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.highlight,
          { backgroundColor: palette.shimmer2 },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "60%",
    opacity: 0.6,
  },
});
