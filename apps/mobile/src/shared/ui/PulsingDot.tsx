import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/shared/theme";

export interface PulsingDotProps {
  /** Cor do ponto. Default: `palette.success` (verde "ao vivo"). */
  color?: string;
  /** Diâmetro em px. Default: 8. */
  size?: number;
  testID?: string;
}

/**
 * Ponto que pulsa em loop (opacity 1 → 0.3 → 1) — indicador "ao vivo".
 *
 * Usado em:
 * - Status "online" do barbeiro
 * - StatusBadge `confirmado` / `online`
 * - Lista de barbearias com barbeiros disponíveis agora
 *
 * Animação roda no UI thread via Reanimated (sem re-renders do JS).
 *
 * Wrapper externo (`View` regular) garante que `testID` apareça no tree do
 * Testing Library — `Animated.View` do Reanimated não forwarda `testID`
 * em alguns mocks de teste.
 */
export function PulsingDot({ color, size = 8, testID }: PulsingDotProps) {
  const { palette } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // O componente é puramente decorativo; nenhum prop de a11y é necessário —
  // o parent (StatusBadge / card de barbeiro online) descreve o estado.
  return (
    <View
      testID={testID ?? "pulsing-dot"}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color ?? palette.success,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    // sem estilos extras — width/height/borderRadius são dinâmicos
  },
});
