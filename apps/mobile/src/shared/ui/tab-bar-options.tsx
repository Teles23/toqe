import { Feather } from "@expo/vector-icons";

import type { Theme } from "@/src/shared/theme";

/**
 * Builder DRY de opções de tab bar para Expo Router.
 *
 * Compartilhado entre `app/(barbeiro)/_layout.tsx` e `app/(cliente)/_layout.tsx`
 * — qualquer mudança visual (cor, fonte, altura) entra aqui uma vez só.
 *
 * Princípio Urban Flow:
 * - Fundo `palette.bg` (não destaca-se da tela base — barra continua o conteúdo)
 * - Active `palette.primary` (âmbar Urban Flow)
 * - Inactive `palette.tabInactive` (#888888 — legível, passa WCAG AA)
 * - Border-top `palette.border` sutil
 * - Label em `Inter_500Medium 11pt` — mesma família do design system
 *
 * O builder NÃO inclui `tabBarIcon` porque cada tab tem seu ícone — o
 * caller passa o nome do ícone Feather e recebe a função renderer.
 */
export function buildTabBarOptions(theme: Theme) {
  const { palette } = theme;
  return {
    headerShown: false,
    tabBarActiveTintColor: palette.primary,
    tabBarInactiveTintColor: palette.tabInactive,
    tabBarStyle: {
      backgroundColor: palette.bg,
      borderTopColor: palette.border,
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      lineHeight: 14,
    },
  };
}

/**
 * Cria a função renderer de ícone Feather para uma tab — assinatura
 * compatível com `tabBarIcon` do Expo Router.
 */
export function tabBarIcon(name: keyof typeof Feather.glyphMap) {
  function IconRenderer({
    color,
    size,
  }: {
    color: string | import("react-native").ColorValue;
    size: number;
  }) {
    return <Feather name={name} size={size} color={color} />;
  }
  return IconRenderer;
}
