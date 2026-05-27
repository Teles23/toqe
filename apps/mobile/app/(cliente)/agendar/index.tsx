import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  Avatar,
  CircleIconButton,
  GhostButton,
} from "@/src/shared/ui";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Servico {
  codigo: number;
  nome: string;
  duracao: number;
  preco: number;
}

interface Barbeiro {
  usrCodigo: number;
  nome: string;
  avatarUrl: string | null;
  nota?: number | null;
  disponivel?: boolean;
}

interface Slot {
  inicio: string;
  hora: string;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

const STEP_LABELS = ["Serviço", "Barbeiro", "Data", "Horário"];

/** Gera os próximos 7 dias como strings YYYY-MM-DD */
function getNext7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const names = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  return names[date.getDay()];
}

interface DateParts {
  day: string;
  dayName: string;
  month: string;
}

function parseDateParts(dateStr: string): DateParts {
  const [, m, d] = dateStr.split("-");
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return {
    day: d,
    dayName: getDayOfWeek(dateStr),
    month: months[parseInt(m, 10) - 1],
  };
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AgendarScreen() {
  const { palette, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<Barbeiro | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const days = getNext7Days();

  // ─── Queries ─────────────────────────────────────────────────────────────

  const servicosQuery = useQuery<{ items: Servico[] }>({
    queryKey: ["publico-servicos", slug],
    queryFn: () => api.get<{ items: Servico[] }>(`/publico/${slug}/servicos`),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const barbeirosQuery = useQuery<{ items: Barbeiro[] }>({
    queryKey: ["publico-barbeiros", slug],
    queryFn: () => api.get<{ items: Barbeiro[] }>(`/publico/${slug}/barbeiros`),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const slotsQuery = useQuery<{ slots: Slot[] }>({
    queryKey: [
      "slots",
      slug,
      selectedBarbeiro?.usrCodigo,
      selectedServico?.codigo,
      selectedDate,
    ],
    queryFn: () =>
      api.get<{ slots: Slot[] }>(
        `/publico/${slug}/slots?barbeiroId=${selectedBarbeiro!.usrCodigo}&servicoId=${selectedServico!.codigo}&data=${selectedDate}`,
      ),
    enabled:
      step === 3 &&
      !!selectedBarbeiro &&
      !!selectedServico &&
      !!selectedDate &&
      !!slug,
    staleTime: 30_000,
  });

  // ─── Navegação entre passos ───────────────────────────────────────────────

  function handleBack() {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }

  function isContinueEnabled(): boolean {
    switch (step) {
      case 0:
        return selectedServico !== null;
      case 1:
        return selectedBarbeiro !== null;
      case 2:
        return selectedDate !== "";
      case 3:
        return selectedSlot !== "";
      default:
        return false;
    }
  }

  async function handleContinue() {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    // step 3 — confirmar reserva
    if (!selectedServico || !selectedBarbeiro || !selectedSlot || !slug) return;
    setConfirming(true);
    try {
      await api.post(`/publico/${slug}/agendamentos`, {
        barbeiroId: selectedBarbeiro.usrCodigo,
        servicoId: selectedServico.codigo,
        inicio: selectedSlot,
        clienteId: user?.codigo ?? undefined,
      });
      setConfirmed(true);
    } catch {
      // erro silencioso — UI fica no step 3 para retry
    } finally {
      setConfirming(false);
    }
  }

  // ─── Estado confirmado ────────────────────────────────────────────────────

  if (confirmed) {
    // Formata data e hora para exibição no ticket
    const slotDate = selectedSlot
      ? new Date(selectedSlot).toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
      : "";
    const slotTime = selectedSlot
      ? new Date(selectedSlot).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const preco = selectedServico
      ? `R$ ${Number(selectedServico.preco).toFixed(2).replace(".", ",")}`
      : "";

    return (
      <View
        testID="agendar-confirmado"
        style={[
          styles.confirmado,
          { backgroundColor: palette.bg, padding: spacing.lg },
        ]}
      >
        {/* Ícone de sucesso */}
        <View style={styles.successIcon}>
          <Feather name="check" size={36} color="#22c55e" />
        </View>

        <Text style={[styles.confirmedTitle, { color: palette.text }]}>
          Reserva confirmada!
        </Text>

        {/* Ticket card */}
        <View style={styles.ticketCard}>
          {slotDate ? (
            <Text style={[styles.ticketDateText, { color: palette.primary }]}>
              {slotDate}
              {slotTime ? ` · ${slotTime}` : ""}
            </Text>
          ) : null}
          {selectedBarbeiro ? (
            <Text style={styles.ticketDetailText}>
              Barbeiro: {selectedBarbeiro.nome}
            </Text>
          ) : null}
          {selectedServico ? (
            <Text style={styles.ticketDetailText}>
              Serviço: {selectedServico.nome}
            </Text>
          ) : null}
          {preco ? (
            <Text style={styles.ticketDetailText}>Valor: {preco}</Text>
          ) : null}
        </View>

        <View style={[styles.ctaBlock, { marginTop: spacing.xl }]}>
          <AmberButton label="Ir pra Home" onPress={() => router.back()} />
          <GhostButton
            label="Adicionar ao calendário"
            onPress={() => {
              /* calendário — futuro */
            }}
          />
        </View>
      </View>
    );
  }

  // ─── Render principal ─────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.md,
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.sm,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <CircleIconButton
          testID="agendar-btn-voltar"
          icon="chevron-left"
          iconSize={20}
          size={40}
          iconColor={palette.text}
          background={palette.surface}
          borderColor={palette.border}
          onPress={handleBack}
          accessibilityLabel="Voltar"
        />
        <Text style={[typography.label, { color: palette.textMuted, flex: 1 }]}>
          Passo {step + 1}/4 · {STEP_LABELS[step]}
        </Text>
      </View>

      {/* Indicador de progresso — dots */}
      <View
        testID="progress-bar"
        style={[
          styles.progressRow,
          { paddingHorizontal: spacing.md, marginBottom: spacing.md },
        ]}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= step ? palette.primary : palette.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Conteúdo do passo */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        {step === 0 && (
          <StepServico
            servicos={servicosQuery.data?.items ?? []}
            isLoading={servicosQuery.isLoading}
            selected={selectedServico}
            onSelect={setSelectedServico}
          />
        )}
        {step === 1 && (
          <StepBarbeiro
            barbeiros={barbeirosQuery.data?.items ?? []}
            isLoading={barbeirosQuery.isLoading}
            selected={selectedBarbeiro}
            onSelect={setSelectedBarbeiro}
          />
        )}
        {step === 2 && (
          <StepData
            days={days}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        )}
        {step === 3 && (
          <StepHorario
            slots={slotsQuery.data?.slots ?? []}
            isLoading={slotsQuery.isLoading}
            selected={selectedSlot}
            onSelect={setSelectedSlot}
          />
        )}
      </ScrollView>

      {/* CTA */}
      <View
        style={[
          styles.cta,
          {
            padding: spacing.md,
            borderTopColor: palette.border,
            backgroundColor: palette.bg,
          },
        ]}
      >
        <AmberButton
          testID="agendar-btn-continuar"
          label={step === 3 ? "Confirmar reserva" : "Continuar"}
          disabled={!isContinueEnabled()}
          loading={confirming}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

// ─── Sub-telas ────────────────────────────────────────────────────────────────

function StepServico({
  servicos,
  isLoading,
  selected,
  onSelect,
}: {
  servicos: Servico[];
  isLoading: boolean;
  selected: Servico | null;
  onSelect: (s: Servico) => void;
}) {
  const { palette, spacing, radius, typography } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View testID="step-servico">
      {servicos.map((s) => {
        const isSelected = selected?.codigo === s.codigo;
        return (
          <Pressable
            key={s.codigo}
            testID={`servico-${s.codigo}`}
            accessibilityRole="button"
            onPress={() => onSelect(s)}
            style={[
              styles.card,
              styles.row,
              {
                backgroundColor: palette.surface,
                borderColor: isSelected ? palette.primary : palette.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
          >
            {/* Ícone da tesoura */}
            <View style={styles.servicoIconBox}>
              <Feather name="scissors" size={18} color={palette.primary} />
            </View>
            {/* Detalhes do serviço */}
            <View style={styles.servicoInfo}>
              <Text
                style={[typography.bodyBold, { color: palette.text }]}
                numberOfLines={1}
              >
                {s.nome}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: palette.textMuted, marginTop: 2 },
                ]}
              >
                {s.duracao} min · R${" "}
                {Number(s.preco).toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepBarbeiro({
  barbeiros,
  isLoading,
  selected,
  onSelect,
}: {
  barbeiros: Barbeiro[];
  isLoading: boolean;
  selected: Barbeiro | null;
  onSelect: (b: Barbeiro) => void;
}) {
  const { palette, spacing, radius, typography } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View testID="step-barbeiro">
      {barbeiros.map((b) => {
        const isSelected = selected?.usrCodigo === b.usrCodigo;
        const nota = b.nota ?? null;
        const disponivel = b.disponivel ?? true;
        return (
          <Pressable
            key={b.usrCodigo}
            testID={`barbeiro-${b.usrCodigo}`}
            accessibilityRole="button"
            onPress={() => onSelect(b)}
            style={[
              styles.card,
              styles.row,
              {
                backgroundColor: palette.surface,
                borderColor: isSelected ? palette.primary : palette.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Avatar uri={b.avatarUrl} name={b.nome} size="sm" />
            <View style={[styles.barbeiroInfo, { marginLeft: spacing.sm }]}>
              <Text
                style={[
                  typography.bodyBold,
                  { color: palette.text, fontSize: 14 },
                ]}
                numberOfLines={1}
              >
                {b.nome}
              </Text>
              <View style={styles.barbeiroMeta}>
                <Feather name="star" size={11} color={palette.primary} />
                <Text style={styles.barbeiroNota}>
                  {nota !== null ? String(nota) : "—"}
                </Text>
                {!disponivel && (
                  <View style={styles.folga}>
                    <Text style={styles.folgaText}>FOLGA</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepData({
  days,
  selected,
  onSelect,
}: {
  days: string[];
  selected: string;
  onSelect: (d: string) => void;
}) {
  const { palette, spacing } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 48) / 2;

  return (
    <View testID="step-data">
      <View style={[styles.dataGrid, { gap: spacing.sm }]}>
        {days.map((d) => {
          const isSelected = d === selected;
          const { day, dayName, month } = parseDateParts(d);
          return (
            <Pressable
              key={d}
              testID={`data-${d}`}
              accessibilityRole="button"
              onPress={() => onSelect(d)}
              style={[
                styles.dateCard,
                {
                  width: cardWidth,
                  backgroundColor: isSelected
                    ? palette.primary
                    : palette.surfaceHigh,
                  borderColor: isSelected ? palette.primary : palette.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateCardDayName,
                  { color: isSelected ? palette.primaryOn : palette.textMuted },
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.dateCardDay,
                  { color: isSelected ? palette.primaryOn : palette.text },
                ]}
              >
                {day}
              </Text>
              <Text
                style={[
                  styles.dateCardMonth,
                  { color: isSelected ? palette.primaryOn : palette.textMuted },
                ]}
              >
                {month}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepHorario({
  slots,
  isLoading,
  selected,
  onSelect,
}: {
  slots: Slot[];
  isLoading: boolean;
  selected: string;
  onSelect: (s: string) => void;
}) {
  const { palette, radius } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View testID="step-horario" style={styles.center}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: palette.textMuted,
          }}
        >
          Nenhum horário disponível para esta data.
        </Text>
      </View>
    );
  }

  const manha = slots.filter((s) => s.hora < "12:00");
  const tarde = slots.filter((s) => s.hora >= "12:00");

  return (
    <View testID="step-horario">
      {manha.length > 0 && (
        <View>
          <Text style={styles.slotSectionLabel}>Manhã</Text>
          <View style={styles.slotsGrid}>
            {manha.map((slot) => {
              const isSelected = slot.inicio === selected;
              const slotTestId = `slot-${slot.hora.replace(":", "-")}`;
              return (
                <Pressable
                  key={slot.inicio}
                  testID={slotTestId}
                  accessibilityRole="button"
                  onPress={() => onSelect(slot.inicio)}
                  style={[
                    styles.slotBtn,
                    {
                      backgroundColor: isSelected
                        ? palette.primary
                        : palette.surface,
                      borderColor: isSelected
                        ? palette.primary
                        : palette.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.slotText,
                      {
                        color: isSelected ? palette.primaryOn : palette.text,
                      },
                    ]}
                  >
                    {slot.hora}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      {tarde.length > 0 && (
        <View style={manha.length > 0 ? styles.slotSectionGap : undefined}>
          <Text style={styles.slotSectionLabel}>Tarde</Text>
          <View style={styles.slotsGrid}>
            {tarde.map((slot) => {
              const isSelected = slot.inicio === selected;
              const slotTestId = `slot-${slot.hora.replace(":", "-")}`;
              return (
                <Pressable
                  key={slot.inicio}
                  testID={slotTestId}
                  accessibilityRole="button"
                  onPress={() => onSelect(slot.inicio)}
                  style={[
                    styles.slotBtn,
                    {
                      backgroundColor: isSelected
                        ? palette.primary
                        : palette.surface,
                      borderColor: isSelected
                        ? palette.primary
                        : palette.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.slotText,
                      {
                        color: isSelected ? palette.primaryOn : palette.text,
                      },
                    ]}
                  >
                    {slot.hora}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    alignItems: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  // StepServico
  servicoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F4B40014",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  servicoInfo: {
    flex: 1,
  },
  // StepBarbeiro
  barbeiroInfo: {
    flex: 1,
  },
  barbeiroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  barbeiroNota: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#aaaaaa",
  },
  folga: {
    backgroundColor: "#ef44441a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  folgaText: {
    color: "#ef4444",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  // StepData
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCard: {
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dateCardDayName: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateCardDay: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    lineHeight: 24,
  },
  dateCardMonth: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  // StepHorario
  slotSectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#666666",
    marginBottom: 8,
  },
  slotSectionGap: {
    marginTop: 16,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: "center",
  },
  slotText: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    borderTopWidth: 1,
  },
  ctaBlock: {
    width: "100%",
    gap: 12,
  },
  confirmado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22c55e20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmedTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.55,
  },
  ticketCard: {
    backgroundColor: "#171717",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#262626",
    gap: 8,
  },
  ticketDateText: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  ticketDetailText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#f5f5f5",
  },
});
