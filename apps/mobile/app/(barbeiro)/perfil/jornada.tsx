import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type DiaJornadaView,
  mergeJornadaComSemana,
  useJornada,
} from "@/src/shared/hooks/barbeiro/use-jornada";
import { useSalvarJornada } from "@/src/shared/hooks/barbeiro/use-salvar-jornada";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  GhostButton,
  ScreenHeader,
  SkeletonBox,
} from "@/src/shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiaJornada = DiaJornadaView;

const VIOLET = "#a78bfa";

const HORA_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Aplica máscara HH:mm conforme o usuário digita (só dígitos, `:` após 2). */
function maskHora(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Campo de horário editável (TextInput com máscara HH:mm). */
function TimeField({
  label,
  value,
  onChangeText,
  accentColor,
  invalid,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  accentColor: string;
  invalid?: boolean;
  testID?: string;
}) {
  return (
    <View
      style={[
        timeFieldStyles.chip,
        invalid ? timeFieldStyles.chipInvalid : null,
      ]}
    >
      <Text style={timeFieldStyles.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={(t) => onChangeText(maskHora(t))}
        keyboardType="number-pad"
        maxLength={5}
        placeholder="HH:mm"
        placeholderTextColor="#555555"
        style={[timeFieldStyles.value, { color: accentColor }]}
      />
    </View>
  );
}

const timeFieldStyles = StyleSheet.create({
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
  chipInvalid: {
    borderColor: "#ff3b30",
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
    padding: 0,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Sub-tela de jornada de trabalho.
 * Carrega a jornada salva (GET /agenda/jornada/:barbeiroId) e persiste a semana
 * inteira numa transação (PUT) ao salvar.
 */
export default function JornadaScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: jornadaSalva, isLoading, isError, refetch } = useJornada();
  const [jornada, setJornada] = useState<DiaJornada[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const { mutate, isPending } = useSalvarJornada();

  // Hidrata o estado local quando os dados salvos chegam (merge com os 7 dias).
  useEffect(() => {
    if (jornadaSalva) setJornada(mergeJornadaComSemana(jornadaSalva));
  }, [jornadaSalva]);

  const toggleDia = useCallback((index: number, value: boolean) => {
    setJornada((prev) =>
      prev.map((d, i) =>
        i !== index
          ? d
          : {
              ...d,
              ativo: value,
              // Ao ativar, inicializa com defaults se ainda estiver vazio.
              abre: value ? (d.abre ?? "09:00") : d.abre,
              fecha: value ? (d.fecha ?? "18:00") : d.fecha,
              almoco: value
                ? (d.almoco ?? { de: "12:00", ate: "13:00" })
                : d.almoco,
            },
      ),
    );
  }, []);

  const updateHora = useCallback(
    (
      index: number,
      campo: "abre" | "fecha" | "almocoDe" | "almocoAte",
      valor: string,
    ) => {
      setJornada((prev) =>
        prev.map((d, i) => {
          if (i !== index) return d;
          if (campo === "abre") return { ...d, abre: valor };
          if (campo === "fecha") return { ...d, fecha: valor };
          const almoco = d.almoco ?? { de: "12:00", ate: "13:00" };
          return {
            ...d,
            almoco:
              campo === "almocoDe"
                ? { ...almoco, de: valor }
                : { ...almoco, ate: valor },
          };
        }),
      );
    },
    [],
  );

  const handleSalvar = useCallback(() => {
    setErro(null);

    // Validação client-side dos dias ATIVOS (espelha o schema do backend):
    // formato HH:mm, início < fim e almoço dentro do expediente — evita 400.
    for (const d of jornada) {
      if (!d.ativo) continue;
      const { abre, fecha, almoco } = d;
      const de = almoco?.de ?? "12:00";
      const ate = almoco?.ate ?? "13:00";
      if (
        !abre ||
        !fecha ||
        !HORA_RE.test(abre) ||
        !HORA_RE.test(fecha) ||
        !HORA_RE.test(de) ||
        !HORA_RE.test(ate)
      ) {
        setErro(`${d.dia}: horário inválido — use HH:mm.`);
        return;
      }
      if (abre >= fecha) {
        setErro(`${d.dia}: a abertura deve ser antes do fechamento.`);
        return;
      }
      if (de >= ate) {
        setErro(`${d.dia}: o início do almoço deve ser antes do fim.`);
        return;
      }
      if (de < abre || ate > fecha) {
        setErro(`${d.dia}: o almoço deve estar dentro do expediente.`);
        return;
      }
    }

    mutate(
      jornada.map((d) => ({
        dia: d.diaSemana,
        inicio: d.abre ?? "09:00",
        fim: d.fecha ?? "18:00",
        ativo: d.ativo,
        almocoIni: d.almoco?.de ?? "12:00",
        almocoFim: d.almoco?.ate ?? "13:00",
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
      <ScreenHeader title="Jornada de trabalho" onBack={() => router.back()} />

      {isLoading ? (
        <View
          testID="jornada-loading"
          style={{ padding: spacing.md, gap: spacing.sm }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBox
              key={i}
              width="100%"
              height={64}
              borderRadius={radius.md}
            />
          ))}
        </View>
      ) : isError ? (
        <View testID="jornada-error-state" style={styles.centerState}>
          <Text
            style={[
              typography.body,
              { color: palette.textMuted, textAlign: "center" },
            ]}
          >
            Não foi possível carregar sua jornada.
          </Text>
          <GhostButton
            label="Tentar novamente"
            onPress={() => void refetch()}
          />
        </View>
      ) : (
        <>
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
                        {
                          color: d.ativo ? palette.primary : palette.textMuted,
                        },
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
                        style={[
                          typography.caption,
                          { color: palette.textMuted },
                        ]}
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

                {/* ── Time fields (editáveis) ── */}
                {d.ativo ? (
                  <View
                    style={[
                      styles.timeGrid,
                      { marginTop: spacing.sm, borderTopColor: palette.border },
                    ]}
                  >
                    <TimeField
                      label="Abertura"
                      value={d.abre ?? ""}
                      onChangeText={(v) => updateHora(index, "abre", v)}
                      accentColor={palette.primary}
                      invalid={!!d.abre && !HORA_RE.test(d.abre)}
                      testID={`hora-abre-${d.diaShort.toLowerCase()}`}
                    />
                    <TimeField
                      label="Fechamento"
                      value={d.fecha ?? ""}
                      onChangeText={(v) => updateHora(index, "fecha", v)}
                      accentColor={palette.primary}
                      invalid={!!d.fecha && !HORA_RE.test(d.fecha)}
                      testID={`hora-fecha-${d.diaShort.toLowerCase()}`}
                    />
                    <TimeField
                      label="Almoço de"
                      value={d.almoco?.de ?? ""}
                      onChangeText={(v) => updateHora(index, "almocoDe", v)}
                      accentColor={VIOLET}
                      invalid={!!d.almoco?.de && !HORA_RE.test(d.almoco.de)}
                      testID={`hora-almoco-de-${d.diaShort.toLowerCase()}`}
                    />
                    <TimeField
                      label="Almoço até"
                      value={d.almoco?.ate ?? ""}
                      onChangeText={(v) => updateHora(index, "almocoAte", v)}
                      accentColor={VIOLET}
                      invalid={!!d.almoco?.ate && !HORA_RE.test(d.almoco.ate)}
                      testID={`hora-almoco-ate-${d.diaShort.toLowerCase()}`}
                    />
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
                paddingBottom: insets.bottom + spacing.md,
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
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
