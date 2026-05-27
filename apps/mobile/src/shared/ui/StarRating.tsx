import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface StarRatingProps {
  /** Número de estrelas preenchidas (0–5). */
  value: number;
  /** Total de estrelas (default 5). */
  total?: number;
  /** Tamanho de cada estrela (default 12). */
  size?: number;
  /** Cor das estrelas preenchidas (default `palette.primary`). */
  color?: string;
  /** Cor das estrelas vazias (default `palette.textDisabled`). */
  emptyColor?: string;
  /** Espaçamento horizontal entre estrelas (default 2). */
  gap?: number;
  testID?: string;
}

/**
 * Linha de estrelas (rating) com ícones Feather — fonte única do indicador de
 * avaliação usado na agenda do cliente, perfil e detalhe da barbearia.
 * Substitui o glifo `★` por `Feather name="star"` consistente.
 */
export function StarRating({
  value,
  total = 5,
  size = 12,
  color,
  emptyColor,
  gap = 2,
  testID,
}: StarRatingProps) {
  const { palette } = useTheme();
  const filled = color ?? palette.primary;
  const empty = emptyColor ?? palette.textDisabled;

  return (
    <View testID={testID} style={[styles.row, { gap }]}>
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < value;
        return (
          <Feather
            key={i}
            name="star"
            size={size}
            color={isFilled ? filled : empty}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
