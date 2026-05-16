import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { Avatar } from "@/src/shared/ui";

interface Props {
  nome: string | null | undefined;
  email: string | null | undefined;
  avatarUrl?: string | null;
}

/**
 * Cabeçalho do perfil — avatar grande centralizado + nome + email.
 */
export function PerfilHeader({ nome, email, avatarUrl }: Props) {
  const { palette, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.lg }]}>
      <Avatar uri={avatarUrl} name={nome} size="xl" />
      <Text
        style={{
          ...typography.heading,
          color: palette.text,
          marginTop: spacing.md,
        }}
      >
        {nome ?? "—"}
      </Text>
      {email ? (
        <Text
          style={{
            ...typography.body,
            color: palette.textMuted,
            marginTop: 4,
          }}
        >
          {email}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
