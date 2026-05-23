/**
 * BloqueioSheet — bottom sheet para bloquear um intervalo da agenda.
 *
 * Permite ao barbeiro configurar:
 *  - Motivo (Almoço / Limpeza / Folga pessoal / Outro)
 *  - Duração em minutos (15 / 30 / 45 / 60 / 90 / 120)
 *  - Recorrente: repetir toda semana no mesmo horário
 *
 * Ao confirmar, chama `onConfirm` com os dados selecionados. O chamador
 * é responsável por calcular `inicio`/`fim` e chamar `useCriarBloqueio`.
 *
 * Acento visual: violet #a78bfa — diferencia do amber da agenda principal.
 */

import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/shared/theme";
import { BottomSheet } from "@/src/shared/ui";

// ─── Constantes ───────────────────────────────────────────────────────────────

const VIOLET = "#a78bfa";

const MOTIVOS: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { label: "Almoço", icon: "coffee" },
  { label: "Limpeza", icon: "wind" },
  { label: "Folga pessoal", icon: "pause-circle" },
  { label: "Outro", icon: "edit-2" },
];

const DURACOES = [15, 30, 45, 60, 90, 120] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BloqueioConfirmData {
  motivo: string;
  duration: number;
  recorrente: boolean;
}

export interface BloqueioSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: BloqueioConfirmData) => void;
  loading?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function BloqueioSheet({
  visible,
  onClose,
  onConfirm,
  loading,
}: BloqueioSheetProps) {
  const { palette, spacing, typography, radius } = useTheme();

  const [motivo, setMotivo] = useState<string>("Almoço");
  const [duration, setDuration] = useState<number>(60);
  const [recorrente, setRecorrente] = useState(false);

  const handleConfirm = () => {
    onConfirm({ motivo, duration, recorrente });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height="content"
      testID="bloqueio-sheet"
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={[styles.sheetHeader, { marginBottom: spacing.md }]}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: VIOLET + "1a",
                borderColor: VIOLET + "40",
                borderRadius: radius.sm,
              },
            ]}
          >
            <Feather name="pause-circle" size={22} color={VIOLET} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.subheading, { color: palette.text }]}>
              Bloquear horário
            </Text>
            <Text
              style={[
                typography.caption,
                { color: palette.textMuted, marginTop: 2 },
              ]}
            >
              Vai sumir da agenda dos clientes
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}
        >
          {/* Motivo */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: palette.textDisabled }]}
            >
              MOTIVO
            </Text>
            <View style={styles.motivoGrid}>
              {MOTIVOS.map((m) => {
                const active = motivo === m.label;
                return (
                  <Pressable
                    key={m.label}
                    testID={`motivo-${m.label}`}
                    onPress={() => setMotivo(m.label)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={({ pressed }) => [
                      styles.chipBtn,
                      {
                        backgroundColor: active
                          ? VIOLET + "1c"
                          : palette.surfaceHigh,
                        borderColor: active ? VIOLET : palette.borderStrong,
                        borderRadius: radius.sm,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={m.icon}
                      size={16}
                      color={active ? VIOLET : "#888888"}
                    />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: active ? VIOLET : palette.textMuted,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Duração */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: palette.textDisabled }]}
            >
              DURAÇÃO
            </Text>
            <View style={styles.duracaoGrid}>
              {DURACOES.map((d) => {
                const active = duration === d;
                return (
                  <Pressable
                    key={d}
                    testID={`duracao-${d}`}
                    onPress={() => setDuration(d)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={({ pressed }) => [
                      styles.duracaoChip,
                      {
                        backgroundColor: active
                          ? VIOLET + "1c"
                          : palette.surfaceHigh,
                        borderColor: active ? VIOLET : palette.borderStrong,
                        borderRadius: radius.sm,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: active ? VIOLET : palette.textMuted,
                          fontWeight: active ? "700" : "500",
                          fontFamily: "JetBrainsMono_400Regular",
                        },
                      ]}
                    >
                      {d}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Toggle recorrente */}
          <View
            style={[
              styles.recorrenteRow,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.label,
                  { color: palette.text, fontWeight: "600" },
                ]}
              >
                Toda semana?
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: palette.textMuted, marginTop: 2 },
                ]}
              >
                Bloqueio recorrente no mesmo horário
              </Text>
            </View>
            <Switch
              testID="toggle-recorrente"
              value={recorrente}
              onValueChange={setRecorrente}
              trackColor={{
                false: palette.borderStrong,
                true: VIOLET,
              }}
              thumbColor="#ffffff"
              accessibilityLabel="Recorrente toda semana"
            />
          </View>

          {/* Dica informativa */}
          <View
            style={[
              styles.dica,
              {
                backgroundColor: VIOLET + "10",
                borderColor: VIOLET + "30",
                borderRadius: radius.sm,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              },
            ]}
          >
            <Feather name="info" size={13} color={VIOLET + "cc"} />
            <Text
              style={[typography.caption, { color: VIOLET + "cc", flex: 1 }]}
            >
              {recorrente
                ? "Bloqueio recorrente · vai repetir toda semana automaticamente."
                : "Bloqueio único · só hoje."}
            </Text>
          </View>
        </ScrollView>

        {/* Botão de confirmação */}
        <Pressable
          testID="confirm-bloqueio"
          onPress={handleConfirm}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={`Bloquear próximos ${duration} minutos`}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: loading ? VIOLET + "80" : VIOLET,
              borderRadius: radius.md,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.confirmText, { color: "#150d2f" }]}>
            Bloquear próximos {duration}min
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  motivoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1.5,
    width: "48%",
  },
  duracaoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  duracaoChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1.5,
    width: "15%",
    flexGrow: 1,
  },
  recorrenteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  dica: {
    padding: 10,
    borderWidth: 1,
  },
  confirmBtn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  confirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
