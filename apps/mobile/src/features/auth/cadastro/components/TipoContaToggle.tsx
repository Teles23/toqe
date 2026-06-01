import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export type TipoConta = "cliente" | "barbeiro";

export interface TipoContaToggleProps {
  value: TipoConta;
  onChange: (value: TipoConta) => void;
  testID?: string;
}

interface OptionProps {
  option: TipoConta;
  label: string;
  testIDSuffix: string;
  selected: boolean;
  testIDPrefix: string;
  onPress: () => void;
}

function Option({
  option: _option,
  label,
  testIDSuffix,
  selected,
  testIDPrefix,
  onPress,
}: OptionProps) {
  const { palette, radius, typography } = useTheme();
  return (
    <Pressable
      testID={`${testIDPrefix}-${testIDSuffix}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? palette.primary : "transparent",
          borderRadius: radius.sm,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          typography.bodyBold,
          {
            color: selected ? palette.primaryOn : palette.textMuted,
            fontFamily: selected ? "Sora_600SemiBold" : "Inter_500Medium",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Toggle binário entre "Cliente" e "Barbeiro" — usado no step 3 do cadastro.
 *
 * Visual:
 *  ┌──────────────┬───────────────┐
 *  │  Cliente     │  Barbeiro     │
 *  └──────────────┴───────────────┘
 *
 * - Container com borda `borderStrong` e radius md.
 * - Opção selecionada: fundo `palette.primary`, texto `primaryOn`.
 * - Opção não selecionada: fundo transparente, texto `textMuted`.
 */
export function TipoContaToggle({
  value,
  onChange,
  testID,
}: TipoContaToggleProps) {
  const { palette, radius } = useTheme();
  const prefix = testID ?? "tipo-conta-toggle";

  return (
    <View
      testID={prefix}
      accessibilityRole="radiogroup"
      style={[
        styles.container,
        {
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
        },
      ]}
    >
      <Option
        option="cliente"
        label="Cliente"
        testIDSuffix="cliente"
        selected={value === "cliente"}
        testIDPrefix={prefix}
        onPress={() => onChange("cliente")}
      />
      <Option
        option="barbeiro"
        label="Barbeiro"
        testIDSuffix="barbeiro"
        selected={value === "barbeiro"}
        testIDPrefix={prefix}
        onPress={() => onChange("barbeiro")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
