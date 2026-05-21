import { format, isFuture, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useTheme } from "@/src/shared/theme";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

// ─── Status colors ────────────────────────────────────────────────────────────

function statusColor(
  status: StatusAgendamento,
  palette: ReturnType<typeof useTheme>["palette"],
): string {
  switch (status) {
    case "pendente":
      return "#f4b400";
    case "confirmado":
      return "#22c55e";
    case "concluido":
      return palette.textDisabled;
    case "cancelado":
      return palette.textMuted;
    case "no_show":
      return "#ef4444";
    default:
      return palette.textMuted;
  }
}

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "No-show",
};

// ─── DateTile ─────────────────────────────────────────────────────────────────

function DateTile({ inicio }: { inicio: string }) {
  const { palette, typography, radius } = useTheme();
  const date = parseISO(inicio);
  const dia = format(date, "EEE", { locale: ptBR });
  const num = format(date, "d");
  const mes = format(date, "MMM", { locale: ptBR });

  return (
    <View
      style={[
        dateTileStyles.tile,
        {
          width: 56,
          backgroundColor: palette.surface,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: palette.border,
          paddingVertical: 6,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        },
      ]}
    >
      <Text
        style={[
          typography.captionBold,
          { color: palette.textMuted, textTransform: "uppercase" },
        ]}
      >
        {dia}
      </Text>
      <Text
        style={[typography.heading, { color: palette.primary, lineHeight: 28 }]}
      >
        {num}
      </Text>
      <Text
        style={[
          typography.captionBold,
          { color: palette.textMuted, textTransform: "uppercase" },
        ]}
      >
        {mes}
      </Text>
    </View>
  );
}

const dateTileStyles = StyleSheet.create({ tile: {} });

// ─── ClienteAptRow ────────────────────────────────────────────────────────────

