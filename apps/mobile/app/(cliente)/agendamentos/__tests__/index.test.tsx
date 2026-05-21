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
  useSegments: jest.fn(() => ["(cliente)", "agendamentos"]),
}));

const mockUseAgendamentos = jest.fn();
jest.mock("@/src/shared/hooks/cliente/use-agendamentos-meus", () => ({
  useAgendamentosMeus: () => mockUseAgendamentos(),
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    barbearia: { codigo: 1, nome: "Urban Flow", perfil: "cliente" },
    barbearias: [{ codigo: 1, nome: "Urban Flow", perfil: "cliente" }],
    switchBarbearia: jest.fn(),
  }),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import ClienteAgendamentosScreen from "../index";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Agendamento futuro (próximos) */
function makeProximo(
  codigo: number,
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // +1 day
    fim: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    status: "confirmado",
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "Cliente X", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
        preco: 50,
        duracao: 30,
      },
    ],
    criadoEm: new Date().toISOString(),
    ...over,
  };
}

/** Agendamento passado (histórico) */
function makeHistorico(
  codigo: number,
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // -1 day
    fim: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    status: "concluido",
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "Cliente X", telefone: null },
    itens: [
      {
        codigo: 2,
        servico: { codigo: 1, nome: "Barba", precoBase: 30, duracaoBase: 20 },
        preco: 30,
        duracao: 20,
      },
    ],
    criadoEm: new Date().toISOString(),
    ...over,
  };
}

function mockQ(over = {}) {
  return {
    data: undefined as AgendamentoResponse[] | undefined,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...over,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClienteAgendamentosScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mostra loading state", () => {
    mockUseAgendamentos.mockReturnValue(mockQ({ isLoading: true }));
    render(<ClienteAgendamentosScreen />);
    expect(screen.getByTestId("lista-meus-agendamentos-loading")).toBeTruthy();
  });

  it("renderiza container principal com testID", () => {
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [] }));
    render(<ClienteAgendamentosScreen />);
    expect(screen.getByTestId("lista-meus-agendamentos")).toBeTruthy();
  });

  it("tabs proximos e historico são renderizadas", () => {
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [] }));
    render(<ClienteAgendamentosScreen />);
    expect(screen.getByTestId("tab-proximos")).toBeTruthy();
    expect(screen.getByTestId("tab-historico")).toBeTruthy();
  });

  it("tab proximos vazia mostra mensagem de vazio", () => {
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [] }));
    render(<ClienteAgendamentosScreen />);
    expect(screen.getByText(/nenhum agendamento futuro/i)).toBeTruthy();
  });

  it("renderiza item de agendamento próximo", () => {
    const item = makeProximo(99);
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [item] }));
    render(<ClienteAgendamentosScreen />);
    expect(screen.getByTestId("apt-row-99")).toBeTruthy();
  });

  it("tap em row navega para detalhe", () => {
    const item = makeProximo(42);
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [item] }));
    render(<ClienteAgendamentosScreen />);
    fireEvent.press(screen.getByTestId("apt-row-42"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/agendamentos/42");
  });

  it("trocar para tab histórico mostra agendamentos passados", () => {
    const futuro = makeProximo(1);
    const passado = makeHistorico(2);
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [futuro, passado] }));
    render(<ClienteAgendamentosScreen />);

    // Inicialmente na tab próximos — item passado não visível
    expect(screen.queryByTestId("apt-row-2")).toBeNull();

    // Trocar para histórico
    fireEvent.press(screen.getByTestId("tab-historico"));
    expect(screen.getByTestId("apt-row-2")).toBeTruthy();
    // item futuro some
    expect(screen.queryByTestId("apt-row-1")).toBeNull();
  });

  it("mostra mensagem de vazio no histórico quando não há passados", () => {
    mockUseAgendamentos.mockReturnValue(mockQ({ data: [makeProximo(1)] }));
    render(<ClienteAgendamentosScreen />);
    fireEvent.press(screen.getByTestId("tab-historico"));
    expect(screen.getByText(/nenhum agendamento no histórico/i)).toBeTruthy();
  });
});
