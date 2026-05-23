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
const mockTenantApi = jest.fn((_codigo: number) => ({ post: mockPost }));
jest.mock("@/src/shared/api/api-client", () => ({
  tenantApi: (codigo: number) => mockTenantApi(codigo),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { useCriarCliente } from "../use-criar-cliente";

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useCriarCliente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ barbearia: { codigo: 7, nome: "Centro" } });
  });

  it("faz POST em /barbearias/:codigo/clientes com o tenant da barbearia ativa", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 1, nome: "Novo" });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCriarCliente(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        nome: "Novo",
        telefone: "(11) 99999-9999",
        email: "novo@x.com",
      });
    });

    expect(mockTenantApi).toHaveBeenCalledWith(7);
    expect(mockPost).toHaveBeenCalledWith("/barbearias/7/clientes", {
      nome: "Novo",
      telefone: "(11) 99999-9999",
      email: "novo@x.com",
    });
  });

  it("aceita cadastro sem e-mail (e-mail opcional)", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 2, nome: "Sem Email" });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCriarCliente(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        nome: "Sem Email",
        telefone: "(11) 98888-7777",
      });
    });

    expect(mockPost).toHaveBeenCalledWith("/barbearias/7/clientes", {
      nome: "Sem Email",
      telefone: "(11) 98888-7777",
    });
  });

  it("invalida o cache de ['clientes'] no sucesso", async () => {
    mockPost.mockResolvedValueOnce({ codigo: 3 });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCriarCliente(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ nome: "X", telefone: "11999990000" });
    });

    const keys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0],
    );
    expect(keys).toContain("clientes");
  });
});
