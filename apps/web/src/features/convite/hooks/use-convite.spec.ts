import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "@/test/render-helpers";
import { ConviteServiceError } from "@/features/convite/services/convite.service";

vi.mock("@/features/convite/services/convite.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/convite/services/convite.service")
  >("@/features/convite/services/convite.service");
  return { ...actual, fetchConvite: vi.fn() };
});

import { fetchConvite } from "@/features/convite/services/convite.service";
import { useConvite } from "./use-convite";

const mockFetchConvite = fetchConvite as unknown as ReturnType<typeof vi.fn>;

const conviteData = {
  token: "tok",
  barbeariaNome: "Studio Navalha",
  barbeariaSlug: "studio-navalha",
  email: "novo@barbeiro.com",
  perfil: "barbeiro",
  expiresAt: new Date().toISOString(),
  isNew: true,
};

describe("useConvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não dispara a query quando o token é undefined", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConvite(undefined), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetchConvite).not.toHaveBeenCalled();
  });

  it("retorna os dados do convite em caso de sucesso", async () => {
    mockFetchConvite.mockResolvedValueOnce(conviteData);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConvite("tok"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(conviteData);
    expect(mockFetchConvite).toHaveBeenCalledWith("tok");
  });

  it("retorna null (sem erro) quando o convite expira/404", async () => {
    mockFetchConvite.mockRejectedValueOnce(
      new ConviteServiceError("expirado", 404),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConvite("tok"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("retorna null (sem erro) quando o convite retorna 401", async () => {
    mockFetchConvite.mockRejectedValueOnce(
      new ConviteServiceError("invalido", 401),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConvite("tok"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("propaga isError em falhas inesperadas (ex: 500)", async () => {
    mockFetchConvite.mockRejectedValueOnce(
      new ConviteServiceError("boom", 500),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConvite("tok"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
