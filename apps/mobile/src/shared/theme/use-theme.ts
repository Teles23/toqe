import { useColorScheme } from "react-native";

import {
  a11y,
  palette,
  radius,
  spacing,
  type Theme,
  typography,
} from "./tokens";

/**
 * Hook único para consumir o design system.
 * Retorna a paleta correta com base em `useColorScheme()` + tokens estáticos.
 *
 * Uso:
 *   const { palette, spacing, radius, typography, isDark } = useTheme();
 *   <View style={{ backgroundColor: palette.bg, padding: spacing.md }} />
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return {
    palette: isDark ? palette.dark : palette.light,
    spacing,
    radius,
    typography,
    a11y,
    isDark,
  };
}
