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

  it("orquestra POST cliente + POST agendamento com cliente novo", async () => {
    mockPost
      .mockResolvedValueOnce({ codigo: 123, nome: "João", email: "j@x.com" })
      .mockResolvedValueOnce({ codigo: 999, tipo: "WALK_IN" });

    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        cliente: { nome: "João", email: "j@x.com", telefone: "1199" },
        barbeiroId: 42,
        servicosIds: [1],
      });
    });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));

    // 1ª chamada: POST /barbearias/:codigo/clientes
    expect(mockPost.mock.calls[0][0]).toBe("/barbearias/7/clientes");
    expect(mockPost.mock.calls[0][1]).toEqual({
      nome: "João",
      email: "j@x.com",
      telefone: "1199",
    });

    // 2ª chamada: POST /agendamentos com clienteId retornado da 1ª
    expect(mockPost.mock.calls[1][0]).toBe("/agendamentos");
    const agdPayload = mockPost.mock.calls[1][1] as Record<string, unknown>;
    expect(agdPayload.tipo).toBe("WALK_IN");
    expect(agdPayload.clienteId).toBe(123);
    expect(agdPayload.barbeiroId).toBe(42);
    expect(agdPayload.servicosIds).toEqual([1]);
    expect(agdPayload.inicio).toEqual(expect.stringMatching(/^\d{4}-/));
  });

  it("pula criação de cliente quando clienteId já fornecido", async () => {
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
    expect(mockPost.mock.calls[0][0]).toBe("/agendamentos");
    expect(
      (mockPost.mock.calls[0][1] as Record<string, unknown>).clienteId,
    ).toBe(555);
  });

  it("rejeita se nem cliente nem clienteId forem fornecidos", async () => {
    const { result } = renderHook(() => useCriarWalkIn(), { wrapper });

    await expect(
      result.current.mutateAsync({ barbeiroId: 42, servicosIds: [1] }),
    ).rejects.toThrow(/cliente/);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("inválida cache de ['fila'] e ['agendamentos'] no sucesso", async () => {
    mockPost
      .mockResolvedValueOnce({ codigo: 1 })
      .mockResolvedValueOnce({ codigo: 999 });

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
        cliente: { nome: "A", email: "a@x.com" },
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
