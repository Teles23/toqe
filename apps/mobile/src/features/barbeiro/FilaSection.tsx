/**
 * FilaSection — seção de walk-ins aguardando, renderizada no TOPO da Agenda.
 *
 * Reflete o protótipo `Toqe App Barbeiro.html` / `Fluxo Barbeiro` (slide 11):
 * a fila não é uma tab separada — aparece como uma seção vermelha
 * ("FILA · esperando (N)") acima da lista de agendamentos do dia.
 *
 * DRY: reutiliza `FilaCard` (barra de progresso + long-press de status) e os
 * hooks `useFilaDia` + `useUpdateStatus`. O componente é autossuficiente —
 * busca seus próprios dados e some quando a fila está vazia.
 */

import { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { FilaCard } from "@/src/features/barbeiro/FilaCard";
import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useToast } from "@/src/shared/hooks/use-toast";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";

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

// ─── WalkInCard — linha rápida + FilaCard ────────────────────────────────────

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

      <FilaCard
        agendamento={agendamento}
        posicao={posicao}
        onChangeStatus={onChangeStatus}
        testID={`fila-card-${agendamento.codigo}`}
      />
    </View>
  );
}

// ─── FilaSection ──────────────────────────────────────────────────────────────

/**
 * Renderiza a seção de fila. Retorna `null` quando não há walk-ins
 * aguardando — assim a Agenda só mostra a seção quando relevante.
 */
export function FilaSection() {
  const { data } = useFilaDia();
  const updateStatus = useUpdateStatus();
  const { showToast } = useToast();

  const handleAtender = useCallback(
    (codigo: number) => {
      updateStatus.mutate(
        { codigo, status: "confirmado" },
        {
          onSuccess: () => showToast("Em atendimento", "success"),
          onError: () =>
            showToast("Não foi possível atender. Tente novamente.", "error"),
        },
      );
    },
    [updateStatus, showToast],
  );

  const filaItems = data ?? [];
  if (filaItems.length === 0) return null;

  const pendentes = filaItems.filter((a) => a.status === "pendente");

  return (
    <View testID="fila-section" style={styles.section}>
      <View style={styles.sectionHeader}>
        <RedPulsingDot />
        <Text style={styles.sectionTitle}>
          FILA · esperando ({pendentes.length})
        </Text>
      </View>

      {filaItems.map((item, idx) => (
        <View key={item.codigo} style={styles.cardWrap}>
          <WalkInCard
            agendamento={item}
            posicao={idx + 1}
            onAtender={handleAtender}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ef44441a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sectionHeader: {
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
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#ef4444",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardWrap: {
    marginTop: 8,
  },
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
});
