import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useConfiguracaoNotificacoes } from "./use-configuracao";
import { createWrapper } from "@/test/render-helpers";

const mockGetNotificacoes = vi.fn();

vi.mock("../services/configuracao.service", () => ({
  configuracaoService: {
    getBarbearia: vi.fn(),
    getHorarios: vi.fn(),
    getNotificacoes: (...args: unknown[]) => mockGetNotificacoes(...args),
    updateBarbearia: vi.fn(),
    updateHorarios: vi.fn(),
    updateNotificacoes: vi.fn(),
  },
}));

describe("useConfiguracaoNotificacoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be disabled when barCodigo is null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfiguracaoNotificacoes(null), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetNotificacoes).not.toHaveBeenCalled();
  });

  it("should fetch data when barCodigo is provided", async () => {
    const mockData = {
      novoAgendamento: true,
      cancelamento: false,
      lembreteCliente: true,
      lembreteInternos: false,
      relatorioDiario: false,
      clienteNovo: false,
      avaliacaoRecebida: true,
      pagamentoRecebido: true,
    };
    mockGetNotificacoes.mockResolvedValueOnce(mockData);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfiguracaoNotificacoes(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(mockGetNotificacoes).toHaveBeenCalledWith(1));
    expect(result.current.isLoading).toBe(false);
  });
});
