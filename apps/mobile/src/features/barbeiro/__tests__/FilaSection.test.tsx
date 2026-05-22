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

jest.mock("@/src/shared/hooks/barbeiro/use-fila-dia", () => ({
  useFilaDia: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-update-status", () => ({
  useUpdateStatus: jest.fn(),
}));

// FilaCard tem timers internos (recalc de espera) — stub leve, testado à parte.
jest.mock("@/src/features/barbeiro/FilaCard", () => {
  const RN = jest.requireActual("react-native");
  return {
    FilaCard: ({ testID }: { testID?: string }) => (
      <RN.View testID={testID ?? "fila-card"} />
    ),
  };
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import type { AgendamentoResponse } from "@toqe/shared";

import { FilaSection } from "../FilaSection";

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

describe("FilaSection", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    mockUseFilaDia.mockReset();
    mutate.mockReset();
    mockUseUpdateStatus.mockReset();
    mockUseUpdateStatus.mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useUpdateStatus>);
  });

  it("não renderiza nada quando a fila está vazia", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ data: [] }));
    render(<FilaSection />);
    expect(screen.queryByTestId("fila-section")).toBeNull();
  });

  it("não renderiza nada quando data é undefined", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ data: undefined }));
    render(<FilaSection />);
    expect(screen.queryByTestId("fila-section")).toBeNull();
  });

  it("colapsado por padrão: mostra prévia do primeiro e esconde a lista", () => {
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
        ],
      }),
    );
    render(<FilaSection />);

    expect(screen.getByTestId("fila-section")).toBeTruthy();
    // Lista detalhada não renderizada enquanto colapsado (não empurra a agenda).
    expect(screen.queryByTestId("fila-expanded")).toBeNull();
    expect(screen.queryByTestId("walkin-card-2")).toBeNull();
    // Prévia do primeiro da fila visível.
    expect(screen.getByText(/João/)).toBeTruthy();
  });

  it("expande ao tocar no banner e revela todos os walk-in cards", () => {
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
        ],
      }),
    );
    render(<FilaSection />);

    fireEvent.press(screen.getByTestId("fila-banner-toggle"));

    expect(screen.getByTestId("fila-expanded")).toBeTruthy();
    expect(screen.getByTestId("walkin-card-1")).toBeTruthy();
    expect(screen.getByTestId("walkin-card-2")).toBeTruthy();
    expect(screen.getByText("Maria")).toBeTruthy();

    // Recolhe novamente.
    fireEvent.press(screen.getByTestId("fila-banner-toggle"));
    expect(screen.queryByTestId("fila-expanded")).toBeNull();
  });

  it("o cabeçalho mostra a contagem de pendentes", () => {
    mockUseFilaDia.mockReturnValue(
      mockQ({
        data: [
          makeAg({ codigo: 1, status: "pendente" }),
          makeAg({ codigo: 2, status: "confirmado" }),
        ],
      }),
    );
    render(<FilaSection />);
    expect(screen.getByText(/FILA · esperando \(1\)/)).toBeTruthy();
  });

  it("atalho Atender (colapsado) chama updateStatus com 'em_andamento'", () => {
    mockUseFilaDia.mockReturnValue(mockQ({ data: [makeAg({ codigo: 7 })] }));
    render(<FilaSection />);
    fireEvent.press(screen.getByTestId("btn-atender-7"));
    expect(mutate).toHaveBeenCalledWith(
      { codigo: 7, status: "em_andamento" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
