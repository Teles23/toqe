/**
 * OrdenarClientesSheet — bottom sheet de opções de ordenação da lista de
 * clientes. Substitui os chips de ordenação soltos no layout (Nome / Última
 * visita) por um ícone no header que abre estas opções, com a selecionada
 * destacada (âmbar + check).
 */

import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/src/shared/ui";

const ACCENT = "#F4B400";

export type SortClientes =
  | "nomeAsc"
  | "nomeDesc"
  | "ultimaRecente"
  | "ultimaAntiga"
  | "totalGasto";

export const SORT_CLIENTES_OPTIONS: { id: SortClientes; label: string }[] = [
  { id: "nomeAsc", label: "Nome (A → Z)" },
  { id: "nomeDesc", label: "Nome (Z → A)" },
  { id: "ultimaRecente", label: "Última visita (mais recente)" },
  { id: "ultimaAntiga", label: "Última visita (mais antiga)" },
  { id: "totalGasto", label: "Total gasto" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  value: SortClientes;
  onSelect: (sort: SortClientes) => void;
}

export function OrdenarClientesSheet({
  visible,
  onClose,
  value,
  onSelect,
}: Props) {
  const handleSelect = (sort: SortClientes) => {
    onSelect(sort);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height="content"
      testID="ordenar-clientes-sheet"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ordenar por</Text>
      </View>

      <View>
        {SORT_CLIENTES_OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              testID={`sort-option-${opt.id}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`Ordenar por ${opt.label}`}
              onPress={() => handleSelect(opt.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {opt.label}
              </Text>
              {active && <Feather name="check" size={18} color={ACCENT} />}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  pressed: { opacity: 0.7 },
  rowText: {
    fontSize: 14,
    color: "#f5f5f5",
    fontFamily: "Inter_400Regular",
  },
  rowTextActive: {
    color: ACCENT,
    fontFamily: "Inter_600SemiBold",
  },
});
