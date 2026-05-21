/**
 * AppointmentDetailSheet — bottom sheet de detalhe de agendamento.
 *
 * Redesign pixel-accurate do protótipo Claude Design (barbeiro-sheets.jsx):
 *  - Top bar: Avatar 48×48 + nome 16px bold + status badge (cor bg 1a)
 *  - Service card: bg #1c1c1c borderRadius 14 padding 14
 *    - IconBox ✂ 36×36 borderRadius 9 + nome 14px bold + duração JetBrains 12px + preço Sora 700 18px
 *    - Grid 2-col: INÍCIO + FIM (9px #888888 uppercase + valor JetBrains 12px)
 *  - History note card: bg #171717 borderRadius 14 (ícone 🕐 violet + ÚLTIMA VISITA)
 *  - Status hint banner: bg statusCor+'10' borderRadius 8
 *  - Actions por status com testIDs corretos
 *
 * Ações por status:
 *  - pendente      → Recusar (ghost) + Aceitar (amber)
 *  - confirmado    → Iniciar (amber fullWidth) + row: Ligar + Zap (ghost)
 *  - em_andamento  → No-show (danger outline) + Concluir (success)
 *  - concluido     → Ver histórico (ghost) + Reagendar (ghost)
 *  - no_show       → Reagendar (ghost)
 */

