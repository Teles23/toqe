import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { FilaCard } from "@/src/features/barbeiro/FilaCard";
import { useFilaDia } from "@/src/shared/hooks/barbeiro/use-fila-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useTheme } from "@/src/shared/theme";
import type { StatusAgendamento } from "@toqe/shared";

export default function BarbeiroFilaScreen() {
  const { palette, spacing, typography, radius } = useTheme();
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
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg - 4,
            paddingTop: spacing.xxl + spacing.sm,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderColor: palette.border,
          },
        ]}
      >
        <Text
          style={{
            ...typography.heading,
            fontSize: 24,
            color: palette.text,
          }}
        >
          Fila de atendimento
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center} testID="fila-loading">
          <ActivityIndicator color={palette.text} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text
            style={{
              ...typography.body,
              fontSize: 14,
              color: palette.textMuted,
              textAlign: "center",
            }}
          >
            Não foi possível carregar a fila. Puxe para tentar novamente.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="lista-fila"
          data={data ?? []}
          keyExtractor={(item) => String(item.codigo)}
          contentContainerStyle={[
            styles.list,
            { padding: spacing.md, paddingBottom: 100 },
          ]}
          renderItem={({ item, index }) => (
            <FilaCard
              agendamento={item}
              posicao={index + 1}
              onChangeStatus={handleChangeStatus}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.text}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text
                style={{
                  ...typography.body,
                  fontSize: 14,
                  color: palette.textMuted,
                  textAlign: "center",
                }}
              >
                Fila vazia. Toque em + para adicionar um walk-in.
              </Text>
            </View>
          }
        />
      )}

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
  header: {},
  list: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
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
