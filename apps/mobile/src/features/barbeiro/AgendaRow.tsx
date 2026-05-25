/**
 * AgendaRow — linha da agenda do barbeiro (redesign Urban Flow / protótipo v2).
 *
 * Substitui o estilo card do `AgendamentoCard` na tela de agenda com a nova
 * abordagem de lista densa: coluna de horário à esquerda + dot de status +
 * nome do cliente + serviço + preço.
 *
 * Toque simples → abre `AppointmentDetailSheet`.
 * `dim` → opacidade reduzida para agendamentos já concluídos / no passado.
 * `isNext` → realça visualmente o próximo agendamento do dia.
 */

import { differenceInMinutes, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { maskCurrency } from "@/src/shared/utils/masks";
import type { AgendamentoResponse } from "@toqe/shared";

// ─── Cores por status ─────────────────────────────────────────────────────────

export const STATUS_DOT_COLORS: Record<string, string> = {
  pendente: "#F4B400",
  confirmado: "#3b82f6",
  em_andamento: "#22c55e",
  concluido: "#555555",
  cancelado: "#555555",
  no_show: "#ef4444",
};

export function getStatusLabel(status: string): string {
  switch (status) {
    case "pendente":
      return "Aguardando";
    case "confirmado":
      return "Confirmado";
    case "em_andamento":
      return "Atendendo";
    case "concluido":
      return "Concluído";
    case "cancelado":
      return "Cancelado";
    case "no_show":
      return "Não compareceu";
    default:
      return status;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AgendaRowProps {
  agendamento: AgendamentoResponse;
  onPress: () => void;
  /** Realça visualmente como "próximo" agendamento do dia. */
  isNext?: boolean;
  /** Opacidade reduzida para agendamentos no passado. */
  dim?: boolean;
  testID?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

function AgendaRowImpl({
  agendamento,
  onPress,
  isNext,
  dim,
  testID,
}: AgendaRowProps) {
  const { palette, typography } = useTheme();

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const timeStr = format(inicio, "HH:mm", { locale: ptBR });

  // Duração real do agendamento (robusto: independe do campo `duracao` do item,
  // que o backend nem sempre popula — usa a janela início→fim).
  const totalDuracao = Math.max(0, differenceInMinutes(fim, inicio));
  const totalPreco = agendamento.itens.reduce(
    (sum, i) => sum + (Number(i.preco) || Number(i.servico?.precoBase) || 0),
    0,
  );

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const dotColor = STATUS_DOT_COLORS[agendamento.status] ?? "#555";

  return (
    <Pressable
      testID={testID ?? `agenda-row-${agendamento.codigo}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Agendamento de ${agendamento.cliente?.nome ?? "Encaixe"} às ${timeStr}`}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: palette.border,
          opacity: pressed ? 0.7 : dim ? 0.45 : 1,
        },
      ]}
    >
      {/* Coluna de horário */}
      <View style={styles.timeCol}>
        <Text
          style={[
            typography.mono,
            {
              color: isNext ? palette.primary : palette.textMuted,
              fontWeight: "600",
            },
          ]}
        >
          {timeStr}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.textDisabled, marginTop: 2 },
          ]}
        >
          {totalDuracao}m
        </Text>
      </View>

      {/* Dot de status */}
      <View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            // Glow sutil no próximo agendamento
            shadowColor: isNext ? dotColor : "transparent",
            shadowOpacity: isNext ? 0.5 : 0,
            shadowRadius: isNext ? 6 : 0,
            elevation: isNext ? 4 : 0,
          },
        ]}
      />

      {/* Conteúdo principal */}
      <View style={styles.content}>
        <Text
          style={[
            typography.label,
            { color: palette.text, fontWeight: "600", marginBottom: 2 },
          ]}
          numberOfLines={1}
        >
          {agendamento.cliente?.nome ?? "Encaixe"}
        </Text>

        <View style={styles.serviceRow}>
          <Text
            style={[typography.caption, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {servicoNome}
          </Text>
          {totalPreco > 0 && (
            <>
              <Text
                style={[typography.caption, { color: palette.textDisabled }]}
              >
                {" "}
                ·{" "}
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textMuted,
                    fontFamily: "JetBrainsMono_400Regular",
                  },
                ]}
              >
                {maskCurrency(totalPreco)}
              </Text>
            </>
          )}
        </View>

        {agendamento.status === "pendente" && (
          <View
            style={[
              styles.pendenteBadge,
              { backgroundColor: palette.primary + "14" },
            ]}
          >
            <Text
              style={[styles.pendenteBadgeText, { color: palette.primary }]}
            >
              AGUARDANDO ACEITE
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Text style={[styles.chevron, { color: palette.textDisabled }]}>›</Text>
    </Pressable>
  );
}

export const AgendaRow = memo(AgendaRowImpl);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  timeCol: {
    width: 48,
    flexShrink: 0,
    alignItems: "flex-end",
    paddingTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginHorizontal: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  pendenteBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendenteBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  chevron: {
    fontSize: 22,
    marginTop: 2,
    flexShrink: 0,
  },
});
