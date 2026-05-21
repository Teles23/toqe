import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { FilaCard } from "@/src/features/barbeiro/FilaCard";
import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useTheme } from "@/src/shared/theme";

// ─── Pulsing dot vermelho ────────────────────────────────────────────────────

function RedPulsingDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);

  return <Animated.View style={[styles.redDot, { opacity: anim }]} />;
}

// ─── WalkInCard — card visual Urban Flow com botão Atender ───────────────────

function WalkInCard({
  agendamento,
  posicao,
  onAtender,
  onChangeStatus,
}: {
  agendamento: Parameters<typeof FilaCard>[0]["agendamento"];
  posicao: number;
  onAtender: (codigo: number) => void;
  onChangeStatus?: Parameters<typeof FilaCard>[0]["onChangeStatus"];
}) {
  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  // Calcula minutos aguardando
  const chegadaMs = new Date(agendamento.criadoEm).getTime();
  const minutosAguardando = Math.max(
    0,
    Math.floor((Date.now() - chegadaMs) / 60_000),
  );

  return (
    <View
      testID={`walkin-card-${agendamento.codigo}`}
      style={styles.walkInCard}
    >
      {/* Linha rápida: nome + tempo + botão atender */}
      <View style={styles.walkInRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.walkInNome} numberOfLines={1}>
            {agendamento.cliente.nome}
          </Text>
          <Text style={styles.walkInServico} numberOfLines={1}>
            {servicoNome}
          </Text>
          <Text style={styles.walkInTempo}>
            Aguardando {minutosAguardando} min
          </Text>
        </View>

        <Pressable
          testID={`btn-atender-${agendamento.codigo}`}
          accessibilityRole="button"
          accessibilityLabel={`Atender ${agendamento.cliente.nome}`}
          onPress={() => onAtender(agendamento.codigo)}
          style={styles.atenderBtn}
        >
          <Text style={styles.atenderBtnText}>Atender →</Text>
        </Pressable>
      </View>

      {/* FilaCard: barra de progresso + long-press para status */}
      <FilaCard
        agendamento={agendamento}
        posicao={posicao}
        onChangeStatus={onChangeStatus}
        testID={`fila-card-${agendamento.codigo}`}
      />
    </View>
  );
}

// ─── BarbeiroFilaScreen ───────────────────────────────────────────────────────

export default function BarbeiroFilaScreen() {
  const { palette, radius } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isRefetching, refetch, isError } = useFilaDia();
  const updateStatus = useUpdateStatus();

  const handleAtender = useCallback(
    (codigo: number) => {
      updateStatus.mutate({ codigo, status: "confirmado" });
    },
    [updateStatus],
  );

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const filaItems = data ?? [];
  const pendentes = filaItems.filter((a) => a.status === "pendente");

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Fila</Text>
        {filaItems.length > 0 && (
          <Text style={styles.headerCounter}>
            ({filaItems.length} aguardando)
          </Text>
        )}
      </View>

      <ScrollView
        testID="lista-fila"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading && (
          <View testID="lista-fila-loading" style={styles.stateCenter}>
            <Text style={[styles.stateText, { color: palette.textMuted }]}>
              Carregando fila…
            </Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.stateCenter}>
            <Text style={[styles.stateText, { color: palette.textMuted }]}>
              Não foi possível carregar a fila. Puxe para tentar novamente.
            </Text>
          </View>
        )}

        {!isLoading && !isError && filaItems.length === 0 && (
          <View testID="fila-vazia" style={styles.stateCenter}>
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>
              Fila vazia. Toque em + para adicionar um walk-in.
            </Text>
          </View>
        )}

        {!isLoading && !isError && filaItems.length > 0 && (
          /* Seção vermelha de walk-ins */
          <View testID="fila-section" style={styles.walkinSection}>
            {/* Cabeçalho da seção */}
            <View style={styles.walkinSectionHeader}>
              <RedPulsingDot />
              <Text style={styles.walkinSectionTitle}>
                FILA · esperando ({pendentes.length})
              </Text>
            </View>

            {/* Cards */}
            {filaItems.map((item, idx) => (
              <View key={item.codigo} style={styles.walkinCardWrap}>
                <WalkInCard
                  agendamento={item}
                  posicao={idx + 1}
                  onAtender={handleAtender}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={openModal}
        accessibilityRole="button"
        accessibilityLabel="Adicionar walk-in"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.primary, borderRadius: radius.pill },
          pressed && styles.fabPressed,
        ]}
        testID="fab-adicionar"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AdicionarWalkInModal visible={modalOpen} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
  },
  headerCounter: {
    fontSize: 13,
    color: "#888888",
    fontFamily: "Inter_400Regular",
  },
  // ── Scroll
  scrollContent: {
    paddingBottom: 100,
  },
  // ── States
  stateCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  stateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  // ── Walk-in section
  walkinSection: {
    backgroundColor: "#ef44441a",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  walkinSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  walkinSectionTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#ef4444",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  walkinCardWrap: {
    marginTop: 8,
  },
  // ── WalkInCard
  walkInCard: {
    gap: 8,
  },
  walkInRow: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  walkInNome: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 2,
  },
  walkInServico: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  walkInTempo: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#ef4444",
  },
  atenderBtn: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4B400",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  atenderBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0d0d0d",
    fontWeight: "700",
  },
  // ── FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPressed: { opacity: 0.8 },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 28 },
});
