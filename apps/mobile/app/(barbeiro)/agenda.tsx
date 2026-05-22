/**
 * BarbeiroAgendaScreen — Agenda do Dia (Urban Flow v2).
 *
 * Redesign pixel-accurate do protótipo Claude Design:
 *  - Header: dia da semana (Sora 700 24px capitalize) + data (📅 12px #888888) + botão filtro 44×44
 *  - Nav prev/next: 40×40 borderRadius 20 bg #1c1c1c border #262626
 *  - Stats strip: concluídos · pendentes · próximo
 *  - Lista densa com AgendaRow (coluna de horário 48px + dot de status + dados)
 *  - Divider "AGORA" com dot âmbar pulsante
 *  - FAB amber 56×56 bottom:80 right:18 com shadow âmbar
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

import { ActionMenuSheet } from "@/src/features/barbeiro/ActionMenuSheet";
import { AgendaRow } from "@/src/features/barbeiro/AgendaRow";
import { AppointmentDetailSheet } from "@/src/features/barbeiro/AppointmentDetailSheet";
import { BloqueioSheet } from "@/src/features/barbeiro/BloqueioSheet";
import { FilaSection } from "@/src/features/barbeiro/FilaSection";
import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useCriarBloqueio } from "@/src/shared/hooks/barbeiro/use-criar-bloqueio";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useToast } from "@/src/shared/hooks/use-toast";
import { useTheme } from "@/src/shared/theme";
import {
  DataListWrapper,
  EmptyScreen,
  ListSkeleton,
  TenantSwitcherSheet,
} from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

import type { DetailAction } from "@/src/features/barbeiro/AppointmentDetailSheet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Determina se um agendamento está no passado em relação ao momento atual. */
function isPast(apt: AgendamentoResponse): boolean {
  return parseISO(apt.fim) < new Date();
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatsStrip({ apts }: { apts: AgendamentoResponse[] }) {
  const { palette } = useTheme();

  const concluidos = apts.filter((a) => a.status === "concluido").length;
  const pendentes = apts.filter((a) => a.status === "pendente").length;
  const proxima = apts.find((a) => a.status === "confirmado" && !isPast(a));

  return (
    <View testID="stats-strip" style={statsStyles.strip}>
      <View style={statsStyles.item}>
        <View style={[statsStyles.dot, { backgroundColor: palette.success }]} />
        <Text style={[statsStyles.num, { color: palette.text }]}>
          {concluidos}
        </Text>
        <Text style={[statsStyles.label, { color: "#888888" }]}>
          {concluidos === 1 ? "atendido" : "atendidos"}
        </Text>
      </View>

      <View style={statsStyles.item}>
        <View style={[statsStyles.dot, { backgroundColor: "#F4B400" }]} />
        <Text style={[statsStyles.num, { color: palette.text }]}>
          {pendentes}
        </Text>
        <Text style={[statsStyles.label, { color: "#888888" }]}>
          {pendentes === 1 ? "pendente" : "pendentes"}
        </Text>
      </View>

      {proxima && (
        <View style={[statsStyles.item, { marginLeft: "auto" }]}>
          <Text
            style={[statsStyles.label, { color: "#F4B400", fontWeight: "600" }]}
          >
            ⏱ próx · {format(parseISO(proxima.inicio), "HH:mm")}
          </Text>
        </View>
      )}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingBottom: 8,
    flexShrink: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  num: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});

function NowDivider() {
  const timeStr = format(new Date(), "HH:mm");
  return (
    <View testID="now-divider" style={nowStyles.wrap}>
      <View style={nowStyles.line} />
      <View style={nowStyles.pill}>
        <View style={nowStyles.dot} />
        <Text style={nowStyles.text}>AGORA · {timeStr}</Text>
      </View>
      <View style={nowStyles.line} />
    </View>
  );
}

const nowStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#F4B40055",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#F4B4001a",
    borderRadius: 100,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F4B400",
  },
  text: {
    fontFamily: "Sora_700Bold",
    fontSize: 9,
    color: "#F4B400",
    letterSpacing: 1.5 * 0.09,
    textTransform: "uppercase",
  },
});

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function BarbeiroAgendaScreen() {
  const { palette, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { barbearia, barbearias } = useAuth();
  const { showToast } = useToast();

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
  const [tenantSwitcherOpen, setTenantSwitcherOpen] = useState(false);

  const goPrev = useCallback(() => setSelectedDate((d) => subDays(d, 1)), []);
  const goNext = useCallback(() => setSelectedDate((d) => addDays(d, 1)), []);
  const goToday = useCallback(() => setSelectedDate(new Date()), []);

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
        recusar: "cancelado",
        iniciar: "confirmado",
        concluir: "concluido",
        no_show: "no_show",
      };

      const toastMap: Partial<
        Record<DetailAction, { msg: string; tone: "success" | "warn" }>
      > = {
        aceitar: { msg: "Aceito · cliente avisado", tone: "success" },
        recusar: { msg: "Recusado · cliente notificado", tone: "warn" },
        iniciar: { msg: "Atendimento iniciado", tone: "success" },
        concluir: { msg: "Concluído · pagamento registrado", tone: "success" },
        no_show: { msg: "Marcado como não compareceu", tone: "warn" },
      };

      const newStatus = statusMap[action];
      if (newStatus) {
        updateStatus.mutate(
          { codigo: selectedApt.codigo, status: newStatus },
          {
            onError: () =>
              showToast(
                "Não foi possível atualizar. Tente novamente.",
                "error",
              ),
          },
        );
      }

      const toastEntry = toastMap[action];
      if (toastEntry) showToast(toastEntry.msg, toastEntry.tone);

      setDetailOpen(false);
    },
    [selectedApt, updateStatus, showToast],
  );

  const handleBloqueioConfirm = useCallback(
    (bloqueioData: {
      motivo: string;
      duration: number;
      recorrente: boolean;
    }) => {
      criarBloqueio.mutate(bloqueioData, {
        onSuccess: () =>
          showToast(`Horário bloqueado · ${bloqueioData.motivo}`, "info"),
        onError: () =>
          showToast("Não foi possível bloquear. Tente novamente.", "error"),
        onSettled: () => setBloqueioOpen(false),
      });
    },
    [criarBloqueio, showToast],
  );

  // ── Header: dia da semana + data + botão filtro ──────────────────────────
  // hojeShort é o formato curto esperado pelos testes: "qui, 21 de mai"
  const hojeShort = format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR });
  const diaSemana = isToday(selectedDate)
    ? "Hoje"
    : format(selectedDate, "EEEE", { locale: ptBR });

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.headerWrap,
          { paddingHorizontal: spacing.md, paddingTop: insets.top + 10 },
        ]}
      >
        {/* Linha 1: título da tela + sino de notificações */}
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Sua agenda</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            testID="btn-notificacoes"
            onPress={() => showToast("Notificações em breve", "info")}
            style={({ pressed }) => [styles.bellBtn, pressed && styles.pressed]}
          >
            <Feather name="bell" size={20} color="#888888" />
          </Pressable>
        </View>

        {/* Pill da barbearia ativa — sempre visível; troca só com 2+ vínculos */}
        {barbearia && (
          <Pressable
            testID="btn-tenant-switcher"
            accessibilityRole="button"
            accessibilityLabel={
              barbearias.length > 1
                ? `Barbearia ativa: ${barbearia.nome}. Toque para trocar.`
                : `Barbearia: ${barbearia.nome}`
            }
            disabled={barbearias.length <= 1}
            onPress={() => {
              if (barbearias.length > 1) setTenantSwitcherOpen(true);
            }}
            style={({ pressed }) => [
              styles.tenantPill,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={styles.tenantLetter}>
              <Text style={styles.tenantLetterText}>
                {barbearia.nome.trim()[0]?.toUpperCase() ?? "B"}
              </Text>
            </View>
            <Text style={styles.tenantName} numberOfLines={1}>
              {barbearia.nome}
            </Text>
            {barbearias.length > 1 && (
              <Feather name="refresh-cw" size={12} color="#888888" />
            )}
          </Pressable>
        )}

        {/* Navegação de dias — ‹ dia · data › (tap no centro volta para hoje) */}
        <View style={styles.dayNav}>
          <Pressable
            onPress={goPrev}
            accessibilityRole="button"
            accessibilityLabel="Dia anterior"
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          >
            <Text style={[styles.navArrow, { color: palette.text }]}>‹</Text>
          </Pressable>

          <Pressable
            onPress={goToday}
            accessibilityRole="button"
            accessibilityLabel="Ir para hoje"
            style={({ pressed }) => [
              styles.centerBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.dayName} numberOfLines={1}>
              {diaSemana}
            </Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={12} color="#888888" />
              {/* hojeShort inclui dia abreviado + data: "qui, 21 de mai" */}
              <Text style={styles.dateText} numberOfLines={1}>
                {hojeShort}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Próximo dia"
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          >
            <Text style={[styles.navArrow, { color: palette.text }]}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats strip — só quando há dados */}
      {data && data.length > 0 && <StatsStrip apts={data} />}

      {/* Fila de walk-ins — seção vermelha no topo (só hoje) */}
      {isSameDay(selectedDate, new Date()) && (
        <View style={{ paddingHorizontal: spacing.md }}>
          <FilaSection />
        </View>
      )}

      {/* Lista principal */}
      <DataListWrapper
        testID="lista-agendamentos"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        loadingComponent={<ListSkeleton testID="agenda-skeleton" />}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 120,
        }}
        emptyComponent={
          isSameDay(selectedDate, new Date()) ? (
            <EmptyScreen
              featherIcon="sun"
              title="Dia livre"
              description="Sem agendamentos hoje. Bom momento pra walk-in ou organizar a semana."
              testID="agenda-empty"
            />
          ) : (
            <EmptyScreen
              featherIcon="calendar"
              title="Sem agendamentos"
              description="Nada marcado para este dia."
              testID="agenda-empty"
            />
          )
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
        accessibilityLabel="Adicionar encaixe ou bloqueio"
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.9 : 1 }]}
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

      <TenantSwitcherSheet
        visible={tenantSwitcherOpen}
        onClose={() => setTenantSwitcherOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingTop: 10,
    paddingBottom: 8,
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  screenTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#f5f5f5",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingBottom: 4,
  },
  centerBtn: {
    flex: 1,
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  dayName: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#f5f5f5",
    textTransform: "capitalize",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  navArrow: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 22,
    lineHeight: 24,
  },
  pressed: { opacity: 0.7 },
  tenantPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#1c1c1c",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#262626",
  },
  tenantLetter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
  },
  tenantLetterText: {
    fontFamily: "Sora_700Bold",
    fontSize: 10,
    color: "#0d0d0d",
  },
  tenantName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#f5f5f5",
    maxWidth: 150,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4B40066",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: "#0a0a0a",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
    marginTop: -2,
  },
});
