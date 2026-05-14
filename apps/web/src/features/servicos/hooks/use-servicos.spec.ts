import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useServicos } from "./use-servicos";
import { createWrapper } from "@/test/render-helpers";

const mockList = vi.fn();

vi.mock("../services/servico.service", () => ({
  servicoService: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

describe("useServicos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be disabled when barCodigo is null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicos(null), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockList).not.toHaveBeenCalled();
  });

  it("should fetch data when barCodigo is provided", async () => {
    const mockData = [
      { codigo: 1, nome: "Corte", precoBase: 25, duracaoBase: 30, ativo: true },
    ];
    mockList.mockResolvedValueOnce(mockData);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicos(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockList).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(mockData);
  });
});
