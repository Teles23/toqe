import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { palette } from "@/src/shared/theme/tokens";

import { usePullToRefresh } from "../use-pull-to-refresh";

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("usePullToRefresh", () => {
  it("expõe o spinner âmbar padronizado (DRY entre todas as abas)", () => {
    const client = new QueryClient();
    const { result } = renderHook(() => usePullToRefresh(), {
      wrapper: makeWrapper(client),
    });
    // primary do tema (light ou dark) — sempre âmbar, nunca preto/cinza
    const primaries = [palette.light.primary, palette.dark.primary];
    expect(primaries).toContain(result.current.tintColor);
    expect(result.current.colors).toEqual([result.current.tintColor]);
  });

  it("refreshing reflete o isRefetching da query principal", () => {
    const client = new QueryClient();
    const { result } = renderHook(() => usePullToRefresh(undefined, true), {
      wrapper: makeWrapper(client),
    });
    expect(result.current.refreshing).toBe(true);
  });

  it("onRefresh chama o refetch da tela E invalida TODAS as queries (refresh global)", async () => {
    const client = new QueryClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const refetch = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => usePullToRefresh(refetch, false), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    // Sem filtro de queryKey → invalida tudo (abas inativas recarregam lazy).
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith();
  });

  it("funciona sem refetch (telas que só dependem do refresh global)", async () => {
    const client = new QueryClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => usePullToRefresh(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
