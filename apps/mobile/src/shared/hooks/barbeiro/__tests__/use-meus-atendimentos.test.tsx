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

const mockGet = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: () => ({ get: mockGet }),
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMeusAtendimentos } from "../use-meus-atendimentos";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useMeusAtendimentos", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 1 } });
    mockGet.mockReset();
  });

  it("faz GET /agendamentos/meus-atendimentos com limit padrão 20", async () => {
    mockGet.mockResolvedValue([]);
    const { result } = renderHook(() => useMeusAtendimentos(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith("/agendamentos/meus-atendimentos?limit=20");
  });

  it("faz GET com limit customizado", async () => {
    mockGet.mockResolvedValue([]);
    const { result } = renderHook(() => useMeusAtendimentos(5), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith("/agendamentos/meus-atendimentos?limit=5");
  });

  it("não faz fetch quando barbearia é null", () => {
    mockUseAuth.mockReturnValue({ barbearia: null });
    renderHook(() => useMeusAtendimentos(), { wrapper });
    expect(mockGet).not.toHaveBeenCalled();
  });
});
