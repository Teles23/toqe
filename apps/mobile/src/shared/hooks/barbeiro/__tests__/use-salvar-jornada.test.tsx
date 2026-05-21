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

import { useSalvarJornada } from "../use-salvar-jornada";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const BARBEARIA = { codigo: 5, nome: "Barbearia Teste" };
const USER = { codigo: 42, nome: "João Barbeiro" };

describe("useSalvarJornada", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ barbearia: BARBEARIA, user: USER });
  });

  it("chama POST /agenda/jornada/:barbeiroId com os dados corretos para dias ativos", async () => {
    mockPost.mockResolvedValue({ diaSemana: 1, inicio: "09:00", fim: "18:00" });

    const { result } = renderHook(() => useSalvarJornada(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync([
        { dia: 1, inicio: "09:00", fim: "18:00", ativo: true },
        { dia: 0, inicio: "09:00", fim: "18:00", ativo: false },
      ]);
    });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    expect(mockPost).toHaveBeenCalledWith(`/agenda/jornada/${USER.codigo}`, {
      diaSemana: 1,
      inicio: "09:00",
      fim: "18:00",
      almocoIni: "12:00",
      almocoFim: "13:00",
    });
  });

  it("invalida queryKey ['jornada'] no onSuccess", async () => {
    mockPost.mockResolvedValue({ diaSemana: 2, inicio: "09:00", fim: "18:00" });

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

    const { result } = renderHook(() => useSalvarJornada(), {
      wrapper: customWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync([
        { dia: 2, inicio: "09:00", fim: "18:00", ativo: true },
      ]);
    });

    const calls = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(calls).toContain("jornada");
  });

  it("propaga erro da API no onError", async () => {
    mockPost.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useSalvarJornada(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync([
          { dia: 3, inicio: "09:00", fim: "18:00", ativo: true },
        ]);
      }),
    ).rejects.toThrow("Server error");
  });
});
