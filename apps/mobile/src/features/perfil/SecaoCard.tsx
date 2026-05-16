import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

interface Props {
  /** Título da seção (renderizado em uppercase pequeno) */
  title?: string;
  children: ReactNode;
}

/**
 * Wrapper de uma "seção" de configurações.
 * Renderiza título opcional acima + grupo de filhos com borda/raio do tema.
 *
 * Use com `<ListItem>` filhos para grupos de settings.
 */
export function SecaoCard({ title, children }: Props) {
  const { palette, spacing, radius, typography } = useTheme();

  return (
    <View style={{ marginTop: spacing.lg }}>
      {title ? (
        <Text
          style={{
            ...typography.caption,
            color: palette.textMuted,
            paddingHorizontal: spacing.md,
            marginBottom: 6,
            textTransform: "uppercase",
            fontSize: 11,
            letterSpacing: 0.6,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.border,
            borderRadius: radius.md,
            marginHorizontal: spacing.md,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
