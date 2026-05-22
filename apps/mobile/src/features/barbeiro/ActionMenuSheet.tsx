/**
 * ActionMenuSheet — sheet do FAB (+) da agenda do barbeiro.
 *
 * Aparece quando o barbeiro toca no FAB e oferece dois atalhos:
 *  - Encaixe / walk-in → cliente chegou sem agendamento
 *  - Bloquear horário  → almoço, folga, limpeza
 */

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/shared/theme";
import { BottomSheet } from "@/src/shared/ui";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ActionMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onWalkin: () => void;
  onBloqueio: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ActionMenuSheet({
  visible,
  onClose,
  onWalkin,
  onBloqueio,
}: ActionMenuSheetProps) {
  const { palette, spacing, typography } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height="content"
      testID="action-menu-sheet"
    >
      <Text
        style={[
          typography.subheading,
          { color: palette.text, marginBottom: spacing.md },
        ]}
      >
        Adicionar
      </Text>

      <View style={{ gap: spacing.sm }}>
        <SheetActionButton
          iconColor={palette.primary}
          icon={<Feather name="user" size={22} color={palette.primary} />}
          title="Encaixe"
          subtitle="Cliente chegou agora · sem agendamento"
          onPress={() => {
            onClose();
            onWalkin();
          }}
          testID="menu-walkin"
        />

        <SheetActionButton
          iconColor="#a78bfa"
          icon={<Feather name="pause-circle" size={22} color="#a78bfa" />}
          title="Bloquear horário"
          subtitle="Almoço · limpeza · folga pessoal"
          onPress={() => {
            onClose();
            onBloqueio();
          }}
          testID="menu-bloqueio"
        />
      </View>
    </BottomSheet>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

interface SheetActionButtonProps {
  iconColor: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
}

function SheetActionButton({
  iconColor,
  icon,
  title,
  subtitle,
  onPress,
  testID,
}: SheetActionButtonProps) {
  const { palette, spacing, typography, radius } = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: palette.surfaceHigh,
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
          padding: spacing.md,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {/* Icon box */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: iconColor + "1a",
            borderColor: iconColor + "38",
            borderRadius: radius.sm,
          },
        ]}
      >
        {icon}
      </View>

      {/* Text */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.label,
            { color: palette.text, fontWeight: "600", marginBottom: 2 },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[typography.caption, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      {/* Chevron */}
      <Text style={[styles.chevron, { color: palette.textDisabled }]}>›</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    minHeight: 64,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chevron: {
    fontSize: 22,
    flexShrink: 0,
  },
});
