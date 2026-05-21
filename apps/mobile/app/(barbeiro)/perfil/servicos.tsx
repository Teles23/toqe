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
import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

/**
 * Sub-tela de serviços e preços (Phase 1 — local toggle state only).
 * Exibe os serviços da barbearia com preços base.
 * Salvar chama apenas router.back().
 */
export default function ServicosScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const { data: servicos, isLoading } = useServicos();

  // Local toggle state indexed by codigo
  const [ativos, setAtivos] = useState<Record<number, boolean>>({});

  const isAtivo = useCallback(
    (codigo: number, defaultAtivo: boolean) => {
      return ativos[codigo] !== undefined ? ativos[codigo] : defaultAtivo;
    },
    [ativos],
  );

  const toggleServico = useCallback((codigo: number, value: boolean) => {
    setAtivos((prev) => ({ ...prev, [codigo]: value }));
  }, []);

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
                    value={ativo}
                    onValueChange={(val) => toggleServico(s.codigo, val)}
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
        <AmberButton label="Salvar" onPress={() => router.back()} />
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
