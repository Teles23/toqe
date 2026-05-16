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
import { useFilaDia } from "../use-fila-dia";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useFilaDia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não dispara request quando barbearia ausente", async () => {
    mockUseAuth.mockReturnValue({ barbearia: null });

    const { result } = renderHook(() => useFilaDia(new Date(2026, 4, 15)), {
      wrapper,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("inclui tipo=WALK_IN na query string", async () => {
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
    mockGet.mockResolvedValueOnce([]);

    renderHook(() => useFilaDia(new Date(2026, 4, 15)), { wrapper });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    expect(tenantApi).toHaveBeenCalledWith(7);
    const calledPath = mockGet.mock.calls[0][0] as string;
    expect(calledPath).toMatch(/^\/agendamentos\?/);
    expect(calledPath).toContain("tipo=WALK_IN");
    expect(calledPath).toContain("data=2026-05-15");
  });

  it("opcionalmente filtra por barbeiroId", async () => {
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
    mockGet.mockResolvedValueOnce([]);

    renderHook(() => useFilaDia(new Date(2026, 4, 15), 42), { wrapper });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    const calledPath = mockGet.mock.calls[0][0] as string;
    expect(calledPath).toContain("barbeiroId=42");
  });

  it("queryKey muda quando barbeiroId muda — evita cache cross-barbeiro", async () => {
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
    mockGet.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ id }: { id?: number }) => useFilaDia(new Date(2026, 4, 15), id),
      { wrapper, initialProps: { id: undefined as number | undefined } },
    );

    await waitFor(() => expect(result.current.isFetched).toBe(true));
    rerender({ id: 99 });
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    const paths = mockGet.mock.calls.map((c) => c[0] as string);
    expect(paths[0]).not.toContain("barbeiroId=");
    expect(paths[1]).toContain("barbeiroId=99");
  });
});
