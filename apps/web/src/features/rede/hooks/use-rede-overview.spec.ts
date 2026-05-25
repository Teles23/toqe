import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useRedeOverview } from "./use-rede-overview";
import { createWrapper } from "@/test/render-helpers";

const mockFetch = vi.fn();

vi.mock("../services/rede.service", () => ({
  fetchRedeOverview: () => mockFetch(),
}));

describe("useRedeOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna isPending enquanto aguarda dados", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRedeOverview(), {
      wrapper: Wrapper,
    });
    expect(result.current.isPending).toBe(true);
  });

  it("retorna unidades e totais ao resolver com sucesso", async () => {
    const overview = {
      unidades: [
        {
          barCodigo: 1,
          nome: "Barber Alpha",
          faturamentoHoje: 200,
          faturamentoMes: 3000,
          agendamentosHoje: 4,
          concluidos: 2,
        },
      ],
      totais: {
        faturamentoHoje: 200,
        faturamentoMes: 3000,
        agendamentosHoje: 4,
        concluidos: 2,
      },
    };
    mockFetch.mockResolvedValue(overview);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRedeOverview(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.unidades).toHaveLength(1);
    expect(result.current.data?.unidades[0]?.nome).toBe("Barber Alpha");
    expect(result.current.data?.totais.faturamentoHoje).toBe(200);
  });

  it("retorna isError em caso de falha na API", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRedeOverview(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
