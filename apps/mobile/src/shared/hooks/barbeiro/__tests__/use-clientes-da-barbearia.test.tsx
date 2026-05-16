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

import { tenantApi } from "@/src/shared/api/api-client";
import { useClientesDaBarbearia } from "../use-clientes-da-barbearia";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useClientesDaBarbearia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não dispara request sem barbearia", async () => {
    mockUseAuth.mockReturnValue({ barbearia: null });
    const { result } = renderHook(() => useClientesDaBarbearia(), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("chama /barbearias/:codigo/clientes com tenantId correto", async () => {
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
    mockGet.mockResolvedValueOnce([]);

    renderHook(() => useClientesDaBarbearia(), { wrapper });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(tenantApi).toHaveBeenCalledWith(7);
    expect(mockGet.mock.calls[0][0]).toBe("/barbearias/7/clientes");
  });

  it("queryKey inclui barbearia.codigo", async () => {
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
    mockGet.mockResolvedValue([]);

    const { result } = renderHook(() => useClientesDaBarbearia(), { wrapper });
    await waitFor(() => expect(result.current.isFetched).toBe(true));
    // mudou pra outra barbearia → nova call
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 99, nome: "Outra" },
    });
    const { result: result2 } = renderHook(() => useClientesDaBarbearia(), {
      wrapper,
    });
    await waitFor(() => expect(result2.current.isFetched).toBe(true));

    // Houve pelo menos 2 chamadas (uma por barbearia diferente)
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
