import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useDashboardOverview } from "./use-dashboard-overview";
import { createWrapper } from "@/test/render-helpers";

const mockFetch = vi.fn();

vi.mock("../services/dashboard.service", () => ({
  fetchDashboardOverview: (...args: unknown[]) => mockFetch(...args),
}));

describe("useDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fica inativo quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(null), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("retorna isLoading enquanto aguarda dados", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(1), {
      wrapper: Wrapper,
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("retorna dados ao resolver com sucesso", async () => {
    const overview = {
      kpis: [],
      liveMetrics: {
        barbeirosAtivos: 0,
        proximoHorario: null,
        aguardando: 0,
        tempoMedio: 0,
      },
      barbeiros: [],
      faturamento: { semana: [], mes: [] },
      servicos: [],
      atividade: [],
    };
    mockFetch.mockResolvedValueOnce(overview);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(overview);
    expect(mockFetch).toHaveBeenCalledWith(1);
  });

  it("retorna isError quando o service rejeita", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
