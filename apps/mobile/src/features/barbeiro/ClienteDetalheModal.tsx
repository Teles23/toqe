import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useHistoricoCliente } from "@/src/shared/hooks/barbeiro/use-historico-cliente";
import { useTheme } from "@/src/shared/theme";
import { Avatar, DataListWrapper } from "@/src/shared/ui";
import type { ClienteAPI } from "@toqe/contracts";
import type { AgendamentoResponse } from "@toqe/shared";

interface Props {
  cliente: ClienteAPI | null;
  visible: boolean;
  onClose: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ClienteDetalheModal({ cliente, visible, onClose }: Props) {
  const { palette, spacing, typography } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } =
    useHistoricoCliente(cliente?.codigo ?? 0, visible && !!cliente);

  if (!cliente) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text style={{ ...typography.heading, color: palette.text }}>
            Cliente
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={12}
          >
            <Text
              style={{
                ...typography.body,
                color: palette.primary,
                fontWeight: "600",
              }}
            >
              Fechar
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <View style={styles.headerCliente}>
            <Avatar uri={cliente.avatarUrl} name={cliente.nome} size="xl" />
            <Text
              style={{
                ...typography.heading,
                color: palette.text,
                marginTop: spacing.md,
              }}
            >
              {cliente.nome}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: palette.textMuted,
                marginTop: 4,
              }}
            >
              {cliente.email}
            </Text>
            {cliente.telefone ? (
              <Text style={{ ...typography.body, color: palette.textMuted }}>
                {cliente.telefone}
              </Text>
            ) : null}
          </View>

          <View style={[styles.metricsBlock, { marginTop: spacing.lg }]}>
            <MetricBig
              label="Total de visitas"
              value={String(cliente.totalVisitas)}
            />
            <MetricBig
              label="Ticket médio"
              value={formatCurrency(cliente.ticketMedio)}
            />
            <MetricBig
              label="Total gasto"
              value={formatCurrency(cliente.totalGasto)}
            />
          </View>

          <Text
            style={{
              ...typography.label,
              color: palette.textMuted,
              marginTop: spacing.xl,
              marginBottom: spacing.sm,
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Histórico de atendimentos
          </Text>
        </ScrollView>

        <View style={{ flex: 1 }}>
          <DataListWrapper<AgendamentoResponse>
            testID="historico-cliente"
            data={data}
            isLoading={isLoading}
            isError={isError}
            isRefetching={isRefetching}
            refetch={refetch}
            emptyMessage="Sem atendimentos concluídos."
            keyExtractor={(item) => String(item.codigo)}
            renderItem={({ item }) => <HistoricoItem item={item} />}
          />
        </View>
      </View>
    </Modal>
  );
}

function MetricBig({ label, value }: { label: string; value: string }) {
  const { palette, typography } = useTheme();
  return (
    <View style={styles.metricBig}>
      <Text
        style={{
          ...typography.caption,
          color: palette.textMuted,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ ...typography.heading, color: palette.text, marginTop: 4 }}
      >
        {value}
      </Text>
    </View>
  );
}

function HistoricoItem({ item }: { item: AgendamentoResponse }) {
  const { palette, spacing, typography } = useTheme();
  const data = format(parseISO(item.inicio), "dd/MM/yyyy HH:mm", {
    locale: ptBR,
  });
  const servico = item.itens[0]?.servico.nome ?? "Atendimento";
  const extras = item.itens.length > 1 ? ` +${item.itens.length - 1}` : "";

  return (
    <View
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text
        style={{ ...typography.bodyBold, color: palette.text }}
        numberOfLines={1}
      >
        {servico}
        {extras}
      </Text>
      <Text
        style={{
          ...typography.caption,
          color: palette.textMuted,
          marginTop: 2,
        }}
      >
        {data} · {item.barbeiro?.nome ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCliente: { alignItems: "center" },
  metricsBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metricBig: { flex: 1, alignItems: "center" },
});
