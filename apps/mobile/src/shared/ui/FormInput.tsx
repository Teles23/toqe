import { Feather } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import {
  Pressable,
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
  /**
   * Quando `true`, o campo é tratado como senha: começa oculto e ganha um
   * botão de olho (Feather `eye`/`eye-off`) à direita para mostrar/ocultar.
   * O FormInput passa a controlar o `secureTextEntry` internamente — não
   * passe `secureTextEntry` junto com esta prop.
   */
  secureToggle?: boolean;
}

/**
 * Input padrão do app — encapsula label, TextInput estilizado e mensagem de erro.
 * Mantém compatibilidade total com `Controller` do react-hook-form.
 */
export const FormInput = forwardRef<TextInput, FormInputProps>(
  function FormInput(
    {
      label,
      error,
      hint,
      leftIcon,
      secureToggle = false,
      secureTextEntry,
      accessibilityLabel,
      ...textInputProps
    },
    ref,
  ) {
    const { palette, spacing, radius, typography, a11y } = useTheme();
    const [hidden, setHidden] = useState(true);

    // Com `secureToggle`, o estado interno comanda a ocultação; sem ele,
    // respeita o `secureTextEntry` vindo do consumidor.
    const isSecure = secureToggle ? hidden : secureTextEntry;

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
            secureTextEntry={isSecure}
            style={[
              styles.input,
              {
                borderRadius: radius.md,
                paddingLeft: leftIcon ? 40 : spacing.md - 2,
                paddingRight: secureToggle ? 44 : spacing.md - 2,
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
          {secureToggle ? (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              style={styles.iconRight}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}
              testID="toggle-senha"
              hitSlop={8}
            >
              <Feather
                name={hidden ? "eye" : "eye-off"}
                size={18}
                color={palette.textMuted}
              />
            </Pressable>
          ) : null}
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
  iconRight: {
    position: "absolute",
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
  },
});
