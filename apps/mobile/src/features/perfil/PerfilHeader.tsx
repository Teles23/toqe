import { StyleSheet, Text, View } from "react-native";

import { ClienteAvatar } from "@/src/features/barbeiro/clientes/components/ClienteAvatar";
import { useTheme } from "@/src/shared/theme";

interface Props {
  nome: string | null | undefined;
  /** Label do papel (ex: "Barbeiro", "Cliente", "Dono"). Default deduzido do perfil. */
  roleLabel?: string;
  /** Email mantido como prop opcional para retrocompatibilidade — não é mais
   *  renderizado aqui (email agora vive no ListItem da seção "Conta" da tela). */
  email?: string | null | undefined;
  avatarUrl?: string | null;
}

/**
 * Cabeçalho do perfil — avatar grande hash-color centralizado + nome + role.
 *
 * Princípio Urban Flow:
 * - Avatar `ClienteAvatar` size=80 (mesmo componente reusado da lista de
 *   clientes — cor de fundo derivada do nome, consistente em todo o app).
 * - Nome em `typography.title` (Sora 26pt).
 * - Role em `typography.caption` `textMuted` — "Barbeiro" / "Cliente" / "Dono".
 * - Email **não** mora mais aqui — fica como ListItem na seção "Conta" da
 *   tela, mantendo a hierarquia visual limpa.
 */
export function PerfilHeader({
  nome,
  roleLabel,
  email: _email,
  avatarUrl: _avatarUrl,
}: Props) {
  const { palette, spacing, typography } = useTheme();
  const displayName = nome ?? "—";

  return (
    <View
      style={[
        styles.container,
        { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
      ]}
    >
      {/* Avatar recebe "" quando nome ausente → mostra placeholder "·" sem
          duplicar o "—" do título abaixo (que quebraria getByText("—")). */}
      <ClienteAvatar nome={nome ?? ""} size={80} />
      <Text
        style={[
          typography.title,
          { color: palette.text, marginTop: spacing.md },
        ]}
      >
        {displayName}
      </Text>
      {roleLabel ? (
        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginTop: 2 },
          ]}
        >
          {roleLabel}
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
