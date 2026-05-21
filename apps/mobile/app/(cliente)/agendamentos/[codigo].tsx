import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AvaliacaoSheet } from "@/src/features/cliente/AvaliacaoSheet";
import { statusToBadge } from "@/src/features/barbeiro/utils/agendamento-actions";
import {
  useAgendamento,
  useCancelarAgendamento,
} from "@/src/shared/hooks/cliente/use-agendamento";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  Avatar,
  Card,
  CountdownTimer,
  DangerButton,
  Divider,
  EmptyScreen,
  GhostButton,
  ScreenHeader,
  StatusBadge,
  TimeDisplay,
} from "@/src/shared/ui";

export default function AgendamentoDetalheScreen() {
  const { palette, spacing, radius, typography } = useTheme();
  const { codigo: codigoStr } = useLocalSearchParams<{ codigo: string }>();
  const codigo = Number(codigoStr);
  const { data, isLoading, isError, refetch } = useAgendamento(codigo);
  const cancelar = useCancelarAgendamento();
  const [avaliacaoVisible, setAvaliacaoVisible] = useState(false);

  const handleCancelar = useCallback(() => {
    Alert.alert(
      "Cancelar agendamento",
      "Tem certeza? Esta ação não pode ser desfeita.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelar.mutateAsync(codigo);
              await refetch();
              Alert.alert("Cancelado", "Agendamento cancelado com sucesso.");
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível cancelar. Tente novamente.",
              );
            }
          },
        },
      ],
    );
  }, [cancelar, codigo, refetch]);

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: palette.bg }]}
        testID="agendamento-loading"
      >
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenHeader
          title="Agendamento"
          right={
            <GhostButton
              label="Voltar"
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
            />
          }
        />
        <EmptyScreen
          icon="⚠️"
          title="Agendamento não encontrado"
          description="Verifique se o link está correto ou tente novamente."
          action={
            <GhostButton label="Tentar novamente" onPress={() => refetch()} />
          }
        />
      </View>
    );
  }

  const inicio = parseISO(data.inicio);
  const fim = parseISO(data.fim);
  const dataStr = format(inicio, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const horaInicio = format(inicio, "HH:mm", { locale: ptBR });
  const horarioStr = `${horaInicio} – ${format(fim, "HH:mm", { locale: ptBR })}`;
  const podeCancelar =
    data.status === "pendente" || data.status === "confirmado";
  const isUpcoming =
    inicio.getTime() > Date.now() &&
    (data.status === "confirmado" || data.status === "pendente");

  const totalPreco = data.itens.reduce(
    (sum, item) => sum + Number(item.preco ?? 0),
    0,
  );

  const badge = statusToBadge(data.status);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Agendamento"
        right={
          <GhostButton
            label="Voltar"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
        }
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        {/* HERO TICKET — TimeDisplay XL + StatusBadge + CountdownTimer */}
        <View
          testID="status-card"
          style={[
            styles.hero,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderStrong,
              borderRadius: radius.xl,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.heroBadgeRow}>
            <StatusBadge
              status={badge.badge}
              label={badge.label}
              size="md"
              textTestID="status-text"
            />
          </View>

          <View style={[styles.heroTimeBlock, { marginTop: spacing.md }]}>
            <TimeDisplay time={horaInicio} size="xl" color={palette.primary} />
            <Text
              style={[
                typography.caption,
                {
                  color: palette.textMuted,
                  marginTop: spacing.xs,
                  fontFamily: "JetBrainsMono_500Medium",
                },
              ]}
            >
              até {format(fim, "HH:mm", { locale: ptBR })}
            </Text>
          </View>

          <Text
            style={[
              typography.subheading,
              {
                color: palette.text,
                marginTop: spacing.md,
                textTransform: "capitalize",
                textAlign: "center",
              },
            ]}
          >
            {dataStr}
          </Text>

          {isUpcoming ? (
            <View style={{ marginTop: spacing.md }}>
              <CountdownTimer target={inicio} />
            </View>
          ) : null}
        </View>

        {data.barbeiro ? (
          <>
            <SectionLabel>Com quem</SectionLabel>
            <Card testID="barbeiro-card">
              <View style={styles.row}>
                <Avatar
                  uri={data.barbeiro.avatarUrl}
                  name={data.barbeiro.nome}
                  size="md"
                />
                <View style={[styles.info, { marginLeft: spacing.md }]}>
                  <Text
                    style={[typography.bodyBold, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {data.barbeiro.nome}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.textMuted, marginTop: 2 },
                    ]}
                  >
                    Barbeiro
                  </Text>
                </View>
              </View>
            </Card>
            <View style={{ height: spacing.sm }} />
          </>
        ) : null}

        <SectionLabel>Quando</SectionLabel>
        <Card testID="data-card">
          <Text
            style={[
              typography.bodyMedium,
              { color: palette.text, textTransform: "capitalize" },
            ]}
          >
            {dataStr}
          </Text>
          <Text
            style={[
              {
                fontFamily: "JetBrainsMono_500Medium",
                fontSize: 18,
                lineHeight: 24,
              },
              { color: palette.primary, marginTop: 2 },
            ]}
          >
            {horarioStr}
          </Text>
        </Card>

        <View style={{ height: spacing.sm }} />

        <SectionLabel>Serviços</SectionLabel>
        <Card testID="servicos-card">
          {data.itens.map((item, idx) => (
            <View key={item.codigo}>
              {idx > 0 ? <Divider /> : null}
              <View
                style={{
                  paddingVertical: spacing.sm,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[typography.body, { color: palette.text, flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.servico.nome}
                </Text>
                <Text
                  style={[typography.caption, { color: palette.textMuted }]}
                >
                  {item.duracao}min
                </Text>
              </View>
            </View>
          ))}
          {totalPreco > 0 ? (
            <>
              <Divider />
              <View
                style={{
                  paddingTop: spacing.sm,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    typography.label,
                    { color: palette.textMuted, textTransform: "uppercase" },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    {
                      fontFamily: "JetBrainsMono_500Medium",
                      fontSize: 16,
                      lineHeight: 22,
                    },
                    { color: palette.text },
                  ]}
                >
                  R$ {totalPreco.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </>
          ) : null}
        </Card>

        {data.status === "concluido" ? (
          <View style={{ marginTop: spacing.xl }}>
            <AmberButton
              label="Avaliar"
              onPress={() => setAvaliacaoVisible(true)}
              testID="botao-avaliar"
            />
          </View>
        ) : null}

        {podeCancelar ? (
          <View style={{ marginTop: spacing.xl }}>
            <DangerButton
              label="Cancelar agendamento"
              onPress={handleCancelar}
              loading={cancelar.isPending}
              testID="botao-cancelar"
            />
          </View>
        ) : null}
      </ScrollView>

      <AvaliacaoSheet
        visible={avaliacaoVisible}
        onClose={() => setAvaliacaoVisible(false)}
        agendamentoCodigo={data.codigo}
        barbeiroNome={data.barbeiro?.nome}
        servicoNome={data.itens[0]?.servico.nome}
        onSuccess={() => setAvaliacaoVisible(false)}
      />
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette, spacing } = useTheme();
  return (
    <Text
      style={[
        styles.sectionLabel,
        {
          color: palette.textMuted,
          marginBottom: 6,
          marginTop: spacing.xs,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderWidth: 1,
    alignItems: "center",
  },
  heroBadgeRow: {
    alignSelf: "center",
  },
  heroTimeBlock: {
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
