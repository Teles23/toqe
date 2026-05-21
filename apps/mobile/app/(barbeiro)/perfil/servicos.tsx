import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";
import { useToggleServico } from "@/src/shared/hooks/barbeiro/use-toggle-servico";
import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

/**
 * Sub-tela de serviços e preços.
 * Toggle persiste via PUT /servicos/:codigo com { ativo }.
 */
export default function ServicosScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const { data: servicos, isLoading } = useServicos();
  const {
    mutate: toggleMutate,
    isPending: isTogglePending,
    variables: toggleVariables,
  } = useToggleServico();

  // Optimistic local state: sobrescreve valor do servidor enquanto a mutation não invalida
  const [ativos, setAtivos] = useState<Record<number, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);

  const isAtivo = useCallback(
    (codigo: number, defaultAtivo: boolean) => {
      return ativos[codigo] !== undefined ? ativos[codigo] : defaultAtivo;
    },
    [ativos],
  );

  const handleToggle = useCallback(
    (codigo: number, value: boolean) => {
      // Atualização otimista — reverte se a API falhar
      setAtivos((prev) => ({ ...prev, [codigo]: value }));
      setErro(null);
      toggleMutate(
        { codigo, ativo: value },
        {
          onError: (e) => {
            // Reverte estado otimista
            setAtivos((prev) => ({ ...prev, [codigo]: !value }));
            setErro(e.message ?? "Erro ao atualizar serviço.");
          },
        },
      );
    },
    [toggleMutate],
  );

  const count = servicos?.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Top bar ── */}
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Text style={{ color: palette.primary, fontSize: 20 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.subheading, { color: palette.text }]}>
            Serviços e preços
          </Text>
          {count > 0 ? (
            <Text style={[typography.caption, { color: palette.textMuted }]}>
              {count} {count === 1 ? "serviço" : "serviços"}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator
            color={palette.primary}
            testID="servicos-loading"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxxl + 64,
          }}
        >
          {(servicos ?? []).map((s) => {
            const ativo = isAtivo(s.codigo, s.ativo);
            return (
              <View
                key={s.codigo}
                testID={`servico-row-${s.codigo}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: ativo ? palette.border : palette.borderStrong,
                    marginBottom: spacing.sm,
                    padding: spacing.md,
                    opacity: ativo ? 1 : 0.55,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  {/* Icon area */}
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: ativo
                          ? palette.primaryDim
                          : palette.surfaceHigh,
                        borderRadius: radius.sm,
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>✂️</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: palette.text }]}>
                      {s.nome}
                    </Text>
                    <Text
                      style={[typography.caption, { color: palette.textMuted }]}
                    >
                      {s.duracaoBase}min ·{" "}
                      <Text style={{ color: palette.primary }}>
                        R${" "}
                        {s.precoBase.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </Text>
                  </View>

                  {/* Toggle */}
                  <Switch
                    testID={`servico-toggle-${s.codigo}`}
                    value={ativo}
                    onValueChange={(val) => handleToggle(s.codigo, val)}
                    disabled={
                      isTogglePending && toggleVariables?.codigo === s.codigo
                    }
                    trackColor={{
                      false: palette.border,
                      true: palette.primary,
                    }}
                    thumbColor={palette.bg}
                  />
                </View>
              </View>
            );
          })}

          {(servicos ?? []).length === 0 && !isLoading ? (
            <Text
              style={[
                typography.body,
                {
                  color: palette.textMuted,
                  textAlign: "center",
                  marginTop: 40,
                },
              ]}
            >
              Nenhum serviço cadastrado.
            </Text>
          ) : null}
        </ScrollView>
      )}

      {/* ── Sticky bottom ── */}
      <View
        style={[
          styles.stickyBottom,
          {
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            backgroundColor: palette.bg,
          },
        ]}
      >
        {erro ? (
          <Text
            testID="servicos-error"
            style={[
              typography.caption,
              {
                color: palette.danger,
                marginBottom: spacing.sm,
                textAlign: "center",
              },
            ]}
          >
            {erro}
          </Text>
        ) : null}
        <AmberButton
          testID="btn-salvar-servicos"
          label="Concluir"
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {},
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {},
  stickyBottom: {},
});
