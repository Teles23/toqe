import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
} from "react-native";

import { useTheme } from "@/src/shared/theme";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
}

/**
 * Botão padrão do app — substitui Pressable+View+Text+ActivityIndicator repetidos.
 * Garante touch target ≥ 44pt (a11y), loading state com spinner, disabled visual.
 */
export function Button({
  label,
  loading = false,
  disabled,
  variant = "primary",
  accessibilityLabel,
  accessibilityState,
  ...rest
}: ButtonProps) {
  const { palette, radius } = useTheme();

  const bg =
    variant === "danger"
      ? palette.danger
      : variant === "secondary"
        ? palette.cardBg
        : palette.primary;

  const fg = variant === "secondary" ? palette.primary : palette.primaryOn;

  const borderColor = variant === "secondary" ? palette.primary : "transparent";

  const isDisabled = !!disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        busy: loading,
        disabled: isDisabled,
        ...accessibilityState,
      }}
      style={({ pressed }) => [
        styles.base(radius.md),
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" ? 1 : 0,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} testID="button-loading" />
      ) : (
        <Text style={[styles.text, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = {
  base: (r: number) =>
    StyleSheet.create({
      x: {
        height: 52,
        borderRadius: r,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        minHeight: 44,
        paddingHorizontal: 16,
      },
    }).x,
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: "600" as const },
};
