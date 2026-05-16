import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  Avatar,
  Card,
  Divider,
  EmptyScreen,
  ListItem,
  ScreenHeader,
} from "@/src/shared/ui";

/**
 * Home do cliente — cumprimento, suas barbearias vinculadas e atalhos.
 * Sem dependência de novos endpoints — usa dados do user já carregados
 * no `useAuth` (barbearias[] vem de GET /usuarios/me).
 */
export default function ClienteHomeScreen() {
  const { palette, spacing, typography } = useTheme();
  const { user, barbearias } = useAuth();

  const semBarbearias = barbearias.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title={`Olá, ${user?.nome?.split(" ")[0] ?? "cliente"}`} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        {semBarbearias ? (
          <EmptyScreen
            icon="✂️"
            title="Bem-vindo ao Toqe"
            description="Você ainda não tem barbearias vinculadas. Em breve poderá buscar barbearias por perto."
          />
        ) : (
          <>
            <Text
              style={{
                ...typography.caption,
                color: palette.textMuted,
                marginBottom: spacing.sm,
                textTransform: "uppercase",
                fontSize: 11,
                letterSpacing: 0.6,
                fontWeight: "600",
              }}
            >
              Suas barbearias
            </Text>
            {barbearias.map((b, idx) => (
              <View key={b.codigo}>
                <Card testID={`barbearia-card-${b.codigo}`}>
                  <View style={styles.row}>
                    <Avatar name={b.nome} size="md" />
                    <View style={[styles.info, { marginLeft: spacing.md - 4 }]}>
                      <Text
                        style={{
                          ...typography.bodyBold,
                          color: palette.text,
                        }}
                        numberOfLines={1}
                      >
                        {b.nome}
                      </Text>
                      <Text
                        style={{
                          ...typography.caption,
                          color: palette.textMuted,
                          marginTop: 2,
                        }}
                      >
                        Perfil: {b.perfil}
                      </Text>
                    </View>
                  </View>
                </Card>
                {idx < barbearias.length - 1 ? (
                  <View style={{ height: 8 }} />
                ) : null}
              </View>
            ))}

            <View
              style={[
                styles.atalhos,
                {
                  marginTop: spacing.lg,
                  backgroundColor: palette.cardBg,
                  borderColor: palette.border,
                  borderRadius: 10,
                  borderWidth: 1,
                  overflow: "hidden",
                },
              ]}
            >
              <ListItem
                label="Meus agendamentos"
                subtitle="Em breve"
                trailing={{ kind: "arrow" }}
                testID="atalho-agendamentos"
              />
              <Divider indent={16} />
              <ListItem
                label="Buscar barbearias"
                subtitle="Em breve"
                trailing={{ kind: "arrow" }}
                testID="atalho-buscar"
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  atalhos: {},
});
