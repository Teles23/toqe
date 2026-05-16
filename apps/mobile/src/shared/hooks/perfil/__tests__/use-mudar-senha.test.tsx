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

const mockPost = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  api: { post: (...args: unknown[]) => mockPost(...args) },
  ApiError: class MockApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { ApiError } from "@/src/shared/api/api-client";
import { useMudarSenha } from "../use-mudar-senha";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useMudarSenha", () => {
  beforeEach(() => jest.clearAllMocks());

  it("envia payload correto para /auth/change-password", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    const { result } = renderHook(() => useMudarSenha(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        senhaAtual: "antiga",
        novaSenha: "nova_senha",
      });
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/change-password", {
      senhaAtual: "antiga",
      novaSenha: "nova_senha",
    });
  });

  it("propaga erro 401 do backend (senha atual incorreta)", async () => {
    mockPost.mockRejectedValueOnce(new ApiError(401, "Senha atual incorreta"));
    const { result } = renderHook(() => useMudarSenha(), { wrapper });

    await expect(
      result.current.mutateAsync({ senhaAtual: "errada", novaSenha: "x" }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
