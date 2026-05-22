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

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { FilaCard } from "@/src/features/barbeiro/FilaCard";
import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useToast } from "@/src/shared/hooks/use-toast";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";

// Habilita LayoutAnimation no Android (no-op em iOS/Fabric, onde já é nativo).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Resumo curto do serviço de um agendamento (para o preview colapsado).
function resumoServico(
  ag: Parameters<typeof FilaCard>[0]["agendamento"],
): string {
  if (ag.itens.length === 1) return ag.itens[0].servico.nome;
  return `${ag.itens[0]?.servico.nome ?? "Serviço"} +${ag.itens.length - 1}`;
}

function minutosAguardando(criadoEm: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60_000),
  );
}

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
  const servicoNome = resumoServico(agendamento);
  const minutos = minutosAguardando(agendamento.criadoEm);

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
          <Text style={styles.walkInTempo}>Aguardando {minutos} min</Text>
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
 * Banner colapsável de fila no topo da Agenda. Retorna `null` quando não há
 * walk-ins aguardando — assim não ocupa espaço nem empurra a lista (Bug UX:
 * a fila não deve deslocar a agenda).
 *
 * - **Colapsado** (padrão): linha única com contador, prévia do primeiro da
 *   fila e um atalho "Atender →" para ele.
 * - **Expandido** (tap no banner): mostra todos os walk-ins com `WalkInCard`.
 */
export function FilaSection() {
  const { data } = useFilaDia();
  const updateStatus = useUpdateStatus();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleAtender = useCallback(
    (codigo: number) => {
      updateStatus.mutate(
        { codigo, status: "em_andamento" },
        {
          onSuccess: () => showToast("Em atendimento", "success"),
          onError: () =>
            showToast("Não foi possível atender. Tente novamente.", "error"),
        },
      );
    },
    [updateStatus, showToast],
  );

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  }, []);

  const filaItems = data ?? [];
  if (filaItems.length === 0) return null;

  const pendentes = filaItems.filter((a) => a.status === "pendente");
  const primeiro = filaItems[0];

  return (
    <View testID="fila-section" style={styles.section}>
      <View style={styles.bannerRow}>
        <Pressable
          testID="fila-banner-toggle"
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Recolher fila" : "Expandir fila"}
          onPress={toggle}
          style={styles.bannerTap}
        >
          <RedPulsingDot />
          <Text style={styles.sectionTitle}>
            FILA · esperando ({pendentes.length})
          </Text>
          {!expanded && (
            <Text style={styles.preview} numberOfLines={1}>
              {primeiro.cliente.nome} · {resumoServico(primeiro)} ·{" "}
              {minutosAguardando(primeiro.criadoEm)}min
            </Text>
          )}
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#ef4444"
          />
        </Pressable>

        {/* Atalho de atendimento do primeiro da fila quando colapsado. */}
        {!expanded && (
          <Pressable
            testID={`btn-atender-${primeiro.codigo}`}
            accessibilityRole="button"
            accessibilityLabel={`Atender ${primeiro.cliente.nome}`}
            onPress={() => handleAtender(primeiro.codigo)}
            style={styles.atenderBtn}
          >
            <Text style={styles.atenderBtnText}>Atender →</Text>
          </Pressable>
        )}
      </View>

      {expanded && (
        <View testID="fila-expanded">
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
      )}
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
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerTap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
  },
  preview: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#f5f5f5",
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
