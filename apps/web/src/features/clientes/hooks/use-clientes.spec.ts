import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useClientes, toCliente } from "./use-clientes";
import { createWrapper } from "@/test/render-helpers";
import type { ClienteAPI } from "../types/cliente.types";

const mockList = vi.fn();

vi.mock("../services/cliente.service", () => ({
  clienteService: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

function makeCliente(overrides: Partial<ClienteAPI> = {}): ClienteAPI {
  return {
    codigo: 1,
    nome: "Ana Lima",
    email: "ana@test.com",
    telefone: null,
    avatarUrl: null,
    perfil: "cliente",
    totalVisitas: 5,
    totalGasto: 250,
    ticketMedio: 50,
    ultimaVisita: new Date().toISOString(),
    servicoFav: "Escova",
    ...overrides,
  };
}

describe("toCliente", () => {
  it("status é 'novo' quando não tem visitas", () => {
    const result = toCliente(makeCliente({ totalVisitas: 0 }));
    expect(result.status).toBe("novo");
  });

  it("status é 'ativo' para cliente com visita recente (< 30 dias)", () => {
    const ontem = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const result = toCliente(
      makeCliente({ totalVisitas: 3, ultimaVisita: ontem }),
    );
    expect(result.status).toBe("ativo");
  });

  it("status é 'inativo' para cliente com última visita > 30 dias", () => {
    const antigo = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
    const result = toCliente(
      makeCliente({ totalVisitas: 3, ultimaVisita: antigo }),
    );
    expect(result.status).toBe("inativo");
  });

  it("status é 'inativo' quando ultimaVisita é null mas há visitas", () => {
    const result = toCliente(
      makeCliente({ totalVisitas: 2, ultimaVisita: null }),
    );
    expect(result.status).toBe("inativo");
  });

  it("gera initial com primeira letra maiúscula do nome", () => {
    const result = toCliente(makeCliente({ nome: "ana lima" }));
    expect(result.initial).toBe("A");
  });

  it("preserva campos da API", () => {
    const result = toCliente(makeCliente());
    expect(result.totalVisitas).toBe(5);
    expect(result.servicoFav).toBe("Escova");
  });
});

describe("useClientes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClientes(null), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockList).not.toHaveBeenCalled();
  });

  it("busca e transforma clientes quando barCodigo é fornecido", async () => {
    const ontem = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    mockList.mockResolvedValueOnce([
      makeCliente({ totalVisitas: 1, ultimaVisita: ontem }),
    ]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClientes(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockList).toHaveBeenCalledWith(1);
    expect(result.current.data[0]?.status).toBe("ativo");
    expect(result.current.data[0]?.initial).toBe("A");
  });

  it("retorna array vazio enquanto carrega", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClientes(1), {
      wrapper: Wrapper,
    });
    expect(result.current.data).toEqual([]);
  });
});
