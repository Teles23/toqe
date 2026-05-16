import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { Avatar, Card } from "@/src/shared/ui";
import type { ClienteAPI } from "@toqe/contracts";

interface Props {
  cliente: ClienteAPI;
  onPress?: (cliente: ClienteAPI) => void;
  testID?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatUltimaVisita(iso: string | null): string {
  if (!iso) return "Sem visitas";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

function ClienteCardImpl({ cliente, onPress, testID }: Props) {
  const { palette, spacing, typography } = useTheme();

  return (
    <Card
      testID={testID ?? `cliente-${cliente.codigo}`}
      onPress={onPress ? () => onPress(cliente) : undefined}
      accessibilityLabel={`Cliente ${cliente.nome}, ${cliente.totalVisitas} visitas`}
    >
      <View style={styles.row}>
        <Avatar uri={cliente.avatarUrl} name={cliente.nome} size="md" />
        <View style={[styles.info, { marginLeft: spacing.md - 4 }]}>
          <Text
            style={{ ...typography.bodyBold, color: palette.text }}
            numberOfLines={1}
          >
            {cliente.nome}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: palette.textMuted,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {cliente.email}
          </Text>
        </View>
      </View>

      <View style={[styles.metrics, { marginTop: spacing.sm + 2 }]}>
        <Metric label="Visitas" value={String(cliente.totalVisitas)} />
        <Metric
          label="Ticket médio"
          value={formatCurrency(cliente.ticketMedio)}
        />
        <Metric
          label="Total gasto"
          value={formatCurrency(cliente.totalGasto)}
        />
        <Metric
          label="Última visita"
          value={formatUltimaVisita(cliente.ultimaVisita)}
        />
      </View>

      {cliente.servicoFav ? (
        <Text
          style={{
            ...typography.caption,
            color: palette.textMuted,
            marginTop: spacing.sm,
          }}
          numberOfLines={1}
        >
          Favorito: {cliente.servicoFav}
        </Text>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { palette, typography } = useTheme();
  return (
    <View style={styles.metric}>
      <Text
        style={{
          ...typography.caption,
          color: palette.textMuted,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typography.bodyBold,
          fontSize: 13,
          color: palette.text,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export const ClienteCard = memo(ClienteCardImpl);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metric: { flex: 1, minWidth: 0 },
});
