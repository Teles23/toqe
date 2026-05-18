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
}

/**
 * Input padrão do app — encapsula label, TextInput estilizado e mensagem de erro.
 * Mantém compatibilidade total com `Controller` do react-hook-form.
 */
export const FormInput = forwardRef<TextInput, FormInputProps>(
  function FormInput(
    { label, error, hint, accessibilityLabel, ...textInputProps },
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
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              borderRadius: radius.md,
              paddingHorizontal: spacing.md - 2,
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
  input: {
    height: 48,
    borderWidth: 1,
  },
});
