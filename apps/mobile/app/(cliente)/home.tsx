import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useProximoAgendamento } from "@/src/shared/hooks/cliente/use-proximo-agendamento";
import { useProximosSlots } from "@/src/shared/hooks/cliente/use-proximos-slots";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  Card,
  SkeletonBox,
  TenantSwitcherSheet,
} from "@/src/shared/ui";

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
  const { palette, spacing, radius, typography } = useTheme();
  const { data, isLoading, isError } = useProximosSlots();
  const [view, setView] = useState<QuickView | null>(null);

  // Derive state from hook + local view override
  const resolvedView: QuickView = (() => {
    if (view === "confirmed" || view === "confirming") return view;
    if (isLoading) return "loading";
    if (isError) return "error";
    if (!data || data.slots.length === 0) return "empty";
    if (view === "loaded") return "loaded";
    return "idle";
  })();

  const handleConfirm = useCallback(async () => {
    setView("confirming");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setView("confirmed");
  }, []);

  const priceLabel = data
    ? `R$ ${(data.servicoPreco / 100).toFixed(2).replace(".", ",")}`
    : "";
  const durationLabel = data ? `${data.servicoDuracao} min` : "";

  if (resolvedView === "loading") {
    return (
      <View
        testID="quick-book-card"
        style={[
          styles.quickCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <SkeletonBox width="60%" height={16} borderRadius={4} />
        <View style={{ height: spacing.sm }} />
        <SkeletonBox width="40%" height={12} borderRadius={4} />
        <View style={{ height: spacing.sm }} />
        <SkeletonBox width="80%" height={12} borderRadius={4} />
      </View>
    );
  }

  if (resolvedView === "error") {
    return (
      <View
        testID="quick-book-error"
        style={[
          styles.quickCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[typography.body, { color: palette.textMuted }]}>
          Não foi possível carregar horários.
        </Text>
        <View style={{ height: spacing.sm }} />
        <AmberButton label="Tentar novamente" onPress={() => setView(null)} />
      </View>
    );
  }

  if (resolvedView === "empty") {
    return (
      <View
        testID="quick-book-empty"
        style={[
          styles.quickCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[typography.subheading, { color: palette.text }]}>
          Sem horários disponíveis
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginTop: spacing.xs },
          ]}
        >
          Nenhum horário disponível nos próximos 7 dias.
        </Text>
        <View style={{ height: spacing.md }} />
        <Pressable
          style={[
            styles.outlineBtn,
            {
              borderColor: palette.border,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
          accessibilityLabel="Outro barbeiro"
        >
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Outro barbeiro
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.outlineBtn,
            {
              borderColor: palette.border,
              borderRadius: radius.sm,
              padding: spacing.sm,
            },
          ]}
          accessibilityLabel="Avisar vaga"
        >
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Avisar vaga
          </Text>
        </Pressable>
      </View>
    );
  }

  if (resolvedView === "confirmed") {
    return (
      <View
        testID="quick-book-confirmed"
        style={[
          styles.quickCard,
          {
            backgroundColor: palette.successDim,
            borderColor: palette.success,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[typography.subheading, { color: palette.success }]}>
          Agendado com sucesso!
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.success, marginTop: spacing.xs },
          ]}
        >
          Seu horário foi confirmado.
        </Text>
      </View>
    );
  }

  // idle or loaded or confirming — show full card
  return (
    <Card testID="quick-book-card">
      {/* Card header */}
      <View
        style={[
          styles.quickCardInner,
          { borderLeftColor: palette.primary, borderLeftWidth: 3 },
        ]}
      >
        <View
          style={[
            styles.initialAvatar,
            {
              backgroundColor: palette.primaryDim,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text
            style={[
              typography.bodyBold,
              { color: palette.primary, textAlign: "center" },
            ]}
          >
            {data?.barbeiroInicial ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={[typography.bodyBold, { color: palette.text }]}
            numberOfLines={1}
          >
            Repetir com {data?.barbeiroNome ?? "—"}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginTop: 2 },
            ]}
          >
            {data?.servicoNome} · {durationLabel} · {priceLabel}
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.sm }} />

      {resolvedView === "idle" && (
        <AmberButton
          testID="quick-book-btn-ver-horarios"
          label="Ver horários disponíveis"
          onPress={() => setView("loaded")}
        />
      )}

      {resolvedView === "loaded" && data && (
        <>
          {/* Group slots by dia */}
          {(() => {
            const groups = data.slots.reduce<Record<string, typeof data.slots>>(
              (acc, slot) => {
                if (!acc[slot.dia]) acc[slot.dia] = [];
                acc[slot.dia].push(slot);
                return acc;
              },
              {},
            );

            return Object.entries(groups).map(([dia, slots]) => (
              <View key={dia} style={{ marginBottom: spacing.sm }}>
                <Text
                  style={[
                    styles.diaLabel,
                    {
                      color: palette.textMuted,
                      marginBottom: spacing.xs,
                    },
                  ]}
                >
                  {dia}
                </Text>
                <View style={styles.slotsRow}>
                  {slots.map((slot) => {
                    const slotTestId = `slot-${slot.hora.replace(":", "-")}`;
                    return (
                      <Pressable
                        key={slot.inicio}
                        testID={slotTestId}
                        onPress={() => handleConfirm()}
                        style={[
                          styles.slotBtn,
                          {
                            backgroundColor: palette.primaryDim,
                            borderColor: palette.primary,
                            borderRadius: radius.sm,
                            padding: spacing.sm,
                          },
                        ]}
                        accessibilityLabel={`Horário ${slot.hora}`}
                      >
                        <Text
                          style={[typography.mono, { color: palette.primary }]}
                        >
                          {slot.hora}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ));
          })()}

          <View style={{ height: spacing.sm }} />

          <Pressable
            testID="quick-book-btn-confirmar"
            onPress={() => handleConfirm()}
            style={[
              styles.confirmBtn,
              {
                backgroundColor: palette.primary,
                borderRadius: radius.sm,
                padding: spacing.md,
                alignItems: "center",
              },
            ]}
            accessibilityLabel="Confirmar agendamento"
          >
            <Text style={[typography.bodyBold, { color: palette.primaryOn }]}>
              Confirmar
            </Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ClienteHomeScreen() {
  const { palette, spacing, radius, typography } = useTheme();
  const { barbearia, barbearias } = useAuth();
  const { data: proximo } = useProximoAgendamento();
  const { data: agendamentos } = useAgendamentosMeus();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const semBarbearias = barbearias.length === 0;
  const letraBarbearia = barbearia?.nome?.trim()[0]?.toUpperCase() ?? "?";

  return (
    <View
      style={[styles.container, { backgroundColor: palette.bg }]}
      testID="home-header"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.bg,
            borderBottomColor: palette.border,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              { fontFamily: "Sora_700Bold", fontSize: 24, lineHeight: 30 },
              { color: palette.text },
            ]}
          >
            Início
          </Text>
          {/* Pill de tenant — só aparece quando há barbearia ativa */}
          {barbearia ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Barbearia ativa: ${barbearia.nome}. Toque para trocar`}
              onPress={() => setShowSwitcher(true)}
              style={styles.tenantPill}
            >
              {/* Mini logo */}
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
          testID="btn-notificacoes"
          accessibilityLabel="Notificações"
          style={[
            styles.bellBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>{"🔔"}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        {semBarbearias ? (
          /* EmptyClienteSemBarbearia — pixel-accurate */
          <View testID="home-sem-barbearia" style={styles.emptyBarbearia}>
            <Text style={styles.emptyIcon}>✂</Text>
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
            {/* NextAptCard */}
            {proximo ? (
              <View
                testID="next-apt-card"
                style={[
                  styles.nextAptPill,
                  {
                    backgroundColor: palette.primaryDim,
                    borderColor: palette.primary,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs + 2,
                    marginBottom: spacing.md,
                    alignSelf: "flex-start",
                  },
                ]}
              >
                <Text
                  style={[typography.captionBold, { color: palette.primary }]}
                >
                  {"Próximo · "}
                  {format(parseISO(proximo.inicio), "HH:mm", { locale: ptBR })}
                  {" · "}
                  {proximo.itens[0]?.servico.nome ?? "Serviço"}
                </Text>
              </View>
            ) : null}

            {/* QuickBookCard */}
            <QuickBookCard />

            {/* Stats grid */}
            {agendamentos !== undefined && agendamentos !== null ? (
              <View style={styles.statsRow}>
                <View
                  testID="stats-visitas"
                  style={[
                    styles.statsCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginRight: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statsNumber,
                      { color: palette.text, fontFamily: "Sora_700Bold" },
                    ]}
                  >
                    {agendamentos.length}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.textMuted, marginTop: 2 },
                    ]}
                  >
                    Visitas
                  </Text>
                </View>
                <View
                  testID="stats-ticket"
                  style={[
                    styles.statsCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      borderRadius: radius.md,
                      padding: spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statsNumber,
                      { color: palette.text, fontFamily: "Sora_700Bold" },
                    ]}
                  >
                    {"—"}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.textMuted, marginTop: 2 },
                    ]}
                  >
                    Ticket médio
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  // ── EmptyClienteSemBarbearia
  emptyBarbearia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 72,
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
    color: "#f5f5f5",
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
    borderColor: "#262626",
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
  emptyBox: {
    borderWidth: 1,
    alignItems: "center",
  },
  nextAptPill: {
    borderWidth: 1,
  },
  quickCard: {
    borderWidth: 1,
  },
  quickCardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  initialAvatar: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotBtn: {
    borderWidth: 1,
    minWidth: 64,
    alignItems: "center",
  },
  confirmBtn: {
    // base styles applied inline
  },
  outlineBtn: {
    borderWidth: 1,
    alignItems: "center",
  },
  diaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  statsCard: {
    flex: 1,
    borderWidth: 1,
  },
  statsNumber: {
    fontSize: 24,
    lineHeight: 30,
  },
});
