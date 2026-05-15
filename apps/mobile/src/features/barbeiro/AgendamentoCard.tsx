import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

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

const STATUS_COLOR_LIGHT: Record<StatusAgendamento, string> = {
  pendente: "#f59f00",
  confirmado: "#1a73e8",
  concluido: "#2f9e44",
  cancelado: "#868e96",
  no_show: "#868e96",
};

const STATUS_COLOR_DARK: Record<StatusAgendamento, string> = {
  pendente: "#ffd43b",
  confirmado: "#4da3ff",
  concluido: "#51cf66",
  cancelado: "#adb5bd",
  no_show: "#adb5bd",
};

const ACTIONS: {
  label: string;
  status: Exclude<StatusAgendamento, "pendente">;
}[] = [
  { label: "Confirmar", status: "confirmado" },
  { label: "Marcar concluído", status: "concluido" },
  { label: "Marcar no-show", status: "no_show" },
  { label: "Cancelar", status: "cancelado" },
];

export function AgendamentoCard({
  agendamento,
  onChangeStatus,
  testID,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? darkColors : lightColors;
  const statusColor = (isDark ? STATUS_COLOR_DARK : STATUS_COLOR_LIGHT)[
    agendamento.status
  ];

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const horarioStr = `${format(inicio, "HH:mm", { locale: ptBR })} – ${format(fim, "HH:mm", { locale: ptBR })}`;

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const handleLongPress = () => {
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
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Agendamento de ${agendamento.cliente.nome} às ${horarioStr}`}
      accessibilityHint="Pressione e segure para mudar o status"
      testID={testID ?? `agendamento-${agendamento.codigo}`}
    >
      <View style={styles.row}>
        <Text style={[styles.horario, { color: colors.text }]}>
          {horarioStr}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText} testID="status-badge">
            {STATUS_LABEL[agendamento.status]}
          </Text>
        </View>
      </View>
      <Text style={[styles.cliente, { color: colors.text }]} numberOfLines={1}>
        {agendamento.cliente.nome}
      </Text>
      <Text
        style={[styles.servico, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {servicoNome}
      </Text>
    </Pressable>
  );
}

const lightColors = {
  cardBg: "#fff",
  border: "#e9ecef",
  text: "#111",
  textMuted: "#666",
};

const darkColors = {
  cardBg: "#1e1e1e",
  border: "#333",
  text: "#f5f5f5",
  textMuted: "#999",
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    minHeight: 80,
  },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  horario: { fontSize: 16, fontWeight: "600" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    minHeight: 24,
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cliente: { fontSize: 15, fontWeight: "500", marginTop: 2 },
  servico: { fontSize: 13, marginTop: 2 },
});
