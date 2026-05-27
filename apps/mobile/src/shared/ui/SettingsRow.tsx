import { Feather } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface SettingsGroupProps {
  /** Rótulo da seção (renderizado em uppercase). Omita para grupo sem header. */
  label?: string;
  children: ReactNode;
}

/**
 * Grupo de linhas de configuração — card arredondado com header opcional.
 * Fonte única compartilhada entre os perfis de cliente e barbeiro (DRY).
 */
export function SettingsGroup({ label, children }: SettingsGroupProps) {
  const { palette, spacing, radius } = useTheme();
  return (
    <View style={[styles.groupWrap, { marginHorizontal: spacing.md }]}>
      {label ? (
        <Text style={[styles.groupLabel, { color: palette.textMuted }]}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.groupContainer,
          {
            backgroundColor: palette.surfaceHigh,
            borderColor: palette.border,
            borderRadius: radius.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export interface SettingsRowProps {
  /** Ícone Feather à esquerda (opcional). */
  icon?: keyof typeof Feather.glyphMap;
  /** Cor do ícone — também tinge o box ao redor (com opacidade). */
  iconColor?: string;
  title: string;
  /** Valor à direita / linha secundária. */
  value?: string;
  onTap?: () => void;
  /** Última linha do grupo — remove a borda inferior. */
  last?: boolean;
  /** Linha destrutiva — tinge o título de `palette.danger`. */
  danger?: boolean;
  /** Slot customizado no lugar do chevron (ex: radio, toggle). */
  trailing?: ReactNode;
  testID?: string;
}

/**
 * Linha de configuração — ícone + título + valor + chevron.
 * Iconografia Feather (sem emoji/glifos). Touch target ≥ 56pt.
 */
export function SettingsRow({
  icon,
  iconColor,
  title,
  value,
  onTap,
  last = false,
  danger = false,
  trailing,
  testID,
}: SettingsRowProps) {
  const { palette } = useTheme();
  const resolvedIconColor = iconColor ?? palette.textMuted;
  const titleColor = danger ? palette.danger : palette.text;

  const content = (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: palette.border },
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: resolvedIconColor + "14",
              borderColor: resolvedIconColor + "30",
            },
          ]}
        >
          <Feather
            name={icon}
            size={16}
            color={danger ? palette.danger : resolvedIconColor}
          />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {value ? (
          <Text
            style={[styles.value, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onTap ? (
          <Feather
            name="chevron-right"
            size={18}
            color={palette.textDisabled}
          />
        ) : null)}
    </View>
  );

  if (onTap) {
    return (
      <Pressable
        testID={testID}
        onPress={onTap}
        accessibilityRole="button"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} accessibilityRole="none">
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  groupWrap: {
    marginBottom: 14,
  },
  groupLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  groupContainer: {
    overflow: "hidden",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
});
