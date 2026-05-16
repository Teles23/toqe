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

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { render, screen } from "@testing-library/react-native";
import React from "react";

import ClienteHomeScreen from "../home";

describe("ClienteHomeScreen", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("mostra cumprimento com primeiro nome do user", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "Carlos Silva",
        email: "c@x.com",
        telefone: null,
        avatarUrl: null,
      },
      barbearias: [],
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByText(/Olá, Carlos/)).toBeTruthy();
  });

  it("mostra EmptyScreen quando user sem barbearias", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      barbearias: [],
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByText(/Bem-vindo ao Toqe/i)).toBeTruthy();
  });

  it("renderiza card para cada barbearia", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      barbearias: [
        { codigo: 1, nome: "Centro", perfil: "cliente" },
        { codigo: 2, nome: "Norte", perfil: "cliente" },
      ],
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("barbearia-card-1")).toBeTruthy();
    expect(screen.getByTestId("barbearia-card-2")).toBeTruthy();
    expect(screen.getByText("Centro")).toBeTruthy();
    expect(screen.getByText("Norte")).toBeTruthy();
  });

  it("renderiza atalhos quando há barbearias", () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 1,
        nome: "X",
        email: "x@x.com",
        telefone: null,
        avatarUrl: null,
      },
      barbearias: [{ codigo: 1, nome: "C", perfil: "cliente" }],
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("atalho-agendamentos")).toBeTruthy();
    expect(screen.getByTestId("atalho-buscar")).toBeTruthy();
  });

  it("fallback 'cliente' quando user sem nome", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      barbearias: [],
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByText(/Olá, cliente/)).toBeTruthy();
  });
});
