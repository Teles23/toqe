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

const mockGet = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ get: mockGet })),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useHistoricoCliente } from "../use-historico-cliente";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const mockAgendamento = (codigo: number, clienteId: number) => ({
  codigo,
  inicio: "2026-05-10T13:00:00.000Z",
  fim: "2026-05-10T13:30:00.000Z",
  status: "concluido" as const,
  barbeiro: { usrCodigo: 99, nome: "B", avatarUrl: null },
  cliente: { usrCodigo: clienteId, nome: "C", telefone: null },
  itens: [
    {
      codigo: 1,
      servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
      preco: 40,
      duracao: 30,
    },
  ],
  criadoEm: "2026-05-09T20:00:00.000Z",
});

describe("useHistoricoCliente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
  });

  it("não dispara request quando enabled=false", async () => {
    renderHook(() => useHistoricoCliente(42, false), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("dispara request com status=concluido e clienteId no path", async () => {
    mockGet.mockResolvedValueOnce([]);
    renderHook(() => useHistoricoCliente(42, true), { wrapper });
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    const url: string = mockGet.mock.calls[0][0] as string;
    expect(url).toContain("status=concluido");
    expect(url).toContain("clienteId=42");
  });

  it("retorna o que a API entrega sem filtro client-side", async () => {
    const dados = [mockAgendamento(1, 42), mockAgendamento(3, 42)];
    mockGet.mockResolvedValueOnce(dados);
    const { result } = renderHook(() => useHistoricoCliente(42, true), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((a) => a.codigo)).toEqual([1, 3]);
  });

  it("não dispara quando clienteId=0", async () => {
    renderHook(() => useHistoricoCliente(0, true), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
  });
});
