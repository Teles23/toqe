import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/src/shared/theme";

export type QuickActionVariant = "primary" | "success" | "danger" | "neutral";

export interface QuickAction {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  variant?: QuickActionVariant;
  disabled?: boolean;
}

export interface QuickActionBarProps {
  actions: QuickAction[];
  /** Override de estilo do container externo. */
  style?: ViewStyle;
  testID?: string;
}

/**
 * Barra horizontal de ações rápidas — ícone + label.
 *
 * Princípio Barber's Flow: ações primárias com 1 toque, sem navegar.
 * Usado no card de agendamento do barbeiro para [Iniciar/Confirmar/Cancelar]
 * e no item da fila para [Chamar/Iniciar/Remover].
 *
 * Scroll horizontal apenas se as ações estourarem a largura — para 2-3
 * ações típicas o conteúdo cabe sem rolar.
 */
export function QuickActionBar({
  actions,
  style,
  testID,
}: QuickActionBarProps) {
  const { palette, spacing, radius, typography } = useTheme();

  function colorsFor(variant: QuickActionVariant) {
    switch (variant) {
      case "primary":
        return { bg: palette.primaryDim, fg: palette.primary };
      case "success":
        return { bg: palette.successDim, fg: palette.success };
      case "danger":
        return { bg: palette.dangerDim, fg: palette.danger };
      default:
        return { bg: palette.surfaceOverlay, fg: palette.text };
    }
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { gap: spacing.sm }]}
      style={style}
      testID={testID ?? "quick-action-bar"}
    >
      {actions.map((action) => {
        const { bg, fg } = colorsFor(action.variant ?? "neutral");
        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled: !!action.disabled }}
            disabled={action.disabled}
            onPress={() => {
              if (action.disabled) return;
              void Haptics.selectionAsync();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: bg,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                gap: spacing.xs + 2,
                opacity: action.disabled ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name={action.icon} size={16} color={fg} />
            <Text style={[typography.label, { color: fg }]}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
      {actions.length === 0 ? <View style={styles.empty} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
  },
  empty: { width: 0, height: 0 },
});
