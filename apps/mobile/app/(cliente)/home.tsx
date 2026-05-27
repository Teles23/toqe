import { Feather } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useProximoAgendamento } from "@/src/shared/hooks/cliente/use-proximo-agendamento";
import { useProximosSlots } from "@/src/shared/hooks/cliente/use-proximos-slots";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, SkeletonBox, TenantSwitcherSheet } from "@/src/shared/ui";

// ─── Design tokens (Quick Book Slots v2) ──────────────────────────────────────
const CARD = "#171717";
const CARD2 = "#1f1f1f";
const BORDER = "#262626";
const BORDER2 = "#2a2a2a";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const FG = "#f5f5f5";

// ─── QuickBook internal state ─────────────────────────────────────────────────
type QuickView =
  | "loading"
  | "empty"
  | "idle"
  | "loaded"
  | "confirming"
  | "confirmed"
  | "error";

function QuickBookCard() {
  const { palette } = useTheme();
  const { data, isLoading, isError } = useProximosSlots();
  const [view, setView] = useState<QuickView | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const resolvedView: QuickView = (() => {
    if (view === "confirmed" || view === "confirming") return view;
    if (isLoading) return "loading";
    if (isError) return "error";
    if (!data || data.slots.length === 0) return "empty";
    if (view === "loaded") return "loaded";
    return "idle";
  })();

  const handleVerHorarios = useCallback(() => {
    setSelectedSlot(data?.slots[0]?.inicio ?? null);
    setView("loaded");
  }, [data]);

  const handleConfirm = useCallback(async () => {
    setView("confirming");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setView("confirmed");
  }, []);

  const priceLabel = data
    ? `R$ ${(data.servicoPreco / 100).toFixed(2).replace(".", ",")}`
    : "";
  const durationLabel = data ? `${data.servicoDuracao} min` : "";

  // ── LOADING ──
  if (resolvedView === "loading") {
    return (
      <View
        testID="quick-book-card"
        style={[styles.qbCard, styles.qbCardPlain]}
      >
        <View style={styles.qbLoadingLabel}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={styles.monoMuted}>GET /agenda/proximos…</Text>
        </View>
        {["Hoje", "Amanhã", "Sex"].map((day) => (
          <View key={day} style={{ marginBottom: 10 }}>
            <SkeletonBox width={44} height={9} borderRadius={4} />
            <View style={{ height: 6 }} />
            <View style={styles.slotRow}>
              <SkeletonBox width="31%" height={48} borderRadius={12} />
              <SkeletonBox width="31%" height={48} borderRadius={12} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // ── ERROR ──
  if (resolvedView === "error") {
    return (
      <View
        testID="quick-book-error"
        style={[styles.qbCard, styles.qbCardPlain]}
      >
        <View style={styles.qbCenterState}>
          <View style={[styles.stateIconBox, styles.stateIconDanger]}>
            <Feather name="wifi-off" size={26} color="#ef4444" />
          </View>
          <Text style={styles.stateTitle}>Falha na conexão</Text>
          <Text style={styles.stateDesc}>
            Não conseguimos buscar os horários. Verifique sua internet e tente
            novamente.
          </Text>
          <Pressable
            onPress={() => setView(null)}
            style={[styles.retryBtn, { backgroundColor: palette.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
          >
            <Feather name="refresh-cw" size={16} color={palette.primaryOn} />
            <Text style={[styles.retryBtnText, { color: palette.primaryOn }]}>
              Tentar de novo
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── EMPTY ──
  if (resolvedView === "empty") {
    return (
      <View
        testID="quick-book-empty"
        style={[styles.qbCard, styles.qbCardPlain]}
      >
        <View style={styles.qbCenterState}>
          <View style={[styles.stateIconBox, styles.stateIconNeutral]}>
            <Feather name="clock" size={26} color="#666666" />
          </View>
          <Text style={styles.stateTitle}>Sem horários disponíveis</Text>
          <Text style={styles.stateDesc}>
            Não há horários livres nos próximos 7 dias. Tente outro barbeiro ou
            ative o aviso de cancelamento.
          </Text>
          <View style={styles.emptyBtnRow}>
            <Pressable
              onPress={() => setView(null)}
              style={styles.emptyBtnNeutral}
              accessibilityRole="button"
              accessibilityLabel="Outro barbeiro"
            >
              <Feather name="user" size={14} color="#dddddd" />
              <Text style={styles.emptyBtnNeutralText}>Outro barbeiro</Text>
            </Pressable>
            <Pressable
              style={[
                styles.emptyBtnAccent,
                {
                  backgroundColor: palette.primary + "1a",
                  borderColor: palette.primary + "40",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Avisar vaga"
            >
              <Feather name="bell" size={14} color={palette.primary} />
              <Text
                style={[styles.emptyBtnAccentText, { color: palette.primary }]}
              >
                Avisar vaga
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── CONFIRMED ──
  if (resolvedView === "confirmed") {
    const slot = data?.slots.find((s) => s.inicio === selectedSlot);
    return (
      <View testID="quick-book-confirmed" style={styles.qbConfirmedCard}>
        <View style={styles.confirmedCheck}>
          <Feather name="check" size={32} color={GREEN} />
        </View>
        <Text style={styles.confirmedTitle}>Agendado!</Text>
        <Text style={styles.confirmedDesc}>
          {slot ? `${slot.dia} · ${slot.hora} · ` : ""}
          {data?.servicoNome} com {data?.barbeiroNome}
        </Text>
        <Pressable
          onPress={() => setView(null)}
          style={styles.reservarOutroBtn}
          accessibilityRole="button"
          accessibilityLabel="Reservar outro"
        >
          <Feather name="refresh-cw" size={14} color="#bbbbbb" />
          <Text style={styles.reservarOutroText}>Reservar outro</Text>
        </Pressable>
      </View>
    );
  }

  // ── IDLE / LOADED / CONFIRMING (card com borda-esquerda accent + header) ──
  return (
    <View
      testID="quick-book-card"
      style={[
        styles.qbCard,
        {
          borderColor: palette.primary + "30",
          borderLeftColor: palette.primary,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.qbHeader}>
        <View
          style={[
            styles.qbAvatar,
            {
              backgroundColor: palette.primary + "1a",
              borderColor: palette.primary + "30",
            },
          ]}
        >
          <Text style={[styles.qbAvatarLetter, { color: palette.primary }]}>
            {data?.barbeiroInicial ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.qbTitle} numberOfLines={1}>
            Repetir com {data?.barbeiroNome ?? "—"}
          </Text>
          <View style={styles.qbSubRow}>
            <Feather name="scissors" size={11} color="#888888" />
            <Text style={styles.qbSubText} numberOfLines={1}>
              {data?.servicoNome} · {durationLabel} · {priceLabel}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.oneToqueBadge,
            { backgroundColor: palette.primary + "14" },
          ]}
        >
          <Feather name="zap" size={10} color={palette.primary} />
          <Text style={[styles.oneToqueText, { color: palette.primary }]}>
            1 TOQUE
          </Text>
        </View>
      </View>

      {/* IDLE */}
      {resolvedView === "idle" && (
        <Pressable
          testID="quick-book-btn-ver-horarios"
          onPress={handleVerHorarios}
          style={[
            styles.verHorariosBtn,
            {
              backgroundColor: palette.primary + "14",
              borderColor: palette.primary + "38",
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ver horários disponíveis"
        >
          <Text style={[styles.verHorariosText, { color: palette.primary }]}>
            Ver horários disponíveis
          </Text>
          <Feather name="arrow-right" size={16} color={palette.primary} />
        </Pressable>
      )}

      {/* LOADED / CONFIRMING */}
      {(resolvedView === "loaded" || resolvedView === "confirming") && data && (
        <View style={{ marginTop: 14 }}>
          {/* slots label */}
          <View style={styles.slotsLabelRow}>
            <View style={styles.greenDot} />
            <Text style={styles.slotsLabelText}>
              {data.slots.length} slots · próximos 7 dias
            </Text>
          </View>

          {/* grouped slots */}
          {Object.entries(
            data.slots.reduce<Record<string, typeof data.slots>>(
              (acc, slot) => {
                (acc[slot.dia] = acc[slot.dia] || []).push(slot);
                return acc;
              },
              {},
            ),
          ).map(([dia, slots]) => (
            <View key={dia} style={{ marginBottom: 10 }}>
              <Text style={styles.diaLabel}>{dia}</Text>
              <View style={styles.slotRow}>
                {slots.map((slot) => {
                  const isSel = slot.inicio === selectedSlot;
                  return (
                    <Pressable
                      key={slot.inicio}
                      testID={`slot-${slot.hora.replace(":", "-")}`}
                      onPress={() => setSelectedSlot(slot.inicio)}
                      style={[
                        styles.slotBtn,
                        isSel
                          ? {
                              backgroundColor: palette.primary + "1c",
                              borderColor: palette.primary,
                            }
                          : styles.slotBtnIdle,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Horário ${slot.hora}`}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          { color: isSel ? palette.primary : "#bbbbbb" },
                        ]}
                      >
                        {slot.hora}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* confirm */}
          <Pressable
            testID="quick-book-btn-confirmar"
            onPress={handleConfirm}
            disabled={resolvedView === "confirming"}
            style={[styles.confirmBtn, { backgroundColor: palette.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Confirmar agendamento"
          >
            {resolvedView === "confirming" ? (
              <ActivityIndicator size="small" color={palette.primaryOn} />
            ) : (
              <>
                <Text
                  style={[styles.confirmBtnText, { color: palette.primaryOn }]}
                >
                  Confirmar reserva
                </Text>
                <Feather
                  name="arrow-right"
                  size={16}
                  color={palette.primaryOn}
                />
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Next appointment — strip style ───────────────────────────────────────────
function NextAppointmentStrip() {
  const { palette } = useTheme();
  const { data: proximo } = useProximoAgendamento();
  if (!proximo) return null;

  const inicio = parseISO(proximo.inicio);
  const date = format(inicio, "EEE, dd MMM", { locale: ptBR });
  const time = format(inicio, "HH:mm", { locale: ptBR });
  const daysAway = Math.max(0, differenceInCalendarDays(inicio, new Date()));
  const barbeiro =
    (proximo as { barbeiro?: { nome?: string } }).barbeiro?.nome ?? "";

  return (
    <Pressable
      testID="next-apt-card"
      style={styles.strip}
      accessibilityRole="button"
      accessibilityLabel={`Próximo agendamento ${date} ${time}`}
    >
      <View style={styles.stripTopRow}>
        <Text style={styles.stripLabel}>PRÓXIMO</Text>
        <View style={styles.stripLine} />
        <Text style={[styles.stripDays, { color: palette.primary }]}>
          em {daysAway}d
        </Text>
      </View>
      <View style={styles.stripBottomRow}>
        <View style={[styles.stripDot, { backgroundColor: palette.primary }]} />
        <Text style={styles.stripDate}>
          {date} · {time}
        </Text>
        {barbeiro ? <Text style={styles.stripWith}>· {barbeiro}</Text> : null}
        <Feather
          name="arrow-right"
          size={14}
          color="#555555"
          style={{ marginLeft: "auto" }}
        />
      </View>
    </Pressable>
  );
}

// ─── Stats grid ───────────────────────────────────────────────────────────────
function StatsGrid({ visitas }: { visitas: number }) {
  const { palette } = useTheme();
  return (
    <View style={styles.statsRow}>
      <View testID="stats-visitas" style={styles.statCard}>
        <View style={[styles.statIconBox, { backgroundColor: BLUE + "1a" }]}>
          <Feather name="calendar" size={16} color={BLUE} />
        </View>
        <Text style={styles.statValue}>{visitas}</Text>
        <Text style={styles.statLabel}>Total visitas</Text>
      </View>
      <View testID="stats-ticket" style={styles.statCard}>
        <View
          style={[
            styles.statIconBox,
            { backgroundColor: palette.primary + "1a" },
          ]}
        >
          <Feather name="credit-card" size={16} color={palette.primary} />
        </View>
        <Text style={styles.statValue}>—</Text>
        <Text style={styles.statLabel}>Ticket médio</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ClienteHomeScreen() {
  const { palette, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { barbearia, barbearias } = useAuth();
  const { data: agendamentos } = useAgendamentosMeus();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const semBarbearias = barbearias.length === 0;

  return (
    <View
      style={[styles.container, { backgroundColor: palette.bg }]}
      testID="home-header"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.md, paddingTop: insets.top + 10 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Início</Text>
          {barbearia ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Barbearia ativa: ${barbearia.nome}. Toque para trocar`}
              onPress={() => setShowSwitcher(true)}
              style={styles.tenantRow}
            >
              <Feather name="home" size={12} color="#888888" />
              <Text style={styles.tenantName} numberOfLines={1}>
                {barbearia.nome}
              </Text>
              <Feather name="chevron-down" size={13} color="#666666" />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          testID="btn-notificacoes"
          accessibilityRole="button"
          accessibilityLabel="Notificações"
          style={styles.bellBtn}
        >
          <Feather name="bell" size={20} color="#bbbbbb" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: 6,
          paddingBottom: spacing.xxxl,
          gap: 14,
        }}
      >
        {semBarbearias ? (
          /* EmptyClienteSemBarbearia — pixel-accurate */
          <View testID="home-sem-barbearia" style={styles.emptyBarbearia}>
            <View
              style={[
                styles.emptyIconBox,
                {
                  backgroundColor: palette.primary + "14",
                  borderColor: palette.primary + "38",
                },
              ]}
            >
              <Feather name="scissors" size={32} color={palette.primary} />
            </View>
            <Text style={styles.emptyLine1}>Bem-vindo ao</Text>
            <Text style={styles.emptyBrand}>Toqe.</Text>
            <Text style={styles.emptySubtitle}>
              Encontre e agende em barbearias perto de você
            </Text>
            <AmberButton
              label="Buscar barbearias"
              onPress={() => router.push("/(cliente)/buscar")}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tenho um código QR"
              onPress={() => router.push("/(cliente)/buscar/qr" as never)}
              style={styles.emptyQrBtn}
            >
              <Text style={styles.emptyQrBtnText}>Tenho um código QR</Text>
            </Pressable>
            <Text style={styles.emptyFooter}>
              Ou peça um convite ao seu barbeiro
            </Text>
          </View>
        ) : (
          <>
            <NextAppointmentStrip />
            <QuickBookCard />
            {agendamentos !== undefined && agendamentos !== null ? (
              <StatsGrid visitas={agendamentos.length} />
            ) : null}
          </>
        )}
      </ScrollView>

      {/* FAB buscar */}
      {!semBarbearias && (
        <Pressable
          testID="fab-buscar"
          accessibilityRole="button"
          accessibilityLabel="Buscar barbearias"
          onPress={() => router.push("/(cliente)/buscar")}
          style={[
            styles.fab,
            { borderRadius: radius.full, backgroundColor: palette.primary },
          ]}
        >
          <Feather name="search" size={20} color={palette.primaryOn} />
        </Pressable>
      )}

      {/* TenantSwitcherSheet */}
      <TenantSwitcherSheet
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    lineHeight: 28,
    color: FG,
    letterSpacing: -0.4,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  tenantName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#999999",
    maxWidth: 200,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Next appointment strip
  strip: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c1c",
    gap: 8,
  },
  stripTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stripLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    color: "#666666",
    textTransform: "uppercase",
  },
  stripLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#222222",
  },
  stripDays: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "JetBrainsMono_400Regular",
  },
  stripBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stripDate: {
    fontSize: 13,
    color: FG,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stripWith: {
    fontSize: 12,
    color: "#888888",
  },
  // ── Quick Book card
  qbCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 20,
    padding: 18,
  },
  qbCardPlain: {
    borderColor: BORDER,
    borderLeftColor: BORDER,
    borderLeftWidth: 1,
  },
  qbHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qbAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qbAvatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 17,
  },
  qbTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
    color: FG,
  },
  qbSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  qbSubText: {
    fontSize: 11,
    color: "#999999",
    flex: 1,
  },
  oneToqueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  oneToqueText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
  },
  // ── idle CTA
  verHorariosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  verHorariosText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  // ── slots
  slotsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  slotsLabelText: {
    fontSize: 9,
    color: GREEN,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "JetBrainsMono_400Regular",
    fontWeight: "700",
  },
  diaLabel: {
    fontSize: 9,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 6,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  slotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotBtn: {
    flexBasis: "31%",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  slotBtnIdle: {
    backgroundColor: CARD2,
    borderColor: BORDER2,
  },
  slotBtnSel: {},
  slotText: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    marginTop: 10,
    borderRadius: 13,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  // ── plain-state shared
  qbLoadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  monoMuted: {
    fontSize: 9,
    color: "#666666",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "JetBrainsMono_400Regular",
  },
  qbCenterState: {
    alignItems: "center",
    paddingVertical: 6,
  },
  stateIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  stateIconNeutral: {
    backgroundColor: CARD2,
    borderColor: BORDER2,
  },
  stateIconDanger: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  stateTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: FG,
    marginBottom: 4,
    textAlign: "center",
  },
  stateDesc: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
    marginBottom: 14,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  emptyBtnRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  emptyBtnNeutral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER2,
    borderRadius: 12,
  },
  emptyBtnNeutralText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dddddd",
    fontFamily: "Inter_500Medium",
  },
  emptyBtnAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  emptyBtnAccentText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  // ── confirmed
  qbConfirmedCard: {
    backgroundColor: "#0f1f15",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  confirmedCheck: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  confirmedTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    color: FG,
    marginBottom: 4,
  },
  confirmedDesc: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
  },
  reservarOutroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 11,
    marginTop: 14,
  },
  reservarOutroText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#bbbbbb",
    fontFamily: "Inter_500Medium",
  },
  // ── stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    lineHeight: 24,
    color: FG,
  },
  statLabel: {
    fontSize: 10,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
    fontWeight: "600",
    fontFamily: "Inter_500Medium",
  },
  // ── FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 18,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4B40066",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  // ── EmptyClienteSemBarbearia
  emptyBarbearia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyLine1: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
  },
  emptyBrand: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
    color: FG,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  emptyQrBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    width: "100%",
  },
  emptyQrBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#888888",
  },
  emptyFooter: {
    fontSize: 11,
    color: "#444444",
    textAlign: "center",
    marginTop: 24,
  },
});
