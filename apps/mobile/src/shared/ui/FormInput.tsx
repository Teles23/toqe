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
      <View style={styles.wrapper(spacing)}>
        <Text style={[styles.label(typography), { color: palette.text }]}>
          {label}
          {hint ? (
            <Text style={{ color: palette.textMuted }}> {hint}</Text>
          ) : null}
        </Text>
        <TextInput
          ref={ref}
          style={[
            styles.input(spacing, radius, typography, a11y.minTouch),
            {
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
            style={[styles.error(typography), { color: palette.danger }]}
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = {
  wrapper: (s: { md: number }) => ({ marginBottom: s.md }),
  label: (t: { label: { fontSize: number; fontWeight: "500" } }) => ({
    fontSize: t.label.fontSize,
    fontWeight: t.label.fontWeight,
    marginBottom: 6,
  }),
  input: (
    s: { md: number },
    r: { md: number },
    t: { body: { fontSize: number } },
    minH: number,
  ) =>
    StyleSheet.create({
      x: {
        height: 48,
        borderRadius: r.md,
        borderWidth: 1,
        paddingHorizontal: s.md - 2,
        fontSize: t.body.fontSize,
        minHeight: minH,
      },
    }).x,
  error: (t: { caption: { fontSize: number } }) => ({
    fontSize: t.caption.fontSize,
    marginTop: 4,
  }),
};
