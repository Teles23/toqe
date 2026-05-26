import { createElement, isValidElement, ReactElement, ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  type FlatListProps,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePullToRefresh } from "@/src/shared/hooks/use-pull-to-refresh";
import { useTheme } from "@/src/shared/theme";

export interface DataListWrapperProps<T> extends Omit<
  FlatListProps<T>,
  "refreshControl" | "ListEmptyComponent" | "data"
> {
  /** Dados da lista (undefined enquanto carrega) */
  data: readonly T[] | undefined;
  /** True enquanto a query está em loading inicial (sem dados) */
  isLoading: boolean;
  /** True quando há erro */
  isError: boolean;
  /** True durante refetch (mostra spinner no pull-to-refresh) */
  isRefetching?: boolean;
  /** Função chamada no pull-to-refresh */
  refetch?: () => void;
  /** Desloca o spinner de refresh para baixo (px) — telas cujo header rola
   * junto com a lista (ex.: agenda) passam `insets.top` p/ alinhar o spinner
   * abaixo da status bar, como nas telas de header fixo. */
  refreshProgressViewOffset?: number;
  /** Mensagem do estado vazio (default: "Nada por aqui ainda.") */
  emptyMessage?: string;
  /** Mensagem de erro (default genérica) */
  errorMessage?: string;
  /** Componente opcional para renderizar como empty state customizado (override) */
  emptyComponent?: ReactElement;
  /** Componente opcional de loading (ex.: skeletons). Default: ActivityIndicator */
  loadingComponent?: ReactElement;
}

/**
 * Envoltório padronizado de FlatList:
 *   - isLoading → ActivityIndicator centralizado
 *   - isError   → mensagem de erro centralizada
 *   - empty     → mensagem de vazio
 *   - refetch   → RefreshControl integrado ao tema
 *
 * Substitui o padrão repetido em agenda.tsx e fila.tsx (~113 linhas duplicadas).
 */
export function DataListWrapper<T>({
  data,
  isLoading,
  isError,
  isRefetching = false,
  refetch,
  refreshProgressViewOffset,
  emptyMessage = "Nada por aqui ainda.",
  errorMessage = "Não foi possível carregar. Puxe para tentar novamente.",
  emptyComponent,
  loadingComponent,
  contentContainerStyle,
  ListHeaderComponent,
  testID,
  ...flatListProps
}: DataListWrapperProps<T>): ReactNode {
  const { palette, spacing, typography } = useTheme();
  // Pull-to-refresh padronizado (âmbar) + refresh global de todas as abas.
  const refreshProps = usePullToRefresh(
    refetch,
    isRefetching,
    refreshProgressViewOffset,
  );

  const muted = {
    ...typography.body,
    fontSize: 14,
    color: palette.textMuted,
    textAlign: "center" as const,
  };

  // Cabeçalho fixo (ex.: header + stats + fila da agenda). Renderizado também
  // nos estados de loading/erro para que a navegação do topo nunca suma.
  const headerNode: ReactNode = isValidElement(ListHeaderComponent)
    ? ListHeaderComponent
    : ListHeaderComponent
      ? createElement(ListHeaderComponent)
      : null;

  if (isLoading) {
    const loadingTestID = `${testID ?? "data-list"}-loading`;
    return (
      <View style={styles.fill}>
        {headerNode}
        <View
          style={loadingComponent ? styles.fill : styles.center}
          testID={loadingTestID}
        >
          {loadingComponent ?? <ActivityIndicator color={palette.text} />}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.fill}>
        {headerNode}
        <View style={styles.center} testID={`${testID ?? "data-list"}-error`}>
          <Text style={muted}>{errorMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={data ?? []}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={[
        { padding: spacing.md, paddingBottom: 40, flexGrow: 1 },
        contentContainerStyle,
      ]}
      refreshControl={
        refetch ? <RefreshControl {...refreshProps} /> : undefined
      }
      ListEmptyComponent={
        emptyComponent ?? (
          <View style={styles.center}>
            <Text style={muted}>{emptyMessage}</Text>
          </View>
        )
      }
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fill: {
    flex: 1,
  },
});
