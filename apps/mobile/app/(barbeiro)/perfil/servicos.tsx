import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";
import { useToggleServico } from "@/src/shared/hooks/barbeiro/use-toggle-servico";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, ScreenHeader } from "@/src/shared/ui";

const ACCENT = "#F4B400";

function formatBRL(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PriceChip({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        priceChipStyles.chip,
        accent ? priceChipStyles.chipAccent : priceChipStyles.chipMuted,
      ]}
    >
      <Text style={priceChipStyles.label}>{label}</Text>
      <Text
        style={[priceChipStyles.value, { color: accent ? ACCENT : "#888888" }]}
      >
        {value}
      </Text>
      <Text style={priceChipStyles.sub}>{sub}</Text>
    </View>
  );
}

const priceChipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#1c1c1c",
  },
  chipMuted: { borderColor: "#262626" },
  chipAccent: { borderColor: ACCENT + "40" },
  label: {
    fontSize: 9,
    color: "#666666",
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  value: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  sub: {
    fontSize: 10,
    color: "#444444",
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
});

/**
 * Sub-tela de serviços e preços.
 * Toggle persiste via PUT /servicos/:codigo com { ativo }.
 */
export default function ServicosScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
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
      <ScreenHeader
        title="Serviços e preços"
        subtitle={
          count > 0
            ? `${count} ${count === 1 ? "serviço" : "serviços"}`
            : undefined
        }
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar serviço"
            onPress={() =>
              Alert.alert(
                "Em breve",
                "Cadastro de novos serviços chega numa próxima atualização.",
              )
            }
            style={({ pressed }) => [
              styles.addBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="plus" size={18} color={ACCENT} />
          </Pressable>
        }
      />

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
                    <Feather
                      name="scissors"
                      size={16}
                      color={ativo ? ACCENT : palette.textMuted}
                    />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: palette.text }]}>
                      {s.nome}
                    </Text>
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={10} color="#666666" />
                      <Text
                        style={[
                          typography.caption,
                          { color: palette.textMuted },
                        ]}
                      >
                        {s.duracaoBase}min
                      </Text>
                      <Text style={{ color: "#444444" }}>·</Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: ativo ? "#aaaaaa" : palette.textMuted,
                            fontFamily: "JetBrainsMono_400Regular",
                          },
                        ]}
                      >
                        {formatBRL(s.precoBase)}
                      </Text>
                    </View>
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

                {/* Price chips — só quando ativo */}
                {ativo ? (
                  <View
                    style={[
                      styles.priceRow,
                      { borderTopColor: palette.border },
                    ]}
                  >
                    <PriceChip
                      label="Preço base"
                      value={formatBRL(s.precoBase)}
                      sub="da barbearia"
                    />
                    <PriceChip
                      label="Seu preço"
                      value={formatBRL(s.precoBase)}
                      sub="cobrado dos clientes"
                      accent
                    />
                  </View>
                ) : null}
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
            paddingBottom: insets.bottom + spacing.md,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT + "1a",
    borderWidth: 1,
    borderColor: ACCENT + "38",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {},
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {},
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stickyBottom: {},
});
