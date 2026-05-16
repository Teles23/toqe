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

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

jest.mock("@/src/shared/hooks/barbeiro/use-fila-dia", () => ({
  useFilaDia: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-update-status", () => ({
  useUpdateStatus: jest.fn(),
}));

// Stub do modal — testes do modal vivem no spec próprio.
// jest.mock factories são hoistadas antes dos imports — require dinâmico
// é a única forma de referenciar react-native dentro do factory.
jest.mock("@/src/features/barbeiro/AdicionarWalkInModal", () => {
  const RN = jest.requireActual("react-native");
  return {
    AdicionarWalkInModal: ({
      visible,
      testID,
    }: {
      visible: boolean;
      testID?: string;
    }) => (visible ? <RN.View testID={testID ?? "walk-in-modal"} /> : null),
  };
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import type { AgendamentoResponse } from "@toqe/shared";

import BarbeiroFilaScreen from "../fila";

const mockUseFilaDia = useFilaDia as jest.MockedFunction<typeof useFilaDia>;
const mockUseUpdateStatus = useUpdateStatus as jest.MockedFunction<
  typeof useUpdateStatus
>;

function makeAg(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T13:00:00.000Z",
    fim: "2026-05-15T13:30:00.000Z",
    status: "pendente",
    barbeiro: { usrCodigo: 99, nome: "Carlos", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "João", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-15T12:50:00.000Z",
    ...over,
  };
}

function mockQ(over: Partial<ReturnType<typeof useFilaDia>> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: jest.fn(),
    ...over,
  } as unknown as ReturnType<typeof useFilaDia>;
}

describe("BarbeiroFilaScreen", () => {
  beforeEach(() => {
    mockUseFilaDia.mockReset();
    mockUseUpdateStatus.mockReset();
    mockUseUpdateStatus.mockReturnValue({
      mutate: jest.fn(),
    } as unknown as ReturnType<typeof useUpdateStatus>);
  });

  it("mostra loading state", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ isLoading: true }));
    render(<BarbeiroFilaScreen />);
    expect(screen.getByTestId("fila-loading")).toBeTruthy();
  });

  it("mostra estado vazio com mensagem específica", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ data: [] }));
    render(<BarbeiroFilaScreen />);
    expect(screen.getByText(/Fila vazia/i)).toBeTruthy();
  });

  it("mostra erro quando isError", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ isError: true }));
    render(<BarbeiroFilaScreen />);
    expect(screen.getByText(/Não foi possível carregar/i)).toBeTruthy();
  });

  it("renderiza FilaCards com posição ascendente", () => {
    mockUseFilaDia.mockReturnValue(
      mockQ({
        data: [
          makeAg({
            codigo: 1,
            cliente: { usrCodigo: 1, nome: "João", telefone: null },
          }),
          makeAg({
            codigo: 2,
            cliente: { usrCodigo: 2, nome: "Maria", telefone: null },
          }),
          makeAg({
            codigo: 3,
            cliente: { usrCodigo: 3, nome: "Ana", telefone: null },
          }),
        ],
      }),
    );
    render(<BarbeiroFilaScreen />);

    expect(screen.getByTestId("lista-fila")).toBeTruthy();
    expect(screen.getByText("João")).toBeTruthy();
    expect(screen.getByText("Maria")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();

    const posicoes = screen
      .getAllByTestId("posicao")
      .map((n) => n.props.children);
    expect(posicoes).toEqual(["1º", "2º", "3º"]);
  });

  it("FAB abre o modal de adicionar walk-in", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ data: [] }));
    render(<BarbeiroFilaScreen />);

    expect(screen.queryByTestId("walk-in-modal")).toBeNull();
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    expect(screen.getByTestId("walk-in-modal")).toBeTruthy();
  });
});
