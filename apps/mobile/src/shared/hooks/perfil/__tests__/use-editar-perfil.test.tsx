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

const mockPut = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  api: {
    // Wrap em arrow function para avaliar mockPut no momento da chamada,
    // não na execução do factory (que rodaria com mockPut ainda undefined).
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useEditarPerfil } from "../use-editar-perfil";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useEditarPerfil", () => {
  beforeEach(() => jest.clearAllMocks());

  it("chama PUT /usuarios/me com o payload", async () => {
    mockPut.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEditarPerfil(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ nome: "Carlos", telefone: "1199" });
    });

    expect(mockPut).toHaveBeenCalledWith("/usuarios/me", {
      nome: "Carlos",
      telefone: "1199",
    });
  });

  it("invalida cache ['usuario-me'] no sucesso", async () => {
    mockPut.mockResolvedValueOnce({});
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidate = jest.spyOn(client, "invalidateQueries");

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useEditarPerfil(), {
      wrapper: customWrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ nome: "X" });
    });

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["usuario-me"] });
    });
  });
});
