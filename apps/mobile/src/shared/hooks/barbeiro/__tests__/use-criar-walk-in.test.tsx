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
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ post: mockPost })),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useCriarWalkIn } from "../use-criar-walk-in";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCriarWalkIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 7, nome: "Centro" },
    });
  });

  it("faz UMA chamada atômica a /agendamentos/walk-in com contato novo (TQE_CONTATO)", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 999, tipo: "WALK_IN" });

    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contato: { nome: "João", telefone: "1199" },
        barbeiroId: 42,
        servicosIds: [1],
      });
    });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    expect(mockPost.mock.calls[0][0]).toBe("/agendamentos/walk-in");
    const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.barbeiroId).toBe(42);
    expect(payload.servicosIds).toEqual([1]);
    expect(payload.contato).toEqual({ nome: "João", telefone: "1199" });
    expect(payload.clienteId).toBeUndefined();
    expect(payload.contatoId).toBeUndefined();
    expect(payload.inicio).toBeUndefined();
  });

  it("envia contatoId (sem objeto contato) quando contato já existe", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 999 });

    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contatoId: 88,
        barbeiroId: 42,
        servicosIds: [1],
      });
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.contatoId).toBe(88);
    expect(payload.contato).toBeUndefined();
    expect(payload.clienteId).toBeUndefined();
  });

  it("envia clienteId (TQE_USR) quando o agendamento é para um cliente autenticável", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 999 });

    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        clienteId: 555,
        barbeiroId: 42,
        servicosIds: [1],
      });
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.clienteId).toBe(555);
    expect(payload.contato).toBeUndefined();
    expect(payload.contatoId).toBeUndefined();
  });

  it("rejeita se nenhum dos três campos for fornecido", async () => {
    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await expect(
      result.current.mutateAsync({ barbeiroId: 42, servicosIds: [1] }),
    ).rejects.toThrow(/contato.*contatoId.*clienteId/i);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("rejeita se mais de um campo for fornecido (XOR)", async () => {
    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await expect(
      result.current.mutateAsync({
        contato: { nome: "João" },
        clienteId: 1,
        barbeiroId: 42,
        servicosIds: [1],
      }),
    ).rejects.toThrow(/exatamente um/i);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("invalida cache de ['fila'] e ['agendamentos'] no sucesso", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 999 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    function customWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useCriarWalkIn(), {
      wrapper: customWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contato: { nome: "A" },
        barbeiroId: 1,
        servicosIds: [1],
      });
    });

    const calls = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(calls).toContain("fila");
    expect(calls).toContain("agendamentos");
  });
});
