import { View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface DividerProps {
  /** Indentação à esquerda em pixels (default: 0) */
  indent?: number;
  testID?: string;
}

/**
 * Separador horizontal 1px com a cor `palette.border`.
 * Útil entre itens de lista.
 */
export function Divider({ indent = 0, testID }: DividerProps) {
  const { palette } = useTheme();
  return (
    <View
      testID={testID ?? "divider"}
      style={{
        height: 1,
        marginLeft: indent,
        backgroundColor: palette.border,
      }}
    />
  );
}
