import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper, ScreenHeader } from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
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
    case "cancelado":
    case "no_show":
      return palette.textMuted;
    default:
      return palette.textMuted;
  }
}

function AgendamentoRow({ item }: { item: AgendamentoResponse }) {
  const { palette, spacing, radius, typography } = useTheme();
  const inicio = parseISO(item.inicio);
  const dataStr = format(inicio, "dd MMM yyyy", { locale: ptBR });
  const horaStr = format(inicio, "HH:mm", { locale: ptBR });
  const servico =
    item.itens.length === 1
      ? item.itens[0].servico.nome
      : `${item.itens[0]?.servico.nome ?? "Serviço"} +${item.itens.length - 1}`;
  const cor = statusColor(item.status, palette);

  return (
    <Pressable
      onPress={() => router.push(`/(cliente)/agendamentos/${item.codigo}`)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.cardBg : palette.bg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
      ]}
      accessibilityRole="button"
      testID={`agendamento-row-${item.codigo}`}
    >
      <View style={styles.dateCol}>
        <Text style={{ ...typography.bodyBold, color: palette.text }}>
          {horaStr}
        </Text>
        <Text style={{ ...typography.caption, color: palette.textMuted }}>
          {dataStr}
        </Text>
      </View>
      <View style={styles.infoCol}>
        <Text
          style={{ ...typography.body, color: palette.text }}
          numberOfLines={1}
        >
          {servico}
        </Text>
        {item.barbeiro ? (
          <Text
            style={{ ...typography.caption, color: palette.textMuted }}
            numberOfLines={1}
          >
            {item.barbeiro.nome}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.badge,
          { backgroundColor: cor, borderRadius: radius.pill },
        ]}
      >
        <Text style={styles.badgeText}>{STATUS_LABEL[item.status]}</Text>
      </View>
    </Pressable>
  );
}

export default function ClienteAgendamentosScreen() {
  const { palette } = useTheme();
  const { data, isLoading, isError, isRefetching, refetch } =
    useAgendamentosMeus();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenHeader title="Meus agendamentos" />
      <DataListWrapper
        testID="lista-meus-agendamentos"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage="Você não tem agendamentos nesta barbearia."
        errorMessage="Não foi possível carregar seus agendamentos."
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item }) => <AgendamentoRow item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateCol: { width: 52, alignItems: "center" },
  infoCol: { flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
