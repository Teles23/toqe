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

const mockPatch = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ patch: mockPatch })),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useUpdateStatus } from "../use-update-status";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useUpdateStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 7, nome: "Centro" } });
  });

  it("faz PATCH /agendamentos/:codigo/status com o status informado", async () => {
    mockPatch.mockResolvedValueOnce({ codigo: 12, status: "em_andamento" });

    const { result } = renderHook(() => useUpdateStatus(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ codigo: 12, status: "em_andamento" });
    });

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));
    expect(mockPatch.mock.calls[0][0]).toBe("/agendamentos/12/status");
    expect(mockPatch.mock.calls[0][1]).toEqual({ status: "em_andamento" });
  });

  it("invalida ['agendamentos'] E ['fila'] no sucesso (encaixe sai da fila ao atender)", async () => {
    mockPatch.mockResolvedValueOnce({ codigo: 12, status: "em_andamento" });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    function customWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useUpdateStatus(), {
      wrapper: customWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ codigo: 12, status: "em_andamento" });
    });

    const calls = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(calls).toContain("agendamentos");
    expect(calls).toContain("fila");
  });

  it("propaga erro da API no onError", async () => {
    mockPatch.mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useUpdateStatus(), { wrapper });

    await expect(
      result.current.mutateAsync({ codigo: 99, status: "cancelado" }),
    ).rejects.toThrow("Server error");
  });
});
