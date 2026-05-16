import { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export type ListItemTrailing =
  | { kind: "arrow" }
  | { kind: "switch"; value: boolean; onValueChange: (v: boolean) => void }
  | { kind: "radio"; selected: boolean }
  | { kind: "node"; node: ReactNode }
  | undefined;

export interface ListItemProps {
  /** Texto principal */
  label: string;
  /** Texto secundário (subtítulo, valor, status) */
  subtitle?: string;
  /** Slot opcional à esquerda (ícone ou avatar) */
  leading?: ReactNode;
  /** Indicador à direita: seta, switch, radio ou nó custom */
  trailing?: ListItemTrailing;
  /** Callback de toque (torna o item Pressable). Quando ausente, é View estático */
  onPress?: () => void;
  /** Estado destacado (selecionado) */
  selected?: boolean;
  /** Variante danger (para "Sair", "Excluir conta", etc.) */
  danger?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Linha padronizada de lista (settings, perfil, menus).
 * - Touch target ≥ 44pt
 * - Trailing tipado: arrow / switch / radio / node custom
 * - Variante `danger` muda cor do label
 */
export function ListItem({
  label,
  subtitle,
  leading,
  trailing,
  onPress,
  selected = false,
  danger = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: ListItemProps) {
  const { palette, spacing, typography, a11y } = useTheme();

  const labelColor = danger ? palette.danger : palette.text;

  const inner = (
    <View
      style={[
        styles.row,
        {
          paddingVertical: spacing.md - 4,
          paddingHorizontal: spacing.md,
          minHeight: a11y.minTouch,
          backgroundColor: selected ? palette.overlay : "transparent",
        },
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.center}>
        <Text
          style={{ ...typography.body, color: labelColor, fontWeight: "500" }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: palette.textMuted,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <TrailingRenderer trailing={trailing} />
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel}>
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {inner}
    </Pressable>
  );
}

function TrailingRenderer({ trailing }: { trailing: ListItemTrailing }) {
  const { palette, typography } = useTheme();

  if (!trailing) return null;

  switch (trailing.kind) {
    case "arrow":
      return (
        <Text
          style={{
            ...typography.body,
            color: palette.textMuted,
            marginLeft: 8,
          }}
          accessibilityLabel="abrir"
        >
          ›
        </Text>
      );
    case "switch":
      return (
        <Switch
          value={trailing.value}
          onValueChange={trailing.onValueChange}
          accessibilityRole="switch"
        />
      );
    case "radio":
      return (
        <View
          style={[
            styles.radio,
            {
              borderColor: trailing.selected ? palette.primary : palette.border,
            },
          ]}
        >
          {trailing.selected ? (
            <View
              style={[styles.radioDot, { backgroundColor: palette.primary }]}
            />
          ) : null}
        </View>
      );
    case "node":
      return <View style={{ marginLeft: 8 }}>{trailing.node}</View>;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  leading: {
    marginRight: 12,
  },
  center: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
