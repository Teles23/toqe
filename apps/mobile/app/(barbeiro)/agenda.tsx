/**
 * BarbeiroAgendaScreen — Agenda do Dia (Urban Flow v2).
 *
 * Redesign fiel ao protótipo Claude Design `dTVtmzWT4ykmhzZusl4Mog`:
 *  - Header: dia da semana + data + botão filtro
 *  - Stats strip: concluídos · pendentes · próximo
 *  - Lista densa com AgendaRow (coluna de horário + dot de status + dados)
 *  - Divider "AGORA" entre passado e futuro
 *  - FAB amber → ActionMenuSheet (walk-in / bloqueio)
 *  - Tap na linha → AppointmentDetailSheet (ações por status)
 */

import {
  addDays,
  format,
  isSameDay,
  isToday,
  parseISO,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionMenuSheet } from "@/src/features/barbeiro/ActionMenuSheet";
import { AgendaRow } from "@/src/features/barbeiro/AgendaRow";
import { AppointmentDetailSheet } from "@/src/features/barbeiro/AppointmentDetailSheet";
import { BloqueioSheet } from "@/src/features/barbeiro/BloqueioSheet";
import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useCriarBloqueio } from "@/src/shared/hooks/barbeiro/use-criar-bloqueio";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper } from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

import type { DetailAction } from "@/src/features/barbeiro/AppointmentDetailSheet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDayLabel(date: Date): string {
  if (isToday(date)) {
    return `Hoje · ${format(date, "EEE, dd 'de' MMM", { locale: ptBR })}`;
  }
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

