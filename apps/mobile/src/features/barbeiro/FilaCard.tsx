import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo, useCallback } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/src/shared/theme";
import { Card } from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

interface Props {
  agendamento: AgendamentoResponse;
  posicao: number; // 1, 2, 3...
  onChangeStatus?: (
    codigo: number,
    status: Exclude<StatusAgendamento, "pendente">,
  ) => void;
  testID?: string;
}

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Aguardando",
  confirmado: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "No-show",
};

function statusColor(
  status: StatusAgendamento,
  palette: ReturnType<typeof useTheme>["palette"],
): string {
  switch (status) {
    case "pendente":
      return palette.warning;
    case "confirmado":
      return palette.primary;
    case "concluido":
      return palette.success;
    default:
      return palette.textMuted;
  }
}

// Ações disponíveis no long-press, em ordem de probabilidade de uso
const ACTIONS: {
  label: string;
  status: Exclude<StatusAgendamento, "pendente">;
}[] = [
  { label: "Chamar agora", status: "confirmado" },
  { label: "Marcar concluído", status: "concluido" },
  { label: "Marcar no-show", status: "no_show" },
  { label: "Cancelar", status: "cancelado" },
];

function FilaCardImpl({ agendamento, posicao, onChangeStatus, testID }: Props) {
  const { palette, radius, typography } = useTheme();
  const badgeColor = statusColor(agendamento.status, palette);

  const chegadaStr = format(parseISO(agendamento.criadoEm), "HH:mm", {
    locale: ptBR,
  });

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const handleLongPress = useCallback(() => {
    if (!onChangeStatus) return;
    const labels = ACTIONS.map((a) => a.label);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: agendamento.cliente.nome,
          options: [...labels, "Fechar"],
          cancelButtonIndex: labels.length,
        },
        (idx) => {
          if (idx < labels.length) {
            onChangeStatus(agendamento.codigo, ACTIONS[idx].status);
          }
        },
      );
    } else {
      Alert.alert(
        agendamento.cliente.nome,
        "Atualizar status:",
        [
          ...ACTIONS.map((a) => ({
            text: a.label,
            onPress: () => onChangeStatus(agendamento.codigo, a.status),
          })),
          { text: "Fechar", style: "cancel" as const },
        ],
        { cancelable: true },
      );
    }
  }, [agendamento.codigo, agendamento.cliente.nome, onChangeStatus]);

  return (
    <Card
      testID={testID ?? `fila-${agendamento.codigo}`}
      onLongPress={handleLongPress}
      delayLongPress={350}
      accessibilityLabel={`${posicao}º na fila: ${agendamento.cliente.nome}, chegou às ${chegadaStr}`}
      accessibilityHint="Pressione e segure para mudar o status"
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <View
            style={[
              styles.posicaoBadge,
              { backgroundColor: palette.primary, borderRadius: radius.pill },
            ]}
          >
            <Text style={styles.posicaoText} testID="posicao">
              {`${posicao}º`}
            </Text>
          </View>
          <View style={styles.info}>
            <Text
              style={{ ...typography.bodyBold, color: palette.text }}
              numberOfLines={1}
            >
              {agendamento.cliente.nome}
            </Text>
            <Text
              style={{
                ...typography.caption,
                fontSize: 13,
                color: palette.textMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {servicoNome} · chegou {chegadaStr}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badgeColor, borderRadius: radius.pill },
          ]}
        >
          <Text style={styles.statusText} testID="status-badge">
            {STATUS_LABEL[agendamento.status]}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export const FilaCard = memo(FilaCardImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  info: { flex: 1 },
  posicaoBadge: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  posicaoText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 24,
    justifyContent: "center",
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
