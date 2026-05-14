import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useLogout } from "./use-logout";
import { createWrapper } from "@/test/render-helpers";

const mockLogout = vi.fn();

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call useAuth().logout when mutate is called", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockLogout).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("should call queryClient.clear() in onSettled even on error", async () => {
    mockLogout.mockRejectedValueOnce(new Error("Network error"));
    const { Wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(clearSpy).toHaveBeenCalled();
  });
});
