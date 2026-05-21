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

const mockPost = jest.fn();
jest.mock("@/src/shared/api/api-client", () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }
  return {
    api: { post: (...args: unknown[]) => mockPost(...args) },
    ApiError,
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { useAceitarConvite } from "../use-aceitar-convite";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAceitarConvite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("faz POST para /convite/:token/aceitar com body correto", async () => {
    mockPost.mockResolvedValue({ sucesso: true, userId: 99 });

    const { result } = renderHook(() => useAceitarConvite(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        token: "abc123",
        nome: "João Silva",
        senha: "senha123",
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/convite/abc123/aceitar",
      { nome: "João Silva", senha: "senha123" },
      { skipRefresh: true },
    );
  });

  it("retorna sucesso com userId correto", async () => {
    mockPost.mockResolvedValue({ sucesso: true, userId: 42 });

    const { result } = renderHook(() => useAceitarConvite(), { wrapper });

    let data: { sucesso: boolean; userId: number } | undefined;
    await act(async () => {
      data = await result.current.mutateAsync({ token: "token-ok" });
    });

    expect(data).toEqual({ sucesso: true, userId: 42 });
  });

  it("propaga erro 404 da API", async () => {
    const apiClientMock = jest.requireMock("@/src/shared/api/api-client") as {
      ApiError: new (status: number, msg: string) => Error & { status: number };
    };
    mockPost.mockRejectedValue(
      new apiClientMock.ApiError(404, "Convite não encontrado"),
    );

    const { result } = renderHook(() => useAceitarConvite(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ token: "token-expirado" });
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
