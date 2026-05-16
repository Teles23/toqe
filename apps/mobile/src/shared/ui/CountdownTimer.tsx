import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { useInterval } from "@/src/shared/hooks/use-interval";
import { useTheme } from "@/src/shared/theme";

import { PulsingDot } from "./PulsingDot";
import {
  type CountdownTone,
  formatCountdownLabel,
  getCountdownColor,
} from "./utils/countdown";

export interface CountdownTimerProps {
  /** Momento alvo (ISO string ou Date). */
  target: string | Date;
  /**
   * Intervalo de atualização em ms. Default: 60_000 (1min).
   * Reduzido nos últimos 15min via override interno (atualiza a cada 30s).
   */
  updateIntervalMs?: number;
  testID?: string;
}

interface Snapshot {
  label: string;
  tone: CountdownTone;
  minutesLeft: number;
}

function snapshot(target: Date): Snapshot {
  const delta = target.getTime() - Date.now();
  const minutesLeft = Math.floor(delta / 60_000);
  return {
    label: formatCountdownLabel(delta),
    tone: getCountdownColor(minutesLeft),
    minutesLeft,
  };
}

/**
 * Contagem regressiva até um agendamento.
 *
 * Cor muda conforme o threshold (verde > âmbar > vermelho pulsante).
 * Atualiza a cada minuto; quando faltam < 15min, pulsa via PulsingDot
 * para puxar o olho do usuário (princípio "a hora é o herói").
 */
export function CountdownTimer({
  target,
  updateIntervalMs = 60_000,
  testID,
}: CountdownTimerProps) {
  const { palette, typography, spacing } = useTheme();

  const targetDate = useMemo(
    () => (target instanceof Date ? target : new Date(target)),
    [target],
  );

  const [snap, setSnap] = useState<Snapshot>(() => snapshot(targetDate));

  useInterval(() => setSnap(snapshot(targetDate)), updateIntervalMs);

  const color =
    snap.tone === "success"
      ? palette.success
      : snap.tone === "warning"
        ? palette.primary
        : snap.tone === "danger"
          ? palette.danger
          : palette.textMuted;

  const isUrgent = snap.tone === "danger";

  return (
    <Text
      testID={testID ?? "countdown-timer"}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Faltam ${snap.label}`}
      style={[
        styles.row,
        typography.bodyMedium,
        { color, gap: spacing.xs + 2 },
      ]}
    >
      {isUrgent ? <PulsingDot color={color} size={6} /> : null}
      <Text style={{ color }}>{snap.label}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
