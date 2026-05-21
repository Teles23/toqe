/**
 * Testa os guards de autenticação e perfil do ClienteLayout.
 *
 * Cenários:
 * - loading: mostra ActivityIndicator (sem redirecionar)
 * - não autenticado: redireciona para /(auth)/login
 * - perfil BARBEIRO: redireciona para /(barbeiro)/agenda
 * - perfil CLIENTE: renderiza as tabs normalmente
 * - perfil null (sem barbearia): renderiza as tabs normalmente
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

import ClienteLayout from "../_layout";

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

describe("ClienteLayout — guards de acesso", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockRedirectHref.mockReset();
  });

  it("mostra ActivityIndicator enquanto loading=true", () => {
    mockUseAuth.mockReturnValue(makeAuth({ loading: true }));
    const { UNSAFE_queryByType } = render(<ClienteLayout />);
    expect(mockRedirectHref).not.toHaveBeenCalled();
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  it("redireciona para /(auth)/login quando não autenticado", () => {
    mockUseAuth.mockReturnValue(makeAuth({ user: null }));
    render(<ClienteLayout />);
    expect(mockRedirectHref).toHaveBeenCalledWith("/(auth)/login");
  });

  it("redireciona para /(barbeiro)/agenda quando perfil é BARBEIRO", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.BARBEIRO }),
    );
    render(<ClienteLayout />);
    expect(mockRedirectHref).toHaveBeenCalledWith("/(barbeiro)/agenda");
  });

  it("redireciona para /(barbeiro)/agenda quando perfil é DONO", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.DONO }),
    );
    render(<ClienteLayout />);
    expect(mockRedirectHref).toHaveBeenCalledWith("/(barbeiro)/agenda");
  });

  it("renderiza tabs quando perfil é CLIENTE", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: Perfil.CLIENTE }),
    );
    render(<ClienteLayout />);
    expect(mockRedirectHref).not.toHaveBeenCalled();
  });

  it("renderiza tabs quando perfil é null (usuário sem barbearia vinculada)", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({ user: { codigo: 1 } as never, perfil: null }),
    );
    render(<ClienteLayout />);
    expect(mockRedirectHref).not.toHaveBeenCalled();
  });
});
