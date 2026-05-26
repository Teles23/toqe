import { StyleSheet, Text, type TextStyle } from "react-native";

import { useTheme } from "@/src/shared/theme";

export type TimeDisplaySize = "sm" | "md" | "lg" | "xl";

export interface TimeDisplayProps {
  /** Horário formatado como string. Ex.: "16:30", "14:00 - 14:45". */
  time: string;
  /**
   * Tamanho:
   * - `sm` (14pt) — para listas densas
   * - `md` (16pt) — para cards inline
   * - `lg` (28pt) — cards de agenda do barbeiro
   * - `xl` (42pt) — hero do cliente / ticket de detalhe
   *
   * Default: `md`.
   */
  size?: TimeDisplaySize;
  /** Cor do texto. Default: `palette.text` (sm/md) ou `palette.primary` (lg/xl). */
  color?: string;
  testID?: string;
  /** Override de estilo (margins, padding etc.). */
  style?: TextStyle;
}

/**
 * Exibe um horário em JetBrains Mono — o "herói" visual do app.
 *
 * Princípio Barber's Flow: a hora é a primeira informação que o usuário
 * deve reconhecer ao olhar a tela. Sempre monoespaçada para alinhamento
 * vertical em listas de horários.
 */
export function TimeDisplay({
  time,
  size = "md",
  color,
  testID,
  style,
}: TimeDisplayProps) {
  const { palette, typography } = useTheme();

  const typeStyle =
    size === "xl"
      ? typography.monoXL
      : size === "lg"
        ? typography.monoLarge
        : size === "md"
          ? typography.monoMedium
          : typography.mono;

  const defaultColor =
    size === "xl" || size === "lg" ? palette.primary : palette.text;

  return (
    <Text
      testID={testID ?? "time-display"}
      accessibilityLabel={time}
      style={[styles.base, typeStyle, { color: color ?? defaultColor }, style]}
    >
      {time}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
