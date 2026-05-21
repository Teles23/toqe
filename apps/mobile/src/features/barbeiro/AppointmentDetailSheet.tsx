/**
 * AppointmentDetailSheet — bottom sheet de detalhe de agendamento.
 *
 * Exibe nome do cliente, serviço, horário, preço e as ações disponíveis
 * conforme o status atual do agendamento.
 *
 * Ações por status:
 *  - pendente   → Recusar (ghost) + Aceitar (amber)
 *  - confirmado → Iniciar (amber) + Ligar (ghost) + Zap (ghost)
 *  - concluido  → Ver histórico (ghost) + Reagendar (ghost)
 *  - cancelado  → (readonly)
 *  - no_show    → Reagendar (ghost)
 */

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { AmberButton, BottomSheet, GhostButton } from "@/src/shared/ui";
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
  const { palette, spacing, typography, radius } = useTheme();

  if (!agendamento) return null;

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const timeStr = format(inicio, "HH:mm", { locale: ptBR });
  const endTimeStr = format(fim, "HH:mm", { locale: ptBR });

  const totalDuracao = agendamento.itens.reduce((sum, i) => sum + i.duracao, 0);
  const totalPreco = agendamento.itens.reduce((sum, i) => sum + i.preco, 0);

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const statusColor =
    STATUS_DOT_COLORS[agendamento.status] ?? palette.textDisabled;
  const statusLabel = getStatusLabel(agendamento.status);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.78}
      testID="detail-sheet"
    >
      <View style={styles.root}>
        {/* Header — cliente + status */}
        <View style={[styles.clientRow, { marginBottom: spacing.md }]}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: palette.primary + "20",
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={[typography.subheading, { color: palette.primary }]}>
              {agendamento.cliente.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[typography.subheading, { color: palette.text }]}
              numberOfLines={1}
            >
              {agendamento.cliente.nome}
            </Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusColor + "1a" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {statusLabel.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Conteúdo scrollável */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card de serviço */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <View style={[styles.serviceHeader, { marginBottom: spacing.sm }]}>
              <View
                style={[
                  styles.serviceIcon,
                  {
                    backgroundColor: palette.primary + "14",
                    borderColor: palette.primary + "38",
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={{ color: palette.primary, fontSize: 15 }}>✂</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.label,
                    { color: palette.text, fontWeight: "600" },
                  ]}
                  numberOfLines={1}
                >
                  {servicoNome}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: palette.textMuted,
                      marginTop: 2,
                      fontFamily: "JetBrainsMono_400Regular",
                    },
                  ]}
                >
                  {totalDuracao} minutos
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Sora_700Bold",
                  fontSize: 18,
                  color: palette.text,
                }}
              >
                R$ {totalPreco}
              </Text>
            </View>

            <View style={[styles.timeRow, { borderTopColor: palette.border }]}>
              <TimeField label="Início" value={timeStr} />
              <TimeField label="Fim" value={endTimeStr} />
            </View>
          </View>
        </ScrollView>

        {/* Ações sticky no rodapé */}
        <View
          style={[
            styles.actions,
            { borderTopColor: palette.border, paddingTop: spacing.sm },
          ]}
        >
          <Actions status={agendamento.status} onAction={onAction} />
        </View>
      </View>
    </BottomSheet>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TimeField({ label, value }: { label: string; value: string }) {
  const { palette, typography } = useTheme();
  return (
    <View style={styles.timeField}>
      <Text
        style={[
          typography.caption,
          {
            color: palette.textDisabled,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 2,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[typography.mono, { color: palette.text, fontWeight: "600" }]}
      >
        {value}
      </Text>
    </View>
  );
}

function Actions({
  status,
  onAction,
}: {
  status: string;
  onAction: (a: DetailAction) => void;
}) {
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
            onPress={() => onAction("iniciar")}
            testID="action-iniciar"
          />
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
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timeRow: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  timeField: {
    minWidth: 60,
  },
  actions: {
    borderTopWidth: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCol: {
    flexDirection: "column",
  },
});
