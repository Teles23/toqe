import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, Avatar } from "@/src/shared/ui";

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

function formatDateChip(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${d}/${months[parseInt(m, 10) - 1]}`;
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AgendarScreen() {
  const { palette, spacing, radius, typography } = useTheme();
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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#22c55e20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ fontSize: 32, color: "#22c55e" }}>✓</Text>
        </View>

        <Text
          style={{
            fontFamily: "Sora_700Bold",
            fontSize: 22,
            color: palette.text,
            textAlign: "center",
            marginBottom: spacing.sm,
            letterSpacing: -0.55,
          }}
        >
          Reserva confirmada!
        </Text>

        {/* Ticket card */}
        <View
          style={{
            backgroundColor: "#171717",
            borderRadius: 16,
            padding: 16,
            width: "100%",
            marginTop: spacing.md,
            borderWidth: 1,
            borderColor: "#262626",
            gap: 8,
          }}
        >
          {slotDate ? (
            <Text
              style={{
                fontFamily: "Sora_700Bold",
                fontSize: 18,
                color: palette.primary,
                marginBottom: 4,
              }}
            >
              {slotDate}
              {slotTime ? ` · ${slotTime}` : ""}
            </Text>
          ) : null}
          {selectedBarbeiro ? (
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 13,
                color: palette.text,
              }}
            >
              Barbeiro: {selectedBarbeiro.nome}
            </Text>
          ) : null}
          {selectedServico ? (
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 13,
                color: palette.text,
              }}
            >
              Serviço: {selectedServico.nome}
            </Text>
          ) : null}
          {preco ? (
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 13,
                color: palette.text,
              }}
            >
              Valor: {preco}
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: spacing.xl, width: "100%" }}>
          <AmberButton label="Ir pra Home" onPress={() => router.back()} />
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
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <Pressable
          testID="agendar-btn-voltar"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Text style={[typography.body, { color: palette.primary }]}>‹</Text>
        </Pressable>
        <Text style={[typography.label, { color: palette.textMuted, flex: 1 }]}>
          Passo {step + 1}/4 · {STEP_LABELS[step]}
        </Text>
      </View>

      {/* Barra de progresso */}
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
              styles.progressSegment,
              {
                backgroundColor:
                  i <= step ? palette.primary : palette.borderStrong,
                borderRadius: radius.full,
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
              {
                backgroundColor: palette.surface,
                borderColor: isSelected ? palette.primary : palette.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
          >
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
            <Text
              style={[
                typography.bodyMedium,
                { color: palette.text, marginLeft: spacing.sm, flex: 1 },
              ]}
              numberOfLines={1}
            >
              {b.nome}
            </Text>
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
  const { palette, spacing, radius, typography } = useTheme();

  return (
    <View testID="step-data">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
      >
        {days.map((d) => {
          const isSelected = d === selected;
          return (
            <Pressable
              key={d}
              testID={`data-${d}`}
              accessibilityRole="button"
              onPress={() => onSelect(d)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: isSelected
                    ? palette.primary
                    : palette.surface,
                  borderColor: isSelected ? palette.primary : palette.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  {
                    color: isSelected ? palette.primaryOn : palette.text,
                    fontFamily: isSelected
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                  },
                ]}
              >
                {formatDateChip(d)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
  const { palette, radius, typography } = useTheme();

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
        <Text style={[typography.body, { color: palette.textMuted }]}>
          Nenhum horário disponível para esta data.
        </Text>
      </View>
    );
  }

  return (
    <View testID="step-horario" style={styles.slotsGrid}>
      {slots.map((slot) => {
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
                backgroundColor: isSelected ? palette.primary : palette.surface,
                borderColor: isSelected ? palette.primary : palette.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                {
                  fontFamily: "JetBrainsMono_500Medium",
                  fontSize: 14,
                  lineHeight: 20,
                },
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
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
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
  dateChip: {
    borderWidth: 1,
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
  cta: {
    borderTopWidth: 1,
  },
  confirmado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
