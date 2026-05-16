import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Input de busca com ícone de lupa à esquerda e botão clear (X) à direita.
 * Touch target ≥ 44pt no botão clear.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = "Buscar…",
  testID,
  accessibilityLabel = "Buscar",
}: SearchInputProps) {
  const { palette, radius, typography, a11y } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.inputBg,
          borderColor: palette.inputBorder,
          borderRadius: radius.md,
          height: 48,
          minHeight: a11y.minTouch,
        },
      ]}
    >
      <Text style={[styles.icon, { color: palette.textMuted }]}>🔍</Text>
      <TextInput
        testID={testID ?? "search-input"}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          { color: palette.text, fontSize: typography.body.fontSize },
        ]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          style={({ pressed }) => [
            styles.clear,
            { minHeight: a11y.minTouch, minWidth: a11y.minTouch },
            pressed && styles.pressed,
          ]}
          hitSlop={4}
          testID={`${testID ?? "search-input"}-clear`}
        >
          <Text style={[styles.clearText, { color: palette.textMuted }]}>
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  clear: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearText: {
    fontSize: 22,
    fontWeight: "300",
  },
  pressed: { opacity: 0.6 },
});
