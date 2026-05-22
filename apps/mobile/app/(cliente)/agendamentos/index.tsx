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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { TenantSwitcherSheet } from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

// ─── Status colors ────────────────────────────────────────────────────────────

function statusColor(status: StatusAgendamento): string {
  switch (status) {
    case "pendente":
      return "#F4B400";
    case "confirmado":
      return "#22c55e";
    case "concluido":
      return "#666666";
    case "cancelado":
      return "#888888";
    case "no_show":
      return "#ef4444";
    default:
      return "#888888";
  }
}

const STATUS_SHORT: Record<StatusAgendamento, string> = {
  pendente: "Aguardando",
  confirmado: "Confirmado",
  em_andamento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "No-show",
};

// ─── DateTile ─────────────────────────────────────────────────────────────────

function DateTile({ inicio }: { inicio: string }) {
  const { palette } = useTheme();
  const date = parseISO(inicio);
  const future = isFuture(date);
  const dia = format(date, "EEE", { locale: ptBR }).slice(0, 3);
  const num = format(date, "d");
  const mes = format(date, "MMM", { locale: ptBR });

  return (
    <View
      style={[
        styles.dateTile,
        future ? styles.dateTileFuture : styles.dateTilePast,
      ]}
    >
      <Text
        style={[
          styles.dateTileDia,
          { color: future ? palette.primary : "#444444" },
        ]}
      >
        {dia.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.dateTileNum,
          { color: future ? palette.text : "#aaaaaa" },
        ]}
      >
        {num}
      </Text>
      <Text
        style={[styles.dateTileMes, { color: future ? "#444444" : "#333333" }]}
      >
        {mes.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── ClienteAptRow ────────────────────────────────────────────────────────────

function ClienteAptRow({ item }: { item: AgendamentoResponse }) {
  const { palette } = useTheme();
  const inicio = parseISO(item.inicio);
  const horaStr = format(inicio, "HH:mm");
  const isCanceled = item.status === "cancelado" || item.status === "no_show";
  const isConcluido = item.status === "concluido";
  const showPill = item.status === "pendente" || item.status === "confirmado";
  const cor = statusColor(item.status);

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
      style={[styles.row, { opacity: isCanceled ? 0.55 : 1 }]}
    >
      <DateTile inicio={item.inicio} />

      <View style={{ flex: 1 }}>
        {/* Hora + serviço */}
        <View style={styles.horaRow}>
          <Text style={styles.horaText}>{horaStr}</Text>
          <Text style={styles.horaDot}>·</Text>
          <Text
            style={[styles.servicoText, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {servico}
          </Text>
        </View>

        {/* Barbeiro */}
        {item.barbeiro ? (
          <Text style={styles.barbeiroText} numberOfLines={1}>
            com {item.barbeiro.nome}
          </Text>
        ) : null}

        {/* Status pill */}
        {showPill ? (
          <View style={[styles.statusBadge, { backgroundColor: cor + "1a" }]}>
            <View style={[styles.statusDot, { backgroundColor: cor }]} />
            <Text style={[styles.statusBadgeText, { color: cor }]}>
              {STATUS_SHORT[item.status].toUpperCase()}
            </Text>
          </View>
        ) : null}

        {/* Avaliar chip */}
        {isConcluido ? (
          <View style={styles.avaliarChip}>
            <Text style={styles.avaliarChipText}>★ AVALIAR</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = "proximos" | "historico";

export default function ClienteAgendamentosScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { barbearia } = useAuth();
  const { data, isLoading, isError, isRefetching, refetch } =
    useAgendamentosMeus();
  const [tab, setTab] = useState<Tab>("proximos");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const letraBarbearia = barbearia?.nome?.trim()[0]?.toUpperCase() ?? "?";

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
          style={styles.contentCenter}
          testID="lista-meus-agendamentos-loading"
        >
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.contentCenter}>
          <Text style={styles.emptyText}>
            Não foi possível carregar seus agendamentos.
          </Text>
        </View>
      );
    }
    if (currentList.length === 0) {
      return (
        <View style={styles.contentCenter}>
          <Text style={styles.emptyText}>
            {tab === "proximos"
              ? "Nenhum agendamento futuro."
              : "Nenhum agendamento no histórico."}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {currentList.map((item, i) => (
          <View
            key={item.codigo}
            style={[i < currentList.length - 1 ? styles.rowSeparator : null]}
          >
            <ClienteAptRow item={item} />
          </View>
        ))}
      </ScrollView>
    );
  }, [isLoading, isError, currentList, tab, palette, isRefetching, refetch]);

  return (
    <View
      testID="lista-meus-agendamentos"
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            Minha agenda
          </Text>
          {/* Tenant pill */}
          {barbearia ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Barbearia ativa: ${barbearia.nome}. Toque para trocar`}
              onPress={() => setShowSwitcher(true)}
              style={styles.tenantPill}
            >
              <View style={styles.pillLogoMini}>
                <Text style={styles.pillLogoLetter}>{letraBarbearia}</Text>
              </View>
              <Text style={styles.pillNome} numberOfLines={1}>
                {barbearia.nome}
              </Text>
              <Text style={styles.pillSwap}>⇅</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push("/(cliente)/home" as never)}
          accessibilityRole="button"
          accessibilityLabel="Novo agendamento"
          style={styles.addBtn}
        >
          <Text style={[styles.addBtnText, { color: palette.primary }]}>+</Text>
        </Pressable>
      </View>

      <TenantSwitcherSheet
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />

      {/* ── Segmented tabs ── */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsContainer}>
          <Pressable
            testID="tab-proximos"
            onPress={() => setTab("proximos")}
            style={[
              styles.tabBtn,
              tab === "proximos"
                ? { backgroundColor: palette.primary }
                : { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: tab === "proximos" ? "#0d0d0d" : "#aaaaaa",
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
              styles.tabBtn,
              tab === "historico"
                ? { backgroundColor: palette.primary }
                : { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: tab === "historico" ? "#0d0d0d" : "#aaaaaa",
                },
              ]}
            >
              Histórico · {historico.length}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    letterSpacing: -0.6,
  },
  // ── Tenant pill
  tenantPill: {
    marginTop: 6,
    backgroundColor: "#171717",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#262626",
    alignSelf: "flex-start",
  },
  pillLogoMini: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
  },
  pillLogoLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 9,
    color: "#0d0d0d",
  },
  pillNome: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    color: "#f5f5f5",
    maxWidth: 160,
  },
  pillSwap: {
    fontSize: 10,
    color: "#666666",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 22,
    lineHeight: 26,
  },
  // ── Tabs
  tabsWrap: {
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#262626",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // ── Date tile
  dateTile: {
    width: 56,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexShrink: 0,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },
  dateTileFuture: {
    backgroundColor: "#F4B40014",
    borderColor: "#F4B40038",
  },
  dateTilePast: {
    backgroundColor: "#1c1c1c",
    borderColor: "#262626",
  },
  dateTileDia: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  dateTileNum: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22,
    marginTop: 2,
  },
  dateTileMes: {
    fontSize: 9,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
  },
  // ── Row body
  horaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  horaText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#f5f5f5",
    fontWeight: "700",
  },
  horaDot: {
    color: "#444444",
    fontSize: 11,
    marginHorizontal: 5,
  },
  servicoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  barbeiroText: {
    fontSize: 11,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold" as never,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  avaliarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#F4B40014",
  },
  avaliarChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F4B400",
    letterSpacing: 0.8,
  },
  rowChevron: {
    fontSize: 16,
    color: "#444444",
    flexShrink: 0,
  },
  // ── States
  contentCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
