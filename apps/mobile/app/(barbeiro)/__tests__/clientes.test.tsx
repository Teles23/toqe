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

jest.mock("@/src/shared/hooks/barbeiro/use-clientes-da-barbearia", () => ({
  useClientesDaBarbearia: jest.fn(),
}));

// Walk-in modal stub
jest.mock("@/src/features/barbeiro/AdicionarWalkInModal", () => {
  const RN = jest.requireActual("react-native");
  return {
    AdicionarWalkInModal: ({
      visible,
    }: {
      visible: boolean;
      onClose: () => void;
    }) => (visible ? <RN.View testID="walkin-modal" /> : null),
  };
});

// Stub do ClienteDetalhe — testado em arquivo próprio
jest.mock("@/src/features/barbeiro/ClienteDetalhe", () => {
  const RN = jest.requireActual("react-native");
  return {
    ClienteDetalhe: ({
      visible,
      cliente,
    }: {
      visible: boolean;
      onClose: () => void;
      cliente: { codigo: number; nome: string } | null;
    }) =>
      visible && cliente ? (
        <RN.View testID="detalhe-modal">
          <RN.Text>{cliente.nome}</RN.Text>
        </RN.View>
      ) : null,
  };
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useClientesDaBarbearia } from "@/src/shared/hooks/barbeiro/use-clientes-da-barbearia";
import type { ClienteAPI } from "@toqe/contracts";

import BarbeiroClientesScreen from "../clientes";

const mockHook = useClientesDaBarbearia as jest.MockedFunction<
  typeof useClientesDaBarbearia
>;

function makeC(over: Partial<ClienteAPI> = {}): ClienteAPI {
  return {
    codigo: 1,
    nome: "Carlos",
    email: "c@x.com",
    telefone: null,
    avatarUrl: null,
    perfil: "cliente",
    totalVisitas: 0,
    totalGasto: 0,
    ticketMedio: 0,
    ultimaVisita: null,
    servicoFav: null,
    ...over,
  };
}

function mockResult(
  over: Partial<ReturnType<typeof useClientesDaBarbearia>> = {},
) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...over,
  } as unknown as ReturnType<typeof useClientesDaBarbearia>;
}

describe("BarbeiroClientesScreen", () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it("mostra loading inicial", () => {
    mockHook.mockReturnValue(mockResult({ isLoading: true }));
    render(<BarbeiroClientesScreen />);
    expect(screen.getByTestId("lista-clientes-loading")).toBeTruthy();
  });

  it("mostra empty state quando lista vazia", () => {
    mockHook.mockReturnValue(mockResult({ data: [] }));
    render(<BarbeiroClientesScreen />);
    expect(screen.getByText("Sem clientes ainda")).toBeTruthy();
  });

  it("mostra erro state quando isError", () => {
    mockHook.mockReturnValue(mockResult({ isError: true }));
    render(<BarbeiroClientesScreen />);
    expect(screen.getByText(/Não foi possível carregar/i)).toBeTruthy();
  });

  it("renderiza lista de cards", () => {
    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({ codigo: 1, nome: "Ana Silva" }),
          makeC({ codigo: 2, nome: "Bruno Costa" }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    expect(screen.getByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("Bruno Costa")).toBeTruthy();
    expect(screen.getByTestId("clientes-contagem").props.children).toEqual([
      2,
      " de ",
      2,
    ]);
  });

  it("filtra por busca local (case-insensitive)", () => {
    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({ codigo: 1, nome: "Ana Silva", email: "ana@x.com" }),
          makeC({ codigo: 2, nome: "Bruno Costa", email: "bruno@x.com" }),
          makeC({ codigo: 3, nome: "Carla Mendes", email: "carla@x.com" }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    fireEvent.changeText(screen.getByTestId("clientes-busca"), "bru");
    expect(screen.queryByText("Ana Silva")).toBeNull();
    expect(screen.getByText("Bruno Costa")).toBeTruthy();
    expect(screen.queryByText("Carla Mendes")).toBeNull();
  });

  it("busca ignora acentos", () => {
    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({ codigo: 1, nome: "André Câmara" }),
          makeC({ codigo: 2, nome: "Bruno Lima" }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    fireEvent.changeText(screen.getByTestId("clientes-busca"), "andre");
    expect(screen.getByText("André Câmara")).toBeTruthy();
    expect(screen.queryByText("Bruno Lima")).toBeNull();
  });

  it("toggle sort por última visita reordena", () => {
    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({
            codigo: 1,
            nome: "A Recente",
            ultimaVisita: "2026-05-10T00:00:00.000Z",
          }),
          makeC({
            codigo: 2,
            nome: "B Antigo",
            ultimaVisita: "2025-01-01T00:00:00.000Z",
          }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    fireEvent.press(screen.getByTestId("sort-ultimaVisita"));
    expect(screen.getByText("A Recente")).toBeTruthy();
    expect(screen.getByText("B Antigo")).toBeTruthy();
  });

  it("tap em card abre modal de detalhe (stub)", () => {
    mockHook.mockReturnValue(
      mockResult({
        data: [makeC({ codigo: 7, nome: "Daniel Souza" })],
      }),
    );
    render(<BarbeiroClientesScreen />);

    expect(screen.queryByTestId("detalhe-modal")).toBeNull();
    fireEvent.press(screen.getByTestId("cliente-7"));
    expect(screen.getByTestId("detalhe-modal")).toBeTruthy();
  });

  it("filtro 'Recentes' exibe apenas clientes com visita nos últimos 7 dias", () => {
    const hoje = new Date().toISOString();
    const antigo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 60 dias atrás

    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({ codigo: 1, nome: "Recente", ultimaVisita: hoje }),
          makeC({ codigo: 2, nome: "Antigo", ultimaVisita: antigo }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    fireEvent.press(screen.getByTestId("filter-recentes"));
    expect(screen.getByText("Recente")).toBeTruthy();
    expect(screen.queryByText("Antigo")).toBeNull();
  });

  it("filtro 'Sumidos' exibe apenas clientes com visita há 30+ dias", () => {
    const hoje = new Date().toISOString();
    const antigo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 60 dias

    mockHook.mockReturnValue(
      mockResult({
        data: [
          makeC({ codigo: 1, nome: "Recente", ultimaVisita: hoje }),
          makeC({ codigo: 2, nome: "Sumido", ultimaVisita: antigo }),
        ],
      }),
    );
    render(<BarbeiroClientesScreen />);
    fireEvent.press(screen.getByTestId("filter-sumidos"));
    expect(screen.queryByText("Recente")).toBeNull();
    expect(screen.getByText("Sumido")).toBeTruthy();
  });

  it("botão + abre modal de walk-in", () => {
    mockHook.mockReturnValue(mockResult({ data: [] }));
    render(<BarbeiroClientesScreen />);
    expect(screen.queryByTestId("walkin-modal")).toBeNull();
    fireEvent.press(screen.getByTestId("btn-adicionar-walkin"));
    expect(screen.getByTestId("walkin-modal")).toBeTruthy();
  });
});
