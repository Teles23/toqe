import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useInterval } from "@/src/shared/hooks/use-interval";
import { useTheme } from "@/src/shared/theme";
import { BottomSheet, Card } from "@/src/shared/ui";
import type { AgendamentoResponse, StatusAgendamento } from "@toqe/shared";

import {
  getMinutesWaiting,
  getWaitProgress,
  getWaitTone,
} from "./utils/fila-wait";

interface Props {
  agendamento: AgendamentoResponse;
  /** Posição na fila (1, 2, 3...) */
  posicao: number;
  onChangeStatus?: (
    codigo: number,
    status: Exclude<StatusAgendamento, "pendente">,
  ) => void;
  testID?: string;
}

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: "Aguardando",
  confirmado: "Confirmado",
  em_andamento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Não compareceu",
};

const ACTIONS: {
  label: string;
  status: Exclude<StatusAgendamento, "pendente">;
}[] = [
  { label: "Chamar agora", status: "confirmado" },
  { label: "Marcar concluído", status: "concluido" },
  { label: "Marcar não compareceu", status: "no_show" },
  { label: "Cancelar", status: "cancelado" },
];

function statusFgBg(
  status: StatusAgendamento,
  palette: ReturnType<typeof useTheme>["palette"],
): { fg: string; bg: string } {
  switch (status) {
    case "pendente":
      return { fg: palette.warning, bg: palette.warningDim };
    case "confirmado":
      return { fg: palette.success, bg: palette.successDim };
    case "concluido":
      return { fg: palette.textMuted, bg: palette.surfaceOverlay };
    default:
      return { fg: palette.textMuted, bg: palette.surfaceOverlay };
  }
}

function waitToneColor(
  tone: ReturnType<typeof getWaitTone>,
  palette: ReturnType<typeof useTheme>["palette"],
): string {
  switch (tone) {
    case "success":
      return palette.success;
    case "warning":
      return palette.warning;
    case "danger":
      return palette.danger;
  }
}

function FilaCardImpl({ agendamento, posicao, onChangeStatus, testID }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Recalcula a cada 30s para a barra de progresso e o tom evoluírem ao vivo.
  const [tick, setTick] = useState(0);
  useInterval(() => setTick((t) => t + 1), 30_000);

  const chegadaIso = agendamento.criadoEm;
  const chegadaStr = format(parseISO(chegadaIso), "HH:mm", { locale: ptBR });

  const { minutesWaiting, progress, toneColor } = useMemo(() => {
    const mins = getMinutesWaiting(chegadaIso);
    const tone = getWaitTone(mins);
    return {
      minutesWaiting: mins,
      progress: getWaitProgress(mins),
      toneColor: waitToneColor(tone, palette),
    };
    // tick força recálculo a cada minuto sem causar re-render desnecessário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chegadaIso, palette, tick]);

  const servicoNome =
    agendamento.itens.length === 1
      ? agendamento.itens[0].servico.nome
      : `${agendamento.itens[0]?.servico.nome ?? "Serviço"} +${agendamento.itens.length - 1}`;

  const status = statusFgBg(agendamento.status, palette);

  const handleLongPress = useCallback(() => {
    if (!onChangeStatus) return;
    setSheetOpen(true);
  }, [onChangeStatus]);

  const handlePick = useCallback(
    (s: Exclude<StatusAgendamento, "pendente">) => {
      onChangeStatus?.(agendamento.codigo, s);
      setSheetOpen(false);
    },
    [agendamento.codigo, onChangeStatus],
  );

  return (
    <>
      <Card
        testID={testID ?? `fila-${agendamento.codigo}`}
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityLabel={`${posicao}º na fila: ${agendamento.cliente.nome}, chegou às ${chegadaStr}, aguardando há ${minutesWaiting} minutos`}
        accessibilityHint={
          onChangeStatus ? "Pressione e segure para mudar o status" : undefined
        }
      >
        <View style={styles.row}>
          <View
            style={[
              styles.posicaoBadge,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.borderStrong,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text
              style={[styles.posicaoText, { color: palette.primary }]}
              testID="posicao"
            >
              {`${posicao}º`}
            </Text>
          </View>

          <View style={[styles.info, { marginLeft: spacing.md }]}>
            <View style={styles.headerRow}>
              <Text
                style={[typography.bodyBold, { color: palette.text, flex: 1 }]}
                numberOfLines={1}
              >
                {agendamento.cliente.nome}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: status.bg,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: status.fg, fontFamily: "Inter_600SemiBold" },
                  ]}
                  testID="status-badge"
                >
                  {STATUS_LABEL[agendamento.status]}
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.caption,
                { color: palette.textMuted, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {servicoNome} · chegou {chegadaStr}
            </Text>

            {/* Barra de progresso da espera — verde → âmbar → vermelho */}
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: palette.surfaceOverlay,
                  borderRadius: radius.full,
                  marginTop: spacing.sm,
                },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: toneColor,
                    borderRadius: radius.full,
                    width: `${progress * 100}%`,
                  },
                ]}
                testID={`fila-${agendamento.codigo}-progress`}
              />
            </View>

            <Text
              style={[
                typography.caption,
                { color: toneColor, marginTop: spacing.xs },
              ]}
            >
              Aguardando há {Math.max(0, minutesWaiting)}min
            </Text>
          </View>
        </View>
      </Card>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        height={0.42}
        testID={`fila-${agendamento.codigo}-sheet`}
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
          {posicao}º na fila · {servicoNome}
        </Text>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.status}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={() => handlePick(a.status)}
            style={({ pressed }) => [
              styles.sheetAction,
              {
                paddingVertical: spacing.md,
                borderBottomColor: palette.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[typography.bodyMedium, { color: palette.text }]}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}

export const FilaCard = memo(FilaCardImpl);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  posicaoBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  posicaoText: {
    fontFamily: "JetBrainsMono_700Bold",
    fontSize: 18,
    lineHeight: 22,
  },
  info: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  sheetAction: {
    borderBottomWidth: 1,
  },
});
