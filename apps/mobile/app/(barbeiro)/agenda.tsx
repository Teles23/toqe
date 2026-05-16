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
} from "react-native";

import { AgendamentoCard } from "@/src/features/barbeiro/AgendamentoCard";
import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useTheme } from "@/src/shared/theme";
import type { StatusAgendamento } from "@toqe/shared";

export default function BarbeiroAgendaScreen() {
  const { palette, spacing, radius, typography, a11y } = useTheme();

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

  const goPrev = useCallback(() => setSelectedDate((d) => subDays(d, 1)), []);
  const goNext = useCallback(() => setSelectedDate((d) => addDays(d, 1)), []);
  const goToday = useCallback(() => setSelectedDate(new Date()), []);

  const dayLabel = isToday(selectedDate)
    ? `Hoje · ${format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR })}`
    : format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });

  const navBtnStyle = ({ pressed }: { pressed: boolean }) => [
    {
      width: a11y.minTouch,
      height: a11y.minTouch,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: palette.cardBg,
      borderColor: palette.border,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    pressed && styles.pressed,
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg - 4,
            paddingTop: spacing.xxl + spacing.sm,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderColor: palette.border,
          },
        ]}
      >
        <Text
          style={{
            ...typography.heading,
            fontSize: 24,
            color: palette.text,
            marginBottom: spacing.md,
          }}
        >
          Agenda
        </Text>

        <View style={[styles.dayNav, { gap: spacing.sm }]}>
          <Pressable
            onPress={goPrev}
            accessibilityRole="button"
            accessibilityLabel="Dia anterior"
            style={navBtnStyle}
          >
            <Text
              style={{ fontSize: 22, fontWeight: "600", color: palette.text }}
            >
              ‹
            </Text>
          </Pressable>

          <Pressable
            onPress={goToday}
            accessibilityRole="button"
            accessibilityLabel="Ir para hoje"
            style={({ pressed }) => [
              {
                flex: 1,
                height: a11y.minTouch,
                borderRadius: radius.md,
                borderWidth: 1,
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                alignItems: "center" as const,
                justifyContent: "center" as const,
                paddingHorizontal: 12,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={{
                ...typography.label,
                color: palette.text,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {dayLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Próximo dia"
            style={navBtnStyle}
          >
            <Text
              style={{ fontSize: 22, fontWeight: "600", color: palette.text }}
            >
              ›
            </Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center} testID="agenda-loading">
          <ActivityIndicator color={palette.text} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text
            style={{
              ...typography.body,
              fontSize: 14,
              color: palette.textMuted,
              textAlign: "center",
            }}
          >
            Não foi possível carregar a agenda. Puxe para tentar novamente.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="lista-agendamentos"
          data={data ?? []}
          keyExtractor={(item) => String(item.codigo)}
          contentContainerStyle={[
            styles.list,
            { padding: spacing.md, paddingBottom: 40 },
          ]}
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
              tintColor={palette.text}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text
                style={{
                  ...typography.body,
                  fontSize: 14,
                  color: palette.textMuted,
                  textAlign: "center",
                }}
              >
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  dayNav: { flexDirection: "row", alignItems: "center" },
  pressed: { opacity: 0.7 },
  list: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
