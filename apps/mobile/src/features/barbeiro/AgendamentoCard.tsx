import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import {
  BottomSheet,
  Card,
  QuickActionBar,
  StatusBadge,
  TimeDisplay,
} from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

import {
  getFullActions,
  getInlineActions,
  statusToBadge,
  toQuickAction,
  type AgendamentoActionStatus,
} from "./utils/agendamento-actions";

interface Props {
  agendamento: AgendamentoResponse;
  onChangeStatus?: (codigo: number, status: AgendamentoActionStatus) => void;
  testID?: string;
}

function AgendamentoCardImpl({ agendamento, onChangeStatus, testID }: Props) {
  const { palette, spacing, typography } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const inicio = parseISO(agendamento.inicio);
  const fim = parseISO(agendamento.fim);
  const horarioStr = `${format(inicio, "HH:mm", { locale: ptBR })} – ${format(fim, "HH:mm", { locale: ptBR })}`;

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const badge = statusToBadge(agendamento.status);

  const handleStatusChange = useCallback(
    (status: AgendamentoActionStatus) => {
      onChangeStatus?.(agendamento.codigo, status);
      setSheetOpen(false);
    },
    [agendamento.codigo, onChangeStatus],
  );

  const inlineActions = onChangeStatus
    ? getInlineActions(agendamento.status).map((spec) =>
        toQuickAction(spec, () => handleStatusChange(spec.key)),
      )
    : [];

  const handleLongPress = useCallback(() => {
    if (!onChangeStatus) return;
    setSheetOpen(true);
  }, [onChangeStatus]);

  return (
    <>
      <Card
        testID={testID ?? `agendamento-${agendamento.codigo}`}
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityLabel={`Agendamento de ${agendamento.cliente.nome} às ${horarioStr}`}
        accessibilityHint={
          onChangeStatus
            ? "Pressione e segure para abrir menu completo de status"
            : undefined
        }
      >
        <View style={[styles.headerRow, { marginBottom: spacing.xs }]}>
          <TimeDisplay
            time={horarioStr}
            size="md"
            color={palette.primary}
            testID={`agendamento-${agendamento.codigo}-time`}
          />
          {/* TestID estável para snapshots/asserts antigos */}
          <View testID="status-badge">
            <StatusBadge status={badge.badge} label={badge.label} />
          </View>
        </View>

        <Text
          style={[
            typography.bodyBold,
            { color: palette.text, marginTop: spacing.xs },
          ]}
          numberOfLines={1}
        >
          {agendamento.cliente.nome}
        </Text>

        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginTop: 2 },
          ]}
          numberOfLines={1}
        >
          {servicoNome}
        </Text>

        {inlineActions.length > 0 ? (
          <View style={{ marginTop: spacing.sm }}>
            <QuickActionBar
              actions={inlineActions}
              testID={`agendamento-${agendamento.codigo}-actions`}
            />
          </View>
        ) : null}
      </Card>

      {/* BottomSheet completo (long-press) — substitui Alert/ActionSheetIOS */}
      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        height={0.45}
        testID={`agendamento-${agendamento.codigo}-sheet`}
      >
        <Text
          style={[
            typography.heading,
            { color: palette.text, marginBottom: spacing.xs },
          ]}
        >
          {agendamento.cliente.nome}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginBottom: spacing.lg },
          ]}
        >
          {horarioStr} · {servicoNome}
        </Text>
        {getFullActions().map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => handleStatusChange(action.key)}
            style={({ pressed }) => [
              styles.sheetAction,
              {
                paddingVertical: spacing.md,
                borderBottomColor: palette.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.bodyMedium,
                { color: actionColor(action.variant, palette) },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}

function actionColor(
  variant: ReturnType<typeof getFullActions>[number]["variant"],
  palette: ReturnType<typeof useTheme>["palette"],
): string {
  switch (variant) {
    case "primary":
      return palette.primary;
    case "success":
      return palette.success;
    case "danger":
      return palette.danger;
    default:
      return palette.text;
  }
}

// Re-export para compatibilidade com chamadas antigas que esperavam
// `StatusAgendamento` direto — não usar em código novo.
export type { StatusAgendamento };

/**
 * `React.memo` evita re-render quando props não mudam — relevante na FlatList
 * de agenda onde o usuário pode atualizar status de um card e os outros
 * permanecem idênticos.
 */
export const AgendamentoCard = memo(AgendamentoCardImpl);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetAction: {
    borderBottomWidth: 1,
  },
});
