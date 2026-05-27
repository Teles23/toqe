import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface CircleIconButtonProps {
  /** Ícone Feather a exibir. */
  icon: keyof typeof Feather.glyphMap;
  /** Handler de toque. Quando ausente, o botão vira um adorno estático. */
  onPress?: () => void;
  /** Diâmetro do círculo (default 44). */
  size?: number;
  /** Tamanho do ícone (default 18). */
  iconSize?: number;
  /** Cor do ícone (default `palette.textMuted`). */
  iconColor?: string;
  /** Cor de fundo (default `palette.surfaceHigh`). */
  background?: string;
  /** Cor da borda (default `palette.border`). */
  borderColor?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Botão circular com ícone Feather — fonte única dos botões redondos de header
 * (voltar, sino, editar, favoritar) compartilhados entre os fluxos cliente e
 * barbeiro. Substitui os glifos `‹`/`←`/`☆` por iconografia Feather coerente.
 *
 * Touch target ≥ 44pt por padrão (WCAG AA).
 */
export function CircleIconButton({
  icon,
  onPress,
  size = 44,
  iconSize = 18,
  iconColor,
  background,
  borderColor,
  accessibilityLabel,
  testID,
}: CircleIconButtonProps) {
  const { palette } = useTheme();
  const color = iconColor ?? palette.textMuted;
  const bg = background ?? palette.surfaceHigh;
  const border = borderColor ?? palette.border;

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: bg,
    borderColor: border,
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[styles.circle, circleStyle]}>
        <Feather name={icon} size={iconSize} color={color} />
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.circle,
        circleStyle,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={iconSize} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