function ClienteAptRow({ item }: { item: AgendamentoResponse }) {
  const { palette, typography, spacing, radius } = useTheme();
  const inicio = parseISO(item.inicio);
  const horaStr = format(inicio, "HH:mm");
  const isCanceled = item.status === "cancelado" || item.status === "no_show";
  const isConcluido = item.status === "concluido";
  const showPill = item.status === "pendente" || item.status === "confirmado";
  const cor = statusColor(item.status, palette);

  const servico =
    item.itens.length === 0
      ? "Serviço"
      : item.itens.length === 1
        ? item.itens[0]!.servico.nome
        : `${item.itens[0]!.servico.nome} +${item.itens.length - 1}`;

  return (
    <Pressable
      testID={`apt-row-${item.codigo}`}
      onPress={() =>
        router.push(`/(cliente)/agendamentos/${item.codigo}` as never)
      }
      accessibilityRole="button"
      style={({ pressed }) => [
        rowStyles.row,
        {
          backgroundColor: pressed ? palette.surfaceHigh : palette.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
          opacity: isCanceled ? 0.55 : 1,
        },
      ]}
    >
      <DateTile inicio={item.inicio} />

      <View style={{ flex: 1 }}>
        {/* Hora + serviço */}
        <View style={rowStyles.horaRow}>
          <Text
            style={[
              typography.mono,
              { color: palette.text, fontFamily: "JetBrainsMono_400Regular" },
            ]}
          >
            {horaStr}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginLeft: 6 },
            ]}
          >
            ·
          </Text>
          <Text
            style={[
              typography.label,
              { color: palette.text, marginLeft: 6, flexShrink: 1 },
            ]}
            numberOfLines={1}
          >
            {servico}
          </Text>
        </View>

        {/* Barbeiro */}
        {item.barbeiro ? (
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {item.barbeiro.nome}
          </Text>
        ) : null}

        {/* Status pill */}
        {showPill ? (
          <View style={[rowStyles.pill, { marginTop: 4 }]}>
            <View
              style={[rowStyles.dot, { backgroundColor: cor, marginRight: 5 }]}
            />
            <Text style={[typography.captionBold, { color: cor }]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
        ) : null}

        {/* Avaliar chip for concluido not yet rated */}
        {isConcluido ? (
          <View style={[rowStyles.pill, { marginTop: 4 }]}>
            <Text
              style={[
                typography.captionBold,
                {
                  color: palette.primaryOn,
                  backgroundColor: palette.primary,
                  borderRadius: radius.full,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  overflow: "hidden",
                },
              ]}
            >
              AVALIAR
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  horaRow: { flexDirection: "row", alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = "proximos" | "historico";

export default function ClienteAgendamentosScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const { data, isLoading, isError, isRefetching, refetch } =
    useAgendamentosMeus();
  const [tab, setTab] = useState<Tab>("proximos");

  const proximos = useMemo(() => {
    if (!data) return [];
    return data
      .filter((a) => isFuture(parseISO(a.inicio)))
      .sort(
        (a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime(),
      );
  }, [data]);

  const historico = useMemo(() => {
    if (!data) return [];
    return data
      .filter((a) => !isFuture(parseISO(a.inicio)))
      .sort(
        (a, b) => parseISO(b.inicio).getTime() - parseISO(a.inicio).getTime(),
      );
  }, [data]);

  const currentList = tab === "proximos" ? proximos : historico;

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <View
          style={contentStyles.center}
          testID="lista-meus-agendamentos-loading"
        >
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={contentStyles.center}>
          <Text
            style={[
              typography.body,
              { color: palette.textMuted, textAlign: "center" },
            ]}
          >
            Não foi possível carregar seus agendamentos.
          </Text>
        </View>
      );
    }
    if (currentList.length === 0) {
      return (
        <View style={contentStyles.center}>
          <Text
            style={[
              typography.body,
              { color: palette.textMuted, textAlign: "center" },
            ]}
          >
            {tab === "proximos"
              ? "Nenhum agendamento futuro."
              : "Nenhum agendamento no histórico."}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {currentList.map((item) => (
          <ClienteAptRow key={item.codigo} item={item} />
        ))}
      </ScrollView>
    );
  }, [
    isLoading,
    isError,
    currentList,
    tab,
    palette,
    typography,
    spacing,
    isRefetching,
    refetch,
  ]);

  return (
    <View
      testID="lista-meus-agendamentos"
      style={[screenStyles.container, { backgroundColor: palette.bg }]}
    >
      {/* ── Header ── */}
      <View
        style={[
          screenStyles.header,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
          },
        ]}
      >
        <Text style={[typography.title, { color: palette.text }]}>
          Minha agenda
        </Text>
        <Pressable
          onPress={() => router.push("/(cliente)/home" as never)}
          accessibilityRole="button"
          accessibilityLabel="Novo agendamento"
          style={({ pressed }) => [
            screenStyles.addBtn,
            {
              backgroundColor: palette.primary,
              borderRadius: radius.full,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text
            style={{ color: palette.primaryOn, fontSize: 18, lineHeight: 20 }}
          >
            +
          </Text>
        </Pressable>
      </View>

      {/* ── Segmented tabs ── */}
      <View
        style={[
          screenStyles.tabs,
          {
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <Pressable
          testID="tab-proximos"
          onPress={() => setTab("proximos")}
          style={[
            screenStyles.tabBtn,
            {
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
              backgroundColor:
                tab === "proximos" ? palette.primary : palette.surface,
              marginRight: spacing.sm,
              borderWidth: 1,
              borderColor:
                tab === "proximos" ? palette.primary : palette.border,
            },
          ]}
        >
          <Text
            style={[
              typography.captionBold,
              {
                color:
                  tab === "proximos" ? palette.primaryOn : palette.textMuted,
              },
            ]}
          >
            Próximos · {proximos.length}
          </Text>
        </Pressable>
        <Pressable
          testID="tab-historico"
          onPress={() => setTab("historico")}
          style={[
            screenStyles.tabBtn,
            {
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
              backgroundColor:
                tab === "historico" ? palette.primary : palette.surface,
              borderWidth: 1,
              borderColor:
                tab === "historico" ? palette.primary : palette.border,
            },
          ]}
        >
          <Text
            style={[
              typography.captionBold,
              {
                color:
                  tab === "historico" ? palette.primaryOn : palette.textMuted,
              },
            ]}
          >
            Histórico · {historico.length}
          </Text>
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBtn: {},
  tabs: { flexDirection: "row" },
  tabBtn: {},
});

const contentStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
