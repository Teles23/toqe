import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useSalvarJornada } from "@/src/shared/hooks/barbeiro/use-salvar-jornada";
import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiaJornada {
  /** 0 = domingo, 1 = segunda … 6 = sábado (padrão ISO/API) */
  diaSemana: number;
  dia: string;
  diaShort: string;
  abre: string | null;
  fecha: string | null;
  ativo: boolean;
  /** Janela de almoço (exibição; persistência fica para fase futura). */
  almoco: { de: string; ate: string } | null;
}

const VIOLET = "#a78bfa";

/** Chip de horário read-only no estilo do protótipo. */
function TimeChip({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <View style={timeChipStyles.chip}>
      <Text style={timeChipStyles.label}>{label}</Text>
      <Text style={[timeChipStyles.value, { color: accentColor }]}>
        {value}
      </Text>
    </View>
  );
}

const timeChipStyles = StyleSheet.create({
  chip: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#1c1c1c",
  },
  label: {
    fontSize: 9,
    color: "#666666",
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  value: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
});

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_JORNADA: DiaJornada[] = [
  {
    diaSemana: 1,
    dia: "Segunda",
    diaShort: "SEG",
    abre: "09:00",
    fecha: "18:00",
    ativo: true,
    almoco: { de: "12:00", ate: "13:00" },
  },
  {
    diaSemana: 2,
    dia: "Terça",
    diaShort: "TER",
    abre: "09:00",
    fecha: "18:00",
    ativo: true,
    almoco: { de: "12:00", ate: "13:00" },
  },
  {
    diaSemana: 3,
    dia: "Quarta",
    diaShort: "QUA",
    abre: "09:00",
    fecha: "18:00",
    ativo: true,
    almoco: { de: "12:00", ate: "13:00" },
  },
  {
    diaSemana: 4,
    dia: "Quinta",
    diaShort: "QUI",
    abre: "09:00",
    fecha: "18:00",
    ativo: true,
    almoco: { de: "12:00", ate: "13:00" },
  },
  {
    diaSemana: 5,
    dia: "Sexta",
    diaShort: "SEX",
    abre: "09:00",
    fecha: "20:00",
    ativo: true,
    almoco: { de: "12:00", ate: "13:00" },
  },
  {
    diaSemana: 6,
    dia: "Sábado",
    diaShort: "SAB",
    abre: "08:00",
    fecha: "17:00",
    ativo: true,
    almoco: null,
  },
  {
    diaSemana: 0,
    dia: "Domingo",
    diaShort: "DOM",
    abre: null,
    fecha: null,
    ativo: false,
    almoco: null,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Sub-tela de jornada de trabalho.
 * Salvar persiste via POST /agenda/jornada/:barbeiroId por dia ativo.
 */
export default function JornadaScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const [jornada, setJornada] = useState<DiaJornada[]>(INITIAL_JORNADA);
  const [erro, setErro] = useState<string | null>(null);
  const { mutate, isPending } = useSalvarJornada();

  const toggleDia = useCallback((index: number, value: boolean) => {
    setJornada((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ativo: value } : d)),
    );
  }, []);

  const handleSalvar = useCallback(() => {
    setErro(null);
    mutate(
      jornada.map((d) => ({
        dia: d.diaSemana,
        inicio: d.abre ?? "09:00",
        fim: d.fecha ?? "18:00",
        ativo: d.ativo,
      })),
      {
        onSuccess: () => router.back(),
        onError: (e) =>
          setErro(e.message ?? "Erro ao salvar jornada. Tente novamente."),
      },
    );
  }, [jornada, mutate]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Top bar ── */}
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Text style={{ color: palette.primary, fontSize: 20 }}>‹</Text>
        </Pressable>
        <Text
          style={[
            typography.subheading,
            { color: palette.text, flex: 1, marginLeft: spacing.sm },
          ]}
        >
          Jornada de trabalho
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxxl + 64,
        }}
      >
        {jornada.map((d, index) => (
          <View
            key={d.diaShort}
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.border,
                marginBottom: spacing.sm,
                padding: spacing.md,
              },
            ]}
          >
            {/* ── Card header ── */}
            <View style={styles.cardHeader}>
              {/* Day pill — quadrado 36×36 mono */}
              <View
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: d.ativo
                      ? palette.primary + "1a"
                      : palette.surfaceHigh,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    { color: d.ativo ? palette.primary : palette.textMuted },
                  ]}
                >
                  {d.diaShort}
                </Text>
              </View>

              {/* Full day name + hours/Folga */}
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.label, { color: palette.text }]}>
                  {d.dia}
                </Text>
                {d.ativo && d.abre && d.fecha ? (
                  <Text
                    style={[typography.caption, { color: palette.textMuted }]}
                  >
                    {d.abre} – {d.fecha}
                  </Text>
                ) : (
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.textDisabled },
                    ]}
                  >
                    Folga
                  </Text>
                )}
              </View>

              {/* Toggle */}
              <Switch
                testID={`toggle-${d.diaShort.toLowerCase()}`}
                value={d.ativo}
                onValueChange={(val) => toggleDia(index, val)}
                trackColor={{
                  false: palette.border,
                  true: palette.primary,
                }}
                thumbColor={palette.bg}
              />
            </View>

            {/* ── Time chips (read-only) ── */}
            {d.ativo && d.abre && d.fecha ? (
              <View
                style={[
                  styles.timeGrid,
                  { marginTop: spacing.sm, borderTopColor: palette.border },
                ]}
              >
                <TimeChip
                  label="Abertura"
                  value={d.abre}
                  accentColor={palette.primary}
                />
                <TimeChip
                  label="Fechamento"
                  value={d.fecha}
                  accentColor={palette.primary}
                />
                {d.almoco ? (
                  <>
                    <TimeChip
                      label="Almoço de"
                      value={d.almoco.de}
                      accentColor={VIOLET}
                    />
                    <TimeChip
                      label="Almoço até"
                      value={d.almoco.ate}
                      accentColor={VIOLET}
                    />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* ── Sticky bottom ── */}
      <View
        style={[
          styles.stickyBottom,
          {
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            backgroundColor: palette.bg,
          },
        ]}
      >
        {erro ? (
          <Text
            testID="jornada-error"
            style={[
              typography.caption,
              {
                color: palette.danger,
                marginBottom: spacing.sm,
                textAlign: "center",
              },
            ]}
          >
            {erro}
          </Text>
        ) : null}
        <AmberButton
          testID="btn-salvar-jornada"
          label="Salvar mudanças"
          onPress={handleSalvar}
          loading={isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center" },
  card: {},
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillText: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stickyBottom: {},
});
