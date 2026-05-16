import { ReactElement, ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  type FlatListProps,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  /** Mensagem do estado vazio (default: "Nada por aqui ainda.") */
  emptyMessage?: string;
  /** Mensagem de erro (default genérica) */
  errorMessage?: string;
  /** Componente opcional para renderizar como empty state customizado (override) */
  emptyComponent?: ReactElement;
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
  emptyMessage = "Nada por aqui ainda.",
  errorMessage = "Não foi possível carregar. Puxe para tentar novamente.",
  emptyComponent,
  contentContainerStyle,
  testID,
  ...flatListProps
}: DataListWrapperProps<T>): ReactNode {
  const { palette, spacing, typography } = useTheme();

  const muted = {
    ...typography.body,
    fontSize: 14,
    color: palette.textMuted,
    textAlign: "center" as const,
  };

  if (isLoading) {
    return (
      <View style={styles.center} testID={`${testID ?? "data-list"}-loading`}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center} testID={`${testID ?? "data-list"}-error`}>
        <Text style={muted}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={data ?? []}
      contentContainerStyle={[
        { padding: spacing.md, paddingBottom: 40, flexGrow: 1 },
        contentContainerStyle,
      ]}
      refreshControl={
        refetch ? (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={palette.text}
          />
        ) : undefined
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
});
