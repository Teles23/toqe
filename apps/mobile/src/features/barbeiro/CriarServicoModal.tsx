/**
 * CriarServicoModal — cadastro de um novo serviço da barbearia.
 *
 * Sheet bottom (mesmo padrão do walk-in): nome + preço + duração + descrição.
 * Persiste via POST /servicos (perfil dono/gerente). Reusa `useCriarServico`,
 * `FormInput`, `AmberButton` e `createServicoSchema` (validação no submit).
 */

import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/src/shared/api/api-client";
import { useCriarServico } from "@/src/shared/hooks/barbeiro/use-criar-servico";
import { useCriarServicoExclusivo } from "@/src/shared/hooks/barbeiro/use-criar-servico-exclusivo";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, FormErrorBox, FormInput } from "@/src/shared/ui";
import { createServicoSchema } from "@toqe/contracts";

const ACCENT = "#F4B400";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** true = cria um serviço EXCLUSIVO do barbeiro (POST /servicos/barbeiro/:id). */
  exclusivo?: boolean;
}

export function CriarServicoModal({
  visible,
  onClose,
  onSuccess,
  exclusivo = false,
}: Props) {
  const { palette, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const criarBarbearia = useCriarServico();
  const criarExclusivo = useCriarServicoExclusivo();
  const criar = exclusivo ? criarExclusivo : criarBarbearia;

  const [nome, setNome] = useState("");
  const [precoStr, setPrecoStr] = useState("");
  const [duracaoStr, setDuracaoStr] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const reset = () => {
    setNome("");
    setPrecoStr("");
    setDuracaoStr("");
    setDescricao("");
    setErro(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setErro(null);
    const parsed = createServicoSchema.safeParse({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      precoBase: Number(precoStr.replace(",", ".")),
      duracaoBase: Number.parseInt(duracaoStr, 10),
    });

    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    try {
      await criar.mutateAsync(parsed.data);
      reset();
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErro("Já existe um serviço com esse nome nessa barbearia.");
      } else if (e instanceof ApiError && e.status === 403) {
        setErro(
          exclusivo
            ? "Você não tem permissão para cadastrar serviços."
            : "Apenas o dono ou gerente pode cadastrar serviços.",
        );
      } else {
        setErro("Não foi possível criar o serviço. Tente novamente.");
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={handleClose}
          accessibilityLabel="Fechar"
        />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Feather name="scissors" size={22} color={ACCENT} />
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Novo serviço</Text>
              <Text style={styles.headerSubtitle}>
                {exclusivo ? "Exclusivo seu" : "Disponível para agendamento"}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={styles.closeBtn}
            >
              <Feather name="x" size={16} color="#888888" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
            }}
          >
            <FormErrorBox error={erro ?? undefined} />

            <FormInput
              label="Nome do serviço"
              placeholder="Ex: Corte + Barba"
              leftIcon="scissors"
              autoCapitalize="sentences"
              maxLength={100}
              value={nome}
              onChangeText={setNome}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <FormInput
                  label="Preço (R$)"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  value={precoStr}
                  onChangeText={(t) => setPrecoStr(t.replace(/[^0-9.,]/g, ""))}
                />
              </View>
              <View style={styles.col}>
                <FormInput
                  label="Duração (min)"
                  placeholder="30"
                  keyboardType="number-pad"
                  maxLength={3}
                  value={duracaoStr}
                  onChangeText={(t) => setDuracaoStr(t.replace(/[^0-9]/g, ""))}
                />
              </View>
            </View>

            <FormInput
              label="Descrição"
              hint="(opcional)"
              placeholder="Detalhes do serviço"
              autoCapitalize="sentences"
              maxLength={500}
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
          </ScrollView>

          {/* CTA */}
          <View
            style={[
              styles.footer,
              {
                paddingHorizontal: spacing.lg,
                paddingBottom: insets.bottom + 18,
                borderTopColor: palette.border,
              },
            ]}
          >
            <AmberButton
              label="Criar serviço"
              icon="check"
              onPress={handleSubmit}
              loading={criar.isPending}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  sheet: {
    maxHeight: "92%",
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  scroll: { flexShrink: 1 },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a3a3a",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ACCENT + "1a",
    borderWidth: 1,
    borderColor: ACCENT + "38",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitles: { flex: 1 },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    color: "#f5f5f5",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: { flex: 1 },
  footer: {
    paddingTop: 14,
    borderTopWidth: 1,
    backgroundColor: "#161616",
  },
});
