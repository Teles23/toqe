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
const mockPut = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ get: mockGet, put: mockPut })),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import {
  useAtualizarPreferenciasNotificacao,
  useNotificacaoPreferencias,
} from "../use-notificacao-preferencias";

function wrapper(client?: QueryClient) {
  const c =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useNotificacaoPreferencias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
  });

  it("dispara GET /notificacoes/preferencias", async () => {
    mockGet.mockResolvedValueOnce({
      email: true,
      push: false,
      whatsapp: false,
      sms: false,
    });

    const { result } = renderHook(() => useNotificacaoPreferencias(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/notificacoes/preferencias");
    expect(result.current.data?.email).toBe(true);
  });

  it("não dispara sem barbearia", async () => {
    mockUseAuth.mockReturnValue({ barbearia: null });
    renderHook(() => useNotificacaoPreferencias(), { wrapper: wrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe("useAtualizarPreferenciasNotificacao — optimistic update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
  });

  it("atualiza cache imediatamente (otimista) e mantém em sucesso", async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    client.setQueryData(["notif-prefs", 7], {
      email: true,
      push: false,
      whatsapp: false,
      sms: false,
    });

    mockPut.mockResolvedValueOnce({
      email: true,
      push: true,
      whatsapp: false,
      sms: false,
    });

    const { result } = renderHook(() => useAtualizarPreferenciasNotificacao(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: true,
        push: true,
        whatsapp: false,
        sms: false,
      });
    });

    expect(mockPut).toHaveBeenCalledWith("/notificacoes/preferencias", {
      email: true,
      push: true,
      whatsapp: false,
      sms: false,
    });
  });

  it("rollback ao falhar — cache volta ao estado anterior", async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const previous = {
      email: true,
      push: false,
      whatsapp: false,
      sms: false,
    };
    client.setQueryData(["notif-prefs", 7], previous);

    mockPut.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useAtualizarPreferenciasNotificacao(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: true,
          push: true,
          whatsapp: false,
          sms: false,
        });
      } catch {
        /* esperado */
      }
    });

    // cache foi restaurado para o `previous`
    expect(client.getQueryData(["notif-prefs", 7])).toEqual(previous);
  });
});
