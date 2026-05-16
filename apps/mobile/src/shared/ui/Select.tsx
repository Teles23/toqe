import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface SelectOption<T> {
  value: T;
  label: string;
  /** Sub-label opcional (segunda linha menor) */
  hint?: string;
}

export interface SelectProps<T> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  /** Texto adicional ao lado do label (ex: "(opcional)") */
  hint?: string;
  /** Override do label exibido na trigger (default: option.label) */
  selectedLabel?: string;
  testID?: string;
}

/**
 * Select padrão do Toqe — Pressable + Modal nativo + FlatList.
 * Tipado em T (qualquer tipo do valor).
 * Touch target ≥ 44pt, `accessibilityRole="combobox"`.
 */
export function Select<T>({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione…",
  error,
  hint,
  selectedLabel,
  testID,
}: SelectProps<T>) {
  const { palette, spacing, radius, typography, a11y } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayText = selectedLabel ?? selected?.label ?? placeholder;
  const hasSelection = value !== null && value !== undefined;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={[
          {
            ...typography.label,
            color: palette.text,
            marginBottom: 6,
          },
        ]}
      >
        {label}
        {hint ? (
          <Text style={{ color: palette.textMuted }}> {hint}</Text>
        ) : null}
      </Text>

      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          {
            height: 48,
            minHeight: a11y.minTouch,
            borderRadius: radius.md,
            borderWidth: 1,
            paddingHorizontal: 14,
            justifyContent: "center" as const,
            backgroundColor: palette.inputBg,
            borderColor: error ? palette.danger : palette.inputBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={{
            ...typography.body,
            color: hasSelection ? palette.text : palette.textMuted,
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
      </Pressable>

      {error ? (
        <Text
          style={{
            ...typography.caption,
            color: palette.danger,
            marginTop: 4,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={() => setOpen(false)}
          accessibilityLabel="Fechar"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.border,
              paddingTop: spacing.md,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <Text
            style={{
              ...typography.heading,
              color: palette.text,
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            {label}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(item, idx) => `${idx}-${String(item.value)}`}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  testID={`${testID ?? label}-option-${String(item.value)}`}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      minHeight: a11y.minTouch,
                      backgroundColor: isSelected
                        ? palette.overlay
                        : "transparent",
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={{
                      ...typography.body,
                      color: palette.text,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.hint ? (
                    <Text
                      style={{
                        ...typography.caption,
                        color: palette.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {item.hint}
                    </Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  backdrop: { flex: 1 },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
});
