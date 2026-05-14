import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  useFaturamento,
  useHorariosPico,
  useBarbeirosRelatorio,
} from "./use-relatorios";
import { createWrapper } from "@/test/render-helpers";

const mockFaturamento = vi.fn();
const mockHorariosPico = vi.fn();
const mockBarbeiros = vi.fn();

vi.mock("../services/relatorio.service", () => ({
  relatorioService: {
    faturamento: (...args: unknown[]) => mockFaturamento(...args),
    horariosPico: (...args: unknown[]) => mockHorariosPico(...args),
    barbeiros: (...args: unknown[]) => mockBarbeiros(...args),
  },
}));

describe("useFaturamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useFaturamento(null, "30d"), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFaturamento).not.toHaveBeenCalled();
  });

  it("busca dados quando barCodigo é fornecido", async () => {
    const data = [{ data: "2025-01-01", total: 300 }];
    mockFaturamento.mockResolvedValueOnce(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useFaturamento(1, "7d"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFaturamento).toHaveBeenCalledWith(1, "7d");
    expect(result.current.data).toEqual(data);
  });
});

describe("useHorariosPico", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHorariosPico(null, "30d"), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockHorariosPico).not.toHaveBeenCalled();
  });

  it("retorna 24 horas ao buscar dados", async () => {
    const data = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      quantidade: 0,
    }));
    mockHorariosPico.mockResolvedValueOnce(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHorariosPico(1, "30d"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(24);
  });
});

describe("useBarbeirosRelatorio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBarbeirosRelatorio(null, "30d"), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("retorna ranking de barbeiros com avaliacao", async () => {
    const data = [
      {
        nome: "João",
        faturamento: 3000,
        atendimentos: 20,
        ticketMedio: 150,
        avaliacao: 0,
      },
    ];
    mockBarbeiros.mockResolvedValueOnce(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBarbeirosRelatorio(1, "30d"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toHaveProperty("avaliacao", 0);
  });
});
