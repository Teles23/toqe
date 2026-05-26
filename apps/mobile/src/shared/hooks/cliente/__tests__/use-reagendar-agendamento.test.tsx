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

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockPatch = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: () => ({ patch: mockPatch }),
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReagendarAgendamento } from "../use-reagendar-agendamento";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useReagendarAgendamento", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 1 } });
    mockPatch.mockReset();
  });

  it("chama PATCH /agendamentos/:codigo/reagendar com body correto", async () => {
    const inicio = "2026-06-01T10:00:00.000Z";
    mockPatch.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useReagendarAgendamento(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ codigo: 42, inicio });
    });

    expect(mockPatch).toHaveBeenCalledWith(
      "/agendamentos/42/reagendar",
      { inicio, fim: undefined },
    );
  });

  it("expõe erro quando a mutation falha", async () => {
    mockPatch.mockRejectedValue(new Error("Conflito"));
    const { result } = renderHook(() => useReagendarAgendamento(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ codigo: 1, inicio: "2026-06-01T10:00:00.000Z" });
      } catch {
        // esperado
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
