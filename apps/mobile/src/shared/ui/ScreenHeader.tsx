import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface ScreenHeaderProps {
  /** Título principal exibido no topo */
  title: string;
  /** Slot opcional à direita do título (ex: botão de ação) */
  right?: ReactNode;
  /** Slot opcional abaixo do título (ex: navegador de dia, busca, filtros) */
  subheader?: ReactNode;
  testID?: string;
}

/**
 * Header padrão de tela — substitui o padrão repetido em agenda/fila.
 * paddingTop: spacing.xxl + spacing.sm (cobre status bar + respiro)
 * paddingBottom: spacing.md
 * Border inferior 1px na cor do tema.
 */
export function ScreenHeader({
  title,
  right,
  subheader,
  testID,
}: ScreenHeaderProps) {
  const { palette, spacing, typography } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.lg - 4,
          paddingTop: spacing.xxl + spacing.sm,
          paddingBottom: spacing.md,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Text
          style={{
            ...typography.heading,
            fontSize: 24,
            color: palette.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {subheader ? (
        <View style={{ marginTop: spacing.md }}>{subheader}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  right: {
    marginLeft: 12,
  },
});
