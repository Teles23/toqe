import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/shared/theme";

export interface EmptyScreenProps {
  /** Emoji ou ícone como string (ex: "📅", "🔍") */
  icon?: string;
  /**
   * Ícone Feather exibido num container com tint do accent (estilo Urban Flow).
   * Tem precedência sobre `icon` (emoji) quando ambos forem passados.
   */
  featherIcon?: keyof typeof Feather.glyphMap;
  /** Título principal */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Slot opcional para botão de ação (use AmberButton/GhostButton) */
  action?: ReactNode;
  testID?: string;
}

/**
 * Tela vazia padronizada — usada para stubs "Em breve" e empty states
 * que ocupam a tela inteira. Centralizada, com ícone grande, título e
 * descrição secundária.
 *
 * Dois estilos de ícone:
 * - `featherIcon`: ícone Feather num box 64×64 com tint do accent (redesign
 *   Urban Flow — preferir nas telas novas).
 * - `icon`: emoji/string grande (legado).
 *
 * Para empty state DENTRO de uma lista, passe este componente em
 * `DataListWrapper.emptyComponent`.
 */
export function EmptyScreen({
  icon,
  featherIcon,
  title,
  description,
  action,
  testID,
}: EmptyScreenProps) {
  const { palette, spacing, typography, radius } = useTheme();

  return (
    <View
      testID={testID ?? "empty-screen"}
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      {featherIcon ? (
        <View
          style={[
            styles.featherBox,
            {
              backgroundColor: palette.primary + "14",
              borderColor: palette.primary + "38",
              borderRadius: radius.lg,
            },
          ]}
        >
          <Feather name={featherIcon} size={28} color={palette.primary} />
        </View>
      ) : icon ? (
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
  featherBox: {
    width: 64,
    height: 64,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
});
