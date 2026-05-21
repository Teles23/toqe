import { Feather } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/shared/theme";

export interface ScreenHeaderProps {
  /** Título principal exibido no topo */
  title: string;
  /** Subtítulo opcional (linha menor sob o título) */
  subtitle?: string;
  /** Se fornecido, renderiza um botão "voltar" 40×40 à esquerda do título */
  onBack?: () => void;
  /** Slot opcional à direita do título (ex: botão de ação) */
  right?: ReactNode;
  /** Slot opcional abaixo do título (ex: navegador de dia, busca, filtros) */
  subheader?: ReactNode;
  /** Mostra a borda inferior (default: true) */
  border?: boolean;
  testID?: string;
}

/**
 * Header padrão de tela — fonte única do cabeçalho (DRY).
 *
 * Aplica safe-area real via `useSafeAreaInsets()` (o título nunca cola na
 * status bar / notch). Com `onBack`, vira header de subtela (botão voltar +
 * título 18px); sem `onBack`, header de topo (título 24px).
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  subheader,
  border = true,
  testID,
}: ScreenHeaderProps) {
  const { palette, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.lg - 4,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
          borderBottomWidth: border ? 1 : 0,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            testID="screen-header-back"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="chevron-left" size={20} color={palette.text} />
          </Pressable>
        ) : null}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              ...typography.heading,
              fontSize: onBack ? 18 : 24,
              color: palette.text,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {subheader ? (
        <View style={{ marginTop: spacing.md }}>{subheader}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    marginLeft: 0,
  },
});
