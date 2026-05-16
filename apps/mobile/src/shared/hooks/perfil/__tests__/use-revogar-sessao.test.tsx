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

const mockDelete = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  api: { delete: (...args: unknown[]) => mockDelete(...args) },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import {
  useRevogarSessao,
  useRevogarTodasSessoes,
} from "../use-revogar-sessao";

function wrapper(client: QueryClient) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

describe("useRevogarSessao", () => {
  beforeEach(() => jest.clearAllMocks());

  it("DELETE /auth/sessions/:codigo", async () => {
    mockDelete.mockResolvedValueOnce({ message: "ok" });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidate = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRevogarSessao(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(42);
    });

    expect(mockDelete).toHaveBeenCalledWith("/auth/sessions/42");
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["sessoes"] });
    });
  });
});

describe("useRevogarTodasSessoes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("DELETE /auth/sessions (sem id)", async () => {
    mockDelete.mockResolvedValueOnce({ message: "ok" });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useRevogarTodasSessoes(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockDelete).toHaveBeenCalledWith("/auth/sessions");
  });
});
