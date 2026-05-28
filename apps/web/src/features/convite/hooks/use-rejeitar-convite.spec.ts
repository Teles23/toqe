import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createWrapper } from "@/test/render-helpers";

vi.mock("@/features/convite/services/convite.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/convite/services/convite.service")
  >("@/features/convite/services/convite.service");
  return { ...actual, requestRejeitarConvite: vi.fn() };
});

import { requestRejeitarConvite } from "@/features/convite/services/convite.service";
import { useRejeitarConvite } from "./use-rejeitar-convite";

const mockRequestRejeitar = requestRejeitarConvite as unknown as ReturnType<
  typeof vi.fn
>;

describe("useRejeitarConvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chama requestRejeitarConvite com o token", async () => {
    mockRequestRejeitar.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRejeitarConvite(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate("tok");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequestRejeitar).toHaveBeenCalledWith("tok");
  });

  it("fica com isError quando a rejeição falha", async () => {
    mockRequestRejeitar.mockRejectedValueOnce(new Error("falhou"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRejeitarConvite(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate("tok");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
