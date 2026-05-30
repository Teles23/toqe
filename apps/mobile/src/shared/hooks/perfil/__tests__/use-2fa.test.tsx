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
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { use2faDisable, use2faEnable, use2faSetup } from "../use-2fa";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("use2fa", () => {
  beforeEach(() => jest.clearAllMocks());

  it("setup → POST /auth/2fa/setup, retorna qrCode", async () => {
    mockPost.mockResolvedValueOnce({ qrCode: "data:image/png;base64,XXX" });
    const { result } = renderHook(() => use2faSetup(), { wrapper });

    await act(async () => {
      const data = await result.current.mutateAsync();
      expect(data).toEqual({ qrCode: "data:image/png;base64,XXX" });
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/2fa/setup");
  });

  it("enable → POST /auth/2fa/enable com { code }", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    const { result } = renderHook(() => use2faEnable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("123456");
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/2fa/enable", {
      code: "123456",
    });
  });

  it("disable → POST /auth/2fa/disable com { code }", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    const { result } = renderHook(() => use2faDisable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("654321");
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/2fa/disable", {
      code: "654321",
    });
  });
});
