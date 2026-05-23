/**
 * Toqe — Design tokens (Urban Flow Native).
 *
 * Source of truth para cores, espaçamento, raios e tipografia mobile.
 * Inspirado e coerente com a identidade Urban Flow da web (apps/web/src/shared/ui/tokens.css).
 *
 * Princípios:
 * - Mobile é dark-first; light mode é fallback.
 * - Nenhum literal hex em telas — sempre via `useTheme()`.
 * - JetBrains Mono **só** em horários e números críticos (TimeDisplay).
 *
 * Mudança de fase: campos `cardBg`/`dangerBg` permanecem como aliases de
 * `surface`/`dangerDim` enquanto telas legadas migram. Removidos na Fase 4
 * (ver `docs/35-redesign-mobile-urban-flow.md`).
 */

// ─── Paleta por modo ─────────────────────────────────────────────────────────
export interface Palette {
  // Superfícies (elevation system)
  bg: string;
  surface: string;
  surfaceHigh: string;
  surfaceOverlay: string;

  // Bordas
  border: string;
  borderStrong: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputFocus: string;

  // Texto
  text: string;
  textMuted: string;
  textDisabled: string;
  /** Tab bar inativa — contraste mínimo WCAG AA sobre `bg` (≠ textDisabled) */
  tabInactive: string;

  // Marca — Urban Flow
  primary: string;
  primaryDim: string;
  primaryOn: string;

  // Estados
  success: string;
  successDim: string;
  info: string;
  infoDim: string;
  danger: string;
  dangerDim: string;
  warning: string;
  warningDim: string;

  // Especiais
  overlay: string;
  shimmer1: string;
  shimmer2: string;

  // Aliases legados (removidos na Fase 4 — não usar em código novo)
  /** @deprecated use `surface` */
  cardBg: string;
  /** @deprecated use `dangerDim` */
  dangerBg: string;
}

const darkPalette: Palette = {
  // Superfícies em camadas
  bg: "#0a0a0a",
  surface: "#111111",
  surfaceHigh: "#181818",
  surfaceOverlay: "#222222",

  // Bordas
  border: "#1e1e1e",
  borderStrong: "#2a2a2a",

  // Inputs
  inputBg: "#111111",
  inputBorder: "#2a2a2a",
  inputFocus: "#f4b400",

  // Texto
  text: "#f0f0f0",
  textMuted: "#777777",
  textDisabled: "#333333",
  tabInactive: "#888888", // ≈5.3:1 sobre #0a0a0a — passa WCAG AA

  // Marca — Urban Flow
  primary: "#f4b400",
  primaryDim: "#2a1f00",
  primaryOn: "#0a0a0a",

  // Estados
  success: "#1db954",
  successDim: "#0a2014",
  info: "#4da3ff",
  infoDim: "#091a2e",
  danger: "#ff3b30",
  dangerDim: "#2a0a08",
  warning: "#ff9500",
  warningDim: "#2a1800",

  // Especiais
  overlay: "rgba(0, 0, 0, 0.75)",
  shimmer1: "#111111",
  shimmer2: "#1a1a1a",

  // Aliases legados
  cardBg: "#111111",
  dangerBg: "#2a0a08",
};

const lightPalette: Palette = {
  bg: "#f8f8f8",
  surface: "#ffffff",
  surfaceHigh: "#fafafa",
  surfaceOverlay: "#f0f0f0",

  border: "#e8e8e8",
  borderStrong: "#d0d0d0",

  inputBg: "#ffffff",
  inputBorder: "#d8d8d8",
  inputFocus: "#d4a000",

  text: "#0a0a0a",
  textMuted: "#666666",
  textDisabled: "#bbbbbb",
  tabInactive: "#666666", // contraste suficiente sobre #f8f8f8

  primary: "#d4a000",
  primaryDim: "#fff8e0",
  primaryOn: "#ffffff",

  success: "#1aa34a",
  successDim: "#e8f5ee",
  info: "#1a73e8",
  infoDim: "#e8f0fe",
  danger: "#cc2200",
  dangerDim: "#fdecea",
  warning: "#e67e00",
  warningDim: "#fff3e0",

  overlay: "rgba(0, 0, 0, 0.5)",
  shimmer1: "#eeeeee",
  shimmer2: "#f5f5f5",

  cardBg: "#ffffff",
  dangerBg: "#fdecea",
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
  xxxl: 64,
} as const;

// ─── Border radius ───────────────────────────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
  /** @deprecated use `full` */
  pill: 999,
} as const;

// ─── Tipografia ──────────────────────────────────────────────────────────────
//
// Famílias:
//  - Sora      → identidade da marca; display/title/heading/subheading
//  - Inter     → corpo do texto; body/bodyMedium/bodyBold/label/caption
//  - JetBrains → horários/números críticos; mono/monoMedium/monoLarge/monoXL
//
// Os tamanhos vêm do prompt da Fase 35; `fontWeight` removido para evitar
// conflito com o `fontFamily` (a família já carrega o peso correto).
export const typography = {
  // Sora — títulos e display
  display: { fontFamily: "Sora_700Bold", fontSize: 34, lineHeight: 42 },
  title: { fontFamily: "Sora_700Bold", fontSize: 26, lineHeight: 34 },
  heading: { fontFamily: "Sora_600SemiBold", fontSize: 20, lineHeight: 28 },
  subheading: { fontFamily: "Sora_600SemiBold", fontSize: 16, lineHeight: 22 },

  // Inter — corpo do texto
  body: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: "Inter_500Medium", fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 24 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  captionBold: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
  },

  // JetBrains Mono — horários e números críticos
  mono: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  monoMedium: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 16,
    lineHeight: 22,
  },
  monoLarge: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 28,
    lineHeight: 36,
  },
  monoXL: { fontFamily: "JetBrainsMono_700Bold", fontSize: 42, lineHeight: 50 },
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
