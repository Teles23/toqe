import { Feather } from "@expo/vector-icons";
import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface FormInputProps extends Omit<
  TextInputProps,
  "style" | "placeholderTextColor"
> {
  label: string;
  error?: string;
  /** Texto adicional abaixo do label (ex: "(opcional)") */
  hint?: string;
  /** Ícone Feather opcional à esquerda do campo (ex: "mail", "lock") */
  leftIcon?: keyof typeof Feather.glyphMap;
}

/**
 * Input padrão do app — encapsula label, TextInput estilizado e mensagem de erro.
 * Mantém compatibilidade total com `Controller` do react-hook-form.
 */
export const FormInput = forwardRef<TextInput, FormInputProps>(
  function FormInput(
    { label, error, hint, leftIcon, accessibilityLabel, ...textInputProps },
    ref,
  ) {
    const { palette, spacing, radius, typography, a11y } = useTheme();

    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text
          style={[typography.label, { color: palette.text, marginBottom: 6 }]}
        >
          {label}
          {hint ? (
            <Text style={{ color: palette.textMuted }}> {hint}</Text>
          ) : null}
        </Text>
        <View style={styles.fieldWrap}>
          {leftIcon ? (
            <View style={styles.iconLeft} pointerEvents="none">
              <Feather name={leftIcon} size={16} color={palette.textMuted} />
            </View>
          ) : null}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                borderRadius: radius.md,
                paddingLeft: leftIcon ? 40 : spacing.md - 2,
                paddingRight: spacing.md - 2,
                fontFamily: typography.body.fontFamily,
                fontSize: typography.body.fontSize,
                minHeight: a11y.minTouch,
                backgroundColor: palette.inputBg,
                color: palette.text,
                borderColor: error ? palette.danger : palette.inputBorder,
              },
            ]}
            placeholderTextColor={palette.textMuted}
            accessibilityLabel={accessibilityLabel ?? label}
            {...textInputProps}
          />
        </View>
        {error ? (
          <Text
            style={[
              typography.caption,
              { color: palette.danger, marginTop: 4 },
            ]}
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fieldWrap: {
    position: "relative",
    justifyContent: "center",
  },
  iconLeft: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
  },
});
