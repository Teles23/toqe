import { StyleSheet, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

import { SkeletonBox } from "./SkeletonBox";

export interface ListSkeletonProps {
  /** Quantidade de linhas-fantasma. Default: 6. */
  rows?: number;
  testID?: string;
}

/**
 * Placeholder de lista enquanto a query carrega — N linhas com um box
 * circular à esquerda + duas linhas de texto. Genérico o bastante para
 * agenda e clientes (evita "flash" de tela vazia antes do dado chegar).
 */
export function ListSkeleton({ rows = 6, testID }: ListSkeletonProps) {
  const { spacing, radius } = useTheme();

  return (
    <View
      testID={testID ?? "list-skeleton"}
      style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
      accessibilityLabel="Carregando"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, { paddingVertical: spacing.md }]}>
          <SkeletonBox width={40} height={40} borderRadius={radius.full} />
          <View style={styles.lines}>
            <SkeletonBox width="55%" height={14} />
            <View style={{ height: spacing.xs }} />
            <SkeletonBox width="35%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lines: {
    flex: 1,
  },
});
