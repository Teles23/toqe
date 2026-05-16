import { render } from "@testing-library/react-native";
import React from "react";

import { palette, type Theme } from "@/src/shared/theme";

import { buildTabBarOptions, tabBarIcon } from "../tab-bar-options";

const themeDark: Theme = {
  palette: palette.dark,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
  radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999, pill: 999 },
  typography: {} as Theme["typography"],
  a11y: { minTouch: 44, minTextContrast: 4.5 },
  isDark: true,
};

describe("buildTabBarOptions", () => {
  it("aplica primary do palette no tint ativo", () => {
    const options = buildTabBarOptions(themeDark);
    expect(options.tabBarActiveTintColor).toBe(palette.dark.primary);
  });

  it("aplica textDisabled no tint inativo (não compete com primary)", () => {
    const options = buildTabBarOptions(themeDark);
    expect(options.tabBarInactiveTintColor).toBe(palette.dark.textDisabled);
  });

  it("tabBarStyle usa bg + border-top do tema", () => {
    const options = buildTabBarOptions(themeDark);
    const style = options.tabBarStyle as Record<string, unknown>;
    expect(style.backgroundColor).toBe(palette.dark.bg);
    expect(style.borderTopColor).toBe(palette.dark.border);
  });

  it("oculta o header (telas controlam o seu próprio)", () => {
    const options = buildTabBarOptions(themeDark);
    expect(options.headerShown).toBe(false);
  });
});

describe("tabBarIcon", () => {
  it("renderiza um Feather com o nome fornecido sem crash", () => {
    const Icon = tabBarIcon("home");
    const { toJSON } = render(<Icon color="#fff" size={24} />);
    // sanity check: o componente devolve uma tree não-nula
    expect(toJSON()).not.toBeNull();
  });
});
