import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CriarServicoModal } from "@/src/features/barbeiro/CriarServicoModal";
import { useAtualizarServicoBarbeiro } from "@/src/shared/hooks/barbeiro/use-atualizar-servico-barbeiro";
import { useBarbeariaConfig } from "@/src/shared/hooks/barbeiro/use-barbearia-config";
import { useServicosBarbeiro } from "@/src/shared/hooks/barbeiro/use-servicos-barbeiro";
import { useToggleServicoBarbeiro } from "@/src/shared/hooks/barbeiro/use-toggle-servico-barbeiro";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  BottomSheet,
  FormInput,
  ScreenHeader,
} from "@/src/shared/ui";
import type { ServicoBarbeiroResponse } from "@toqe/shared";

const ACCENT = "#F4B400";

function formatBRL(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Estado efetivo de "ativo" (sem registro = ativo por padrão). */
function isAtivoDefault(item: ServicoBarbeiroResponse): boolean {
  return item.barbeiro?.ativo ?? true;
}

/**
 * Sub-tela de serviços e preços do barbeiro.
 * Consome a lista consolidada (GET /servicos/barbeiro/:id): cada serviço da
 * barbearia + os exclusivos do barbeiro, com preço/duração efetivos. O barbeiro
 * liga/desliga (PATCH) e — se o dono permitir — edita preço/duração (PUT) e
 * cadastra serviços exclusivos.
 */
export default function ServicosScreen() {
  "use no memo";
  const { palette, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: servicos, isLoading } = useServicosBarbeiro();
  const { data: config } = useBarbeariaConfig();
  const toggle = useToggleServicoBarbeiro();
  const atualizar = useAtualizarServicoBarbeiro();

  const podeAlterarPreco = config?.barbeiroAlteraPreco ?? false;
  const podeCriar = config?.barbeiroCriaServico ?? false;

  // Override otimista do toggle (srvCodigo → ativo) até a query invalidar.
  const [ativos, setAtivos] = useState<Record<number, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [criarOpen, setCriarOpen] = useState(false);

  // Sheet de edição de preço/duração.
  const [editando, setEditando] = useState<ServicoBarbeiroResponse | null>(
    null,
  );
  const [precoStr, setPrecoStr] = useState("");
  const [duracaoStr, setDuracaoStr] = useState("");
  const [editErro, setEditErro] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setPrecoStr(String(editando.precoEfetivo));
      setDuracaoStr(String(editando.duracaoEfetiva));
      setEditErro(null);
    }
  }, [editando]);

  const isAtivo = useCallback(
    (item: ServicoBarbeiroResponse) =>
      ativos[item.servico.codigo] ?? isAtivoDefault(item),
    [ativos],
  );

  const handleToggle = useCallback(
    (srvCodigo: number, value: boolean) => {
      setAtivos((prev) => ({ ...prev, [srvCodigo]: value }));
      setErro(null);
      toggle.mutate(
        { srvCodigo, ativo: value },
        {
          onError: (e) => {
            setAtivos((prev) => ({ ...prev, [srvCodigo]: !value }));
            setErro(e.message ?? "Erro ao atualizar serviço.");
          },
        },
      );
    },
    [toggle],
  );

  const handleSalvarPreco = useCallback(() => {
    if (!editando) return;
    setEditErro(null);
    const preco =
      precoStr.trim() === "" ? null : Number(precoStr.replace(",", "."));
    const duracao = Number.parseInt(duracaoStr, 10);
    if (preco !== null && (Number.isNaN(preco) || preco < 0)) {
      setEditErro("Preço inválido.");
      return;
    }
    if (Number.isNaN(duracao) || duracao < 5) {
      setEditErro("Duração mínima: 5 minutos.");
      return;
    }
    atualizar.mutate(
      {
        srvCodigo: editando.servico.codigo,
        precoProprio: preco,
        duracaoMin: duracao,
      },
      {
        onSuccess: () => setEditando(null),
        onError: (e) =>
          setEditErro(e.message ?? "Não foi possível salvar. Tente novamente."),
      },
    );
  }, [editando, precoStr, duracaoStr, atualizar]);

  const count = servicos?.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Serviços e preços"
        subtitle={
          count > 0
            ? `${count} ${count === 1 ? "serviço" : "serviços"}`
            : undefined
        }
        onBack={() => router.back()}
        right={
          podeCriar ? (
            <Pressable
              testID="btn-add-servico"
              accessibilityRole="button"
              accessibilityLabel="Adicionar serviço exclusivo"
              onPress={() => setCriarOpen(true)}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="plus" size={18} color={ACCENT} />
            </Pressable>
          ) : undefined
        }
      />

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
          {(servicos ?? []).map((item) => {
            const ativo = isAtivo(item);
            const { codigo, nome } = item.servico;
            const precoDiferente = item.precoEfetivo !== item.servico.precoBase;
            return (
              <Pressable
                key={codigo}
                testID={`servico-row-${codigo}`}
                disabled={!podeAlterarPreco}
                onPress={() => podeAlterarPreco && setEditando(item)}
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
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: ativo
                          ? palette.primaryDim
                          : palette.surfaceHigh,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Feather
                      name="scissors"
                      size={16}
                      color={ativo ? ACCENT : palette.textMuted}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <View style={styles.nomeRow}>
                      <Text
                        style={[typography.label, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {nome}
                      </Text>
                      {item.exclusivo ? (
                        <View style={styles.badgeExcl}>
                          <Text style={styles.badgeExclText}>EXCLUSIVO</Text>
                        </View>
                      ) : null}
                      {!ativo ? (
                        <View style={styles.badgeOff}>
                          <Text style={styles.badgeOffText}>NÃO REALIZO</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={10} color="#666666" />
                      <Text
                        style={[
                          typography.caption,
                          { color: palette.textMuted },
                        ]}
                      >
                        {item.duracaoEfetiva}min
                      </Text>
                      <Text style={{ color: "#444444" }}>·</Text>
                      <Text
                        testID={`servico-preco-${codigo}`}
                        style={[
                          typography.caption,
                          {
                            color: ativo ? ACCENT : palette.textMuted,
                            fontFamily: "JetBrainsMono_400Regular",
                          },
                        ]}
                      >
                        {formatBRL(item.precoEfetivo)}
                      </Text>
                      {precoDiferente ? (
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: palette.textMuted,
                              textDecorationLine: "line-through",
                              fontFamily: "JetBrainsMono_400Regular",
                            },
                          ]}
                        >
                          {formatBRL(item.servico.precoBase)}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Switch
                    testID={`servico-toggle-${codigo}`}
                    value={ativo}
                    onValueChange={(val) => handleToggle(codigo, val)}
                    disabled={
                      toggle.isPending && toggle.variables?.srvCodigo === codigo
                    }
                    trackColor={{
                      false: palette.border,
                      true: palette.primary,
                    }}
                    thumbColor={palette.bg}
                  />
                </View>
              </Pressable>
            );
          })}

          {count === 0 ? (
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
              Nenhum serviço disponível.
            </Text>
          ) : null}
        </ScrollView>
      )}

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

      <CriarServicoModal
        visible={criarOpen}
        exclusivo
        onClose={() => setCriarOpen(false)}
      />

      {/* Sheet de edição de preço/duração */}
      <BottomSheet
        visible={editando !== null}
        onClose={() => setEditando(null)}
        height="content"
        testID="servico-edit-sheet"
      >
        <Text style={[typography.heading, { color: palette.text }]}>
          {editando?.servico.nome}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginBottom: spacing.md },
          ]}
        >
          Seu preço e duração (deixe o preço vazio para usar o da barbearia)
        </Text>

        {editErro ? (
          <Text
            testID="servico-edit-error"
            style={[
              typography.caption,
              { color: palette.danger, marginBottom: spacing.sm },
            ]}
          >
            {editErro}
          </Text>
        ) : null}

        <View style={styles.editRow}>
          <View style={styles.editCol}>
            <FormInput
              label="Seu preço (R$)"
              placeholder={
                editando ? formatBRL(editando.servico.precoBase) : "0,00"
              }
              keyboardType="decimal-pad"
              value={precoStr}
              onChangeText={(t) => setPrecoStr(t.replace(/[^0-9.,]/g, ""))}
              testID="input-preco-proprio"
            />
          </View>
          <View style={styles.editCol}>
            <FormInput
              label="Duração (min)"
              placeholder="30"
              keyboardType="number-pad"
              maxLength={3}
              value={duracaoStr}
              onChangeText={(t) => setDuracaoStr(t.replace(/[^0-9]/g, ""))}
              testID="input-duracao-min"
            />
          </View>
        </View>

        <AmberButton
          testID="btn-salvar-preco"
          label="Salvar"
          icon="check"
          onPress={handleSalvarPreco}
          loading={atualizar.isPending}
        />
      </BottomSheet>
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
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  nomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  badgeExcl: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: ACCENT + "1a",
  },
  badgeExclText: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
    color: ACCENT,
  },
  badgeOff: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#ef44441a",
  },
  badgeOffText: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
    color: "#ef4444",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  editRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  editCol: { flex: 1 },
  stickyBottom: {},
});
