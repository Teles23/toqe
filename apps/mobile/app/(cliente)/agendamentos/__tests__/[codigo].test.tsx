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

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { back: mockBack, replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ codigo: "42" })),
}));

const mockUseAgendamento = jest.fn();
const mockMutateAsync = jest.fn();
jest.mock("@/src/shared/hooks/cliente/use-agendamento", () => ({
  useAgendamento: (codigo: number) => mockUseAgendamento(codigo),
  useCancelarAgendamento: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import AgendamentoDetalheScreen from "../[codigo]";

function makeAg(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 42,
    inicio: "2026-06-15T14:00:00.000Z",
    fim: "2026-06-15T14:30:00.000Z",
    status: "confirmado",
    barbeiro: { usrCodigo: 99, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "Cliente X", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
        preco: 50,
        duracao: 30,
      },
    ],
    criadoEm: "2026-06-10T10:00:00.000Z",
    ...over,
  };
}

function mockQ(over = {}) {
  return {
    data: undefined as AgendamentoResponse | undefined,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...over,
  };
}

describe("AgendamentoDetalheScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mostra loading state", () => {
    mockUseAgendamento.mockReturnValue(mockQ({ isLoading: true }));
    render(<AgendamentoDetalheScreen />);
    expect(screen.getByTestId("agendamento-loading")).toBeTruthy();
  });

  it("mostra erro quando isError", () => {
    mockUseAgendamento.mockReturnValue(mockQ({ isError: true }));
    render(<AgendamentoDetalheScreen />);
    expect(screen.getByText(/não encontrado/i)).toBeTruthy();
  });

  it("renderiza status traduzido", () => {
    mockUseAgendamento.mockReturnValue(
      mockQ({ data: makeAg({ status: "confirmado" }) }),
    );
    render(<AgendamentoDetalheScreen />);
    expect(screen.getByTestId("status-text").props.children).toBe("Confirmado");
  });

  it("renderiza barbeiro e serviços", () => {
    mockUseAgendamento.mockReturnValue(mockQ({ data: makeAg() }));
    render(<AgendamentoDetalheScreen />);
    expect(screen.getByText("Carlos Barbeiro")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
    expect(screen.getByText("30min")).toBeTruthy();
  });

  it("mostra botão cancelar para status pendente ou confirmado", () => {
    mockUseAgendamento.mockReturnValue(
      mockQ({ data: makeAg({ status: "confirmado" }) }),
    );
    render(<AgendamentoDetalheScreen />);
    expect(screen.getByTestId("botao-cancelar")).toBeTruthy();
  });

  it("NÃO mostra botão cancelar para status concluído", () => {
    mockUseAgendamento.mockReturnValue(
      mockQ({ data: makeAg({ status: "concluido" }) }),
    );
    render(<AgendamentoDetalheScreen />);
    expect(screen.queryByTestId("botao-cancelar")).toBeNull();
  });

  it("cancelar pede confirmação via Alert + chama mutate", async () => {
    mockUseAgendamento.mockReturnValue(mockQ({ data: makeAg() }));
    mockMutateAsync.mockResolvedValueOnce({});
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_t, _m, buttons) => {
        const cancelar = buttons?.find(
          (b) => b.text === "Cancelar agendamento",
        );
        cancelar?.onPress?.();
      });

    render(<AgendamentoDetalheScreen />);
    fireEvent.press(screen.getByTestId("botao-cancelar"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(42);
    });
    alertSpy.mockRestore();
  });
});
