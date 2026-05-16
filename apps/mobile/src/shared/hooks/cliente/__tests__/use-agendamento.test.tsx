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

const mockGet = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ get: mockGet, delete: mockDelete })),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAgendamento, useCancelarAgendamento } from "../use-agendamento";

function wrapper(client?: QueryClient) {
  const c =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useAgendamento", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 7, nome: "C" } });
  });

  it("não dispara request sem barbearia", async () => {
    mockUseAuth.mockReturnValue({ barbearia: null });
    renderHook(() => useAgendamento(42), { wrapper: wrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("não dispara request quando codigo=0", async () => {
    renderHook(() => useAgendamento(0), { wrapper: wrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("dispara GET /agendamentos/:codigo com tenantId correto", async () => {
    mockGet.mockResolvedValueOnce({ codigo: 42 });
    renderHook(() => useAgendamento(42), { wrapper: wrapper() });
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(tenantApi).toHaveBeenCalledWith(7);
    expect(mockGet.mock.calls[0][0]).toBe("/agendamentos/42");
  });
});

describe("useCancelarAgendamento", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 7, nome: "C" } });
  });

  it("envia DELETE /agendamentos/:codigo", async () => {
    mockDelete.mockResolvedValueOnce({ status: "cancelado" });
    const { result } = renderHook(() => useCancelarAgendamento(), {
      wrapper: wrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(99);
    });

    expect(mockDelete).toHaveBeenCalledWith("/agendamentos/99");
  });

  it("invalida queries relacionadas no sucesso", async () => {
    mockDelete.mockResolvedValueOnce({});
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const spy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCancelarAgendamento(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    const keys = spy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(keys).toContain("agendamento");
    expect(keys).toContain("agendamentos");
    expect(keys).toContain("fila");
  });
});
