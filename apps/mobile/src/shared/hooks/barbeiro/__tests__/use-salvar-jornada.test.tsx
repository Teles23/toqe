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

const mockPut = jest.fn();
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: jest.fn(() => ({ put: mockPut })),
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

  it("faz UM PUT /agenda/jornada/:barbeiroId com todos os dias (transacional)", async () => {
    mockPut.mockResolvedValue([
      { diaSemana: 1, inicio: "09:00", fim: "18:00" },
    ]);

    const { result } = renderHook(() => useSalvarJornada(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync([
        {
          dia: 1,
          inicio: "09:00",
          fim: "18:00",
          ativo: true,
          almocoIni: "12:00",
          almocoFim: "13:00",
        },
        {
          dia: 0,
          inicio: "09:00",
          fim: "18:00",
          ativo: false,
          almocoIni: "11:30",
          almocoFim: "12:30",
        },
      ]);
    });

    await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

    // Envia os 2 dias (inclusive o inativo) num único body { dias: [...] },
    // repassando o almoço REAL coletado da UI (sem placeholder hardcoded).
    expect(mockPut).toHaveBeenCalledWith(`/agenda/jornada/${USER.codigo}`, {
      dias: [
        {
          diaSemana: 1,
          ativo: true,
          inicio: "09:00",
          fim: "18:00",
          almocoIni: "12:00",
          almocoFim: "13:00",
        },
        {
          diaSemana: 0,
          ativo: false,
          inicio: "09:00",
          fim: "18:00",
          almocoIni: "11:30",
          almocoFim: "12:30",
        },
      ],
    });
  });

  it("invalida queryKey ['jornada'] no onSuccess", async () => {
    mockPut.mockResolvedValue({ diaSemana: 2, inicio: "09:00", fim: "18:00" });

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
        {
          dia: 2,
          inicio: "09:00",
          fim: "18:00",
          ativo: true,
          almocoIni: "12:00",
          almocoFim: "13:00",
        },
      ]);
    });

    const calls = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(calls).toContain("jornada");
  });

  it("propaga erro da API no onError", async () => {
    mockPut.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useSalvarJornada(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync([
          {
            dia: 3,
            inicio: "09:00",
            fim: "18:00",
            ativo: true,
            almocoIni: "12:00",
            almocoFim: "13:00",
          },
        ]);
      }),
    ).rejects.toThrow("Server error");
  });
});
