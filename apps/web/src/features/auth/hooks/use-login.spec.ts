import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useLogin } from "./use-login";
import { createWrapper } from "@/test/render-helpers";

const mockLogin = vi.fn();

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call useAuth().login with email and senha", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ email: "user@test.com", senha: "password123" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
  });

  it("should set isError when login fails", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ email: "user@test.com", senha: "wrong" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
