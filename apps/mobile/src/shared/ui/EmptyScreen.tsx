import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface EmptyScreenProps {
  /** Emoji ou ícone como string (ex: "📅", "🔍") */
  icon?: string;
  /** Título principal */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Slot opcional para botão de ação (use <Button>) */
  action?: ReactNode;
  testID?: string;
}

/**
 * Tela vazia padronizada — usada para stubs "Em breve" e empty states
 * que ocupam a tela inteira. Centralizada, com ícone grande, título e
 * descrição secundária.
 *
 * Para empty state DENTRO de uma lista, use `DataListWrapper` com
 * `emptyMessage` (mais leve, fica no contexto da lista).
 */
export function EmptyScreen({
  icon,
  title,
  description,
  action,
  testID,
}: EmptyScreenProps) {
  const { palette, spacing, typography } = useTheme();

  return (
    <View
      testID={testID ?? "empty-screen"}
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      {icon ? (
        <Text style={[styles.icon, { color: palette.textMuted }]}>{icon}</Text>
      ) : null}
      <Text
        style={{
          ...typography.heading,
          color: palette.text,
          marginTop: spacing.md,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            ...typography.body,
            color: palette.textMuted,
            marginTop: spacing.sm,
            textAlign: "center",
            paddingHorizontal: spacing.lg,
            maxWidth: 320,
          }}
        >
          {description}
        </Text>
      ) : null}
      {action ? (
        <View
          style={{
            marginTop: spacing.lg,
            width: "100%",
            paddingHorizontal: spacing.lg,
          }}
        >
          {action}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    fontSize: 64,
    textAlign: "center",
  },
});
