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
  onChangeStatus?: (
    codigo: number,
    status: Exclude<StatusAgendamento, "pendente">,
  ) => void;
  testID?: string;
}

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "No-show",
};

// Cores semânticas — mapeamento centralizado de status → token de cor do tema.
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
    case "cancelado":
    case "no_show":
      return palette.textMuted;
    default:
      return palette.textMuted;
  }
}

const ACTIONS: {
  label: string;
  status: Exclude<StatusAgendamento, "pendente">;
}[] = [
  { label: "Confirmar", status: "confirmado" },
  { label: "Marcar concluído", status: "concluido" },
  { label: "Marcar no-show", status: "no_show" },
  { label: "Cancelar", status: "cancelado" },
];

function AgendamentoCardImpl({ agendamento, onChangeStatus, testID }: Props) {
  const { palette, radius, typography } = useTheme();
  const badgeColor = statusColor(agendamento.status, palette);

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const horarioStr = `${format(inicio, "HH:mm", { locale: ptBR })} – ${format(fim, "HH:mm", { locale: ptBR })}`;

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
      testID={testID ?? `agendamento-${agendamento.codigo}`}
      onLongPress={handleLongPress}
      delayLongPress={350}
      accessibilityLabel={`Agendamento de ${agendamento.cliente.nome} às ${horarioStr}`}
      accessibilityHint="Pressione e segure para mudar o status"
    >
      <View style={styles.row}>
        <Text style={{ ...typography.bodyBold, color: palette.text }}>
          {horarioStr}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor, borderRadius: radius.pill },
          ]}
        >
          <Text style={styles.badgeText} testID="status-badge">
            {STATUS_LABEL[agendamento.status]}
          </Text>
        </View>
      </View>
      <Text
        style={{
          ...typography.label,
          fontSize: 15,
          color: palette.text,
          marginTop: 2,
        }}
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
        {servicoNome}
      </Text>
    </Card>
  );
}

/**
 * `React.memo` evita re-render quando props não mudam — relevante na FlatList
 * de agenda onde o usuário pode atualizar status de um card e os outros
 * permanecem idênticos.
 */
export const AgendamentoCard = memo(AgendamentoCardImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 24,
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
