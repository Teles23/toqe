import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useConfiguracaoPlano, useCheckout } from "./use-configuracao-plano";
import { createWrapper } from "@/test/render-helpers";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/shared/api/api-client", () => ({
  barbeariaApi: vi.fn(() => ({
    get: (...args: unknown[]) => mockGet(...args),
  })),
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe("useConfiguracaoPlano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fica idle quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfiguracaoPlano(null), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("busca dados quando barCodigo é fornecido", async () => {
    const mockData = {
      plano: "pro",
      planoStatus: "ativo",
      planoValidoAte: "2026-07-01T00:00:00.000Z",
      trialFim: null,
    };
    mockGet.mockResolvedValueOnce(mockData);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfiguracaoPlano(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plano).toBe("pro");
    expect(result.current.data?.planoStatus).toBe("ativo");
  });

  it("seleciona apenas os campos necessários (plano, planoStatus, planoValidoAte, trialFim)", async () => {
    const mockData = {
      plano: "basic",
      planoStatus: "trial",
      planoValidoAte: null,
      trialFim: "2026-06-01T00:00:00.000Z",
      // Campo extra que não deve aparecer no resultado
      outrosCampos: "qualquer",
    };
    mockGet.mockResolvedValueOnce(mockData);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConfiguracaoPlano(2), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      plano: "basic",
      planoStatus: "trial",
      planoValidoAte: null,
      trialFim: "2026-06-01T00:00:00.000Z",
    });
  });
});

describe("useCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fica idle quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCheckout(null), {
      wrapper: Wrapper,
    });
    expect(result.current.isPending).toBe(false);
  });

  it("chama POST /asaas/checkout/:barCodigo com o plano selecionado", async () => {
    mockPost.mockResolvedValueOnce({ url: "https://pay.asaas.com/abc" });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCheckout(1), {
      wrapper: Wrapper,
    });

    await act(async () => {
      const res = await result.current.mutateAsync("pro");
      expect(res).toEqual({ url: "https://pay.asaas.com/abc" });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/asaas/checkout/1",
      { plano: "pro" },
      expect.objectContaining({ tenantId: 1 }),
    );
  });
});
