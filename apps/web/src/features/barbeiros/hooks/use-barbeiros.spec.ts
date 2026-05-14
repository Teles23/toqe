import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBarbeiros, toBarbeiro } from "./use-barbeiros";
import { createWrapper } from "@/test/render-helpers";
import type { BarbeiroAPI } from "../types/barbeiro.types";

const mockList = vi.fn();

vi.mock("../services/barbeiro.service", () => ({
  barbeiroService: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

const apiFixture: BarbeiroAPI = {
  codigo: 1,
  nome: "Carlos Silva",
  email: "carlos@test.com",
  telefone: null,
  avatarUrl: null,
  perfil: "barbeiro",
  atendimentosHoje: 3,
  atendimentosMes: 40,
  faturamentoMes: 2000,
  ticketMedio: 50,
};

describe("toBarbeiro", () => {
  it("gera initial com primeira letra maiúscula do nome", () => {
    const result = toBarbeiro(apiFixture);
    expect(result.initial).toBe("C");
  });

  it("estado padrão é idle", () => {
    const result = toBarbeiro(apiFixture);
    expect(result.estado).toBe("idle");
  });

  it("avaliacao padrão é 0", () => {
    const result = toBarbeiro(apiFixture);
    expect(result.avaliacao).toBe(0);
  });

  it("preserva todos os campos da API", () => {
    const result = toBarbeiro(apiFixture);
    expect(result.codigo).toBe(1);
    expect(result.atendimentosHoje).toBe(3);
    expect(result.faturamentoMes).toBe(2000);
  });
});

describe("useBarbeiros", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBarbeiros(null), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockList).not.toHaveBeenCalled();
  });

  it("busca e transforma barbeiros quando barCodigo é fornecido", async () => {
    mockList.mockResolvedValueOnce([apiFixture]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBarbeiros(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockList).toHaveBeenCalledWith(1);
    expect(result.current.data[0].initial).toBe("C");
    expect(result.current.data[0].estado).toBe("idle");
  });

  it("retorna array vazio enquanto carrega", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBarbeiros(1), {
      wrapper: Wrapper,
    });
    expect(result.current.data).toEqual([]);
  });
});
