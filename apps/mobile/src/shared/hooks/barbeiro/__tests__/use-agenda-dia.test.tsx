jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: { apiUrl: "http://localhost:3000/api/v1" },
    },
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

import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAgendaDia } from "../use-agenda-dia";
import { tenantApi } from "@/src/shared/api/api-client";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAgendaDia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não dispara request quando user/barbearia ausentes", async () => {
    mockUseAuth.mockReturnValue({ user: null, barbearia: null });

    // Usa construtor (year, monthIndex, day) → meia-noite local, evita drift de fuso
    const { result } = renderHook(() => useAgendaDia(new Date(2026, 4, 15)), {
      wrapper,
    });

    // Espera ciclo do react-query — não deve chamar fetch
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("chama tenantApi com tenantId da barbearia e query string correta", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        codigo: 99,
        nome: "Bob",
        email: "b@x.com",
        telefone: null,
        avatarUrl: null,
      },
      barbearia: { codigo: 7, nome: "Toqe Centro" },
    });
    mockGet.mockResolvedValueOnce([]);

    // Construtor local — sem ambiguidade de timezone na formatação YYYY-MM-DD
    renderHook(() => useAgendaDia(new Date(2026, 4, 15)), { wrapper });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    expect(tenantApi).toHaveBeenCalledWith(7);
    const calledPath = mockGet.mock.calls[0][0] as string;
    expect(calledPath).toMatch(/^\/agendamentos\?/);
    expect(calledPath).toContain("data=2026-05-15");
    expect(calledPath).toContain("barbeiroId=99");
  });
});
