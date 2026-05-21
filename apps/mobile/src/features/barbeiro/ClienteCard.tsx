/**
 * ClienteCard — row de cliente na lista de clientes do barbeiro.
 *
 * Redesign pixel-accurate do protótipo (barbeiro-clientes.jsx — ClienteCard):
 *  - Layout row: paddingVertical 12, paddingHorizontal 4, borderBottomWidth 1 #262626
 *  - Avatar 44×44 (componente Avatar do app, via ClienteAvatar)
 *  - Nome: 14px fontWeight 700 + badge "NOVO" para totalVisitas <= 1
 *  - Identificador secundário: telefone (mono) ou e-mail como fallback
 *  - Métricas: visitas, ticket médio, total gasto, última visita dd/MM/yyyy
 *  - Serviço favorito quando disponível
 *  - Sem onPress → componente estático (sem accessibilityRole="button")
 */

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import type { ClienteAPI } from "@toqe/contracts";

import { ClienteAvatar } from "./clientes/components/ClienteAvatar";

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

  const isNovo = cliente.totalVisitas <= 1;

  const content = (
    <>
      <View style={styles.topRow}>
        <ClienteAvatar nome={cliente.nome} size={44} />
        <View style={[styles.info, { marginLeft: spacing.md - 4 }]}>
          {/* Nome + badge NOVO */}
          <View style={styles.nameRow}>
            <Text
              style={[typography.bodyBold, { color: palette.text }]}
              numberOfLines={1}
            >
              {cliente.nome}
            </Text>
            {isNovo && (
              <View style={styles.novoBadge}>
                <Text style={styles.novoBadgeText}>NOVO</Text>
              </View>
            )}
          </View>
          {/* Identificador secundário: telefone ou email */}
          {cliente.telefone ? (
            <Text
              style={[
                typography.mono,
                { color: palette.textMuted, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {cliente.telefone}
            </Text>
          ) : (
            <Text
              style={[
                typography.caption,
                { color: palette.textMuted, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {cliente.email}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.metricsRow, { marginTop: spacing.sm + 2 }]}>
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
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID ?? `cliente-${cliente.codigo}`}
        onPress={() => onPress(cliente)}
        accessibilityRole="button"
        accessibilityLabel={`Cliente ${cliente.nome}, ${cliente.totalVisitas} visitas`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID ?? `cliente-${cliente.codigo}`}
      accessibilityLabel={`Cliente ${cliente.nome}, ${cliente.totalVisitas} visitas`}
      style={styles.card}
    >
      {content}
    </View>
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
  card: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
    backgroundColor: "transparent",
  },
  pressed: { opacity: 0.7 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "nowrap",
  },
  novoBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#a78bfa1a",
    borderRadius: 4,
    flexShrink: 0,
  },
  novoBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    color: "#a78bfa",
    fontWeight: "800",
    letterSpacing: 8 * 0.08,
    textTransform: "uppercase",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
});
