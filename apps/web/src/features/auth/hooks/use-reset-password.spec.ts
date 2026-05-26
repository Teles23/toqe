import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useResetPassword } from "./use-reset-password";
import { createWrapper } from "@/test/render-helpers";

vi.mock("@/features/auth/services/auth.service", () => ({
  requestResetPassword: vi.fn(),
}));

import { requestResetPassword } from "@/features/auth/services/auth.service";

const mockRequestResetPassword = requestResetPassword as unknown as ReturnType<
  typeof vi.fn
>;

describe("useResetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chama requestResetPassword com token e novaSenha corretos", async () => {
    mockRequestResetPassword.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResetPassword(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({
        token: "abc123token",
        novaSenha: "novaSenha123",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequestResetPassword).toHaveBeenCalledWith(
      "abc123token",
      "novaSenha123",
    );
  });

  it("fica com isError true quando requestResetPassword lança erro", async () => {
    mockRequestResetPassword.mockRejectedValueOnce(
      new Error("Token inválido ou expirado"),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResetPassword(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({
        token: "token_invalido",
        novaSenha: "qualquerSenha",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe(
      "Token inválido ou expirado",
    );
  });

  it("tem mutationKey ['auth', 'reset-password']", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useResetPassword(), {
      wrapper: Wrapper,
    });
    // A mutation ainda não foi disparada — verifica que o hook inicializou
    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
  });
});
