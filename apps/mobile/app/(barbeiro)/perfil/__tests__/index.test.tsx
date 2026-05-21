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

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
  },
  // Mock do useSegments — usado por usePerfilBasePath para detectar grupo.
  useSegments: jest.fn(() => ["(barbeiro)", "perfil"]),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// useBarbeiroStats — retorna undefined por padrão (stats não carregadas)
jest.mock("@/src/shared/hooks/barbeiro/use-barbeiro-stats", () => ({
  useBarbeiroStats: () => ({ data: undefined, isLoading: false }),
}));

import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import PerfilIndexScreen from "../index";

describe("PerfilIndexScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza nome e email do user", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "Carlos",
        email: "c@x.com",
        telefone: null,
        avatarUrl: null,
      },
      perfil: "barbeiro",
      barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
      barbearia: { codigo: 1, nome: "Centro" },
      switchBarbearia: jest.fn(),
      logout: jest.fn(),
    });
    render(<PerfilIndexScreen />);
    expect(screen.getByText("Carlos")).toBeTruthy();
    expect(screen.getByText("c@x.com")).toBeTruthy();
  });

  it("renderiza 3 seções: Conta, Segurança (sem Barbearia se 1 só)", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      perfil: "barbeiro",
      barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
      barbearia: { codigo: 1, nome: "Centro" },
      switchBarbearia: jest.fn(),
      logout: jest.fn(),
    });
    render(<PerfilIndexScreen />);
    expect(screen.getByText("Conta")).toBeTruthy();
    expect(screen.getByText("Segurança")).toBeTruthy();
    expect(screen.queryByText("Barbearia ativa")).toBeNull();
  });

  it("mostra seção Barbearia quando >1", () => {
    const switchBarb = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      perfil: "barbeiro",
      barbearias: [
        { codigo: 1, nome: "Centro", perfil: "barbeiro" },
        { codigo: 2, nome: "Norte", perfil: "dono" },
      ],
      barbearia: { codigo: 1, nome: "Centro" },
      switchBarbearia: switchBarb,
      logout: jest.fn(),
    });
    render(<PerfilIndexScreen />);
    expect(screen.getByText("Barbearia ativa")).toBeTruthy();
    expect(screen.getByTestId("barbearia-1")).toBeTruthy();
    expect(screen.getByTestId("barbearia-2")).toBeTruthy();

    fireEvent.press(screen.getByTestId("barbearia-2"));
    expect(switchBarb).toHaveBeenCalledWith(2);
  });

  it("navega para /editar ao tap em 'Editar perfil'", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      perfil: "barbeiro",
      barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
      barbearia: { codigo: 1, nome: "Centro" },
      switchBarbearia: jest.fn(),
      logout: jest.fn(),
    });
    render(<PerfilIndexScreen />);
    fireEvent.press(screen.getByTestId("ir-editar"));
    expect(mockPush).toHaveBeenCalledWith("/(barbeiro)/perfil/editar");
  });

  it("Sair pede confirmação e chama logout", () => {
    const logout = jest.fn();
    const alertSpy = jest
      .spyOn(Alert, "alert")
      // simula tap em "Sair"
      .mockImplementation((_t, _m, buttons) => {
        const sair = buttons?.find((b) => b.text === "Sair");
        sair?.onPress?.();
      });

    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      perfil: "barbeiro",
      barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
      barbearia: { codigo: 1, nome: "Centro" },
      switchBarbearia: jest.fn(),
      logout,
    });
    render(<PerfilIndexScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));

    expect(alertSpy).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
