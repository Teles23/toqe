import { addDays, format, isSameDay, isToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { AgendamentoCard } from "@/src/features/barbeiro/AgendamentoCard";
import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import type { StatusAgendamento } from "@toqe/shared";

export default function BarbeiroAgendaScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? darkColors : lightColors;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data, isLoading, isRefetching, refetch, isError } =
    useAgendaDia(selectedDate);
  const updateStatus = useUpdateStatus();

  const handleChangeStatus = useCallback(
    (codigo: number, status: Exclude<StatusAgendamento, "pendente">) => {
      updateStatus.mutate({ codigo, status });
    },
    [updateStatus],
  );

  const dayLabel = isToday(selectedDate)
    ? `Hoje · ${format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR })}`
    : format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Agenda</Text>

        <View style={styles.dayNav}>
          <Pressable
            onPress={() => setSelectedDate((d) => subDays(d, 1))}
            accessibilityRole="button"
            accessibilityLabel="Dia anterior"
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.navText, { color: colors.text }]}>‹</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedDate(new Date())}
            accessibilityRole="button"
            accessibilityLabel="Ir para hoje"
            style={({ pressed }) => [
              styles.dayLabelWrapper,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.dayLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              {dayLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedDate((d) => addDays(d, 1))}
            accessibilityRole="button"
            accessibilityLabel="Próximo dia"
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.navText, { color: colors.text }]}>›</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center} testID="agenda-loading">
          <ActivityIndicator color={colors.text} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Não foi possível carregar a agenda. Puxe para tentar novamente.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="lista-agendamentos"
          data={data ?? []}
          keyExtractor={(item) => String(item.codigo)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AgendamentoCard
              agendamento={item}
              onChangeStatus={handleChangeStatus}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.text}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                {isSameDay(selectedDate, new Date())
                  ? "Sem agendamentos para hoje."
                  : "Sem agendamentos para este dia."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const lightColors = {
  bg: "#f5f5f5",
  cardBg: "#fff",
  border: "#e0e0e0",
  text: "#111",
  textMuted: "#666",
};

const darkColors = {
  bg: "#111",
  cardBg: "#1e1e1e",
  border: "#333",
  text: "#f5f5f5",
  textMuted: "#999",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { fontSize: 22, fontWeight: "600" },
  dayLabelWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dayLabel: { fontSize: 15, fontWeight: "500", textAlign: "center" },
  pressed: { opacity: 0.7 },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: { fontSize: 14, textAlign: "center" },
});
