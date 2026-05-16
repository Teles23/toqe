import { addDays, format, isSameDay, isToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AgendamentoCard } from "@/src/features/barbeiro/AgendamentoCard";
import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper, ScreenHeader } from "@/src/shared/ui";
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
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    pressed && styles.pressed,
  ];

  const dayNav = (
    <View style={[styles.dayNav, { gap: spacing.sm }]}>
      <Pressable
        onPress={goPrev}
        accessibilityRole="button"
        accessibilityLabel="Dia anterior"
        style={navBtnStyle}
      >
        <Text style={[styles.navArrow, { color: palette.text }]}>‹</Text>
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
            backgroundColor: palette.surface,
            borderColor: palette.borderStrong,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            paddingHorizontal: 12,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            typography.label,
            { color: palette.text, textAlign: "center" },
          ]}
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
        <Text style={[styles.navArrow, { color: palette.text }]}>›</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="Agenda" subheader={dayNav} />

      <DataListWrapper
        testID="lista-agendamentos"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage={
          isSameDay(selectedDate, new Date())
            ? "Sem agendamentos para hoje."
            : "Sem agendamentos para este dia."
        }
        errorMessage="Não foi possível carregar a agenda. Puxe para tentar novamente."
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item }) => (
          <AgendamentoCard
            agendamento={item}
            onChangeStatus={handleChangeStatus}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayNav: { flexDirection: "row", alignItems: "center" },
  navArrow: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 22,
    lineHeight: 24,
  },
  pressed: { opacity: 0.7 },
});
