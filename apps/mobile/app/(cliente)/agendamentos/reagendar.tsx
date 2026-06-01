import { Feather } from "@expo/vector-icons";
import { addDays, addMinutes, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAgendamento } from "@/src/shared/hooks/cliente/use-agendamento";
import { useReagendarAgendamento } from "@/src/shared/hooks/cliente/use-reagendar-agendamento";
import { useTheme } from "@/src/shared/theme";
import type { AgendamentoItemResponse } from "@toqe/shared";

const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export default function ReagendarScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const { palette, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: agendamento, isLoading } = useAgendamento(Number(codigo));
  const reagendar = useReagendarAgendamento();

  const [data, setData] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [horario, setHorario] = useState<string>("09:00");

  const handleConfirmar = useCallback(async () => {
    if (!agendamento) return;

    const [h, m] = horario.split(":").map(Number);
    const novoInicio = new Date(data);
    novoInicio.setHours(h, m, 0, 0);

    const durMin = agendamento.itens.reduce(
      (s: number, i: AgendamentoItemResponse) => s + i.duracaoMin,
      0,
    );
    const novoFim = addMinutes(novoInicio, durMin || 30);

    Alert.alert(
      "Confirmar reagendamento",
      `Novo horário: ${format(novoInicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await reagendar.mutateAsync({
                codigo: Number(codigo),
                inicio: novoInicio.toISOString(),
                fim: novoFim.toISOString(),
              });
              Alert.alert("Pronto!", "Agendamento reagendado com sucesso.");
              router.back();
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível reagendar. Verifique o horário e tente novamente.",
              );
            }
          },
        },
      ],
    );
  }, [agendamento, data, horario, codigo, reagendar]);

  if (isLoading || !agendamento) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={{ color: palette.textMuted }}>Carregando…</Text>
      </View>
    );
  }

  const servicosNomes = agendamento.itens
    .map((i: AgendamentoItemResponse) => i.servico.nome)
    .join(", ");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
      }}
    >
      <Text style={[styles.title, { color: palette.text }]}>
        Reagendar agendamento
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.surface, borderRadius: radius.md },
        ]}
      >
        <Text style={[styles.label, { color: palette.textMuted }]}>
          Barbeiro
        </Text>
        <Text style={[styles.value, { color: palette.text }]}>
          {agendamento.barbeiro?.nome}
        </Text>
        {servicosNomes ? (
          <>
            <Text
              style={[styles.label, { color: palette.textMuted, marginTop: 8 }]}
            >
              Serviços
            </Text>
            <Text style={[styles.value, { color: palette.text }]}>
              {servicosNomes}
            </Text>
          </>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Nova data
      </Text>
      <View style={styles.row}>
        <Pressable
          testID="btn-dia-anterior"
          accessibilityRole="button"
          accessibilityLabel="Dia anterior"
          onPress={() => setData((d) => subDays(d, 1))}
          style={[
            styles.navBtn,
            { backgroundColor: palette.surface, borderRadius: radius.sm },
          ]}
        >
          <Feather name="chevron-left" size={18} color={palette.text} />
        </Pressable>
        <Text style={[styles.dateText, { color: palette.text }]}>
          {format(data, "EEEE, dd/MM", { locale: ptBR })}
        </Text>
        <Pressable
          testID="btn-proximo-dia"
          accessibilityRole="button"
          accessibilityLabel="Próximo dia"
          onPress={() => setData((d) => addDays(d, 1))}
          style={[
            styles.navBtn,
            { backgroundColor: palette.surface, borderRadius: radius.sm },
          ]}
        >
          <Feather name="chevron-right" size={18} color={palette.text} />
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Horário
      </Text>
      <View style={styles.horariosGrid}>
        {HORARIOS.map((h) => (
          <Pressable
            key={h}
            testID={`horario-${h}`}
            onPress={() => setHorario(h)}
            style={[
              styles.horarioBtn,
              {
                backgroundColor:
                  horario === h ? palette.primary : palette.surface,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={{
                color: horario === h ? palette.primaryOn : palette.text,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {h}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        testID="botao-confirmar-reagendamento"
        onPress={() => void handleConfirmar()}
        disabled={reagendar.isPending}
        style={[
          styles.confirmBtn,
          {
            backgroundColor: palette.primary,
            borderRadius: radius.md,
            opacity: reagendar.isPending ? 0.6 : 1,
          },
        ]}
      >
        <Text style={[styles.confirmBtnText, { color: palette.primaryOn }]}>
          {reagendar.isPending ? "Reagendando…" : "Confirmar reagendamento"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  card: { padding: 16 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "500" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: { padding: 10, width: 40, alignItems: "center" },
  dateText: { fontSize: 15, fontWeight: "600", flex: 1, textAlign: "center" },
  horariosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  horarioBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: "center",
  },
  confirmBtn: { padding: 16, alignItems: "center", marginTop: 24 },
  confirmBtnText: { fontSize: 15, fontWeight: "700" },
});
