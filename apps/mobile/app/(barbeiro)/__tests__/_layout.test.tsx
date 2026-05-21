/**
 * Testa os guards de autenticação e perfil do BarbeiroLayout.
 *
 * Cenários:
 * - loading: mostra ActivityIndicator (sem redirecionar)
 * - não autenticado: redireciona para /(auth)/login
 * - perfil CLIENTE: redireciona para /(cliente)/home
 * - perfil BARBEIRO: renderiza as tabs normalmente
 */

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

const mockRedirectHref = jest.fn();
jest.mock("expo-router", () => {
  function Redirect({ href }: { href: string }) {
    mockRedirectHref(href);
    return null;
  }
  function Tabs({ children }: { children?: React.ReactNode }) {
    return children as React.ReactElement;
  }
  function TabsScreen() {
    return null;
  }
  Tabs.Screen = TabsScreen;
  return { Redirect, Tabs, router: { replace: jest.fn() } };
});

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/src/shared/theme", () => ({
  useTheme: () => ({}),
}));

jest.mock("@/src/shared/ui/tab-bar-options", () => ({
  buildTabBarOptions: () => ({}),
  tabBarIcon: () => () => null,
}));

import { render } from "@testing-library/react-native";
import React from "react";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { Perfil } from "@toqe/shared";

import BarbeiroLayout from "../_layout";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function makeAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    user: null,
    perfil: null,
    barbearia: null,
    barbearias: [],
    loading: false,
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    switchBarbearia: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>;
}

describe("BarbeiroLayout — guards de acesso", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockRedirectHref.mockReset();
  });

  it("mostra ActivityIndicator enquanto loading=true", () => {
    mockUseAuth.mockReturnValue(makeAuth({ loading: true }));
    const { getByTestId, UNSAFE_queryByType } = render(<BarbeiroLayout />);
    // ActivityIndicator deve estar presente; Redirect não deve ser chamado
    expect(mockRedirectHref).not.toHaveBeenCalled();
    // ActivityIndicator presente na árvore
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  it("redireciona para /(auth)/login quando não autenticado", () => {
    mockUseAuth.mockReturnValue(makeAuth({ user: null }));
    render(<BarbeiroLayout />);
    expect(mockRedirectHref).toHaveBeenCalledWith("/(auth)/login");
  });

  it("redireciona para /(cliente)/home quando perfil é CLIENTE", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.CLIENTE }),
    );
    render(<BarbeiroLayout />);
    expect(mockRedirectHref).toHaveBeenCalledWith("/(cliente)/home");
  });

  it("renderiza tabs quando perfil é BARBEIRO", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.BARBEIRO }),
    );
    render(<BarbeiroLayout />);
    expect(mockRedirectHref).not.toHaveBeenCalled();
  });

  it("renderiza tabs quando perfil é DONO", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.DONO }),
    );
    render(<BarbeiroLayout />);
    expect(mockRedirectHref).not.toHaveBeenCalled();
  });
});
