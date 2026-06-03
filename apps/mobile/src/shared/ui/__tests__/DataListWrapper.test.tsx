import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { palette } from "@/src/shared/theme/tokens";

import { DataListWrapper } from "../DataListWrapper";

interface Item {
  id: number;
  nome: string;
}

const baseProps = {
  keyExtractor: (item: Item) => String(item.id),
  renderItem: ({ item }: { item: Item }) => (
    <Text testID={`item-${item.id}`}>{item.nome}</Text>
  ),
};

// DataListWrapper usa usePullToRefresh → useQueryClient: precisa do provider.
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("DataListWrapper", () => {
  it("mostra ActivityIndicator quando isLoading=true", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={undefined}
        isLoading
        isError={false}
        testID="lista"
      />,
      { wrapper },
    );
    expect(screen.getByTestId("lista-loading")).toBeTruthy();
  });

  it("mostra mensagem de erro quando isError=true", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={undefined}
        isLoading={false}
        isError
        errorMessage="erro custom"
        testID="lista"
      />,
      { wrapper },
    );
    expect(screen.getByTestId("lista-error")).toBeTruthy();
    expect(screen.getByText("erro custom")).toBeTruthy();
  });

  it("renderiza itens quando há dados", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={[
          { id: 1, nome: "A" },
          { id: 2, nome: "B" },
        ]}
        isLoading={false}
        isError={false}
        testID="lista"
      />,
      { wrapper },
    );
    expect(screen.getByTestId("item-1")).toBeTruthy();
    expect(screen.getByTestId("item-2")).toBeTruthy();
  });

  it("mostra empty state customizado quando data vazio", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={[]}
        isLoading={false}
        isError={false}
        emptyMessage="vazio mesmo"
      />,
      { wrapper },
    );
    expect(screen.getByText("vazio mesmo")).toBeTruthy();
  });

  it("passa RefreshControl com onRefresh chamando refetch", async () => {
    const refetch = jest.fn();
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={[]}
        isLoading={false}
        isError={false}
        isRefetching={false}
        refetch={refetch}
        testID="lista"
      />,
      { wrapper },
    );
    const list = screen.getByTestId("lista");
    const refreshControl = list.props.refreshControl;
    expect(refreshControl).toBeTruthy();
    // Spinner âmbar padronizado (DRY) — primary do tema (light ou dark).
    const primaries = [palette.light.primary, palette.dark.primary];
    expect(primaries).toContain(refreshControl.props.tintColor);
    expect(refreshControl.props.colors).toEqual([
      refreshControl.props.tintColor,
    ]);
    // Invoca o callback diretamente — equivalente ao pull-to-refresh
    await act(async () => {
      await refreshControl.props.onRefresh();
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("propaga isRefetching para o RefreshControl", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={[]}
        isLoading={false}
        isError={false}
        isRefetching
        refetch={jest.fn()}
        testID="lista"
      />,
      { wrapper },
    );
    const list = screen.getByTestId("lista");
    expect(list.props.refreshControl.props.refreshing).toBe(true);
  });

  it("não renderiza RefreshControl quando refetch é undefined", () => {
    render(
      <DataListWrapper<Item>
        {...baseProps}
        data={[]}
        isLoading={false}
        isError={false}
        testID="lista"
      />,
      { wrapper },
    );
    expect(screen.getByTestId("lista").props.refreshControl).toBeUndefined();
  });
});
