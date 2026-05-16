import { StyleSheet, Text, View } from "react-native";

import { PulsingDot } from "./PulsingDot";
import { type Palette, useTheme } from "@/src/shared/theme";

export type StatusBadgeStatus =
  | "confirmado"
  | "pendente"
  | "cancelado"
  | "concluido"
  | "online";

export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  /** Texto exibido. Default: label PT-BR do status. */
  label?: string;
  /** Tamanho: `sm` (caption) ou `md` (label). Default: `sm`. */
  size?: "sm" | "md";
  testID?: string;
  /**
   * TestID adicional aplicado ao `<Text>` interno (não ao wrapper).
   * Útil para testes que assertam `props.children` esperando string pura.
   */
  textTestID?: string;
}

interface StatusTokens {
  bg: keyof Palette;
  fg: keyof Palette;
  showDot: boolean;
  defaultLabel: string;
}

const STATUS_MAP: Record<StatusBadgeStatus, StatusTokens> = {
  confirmado: {
    bg: "successDim",
    fg: "success",
    showDot: true,
    defaultLabel: "Confirmado",
  },
  pendente: {
    bg: "primaryDim",
    fg: "primary",
    showDot: false,
    defaultLabel: "Pendente",
  },
  cancelado: {
    bg: "dangerDim",
    fg: "danger",
    showDot: false,
    defaultLabel: "Cancelado",
  },
  concluido: {
    bg: "surfaceOverlay",
    fg: "textMuted",
    showDot: false,
    defaultLabel: "Concluído",
  },
  online: {
    bg: "successDim",
    fg: "success",
    showDot: true,
    defaultLabel: "Online",
  },
};

/**
 * Badge de status — texto + cor consistentes por status + PulsingDot opcional.
 *
 * Mapa de status → tokens em `STATUS_MAP`. Para mudar a aparência de um
 * status (ex.: cor de "concluido"), editar apenas o mapa.
 */
export function StatusBadge({
  status,
  label,
  size = "sm",
  testID,
  textTestID,
}: StatusBadgeProps) {
  const { palette, radius, spacing, typography } = useTheme();
  const tokens = STATUS_MAP[status];
  const fg = palette[tokens.fg];
  const bg = palette[tokens.bg];

  const textStyle = size === "md" ? typography.label : typography.caption;

  return (
    <View
      testID={testID ?? `status-badge-${status}`}
      accessibilityRole="text"
      accessibilityLabel={label ?? tokens.defaultLabel}
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: size === "md" ? spacing.xs + 2 : spacing.xs,
          gap: spacing.xs + 2,
        },
      ]}
    >
      {tokens.showDot ? <PulsingDot color={fg} size={6} /> : null}
      <Text testID={textTestID} style={[textStyle, { color: fg }]}>
        {label ?? tokens.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
});
