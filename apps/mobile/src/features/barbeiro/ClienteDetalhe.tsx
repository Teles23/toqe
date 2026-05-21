/**
 * ClienteDetalhe — tela de detalhe de cliente (modal full-screen).
 *
 * Exibe o perfil completo do cliente do ponto de vista do barbeiro:
 *  - Identidade: nome, telefone, tags (VIP/Novo)
 *  - Quick actions: Agendar · Ligar · WhatsApp
 *  - Stats: visitas totais, ticket médio, última visita
 *  - Próximo agendamento agendado (se houver)
 *  - Notas do barbeiro (editáveis localmente — integração API é Phase 2)
 *  - Timeline de histórico via `useHistoricoCliente`
 *
 * Usa `Modal` com `animationType="slide"` para simular push navigation
 * sem alterar a estrutura de rotas do Expo Router.
 */

import { Feather } from "@expo/vector-icons";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/shared/theme";
import { Avatar } from "@/src/shared/ui";
import { useHistoricoCliente } from "@/src/shared/hooks/barbeiro/use-historico-cliente";
import type { ClienteAPI } from "@toqe/contracts";
import type { AgendamentoResponse } from "@toqe/shared";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ClienteDetalheProps {
  cliente: ClienteAPI | null;
  visible: boolean;
  onClose: () => void;
  proximoAgendamento?: {
    data: string;
    horario: string;
    servico: string;
  } | null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ClienteDetalhe({
  cliente,
  visible,
  onClose,
  proximoAgendamento,
}: ClienteDetalheProps) {
  const { palette, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");

  const { data: historico, isLoading: loadingHistorico } = useHistoricoCliente(
    cliente?.codigo ?? 0,
    visible && !!cliente,
  );

  const handleLigar = useCallback(() => {
    if (cliente?.telefone) {
      void Linking.openURL(`tel:${cliente.telefone}`);
    }
  }, [cliente?.telefone]);

  const handleWhatsApp = useCallback(() => {
    if (cliente?.telefone) {
      const digits = cliente.telefone.replace(/\D/g, "");
      void Linking.openURL(`https://wa.me/55${digits}`);
    }
  }, [cliente?.telefone]);

  if (!cliente) return null;

  const ticketFormatado =
    cliente.ticketMedio > 0 ? `R$${Math.round(cliente.ticketMedio)}` : "—";

  const ultimaVisitaLabel = cliente.ultimaVisita
    ? (() => {
        const diff = differenceInDays(
          new Date(),
          parseISO(cliente.ultimaVisita),
        );
        if (diff === 0) return "hoje";
        if (diff === 1) return "ontem";
        return `há ${diff}d`;
      })()
    : "—";

  const isNovo = cliente.totalVisitas === 0;
  const isVip = cliente.totalVisitas >= 10;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      testID="cliente-detalhe-modal"
    >
      <View style={[styles.safeArea, { backgroundColor: palette.bg }]}>
        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            {
              borderBottomColor: palette.border,
              paddingHorizontal: spacing.md,
              paddingTop: insets.top + 8,
              height: 56 + insets.top,
            },
          ]}
        >
          <Pressable
            testID="btn-voltar"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                borderRadius: radius.full,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.chevronBack, { color: palette.text }]}>‹</Text>
          </Pressable>

          <Text
            style={[
              typography.subheading,
              { color: palette.text, flex: 1, textAlign: "center" },
            ]}
            numberOfLines={1}
          >
            {cliente.nome}
          </Text>

          {/* Espaço visual para centralizar o título */}
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xl + 60,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity block */}
          <View style={[styles.identityBlock, { paddingTop: spacing.sm }]}>
            <Avatar uri={cliente.avatarUrl} name={cliente.nome} size="lg" />
            <Text style={[styles.clienteName, { color: palette.text }]}>
              {cliente.nome}
            </Text>
            {cliente.telefone && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textMuted,
                    fontFamily: "JetBrainsMono_400Regular",
                    marginTop: 2,
                  },
                ]}
              >
                {cliente.telefone}
              </Text>
            )}

            {/* Tags: NOVO / VIP */}
            {(isNovo || isVip) && (
              <View style={styles.tagsRow} testID="cliente-tags">
                {isNovo && (
                  <View style={styles.badgeNovo}>
                    <Text style={styles.badgeNovoText}>NOVO</Text>
                  </View>
                )}
                {isVip && (
                  <View style={styles.badgeVip}>
                    <Text style={styles.badgeVipText}>VIP</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <QuickAction
              icon="calendar"
              label="Agendar"
              iconBgColor="#F4B40014"
              iconColor="#F4B400"
              onPress={() => {
                /* Phase 2: navegar para booking */
              }}
              testID="qa-agendar"
            />
            <QuickAction
              icon="phone"
              label="Ligar"
              iconBgColor="#3b82f61a"
              iconColor="#3b82f6"
              onPress={handleLigar}
              testID="qa-ligar"
              disabled={!cliente.telefone}
            />
            <QuickAction
              icon="message-circle"
              label="WhatsApp"
              iconBgColor="#22c55e1a"
              iconColor="#22c55e"
              onPress={handleWhatsApp}
              testID="qa-whatsapp"
              disabled={!cliente.telefone}
            />
          </View>

          {/* Stats card */}
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                borderRadius: radius.md,
              },
            ]}
          >
            <StatCol
              value={String(cliente.totalVisitas)}
              label="Visitas"
              color={palette.primary}
            />
            <View
              style={[styles.statDivider, { backgroundColor: palette.border }]}
            />
            <StatCol
              value={ticketFormatado}
              label="Ticket médio"
              color={palette.info}
            />
            <View
              style={[styles.statDivider, { backgroundColor: palette.border }]}
            />
            <StatCol
              value={ultimaVisitaLabel}
              label="Última visita"
              color="#a78bfa"
              smaller
            />
          </View>

          {/* Serviço favorito */}
          {cliente.servicoFav && (
            <View
              style={[
                styles.servicoFavCard,
                {
                  backgroundColor: palette.surfaceHigh,
                  borderColor: palette.borderStrong,
                  borderLeftColor: palette.primary,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text
                style={[styles.sectionLabel, { color: palette.textDisabled }]}
              >
                SERVIÇO FAVORITO
              </Text>
              <Text
                style={[
                  typography.label,
                  { color: palette.text, marginTop: 4 },
                ]}
              >
                {cliente.servicoFav}
              </Text>
            </View>
          )}

          {/* Próximo agendamento */}
          {proximoAgendamento && (
            <View style={styles.nextAptCard} testID="next-apt-card">
              <Text style={styles.nextAptLabel}>PRÓXIMO AGENDAMENTO</Text>
              <View style={styles.nextAptRow}>
                <Text style={styles.nextAptDate}>
                  {proximoAgendamento.data}
                </Text>
                <Text style={styles.nextAptSep}>{" · "}</Text>
                <Text style={styles.nextAptHorario}>
                  {proximoAgendamento.horario}
                </Text>
                <Text style={styles.nextAptSep}>{" · "}</Text>
                <Text
                  style={[styles.nextAptServico, { color: palette.text }]}
                  numberOfLines={1}
                >
                  {proximoAgendamento.servico}
                </Text>
              </View>
            </View>
          )}

          {/* Notas do barbeiro */}
          <View
            style={[
              styles.notesCard,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                borderRadius: radius.md,
              },
            ]}
          >
            <View style={styles.notesHeader}>
              <View style={styles.sectionLabelRow}>
                <Feather name="edit-2" size={12} color={palette.textDisabled} />
                <Text
                  style={[styles.sectionLabel, { color: palette.textDisabled }]}
                >
                  NOTAS DO BARBEIRO
                </Text>
              </View>
              <Pressable
                testID="btn-editar-nota"
                onPress={() => setEditingNote((v) => !v)}
                hitSlop={8}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: palette.primary, fontWeight: "600" },
                  ]}
                >
                  {editingNote ? "Salvar" : "Editar"}
                </Text>
              </Pressable>
            </View>

            {editingNote ? (
              <TextInput
                testID="input-nota"
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Preferências, observações, lembretes…"
                placeholderTextColor={palette.textDisabled}
                style={[
                  styles.noteInput,
                  {
                    color: palette.text,
                    backgroundColor: palette.bg,
                    borderColor: palette.borderStrong,
                    borderRadius: radius.sm,
                  },
                ]}
              />
            ) : (
              <Text
                style={[
                  typography.caption,
                  {
                    color: note ? palette.text : palette.textDisabled,
                    fontStyle: note ? "normal" : "italic",
                    lineHeight: 18,
                    marginTop: 4,
                  },
                ]}
              >
                {note || "Sem notas. Toque em Editar para adicionar."}
              </Text>
            )}
          </View>

          {/* Histórico */}
          <View>
            <View style={styles.historicHeader}>
              <View style={styles.sectionLabelRow}>
                <Feather name="clock" size={12} color={palette.textDisabled} />
                <Text
                  style={[styles.sectionLabel, { color: palette.textDisabled }]}
                >
                  HISTÓRICO
                </Text>
              </View>
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textDisabled,
                    fontFamily: "JetBrainsMono_400Regular",
                  },
                ]}
              >
                {historico?.length ?? 0}{" "}
                {historico?.length === 1 ? "visita" : "visitas"}
              </Text>
            </View>

            {loadingHistorico ? (
              <View
                style={[
                  styles.emptyHistorico,
                  {
                    backgroundColor: palette.surfaceHigh,
                    borderColor: palette.borderStrong,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text
                  style={[typography.caption, { color: palette.textMuted }]}
                >
                  Carregando histórico…
                </Text>
              </View>
            ) : !historico || historico.length === 0 ? (
              <View
                style={[
                  styles.emptyHistorico,
                  {
                    backgroundColor: palette.surfaceHigh,
                    borderColor: palette.borderStrong,
                    borderRadius: radius.md,
                  },
                ]}
                testID="historico-vazio"
              >
                <Text
                  style={[typography.caption, { color: palette.textMuted }]}
                >
                  Ainda sem atendimentos registrados.
                </Text>
              </View>
            ) : (
              <View testID="historico-lista">
                {historico.map((apt, i) => (
                  <HistoryRow
                    key={apt.codigo}
                    agendamento={apt}
                    isLast={i === historico.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  iconBgColor,
  iconColor,
  onPress,
  disabled,
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  iconBgColor: string;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const { palette, radius } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.quickActionBtn,
        {
          backgroundColor: palette.surfaceHigh,
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[styles.quickActionIconBox, { backgroundColor: iconBgColor }]}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCol({
  value,
  label,
  color,
  smaller,
}: {
  value: string;
  label: string;
  color: string;
  smaller?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statValue, { color, fontSize: smaller ? 16 : 22 }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: palette.textDisabled }]}>
        {label}
      </Text>
    </View>
  );
}

function HistoryRow({
  agendamento,
  isLast,
}: {
  agendamento: AgendamentoResponse;
  isLast: boolean;
}) {
  const { palette, typography, radius } = useTheme();
  const inicio = parseISO(agendamento.inicio);
  const dateStr = format(inicio, "dd/MM", { locale: ptBR });
  const diff = differenceInDays(new Date(), inicio);
  const whenStr = diff === 0 ? "hoje" : diff === 1 ? "ontem" : `há ${diff}d`;

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const totalPreco = agendamento.itens.reduce((sum, i) => sum + i.preco, 0);
  const isNoShow = agendamento.status === "no_show";

  return (
    <View style={styles.historyRow}>
      {/* Timeline rail */}
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: isNoShow ? palette.danger : palette.primary,
            },
          ]}
        />
        {!isLast && (
          <View
            style={[styles.timelineLine, { backgroundColor: palette.border }]}
          />
        )}
      </View>

      {/* Content */}
      <View style={[styles.historyContent, { paddingBottom: isLast ? 0 : 10 }]}>
        <View
          style={[
            styles.historyCard,
            {
              backgroundColor: palette.surfaceHigh,
              borderColor: palette.borderStrong,
              borderRadius: radius.md,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.historyMeta}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textMuted,
                    fontFamily: "JetBrainsMono_400Regular",
                    fontWeight: "600",
                  },
                ]}
              >
                {dateStr}
              </Text>
              <Text
                style={[typography.caption, { color: palette.textDisabled }]}
              >
                {" · "}
                {whenStr}
              </Text>
              {isNoShow && (
                <View
                  style={[
                    styles.noShowBadge,
                    { backgroundColor: palette.danger + "1a" },
                  ]}
                >
                  <Text style={[styles.noShowText, { color: palette.danger }]}>
                    NO-SHOW
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.historyService}>
              <Text
                style={[
                  typography.label,
                  {
                    color: isNoShow ? palette.textMuted : palette.text,
                    fontWeight: "500",
                    textDecorationLine: isNoShow ? "line-through" : "none",
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {servicoNome}
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textMuted,
                    fontFamily: "JetBrainsMono_400Regular",
                    marginLeft: 8,
                  },
                ]}
              >
                R$ {totalPreco}
              </Text>
            </View>
          </View>

          {/* Repeat button */}
          <Pressable
            testID={`repeat-${agendamento.codigo}`}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Repetir agendamento"
            style={styles.repeatBtn}
          >
            <Feather name="rotate-ccw" size={14} color="#F4B400" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderBottomWidth: 1,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chevronBack: {
    fontSize: 26,
    fontFamily: "Sora_600SemiBold",
    lineHeight: 30,
    marginLeft: 2,
  },
  identityBlock: {
    alignItems: "center",
    gap: 8,
  },
  clienteName: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badgeNovo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#a78bfa1a",
  },
  badgeNovoText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#a78bfa",
  },
  badgeVip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#F4B40014",
  },
  badgeVipText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#F4B400",
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 60,
  },
  quickActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#888888",
    marginTop: 6,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Sora_700Bold",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
    textAlign: "center",
  },
  servicoFavCard: {
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  nextAptCard: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262626",
    borderLeftWidth: 3,
    borderLeftColor: "#F4B400",
  },
  nextAptLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#666666",
    marginBottom: 6,
  },
  nextAptRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  nextAptDate: {
    fontFamily: "Sora_700Bold",
    fontSize: 13,
    color: "#F4B400",
  },
  nextAptSep: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
  },
  nextAptHorario: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#888888",
  },
  nextAptServico: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notesCard: {
    padding: 14,
    borderWidth: 1,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    padding: 10,
    minHeight: 80,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: "top",
  },
  historicHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  emptyHistorico: {
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  historyRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineRail: {
    width: 32,
    alignItems: "center",
    flexShrink: 0,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    minWidth: 0,
  },
  historyCard: {
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 0,
  },
  historyService: {
    flexDirection: "row",
    alignItems: "center",
  },
  noShowBadge: {
    marginLeft: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  noShowText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    letterSpacing: 0.8,
  },
  repeatBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F4B40014",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
