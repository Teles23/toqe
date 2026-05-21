import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { BottomSheet } from "./BottomSheet";

export interface TenantSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet para trocar de barbearia ativa.
 * Exibe todas as barbearias vinculadas ao usuário.
 * Design: Urban Flow v2 / SplashTenantPicker spec.
 */
export function TenantSwitcherSheet({
  visible,
  onClose,
}: TenantSwitcherSheetProps) {
  const { barbearia, barbearias, switchBarbearia } = useAuth();

  const handleSelect = (codigo: number) => {
    switchBarbearia(codigo);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height="auto"
      testID="tenant-switcher-sheet"
    >
      {/* Título + subtítulo */}
      <View style={styles.header}>
        <Text style={styles.title}>Minha barbearia</Text>
        <Text style={styles.subtitle}>Toque para trocar</Text>
      </View>

      {/* Lista de barbearias */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {barbearias.map((b) => {
          const isActive = b.codigo === barbearia?.codigo;
          const letra = b.nome.trim()[0]?.toUpperCase() ?? "?";

          return (
            <Pressable
              key={b.codigo}
              testID={`tenant-option-${b.codigo}`}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${b.nome}`}
              onPress={() => handleSelect(b.codigo)}
              style={[styles.row, isActive && styles.rowActive]}
            >
              {/* Logo square */}
              <View style={styles.logoSquare}>
                <Text style={styles.logoLetter}>{letra}</Text>
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.nomeBarbearia} numberOfLines={1}>
                  {b.nome}
                </Text>
                <Text style={styles.perfilText}>{b.perfil.toLowerCase()}</Text>
              </View>

              {/* Checkmark */}
              {isActive && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#888888",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  rowActive: {
    backgroundColor: "#F4B40014",
  },
  logoSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    color: "#0d0d0d",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nomeBarbearia: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    color: "#f5f5f5",
  },
  perfilText: {
    fontSize: 11,
    color: "#888888",
    marginTop: 1,
  },
  checkmark: {
    fontSize: 16,
    color: "#F4B400",
    marginLeft: 8,
  },
});