/** Determina se um agendamento está no passado em relação ao momento atual. */
function isPast(apt: AgendamentoResponse): boolean {
  return parseISO(apt.fim) < new Date();
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatsStrip({
  apts,
  accent,
}: {
  apts: AgendamentoResponse[];
  accent: string;
}) {
  const { palette, typography } = useTheme();

  const concluidos = apts.filter((a) => a.status === "concluido").length;
  const pendentes = apts.filter((a) => a.status === "pendente").length;
  const proxima = apts.find((a) => a.status === "confirmado" && !isPast(a));

  return (
    <View testID="stats-strip" style={styles.statsStrip}>
      <View style={styles.statItem}>
        <View style={[styles.statDot, { backgroundColor: palette.success }]} />
        <Text style={[styles.statNum, { color: palette.text }]}>
          {concluidos}
        </Text>
        <Text style={[typography.caption, { color: palette.textMuted }]}>
          {concluidos === 1 ? "atendido" : "atendidos"}
        </Text>
      </View>

      <View style={styles.statItem}>
        <View style={[styles.statDot, { backgroundColor: "#F4B400" }]} />
        <Text style={[styles.statNum, { color: palette.text }]}>
          {pendentes}
        </Text>
        <Text style={[typography.caption, { color: palette.textMuted }]}>
          {pendentes === 1 ? "pendente" : "pendentes"}
        </Text>
      </View>

      {proxima && (
        <View style={[styles.statItem, { marginLeft: "auto" }]}>
          <Text
            style={[typography.caption, { color: accent, fontWeight: "600" }]}
          >
            ⏱ próx · {format(parseISO(proxima.inicio), "HH:mm")}
          </Text>
        </View>
      )}
    </View>
  );
}

function NowDivider() {
  const timeStr = format(new Date(), "HH:mm");
  return (
    <View testID="now-divider" style={styles.nowDivider}>
      <View style={[styles.nowLine, { backgroundColor: "#F4B40055" }]} />
      <View
        style={[
          styles.nowPill,
          { backgroundColor: "#F4B40018", borderRadius: 100 },
        ]}
      >
        <View style={[styles.nowDot, { backgroundColor: "#F4B400" }]} />
        <Text style={[styles.nowText, { color: "#F4B400" }]}>
          Agora · {timeStr}
        </Text>
      </View>
      <View style={[styles.nowLine, { backgroundColor: "#F4B40055" }]} />
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function BarbeiroAgendaScreen() {
  const { palette, spacing, radius, a11y } = useTheme();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data, isLoading, isRefetching, refetch, isError } =
    useAgendaDia(selectedDate);

  const updateStatus = useUpdateStatus();
  const criarBloqueio = useCriarBloqueio();

  const [selectedApt, setSelectedApt] = useState<AgendamentoResponse | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [bloqueioOpen, setBloqueioOpen] = useState(false);

  const goPrev = useCallback(() => setSelectedDate((d) => subDays(d, 1)), []);
  const goNext = useCallback(() => setSelectedDate((d) => addDays(d, 1)), []);
  const goToday = useCallback(() => setSelectedDate(new Date()), []);

  const dayLabel = buildDayLabel(selectedDate);

  // Determinação do "próximo" agendamento — o primeiro confirmado no futuro
  const nextAptId = data?.find(
    (a) => a.status === "confirmado" && !isPast(a),
  )?.codigo;

  // Índice onde inserir o divider "AGORA" (para hoje)
  const nowDividerIndex =
    isSameDay(selectedDate, new Date()) && data
      ? data.findLastIndex((a) => isPast(a))
      : -1;

  const handleRowTap = useCallback((apt: AgendamentoResponse) => {
    setSelectedApt(apt);
    setDetailOpen(true);
  }, []);

  const handleDetailAction = useCallback(
    (action: DetailAction) => {
      if (!selectedApt) return;

      type UpdatableStatus = Exclude<StatusAgendamento, "pendente">;
      const statusMap: Partial<Record<DetailAction, UpdatableStatus>> = {
        aceitar: "confirmado",
        iniciar: "confirmado",
        concluir: "concluido",
        no_show: "no_show",
      };

      const newStatus = statusMap[action];
      if (newStatus) {
        updateStatus.mutate({ codigo: selectedApt.codigo, status: newStatus });
      }

      setDetailOpen(false);
    },
    [selectedApt, updateStatus],
  );

  const handleBloqueioConfirm = useCallback(
    (data: { motivo: string; duration: number; recorrente: boolean }) => {
      criarBloqueio.mutate(data, {
        onSettled: () => setBloqueioOpen(false),
      });
    },
    [criarBloqueio],
  );

  // Botão de navegação de dia
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
            {
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: palette.text,
              textAlign: "center",
              textTransform: "capitalize",
            },
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
      {/* Header de navegação de data */}
      <View
        style={[
          styles.headerWrap,
          { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
        ]}
      >
        {dayNav}
      </View>

      {/* Stats strip — só quando há dados */}
      {data && data.length > 0 && <StatsStrip apts={data} accent="#F4B400" />}

      {/* Lista principal */}
      <DataListWrapper
        testID="lista-agendamentos"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 120,
        }}
        emptyMessage={
          isSameDay(selectedDate, new Date())
            ? "Sem agendamentos para hoje."
            : "Sem agendamentos para este dia."
        }
        errorMessage="Não foi possível carregar a agenda. Puxe para tentar novamente."
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item, index }) => (
          <>
            {/* Divider "AGORA" entre passado e futuro */}
            {index === nowDividerIndex + 1 && nowDividerIndex >= 0 && (
              <NowDivider />
            )}
            <AgendaRow
              agendamento={item}
              onPress={() => handleRowTap(item)}
              isNext={item.codigo === nextAptId}
              dim={isPast(item) && item.status === "concluido"}
            />
          </>
        )}
      />

      {/* FAB */}
      <Pressable
        testID="fab-adicionar"
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Adicionar walk-in ou bloqueio"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: "#F4B400",
            borderRadius: 28,
            bottom: 88,
            shadowColor: "#F4B400",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Sheets */}
      <ActionMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onWalkin={() => setWalkinOpen(true)}
        onBloqueio={() => setBloqueioOpen(true)}
      />

      <AppointmentDetailSheet
        agendamento={selectedApt}
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAction={handleDetailAction}
      />

      <BloqueioSheet
        visible={bloqueioOpen}
        onClose={() => setBloqueioOpen(false)}
        onConfirm={handleBloqueioConfirm}
        loading={criarBloqueio.isPending}
      />

      <AdicionarWalkInModal
        visible={walkinOpen}
        onClose={() => setWalkinOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {},
  dayNav: { flexDirection: "row", alignItems: "center" },
  navArrow: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 22,
    lineHeight: 24,
  },
  pressed: { opacity: 0.7 },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingBottom: 8,
    flexShrink: 0,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  nowDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  nowLine: {
    flex: 1,
    height: 1,
  },
  nowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  nowText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: "#0a0a0a",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
    marginTop: -2,
  },
});
