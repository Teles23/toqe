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
jest.mock("@/src/shared/api/api-client", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useSessoes } from "../use-sessoes";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSessoes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dispara GET /auth/sessions automaticamente", async () => {
    mockGet.mockResolvedValueOnce([
      { codigo: 1, criadoEm: "2026-05-10", expiraEm: "2026-06-10" },
    ]);

    const { result } = renderHook(() => useSessoes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/auth/sessions");
    expect(result.current.data).toHaveLength(1);
  });
});
