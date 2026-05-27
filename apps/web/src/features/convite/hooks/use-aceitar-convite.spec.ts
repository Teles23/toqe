import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createWrapper } from "@/test/render-helpers";
import { ConviteServiceError } from "@/features/convite/services/convite.service";

vi.mock("@/features/convite/services/convite.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/convite/services/convite.service")
  >("@/features/convite/services/convite.service");
  return { ...actual, requestAceitarConvite: vi.fn() };
});

const mockEstablishSession = vi.fn().mockResolvedValue(undefined);
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ establishSession: mockEstablishSession }),
}));

import { requestAceitarConvite } from "@/features/convite/services/convite.service";
import { useAceitarConvite } from "./use-aceitar-convite";

const mockRequestAceitar = requestAceitarConvite as unknown as ReturnType<
  typeof vi.fn
>;

const aceiteResult = {
  user: { codigo: 7, nome: "Carlos Lima", email: "novo@barbeiro.com" },
  isNew: true,
  barbeariaNome: "Studio Navalha",
};

describe("useAceitarConvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstablishSession.mockResolvedValue(undefined);
  });

  it("aceita o convite e estabelece a sessão (auto-login)", async () => {
    mockRequestAceitar.mockResolvedValueOnce(aceiteResult);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAceitarConvite(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({
        token: "tok",
        nome: "Carlos Lima",
        senha: "senha12345",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequestAceitar).toHaveBeenCalledWith("tok", {
      nome: "Carlos Lima",
      senha: "senha12345",
    });
    expect(mockEstablishSession).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(aceiteResult);
  });

  it("não estabelece a sessão quando o aceite falha", async () => {
    mockRequestAceitar.mockRejectedValueOnce(
      new ConviteServiceError("Convite já utilizado.", 409),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAceitarConvite(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({ token: "tok", senha: "senha12345" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ConviteServiceError);
    expect((result.current.error as ConviteServiceError).status).toBe(409);
    expect(mockEstablishSession).not.toHaveBeenCalled();
  });
});
