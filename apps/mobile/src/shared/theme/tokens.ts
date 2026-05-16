/**
 * Toqe — Design tokens (única fonte da verdade para cores, espaçamento, raios e tipografia).
 *
 * Nunca hardcoded hex em telas/componentes. Sempre via `useTheme()`.
 * Paleta deriva da cor de marca `#1a73e8` (primary light) / `#4da3ff` (primary dark).
 */

// ─── Paleta por modo ─────────────────────────────────────────────────────────
export interface Palette {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryOn: string; // texto/ícones sobre primary
  inputBg: string;
  inputBorder: string;
  danger: string;
  dangerBg: string;
  success: string;
  warning: string;
  overlay: string;
}

const lightPalette: Palette = {
  bg: "#f5f5f5",
  cardBg: "#ffffff",
  border: "#e0e0e0",
  text: "#111111",
  textMuted: "#666666",
  primary: "#1a73e8",
  primaryOn: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "#dddddd",
  danger: "#c62828",
  dangerBg: "#fdecea",
  success: "#2f9e44",
  warning: "#f59f00",
  overlay: "rgba(0, 0, 0, 0.08)",
};

const darkPalette: Palette = {
  bg: "#111111",
  cardBg: "#1e1e1e",
  border: "#333333",
  text: "#f5f5f5",
  textMuted: "#999999",
  primary: "#4da3ff",
  primaryOn: "#ffffff",
  inputBg: "#1e1e1e",
  inputBorder: "#333333",
  danger: "#ff6b6b",
  dangerBg: "#3a0a0a",
  success: "#51cf66",
  warning: "#ffd43b",
  overlay: "rgba(255, 255, 255, 0.08)",
};

export const palette: { readonly light: Palette; readonly dark: Palette } = {
  light: lightPalette,
  dark: darkPalette,
};

export type ColorMode = "light" | "dark";

// ─── Espaçamento (escala base 4) ─────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border radius ───────────────────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

// ─── Tipografia ──────────────────────────────────────────────────────────────
export const typography = {
  display: { fontSize: 36, fontWeight: "700" as const, lineHeight: 44 },
  title: { fontSize: 28, fontWeight: "700" as const, lineHeight: 36 },
  heading: { fontSize: 22, fontWeight: "600" as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
} as const;

// ─── Tamanhos mínimos (acessibilidade — WCAG AA touch targets) ───────────────
export const a11y = {
  minTouch: 44, // pt
  minTextContrast: 4.5,
} as const;

export interface Theme {
  palette: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  a11y: typeof a11y;
  isDark: boolean;
}
