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
  useSegments: jest.fn(() => ["(cliente)", "perfil"]),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseAgendamentos = jest.fn();
jest.mock("@/src/shared/hooks/cliente/use-agendamentos-meus", () => ({
  useAgendamentosMeus: () => mockUseAgendamentos(),
}));

import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import ClientePerfilScreen from "../index";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAuthBase(over = {}) {
  return {
    user: {
      codigo: 1,
      nome: "Maria Cliente",
      email: "maria@x.com",
      telefone: null,
      avatarUrl: null,
    },
    perfil: "cliente",
    barbearias: [
      {
        codigo: 1,
        nome: "Barbearia Centro",
        slug: "centro",
        perfil: "cliente",
      },
    ],
    barbearia: { codigo: 1, nome: "Barbearia Centro", slug: "centro" },
    switchBarbearia: jest.fn(),
    logout: jest.fn(),
    ...over,
  };
}

function makeAg(
  codigo: number,
  status: AgendamentoResponse["status"] = "concluido",
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    fim: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    status,
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "Maria Cliente", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
        preco: 50,
        duracao: 30,
      },
    ],
    criadoEm: new Date().toISOString(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClientePerfilScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgendamentos.mockReturnValue({ data: undefined });
  });

  it("renderiza nome do usuário", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    render(<ClientePerfilScreen />);
    expect(screen.getByText("Maria Cliente")).toBeTruthy();
  });

  it("mostra stats com cortes feitos", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    mockUseAgendamentos.mockReturnValue({
      data: [
        makeAg(1, "concluido"),
        makeAg(2, "concluido"),
        makeAg(3, "pendente"),
      ],
    });
    render(<ClientePerfilScreen />);
    // 2 concluídos
    expect(screen.getByText("2")).toBeTruthy();
    // 1 barbearia
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("CORTES FEITOS")).toBeTruthy();
    expect(screen.getByText("BARBEARIAS")).toBeTruthy();
  });

  it("mostra traço quando sem agendamentos", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    mockUseAgendamentos.mockReturnValue({ data: undefined });
    render(<ClientePerfilScreen />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("Sair pede confirmação e chama logout", () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue(makeAuthBase({ logout }));
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_t, _m, buttons) => {
        const sair = buttons?.find((b) => b.text === "Sair");
        sair?.onPress?.();
      });

    render(<ClientePerfilScreen />);
    fireEvent.press(screen.getByTestId("btn-logout"));

    expect(alertSpy).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("perfil-scroll e ir-editar existem", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    render(<ClientePerfilScreen />);
    expect(screen.getByTestId("perfil-scroll")).toBeTruthy();
    expect(screen.getByTestId("ir-editar")).toBeTruthy();
  });

  it("ir-senha navega para senha", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    render(<ClientePerfilScreen />);
    fireEvent.press(screen.getByTestId("ir-senha"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/perfil/senha");
  });

  it("ir-notificacoes navega para notificacoes", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    render(<ClientePerfilScreen />);
    fireEvent.press(screen.getByTestId("ir-notificacoes"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/perfil/notificacoes");
  });
});