import { differenceInMinutes, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { AmberButton, Avatar, BottomSheet, GhostButton } from "@/src/shared/ui";
import type { AgendamentoResponse } from "@toqe/shared";

import { STATUS_DOT_COLORS, getStatusLabel } from "./AgendaRow";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DetailAction =
  | "aceitar"
  | "recusar"
  | "iniciar"
  | "concluir"
  | "no_show"
  | "reagendar"
  | "historico";

export interface AppointmentDetailSheetProps {
  agendamento: AgendamentoResponse | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: DetailAction) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AppointmentDetailSheet({
  agendamento,
  visible,
  onClose,
  onAction,
}: AppointmentDetailSheetProps) {
  const { palette } = useTheme();

  if (!agendamento) return null;

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const timeStr = format(inicio, "HH:mm", { locale: ptBR });
  const endTimeStr = format(fim, "HH:mm", { locale: ptBR });

  // Duração real do agendamento (início→fim) — robusto contra item.duracao ausente.
  const totalDuracao = Math.max(0, differenceInMinutes(fim, inicio));
  const totalPreco = agendamento.itens.reduce(
    (sum, i) => sum + (Number(i.preco) || Number(i.servico?.precoBase) || 0),
    0,
  );

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const statusColor =
    STATUS_DOT_COLORS[agendamento.status] ?? palette.textDisabled;
  const statusLabel = getStatusLabel(agendamento.status);

  // Status hint — "próximo passo"
  const statusNeeds: Partial<Record<string, string>> = {
    pendente: "aceitar",
    confirmado: "iniciar",
    em_andamento: "concluir",
  };
  const nextStep = statusNeeds[agendamento.status];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.78}
      testID="detail-sheet"
    >
      <View style={styles.root}>
        {/* ── Top bar: Avatar + nome + status badge ── */}
        <View style={styles.topBar}>
          <Avatar name={agendamento.cliente.nome} size="md" />
          <View style={styles.topBarText}>
            <Text style={styles.clienteName} numberOfLines={1}>
              {agendamento.cliente.nome}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "1a" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {statusLabel.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Conteúdo scrollável ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Service card */}
          <View style={styles.serviceCard}>
            {/* Ícone + nome + duração + preço */}
            <View style={styles.serviceHeader}>
              <View style={styles.serviceIconBox}>
                <Text style={styles.serviceIconText}>✂</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.serviceName, { color: palette.text }]}
                  numberOfLines={1}
                >
                  {servicoNome}
                </Text>
                <Text style={styles.serviceDuration}>
                  {totalDuracao} minutos
                </Text>
              </View>
              <Text style={[styles.servicePrice, { color: palette.text }]}>
                R$ {totalPreco}
              </Text>
            </View>

            {/* Grid início / fim */}
            <View style={[styles.timeGrid, { borderTopColor: "#262626" }]}>
              <TimeField label="INÍCIO" value={timeStr} />
              <TimeField label="FIM" value={endTimeStr} />
            </View>
          </View>

          {/* Status hint banner */}
          {nextStep && (
            <View
              style={[
                styles.hintBanner,
                {
                  backgroundColor: statusColor + "10",
                  borderColor: statusColor + "30",
                },
              ]}
            >
              <Text style={[styles.hintText, { color: statusColor }]}>
                Próximo passo:{" "}
                <Text
                  style={{ fontWeight: "700", textTransform: "capitalize" }}
                >
                  {nextStep}
                </Text>
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Ações sticky no rodapé ── */}
        <View style={[styles.actionsWrap, { borderTopColor: "#262626" }]}>
          <Actions
            status={agendamento.status}
            telefone={agendamento.cliente.telefone}
            onAction={onAction}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TimeField({ label, value }: { label: string; value: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={[styles.timeValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function Actions({
  status,
  telefone,
  onAction,
}: {
  status: string;
  telefone?: string | null;
  onAction: (a: DetailAction) => void;
}) {
  const handleLigar = () => {
    if (telefone) void Linking.openURL(`tel:${telefone}`);
  };
  const handleWhatsApp = () => {
    if (telefone) {
      const digits = telefone.replace(/\D/g, "");
      void Linking.openURL(`https://wa.me/55${digits}`);
    }
  };

  switch (status) {
    case "pendente":
      return (
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Recusar"
              onPress={() => onAction("recusar")}
              testID="action-recusar"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AmberButton
              label="Aceitar"
              icon="check"
              onPress={() => onAction("aceitar")}
              testID="action-aceitar"
            />
          </View>
        </View>
      );
    case "confirmado":
      return (
        <View style={styles.actionCol}>
          <AmberButton
            label="Iniciar atendimento"
            icon="play"
            iconRight="arrow-right"
            onPress={() => onAction("iniciar")}
            testID="action-iniciar"
          />
          <View style={[styles.actionRow, { marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <GhostButton
                label="Ligar"
                icon="phone"
                onPress={handleLigar}
                disabled={!telefone}
                testID="action-ligar"
              />
            </View>
            <View style={{ flex: 1 }}>
              <GhostButton
                label="Zap"
                icon="message-circle"
                onPress={handleWhatsApp}
                disabled={!telefone}
                testID="action-zap"
              />
            </View>
          </View>
        </View>
      );
    case "em_andamento":
      return (
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="No-show"
              onPress={() => onAction("no_show")}
              testID="action-no_show"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AmberButton
              label="Concluir"
              icon="check"
              onPress={() => onAction("concluir")}
              testID="action-concluir"
            />
          </View>
        </View>
      );
    case "concluido":
      return (
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Histórico"
              onPress={() => onAction("historico")}
              testID="action-historico"
            />
          </View>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Reagendar"
              onPress={() => onAction("reagendar")}
              testID="action-reagendar"
            />
          </View>
        </View>
      );
    case "no_show":
      return (
        <GhostButton
          label="Tentar reagendar"
          onPress={() => onAction("reagendar")}
          testID="action-reagendar-noshow"
        />
      );
    default:
      return null;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 4,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexShrink: 0,
  },
  topBarText: {
    flex: 1,
    minWidth: 0,
  },
  clienteName: {
    fontFamily: "Inter_700Bold" as never,
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  // Service card
  serviceCard: {
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
    padding: 14,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  serviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#F4B40014",
    borderWidth: 1,
    borderColor: "#F4B40038",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serviceIconText: {
    fontSize: 16,
    color: "#F4B400",
  },
  serviceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceDuration: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#888888",
  },
  servicePrice: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    flexShrink: 0,
  },
  // Time grid
  timeGrid: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  timeField: {
    minWidth: 60,
  },
  timeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#888888",
    letterSpacing: 9 * 0.12,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  timeValue: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
  },
  // History card
  historyCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#a78bfa1a",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyIconText: {
    fontSize: 15,
    color: "#a78bfa",
  },
  historyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#888888",
    letterSpacing: 9 * 0.14,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  historyValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  // Status hint
  hintBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    flex: 1,
  },
  // Actions
  actionsWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#161616",
    flexShrink: 0,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCol: {
    flexDirection: "column",
  },
});
