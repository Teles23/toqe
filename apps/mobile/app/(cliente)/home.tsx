import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useProximoAgendamento } from "@/src/shared/hooks/cliente/use-proximo-agendamento";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  Avatar,
  Card,
  Divider,
  EmptyScreen,
  ListItem,
  ScreenHeader,
} from "@/src/shared/ui";
import { getCurrentGreeting } from "@/src/shared/utils/greeting";

/**
 * Home do cliente — saudação contextual, suas barbearias vinculadas e atalhos.
 *
 * Princípio Barber's Flow aplicado: greeting dinâmico ("Boa tarde ⛅") como
 * primeira informação, seções tipograficamente fortes, cards dark.
 *
 * **TODO (refino futuro):** quando existir endpoint `GET /agendamentos/proximo`,
 * substituir a saudação no topo por um **card hero** com `TimeDisplay` XL +
 * `CountdownTimer` + `StatusBadge` quando houver agendamento próximo (estado A
 * do prompt da Fase 35); voltar ao layout atual quando não houver (estado B).
 */
export default function ClienteHomeScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const { user, barbearias } = useAuth();
  const { data: proximo } = useProximoAgendamento();

  const firstName = user?.nome?.split(" ")[0] ?? "cliente";
  const greeting = getCurrentGreeting();
  const semBarbearias = barbearias.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title={`Olá, ${firstName}`} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        {/* Greeting contextual em destaque — antecipa o card hero futuro */}
        <View
          style={[
            styles.greeting,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.heading, { color: palette.text }]}>
            {greeting.text} {greeting.icon}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginTop: spacing.xs },
            ]}
          >
            {semBarbearias
              ? "Vamos te conectar à sua próxima barbearia."
              : "Que tal agendar seu próximo corte?"}
          </Text>
        </View>

        {semBarbearias ? (
          <EmptyScreen
            icon="✂️"
            title="Bem-vindo ao Toqe"
            description="Você ainda não tem barbearias vinculadas. Em breve poderá buscar barbearias por perto."
          />
        ) : (
          <>
            {proximo ? (
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
                  Próximo agendamento
                </Text>
                <Card testID="proximo-agendamento-card">
                  <Text
                    style={{ ...typography.bodyBold, color: palette.text }}
                    numberOfLines={1}
                  >
                    {proximo.itens[0]?.servico.nome ?? "Serviço"}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: palette.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {format(
                      parseISO(proximo.inicio),
                      "EEEE, dd 'de' MMMM 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </Text>
                  {proximo.barbeiro ? (
                    <Text
                      style={{
                        ...typography.caption,
                        color: palette.textMuted,
                        marginTop: 2,
                      }}
                    >
                      Com {proximo.barbeiro.nome}
                    </Text>
                  ) : null}
                </Card>
                <View style={{ height: spacing.lg }} />
              </>
            ) : null}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: palette.textMuted,
                  marginBottom: spacing.sm,
                },
              ]}
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
                        style={[typography.bodyBold, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {b.nome}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: palette.textMuted, marginTop: 2 },
                        ]}
                      >
                        Perfil: {b.perfil}
                      </Text>
                    </View>
                  </View>
                </Card>
                {idx < barbearias.length - 1 ? (
                  <View style={{ height: spacing.sm }} />
                ) : null}
              </View>
            ))}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: palette.textMuted,
                  marginTop: spacing.lg,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              Atalhos
            </Text>
            <View
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
                borderRadius: radius.md,
                borderWidth: 1,
                overflow: "hidden",
              }}
            >
              <ListItem
                label="Meus agendamentos"
                subtitle="Veja seus horários marcados"
                trailing={{ kind: "arrow" }}
                onPress={() => router.push("/(cliente)/agendamentos")}
                testID="atalho-agendamentos"
              />
              <Divider indent={16} />
              <ListItem
                label="Buscar barbearias"
                subtitle="Encontre profissionais perto de você"
                trailing={{ kind: "arrow" }}
                onPress={() => router.push("/(cliente)/buscar")}
                testID="atalho-buscar"
              />
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <AmberButton
                label="Agendar novo horário"
                onPress={() => {
                  // navegação futura — placeholder até existir /(cliente)/agendar
                }}
                accessibilityLabel="Agendar novo horário"
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
  greeting: { borderWidth: 1 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
