import { Feather } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvaliacaoSheet } from "@/src/features/cliente/AvaliacaoSheet";
import {
  useAgendamento,
  useCancelarAgendamento,
} from "@/src/shared/hooks/cliente/use-agendamento";
import { useTheme } from "@/src/shared/theme";
import { CircleIconButton } from "@/src/shared/ui";
import type { StatusAgendamento } from "@toqe/shared";

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusColor(status: StatusAgendamento): string {
  switch (status) {
    case "pendente":
      return "#F4B400";
    case "confirmado":
      return "#22c55e";
    case "em_andamento":
      return "#22c55e";
    case "concluido":
      return "#666666";
    case "cancelado":
      return "#888888";
    case "no_show":
      return "#ef4444";
    default:
      return "#888888";
  }
}

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  em_andamento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Você não foi",
};

// ─── Detail micro cell ────────────────────────────────────────────────────────

function DetailMicro({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.detailMicro}>
      <View style={styles.detailMicroLabel}>
        <Feather name={icon} size={11} color={palette.textDisabled} />
        <Text style={styles.detailMicroLabelText}>{label.toUpperCase()}</Text>
      </View>
      <Text
        style={[styles.detailMicroValue, { color: valueColor ?? palette.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AgendamentoDetalheScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
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
        style={[styles.centeredFlex, { backgroundColor: palette.bg }]}
        testID="agendamento-loading"
      >
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.centeredFlex, { backgroundColor: palette.bg }]}>
        <Text style={[styles.notFoundTitle, { color: palette.text }]}>
          Agendamento não encontrado
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.notFoundBack}
        >
          <Feather name="arrow-left" size={16} color={palette.primary} />
          <Text style={{ color: palette.primary, fontSize: 14 }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const inicio = parseISO(data.inicio);
  const fim = parseISO(data.fim);
  const dataStr = format(inicio, "EEE, dd MMM", { locale: ptBR });
  const horaInicio = format(inicio, "HH:mm", { locale: ptBR });
  const horaFim = format(fim, "HH:mm", { locale: ptBR });
  const podeCancelar =
    data.status === "pendente" || data.status === "confirmado";

  const totalPreco = data.itens.reduce(
    (sum, item) => sum + Number(item.preco ?? 0),
    0,
  );

  const servicoNome =
    data.itens.length === 0
      ? "Serviço"
      : data.itens.length === 1
        ? data.itens[0]!.servico.nome
        : `${data.itens[0]!.servico.nome} +${data.itens.length - 1}`;

  const duracaoTotal = data.itens.reduce(
    (sum, item) => sum + (item.duracaoMin ?? 0),
    0,
  );

  const statusCor = statusColor(data.status as StatusAgendamento);
  const statusLabel =
    STATUS_LABEL[data.status as StatusAgendamento] ?? data.status;
  const initial = data.barbeiro
    ? data.barbeiro.nome.charAt(0).toUpperCase()
    : "?";

  // ── Render actions by status
  function renderActions() {
    switch (data?.status) {
      case "confirmado":
        return (
          <View style={styles.actionsCol}>
            <Pressable
              accessibilityRole="button"
              style={[styles.btnAmber, { backgroundColor: palette.primary }]}
            >
              <Feather name="map-pin" size={16} color={palette.primaryOn} />
              <Text style={[styles.btnAmberText, { color: palette.primaryOn }]}>
                Como chegar
              </Text>
            </Pressable>
            <View style={styles.actionsRow}>
              <Pressable accessibilityRole="button" style={styles.btnGhost}>
                <Feather name="calendar" size={14} color={palette.textMuted} />
                <Text
                  style={[styles.btnGhostText, { color: palette.textMuted }]}
                >
                  Calendário
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.btnGhost}
                onPress={() =>
                  router.push(
                    `/(cliente)/agendamentos/${codigo}/reagendar` as never,
                  )
                }
              >
                <Feather name="repeat" size={14} color={palette.textMuted} />
                <Text
                  style={[styles.btnGhostText, { color: palette.textMuted }]}
                >
                  Reagendar
                </Text>
              </Pressable>
              <Pressable
                testID="botao-cancelar"
                accessibilityRole="button"
                onPress={handleCancelar}
                style={styles.btnGhost}
              >
                <Feather name="x" size={14} color={palette.danger} />
                <Text style={[styles.btnGhostText, { color: palette.danger }]}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </View>
        );
      case "pendente":
        return (
          <View style={styles.actionsCol}>
            <Pressable
              accessibilityRole="button"
              style={[
                styles.btnOutline,
                {
                  borderColor: palette.primary,
                  backgroundColor: "#F4B40014",
                },
              ]}
            >
              <Text style={[styles.btnOutlineText, { color: palette.primary }]}>
                Lembrar barbeiro
              </Text>
            </Pressable>
            <Pressable
              testID="botao-cancelar"
              accessibilityRole="button"
              onPress={handleCancelar}
              style={[
                styles.btnOutline,
                { borderColor: palette.danger + "66" },
              ]}
            >
              <Text style={[styles.btnOutlineText, { color: palette.danger }]}>
                Desistir
              </Text>
            </Pressable>
          </View>
        );
      case "concluido":
        return (
          <View style={styles.actionsCol}>
            <Pressable
              accessibilityRole="button"
              style={[styles.btnGhostFull, { borderColor: "#262626" }]}
            >
              <Feather name="refresh-cw" size={15} color="#aaaaaa" />
              <Text style={[styles.btnGhostText, { color: "#aaaaaa" }]}>
                Repetir esse corte
              </Text>
            </Pressable>
            <Pressable
              testID="botao-avaliar"
              accessibilityRole="button"
              onPress={() => setAvaliacaoVisible(true)}
              style={styles.btnAvaliar}
            >
              <Feather name="star" size={15} color={palette.primary} />
              <Text style={[styles.btnAvaliarText, { color: palette.primary }]}>
                Avaliar atendimento
              </Text>
            </Pressable>
          </View>
        );
      case "no_show":
        return (
          <View style={styles.actionsCol}>
            <View style={styles.noShowBanner}>
              <Text style={styles.noShowBannerText}>
                Você não compareceu. Não se preocupe — pode reagendar quando
                quiser.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              style={[styles.btnAmber, { backgroundColor: palette.primary }]}
              onPress={() =>
                router.push(
                  `/(cliente)/agendamentos/${codigo}/reagendar` as never,
                )
              }
            >
              <Text style={styles.btnAmberText}>Reagendar</Text>
            </Pressable>
          </View>
        );
      case "cancelado":
        return (
          <Pressable
            accessibilityRole="button"
            style={[styles.btnGhostFull, { borderColor: "#262626" }]}
          >
            <Text style={[styles.btnGhostText, { color: "#aaaaaa" }]}>
              Agendar de novo
            </Text>
          </Pressable>
        );
      default:
        return null;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <CircleIconButton
            icon="chevron-left"
            iconSize={20}
            size={40}
            iconColor={palette.textMuted}
            background="#1c1c1c"
            borderColor="#262626"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
          <Text style={styles.topBarTitle}>Detalhes</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Status badge ── */}
        <View style={styles.statusRow}>
          <View
            testID="status-card"
            style={[styles.statusBadge, { backgroundColor: statusCor + "1a" }]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusCor }]} />
            <Text
              testID="status-text"
              style={[styles.statusBadgeText, { color: statusCor }]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* ── Hero date/time ── */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroDate, { color: palette.text }]}>
            {dataStr}
          </Text>
          <Text style={[styles.heroHora, { color: palette.primary }]}>
            {horaInicio}
          </Text>
        </View>

        {/* ── Service card ── */}
        <View testID="barbeiro-card" style={styles.serviceCard}>
          {/* Barbeiro row */}
          <View style={styles.serviceCardTop}>
            <View
              style={[
                styles.serviceIcon,
                { backgroundColor: palette.primary + "14" },
              ]}
            >
              <Feather name="scissors" size={18} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceName, { color: palette.text }]}>
                {servicoNome}
              </Text>
              <Text style={styles.barbeiroName}>
                {data.barbeiro?.nome ?? "Barbeiro"}
              </Text>
            </View>
            {data.barbeiro && (
              <View
                style={[
                  styles.barbeiroAvatar,
                  { backgroundColor: palette.primary },
                ]}
              >
                <Text
                  style={[
                    styles.barbeiroAvatarLetter,
                    { color: palette.primaryOn },
                  ]}
                >
                  {initial}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Micro grid */}
          <View style={styles.microGrid}>
            <DetailMicro
              icon="clock"
              label="Duração"
              value={`${duracaoTotal}min`}
            />
            <DetailMicro
              icon="credit-card"
              label="Total"
              value={
                totalPreco > 0
                  ? `R$ ${totalPreco.toFixed(2).replace(".", ",")}`
                  : "—"
              }
              valueColor={palette.primary}
            />
          </View>
        </View>

        {/* ── Location card (future) ── */}
        {podeCancelar ? (
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Feather name="map-pin" size={18} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationTitle, { color: palette.text }]}>
                Barbearia
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                Rua da Barbearia
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Hora de saída ── */}
        <View style={styles.horarioRow}>
          <Text style={styles.horarioLabel}>Término previsto:</Text>
          <Text style={[styles.horarioValue, { color: palette.primary }]}>
            {horaFim}
          </Text>
        </View>
      </ScrollView>

      {/* ── Sticky actions ── */}
      <View style={[styles.actionsArea, { borderTopColor: "#262626" }]}>
        {renderActions()}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
  },
  notFoundBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontSize: 11,
    color: "#666666",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  // ── Status badge
  statusRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  // ── Hero
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  heroDate: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  heroHora: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginTop: 2,
  },
  // ── Service card
  serviceCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  serviceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  barbeiroName: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  barbeiroAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  barbeiroAvatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#262626",
    marginBottom: 14,
  },
  microGrid: {
    flexDirection: "row",
    gap: 14,
  },
  detailMicro: {
    flex: 1,
    minWidth: 0,
  },
  detailMicroLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  detailMicroLabelText: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#888888",
    fontFamily: "Inter_600SemiBold",
  },
  detailMicroValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Location card
  locationCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#3b82f61a",
    borderWidth: 1,
    borderColor: "#3b82f640",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  locationAddress: {
    fontSize: 11,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  // ── Horário row
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  horarioLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
  },
  horarioValue: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
  },
  // ── Actions
  actionsArea: {
    borderTopWidth: 1,
    padding: 14,
    paddingBottom: 18,
  },
  actionsCol: {
    gap: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  btnAmber: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnAmberText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
  },
  btnGhost: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
  },
  btnGhostFull: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnGhostText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  btnOutline: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
  },
  btnAvaliar: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F4B40038",
    backgroundColor: "#F4B40014",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnAvaliarText: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
  },
  noShowBanner: {
    padding: 10,
    backgroundColor: "#ef444410",
    borderWidth: 1,
    borderColor: "#ef444430",
    borderRadius: 10,
  },
  noShowBannerText: {
    fontSize: 11,
    color: "#fca5a5",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
