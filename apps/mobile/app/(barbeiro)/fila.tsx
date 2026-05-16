import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { FilaCard } from "@/src/features/barbeiro/FilaCard";
import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper, ScreenHeader } from "@/src/shared/ui";
import type { StatusAgendamento } from "@toqe/shared";

export default function BarbeiroFilaScreen() {
  const { palette, radius } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isRefetching, refetch, isError } = useFilaDia();
  const updateStatus = useUpdateStatus();

  const handleChangeStatus = useCallback(
    (codigo: number, status: Exclude<StatusAgendamento, "pendente">) => {
      updateStatus.mutate({ codigo, status });
    },
    [updateStatus],
  );

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="Fila de atendimento" />

      <DataListWrapper
        testID="lista-fila"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage="Fila vazia. Toque em + para adicionar um walk-in."
        errorMessage="Não foi possível carregar a fila. Puxe para tentar novamente."
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item, index }) => (
          <FilaCard
            agendamento={item}
            posicao={index + 1}
            onChangeStatus={handleChangeStatus}
          />
        )}
      />

      <Pressable
        onPress={openModal}
        accessibilityRole="button"
        accessibilityLabel="Adicionar walk-in"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.primary, borderRadius: radius.pill },
          pressed && styles.fabPressed,
        ]}
        testID="fab-adicionar"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AdicionarWalkInModal visible={modalOpen} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPressed: { opacity: 0.8 },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 28 },
});
