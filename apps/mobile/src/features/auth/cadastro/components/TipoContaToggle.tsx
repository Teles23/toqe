import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export type TipoConta = "cliente" | "barbeiro";

export interface TipoContaToggleProps {
  value: TipoConta;
  onChange: (value: TipoConta) => void;
  testID?: string;
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
 *
 * O slide animado fica como refino futuro (Reanimated). Por ora a transição
 * instantânea é aceitável — o toque já dá feedback haptic via parent.
 */
export function TipoContaToggle({
  value,
  onChange,
  testID,
}: TipoContaToggleProps) {
  const { palette, radius, typography } = useTheme();

  function Option({
    option,
    label,
    testIDSuffix,
  }: {
    option: TipoConta;
    label: string;
    testIDSuffix: string;
  }) {
    const selected = value === option;
    return (
      <Pressable
        testID={`${testID ?? "tipo-conta-toggle"}-${testIDSuffix}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={() => onChange(option)}
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

  return (
    <View
      testID={testID ?? "tipo-conta-toggle"}
      accessibilityRole="radiogroup"
      style={[
        styles.container,
        {
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
        },
      ]}
    >
      <Option option="cliente" label="Cliente" testIDSuffix="cliente" />
      <Option option="barbeiro" label="Barbeiro" testIDSuffix="barbeiro" />
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
