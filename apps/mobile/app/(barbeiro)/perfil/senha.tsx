import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { forwardRef, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/src/shared/api/api-client";
import { useMudarSenha } from "@/src/shared/hooks/perfil/use-mudar-senha";
import { useToast } from "@/src/shared/hooks/use-toast";
import { ScreenHeader } from "@/src/shared/ui";

const AMBER = "#F4B400";
const CARD = "#171717";
const BORDER = "#262626";
const BG = "#0d0d0d";
const FG = "#f5f5f5";
const FG4 = "#666666";

export default function PerfilSenhaScreen() {
  const mudar = useMudarSenha();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [senhaAtualError, setSenhaAtualError] = useState<string | null>(null);

  const novaSenhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);

  const reqs = useMemo(
    () => ({
      length: novaSenha.length >= 8,
      upper: /[A-Z]/.test(novaSenha),
      number: /[0-9]/.test(novaSenha),
      match: novaSenha === confirmar && confirmar.length > 0,
    }),
    [novaSenha, confirmar],
  );

  const allOk =
    reqs.length &&
    reqs.upper &&
    reqs.number &&
    reqs.match &&
    senhaAtual.length > 0;

  const onSubmit = async () => {
    if (!allOk) return;
    setRootError(null);
    setSenhaAtualError(null);
    setSubmitting(true);
    try {
      await mudar.mutateAsync({ senhaAtual, novaSenha });
      showToast(
        "Senha alterada. Outros dispositivos foram desconectados.",
        "success",
      );
      router.back();
    } catch (err) {
      // 400 = senha atual incorreta (erro de campo, sem logout). Antes era 401,
      // que disparava o interceptor de refresh e deslogava o usuário.
      if (err instanceof ApiError && err.status === 400) {
        setSenhaAtualError("Senha atual incorreta.");
      } else {
        setRootError("Não foi possível alterar a senha. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: BG }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <ScreenHeader
        title="Trocar senha"
        onBack={() => router.back()}
        border={false}
      />

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>⚠</Text>
          <Text style={styles.infoText}>
            Você será desconectado de outros dispositivos ao salvar.
          </Text>
        </View>

        {/* Erro global */}
        {rootError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{rootError}</Text>
          </View>
        ) : null}

        {/* Senha atual */}
        <CampoSenha
          label="SENHA ATUAL"
          testID="input-senha-atual"
          placeholder="••••••••"
          autoComplete="password"
          value={senhaAtual}
          onChangeText={(v) => {
            setSenhaAtual(v);
            setSenhaAtualError(null);
          }}
          returnKeyType="next"
          onSubmitEditing={() => novaSenhaRef.current?.focus()}
          error={senhaAtualError}
        />

        {/* Nova senha */}
        <CampoSenha
          ref={novaSenhaRef}
          label="NOVA SENHA"
          testID="input-nova-senha"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          value={novaSenha}
          onChangeText={setNovaSenha}
          returnKeyType="next"
          onSubmitEditing={() => confirmarRef.current?.focus()}
        />

        {/* Confirmar nova senha */}
        <CampoSenha
          ref={confirmarRef}
          label="CONFIRMAR NOVA SENHA"
          testID="input-confirmar"
          placeholder="Repita a senha"
          autoComplete="new-password"
          value={confirmar}
          onChangeText={setConfirmar}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {/* Requisitos */}
        <View style={styles.reqContainer}>
          <Text style={styles.reqTitle}>REQUISITOS</Text>
          <RequisitRow
            testID="req-length"
            ok={reqs.length}
            text="Mínimo 8 caracteres"
          />
          <RequisitRow
            testID="req-upper"
            ok={reqs.upper}
            text="Pelo menos 1 maiúscula"
          />
          <RequisitRow
            testID="req-number"
            ok={reqs.number}
            text="Pelo menos 1 número"
          />
          <RequisitRow
            testID="req-match"
            ok={reqs.match}
            text="Senhas coincidem"
            last
          />
        </View>
      </ScrollView>

      {/* CTA em fluxo (dentro do KAV) — sobe junto com o teclado */}
      <View style={[styles.ctaWrapper, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable
          testID="btn-salvar-senha"
          onPress={onSubmit}
          style={[
            styles.ctaBtn,
            (!allOk || submitting) && styles.ctaBtnDisabled,
          ]}
          disabled={!allOk || submitting}
          accessibilityRole="button"
          accessibilityLabel="Salvar senha"
        >
          {submitting ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.ctaBtnText}>Salvar senha</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Campo de senha no estilo card desta tela (label uppercase + input sem borda),
 * com toggle de visibilidade (olho). Os 3 campos são idênticos em estrutura —
 * extrair evita repetição e mantém o design da tela (o FormInput global tem
 * outro visual, usado em login/cadastro).
 */
type CampoSenhaProps = {
  label: string;
  testID: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  autoComplete: TextInputProps["autoComplete"];
  returnKeyType: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  error?: string | null;
};

const CampoSenha = forwardRef<TextInput, CampoSenhaProps>(function CampoSenha(
  {
    label,
    testID,
    placeholder,
    value,
    onChangeText,
    autoComplete,
    returnKeyType,
    onSubmitEditing,
    error,
  },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          testID={testID}
          ref={ref}
          style={styles.fieldInput}
          placeholder={placeholder}
          placeholderTextColor="#444"
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          maxLength={128}
          value={value}
          onChangeText={onChangeText}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        <Pressable
          testID={`${testID}-toggle`}
          onPress={() => setHidden((h) => !h)}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}
          hitSlop={8}
        >
          <Feather name={hidden ? "eye" : "eye-off"} size={18} color={FG4} />
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
});

function RequisitRow({
  ok,
  text,
  testID,
  last = false,
}: {
  ok: boolean;
  text: string;
  testID: string;
  last?: boolean;
}) {
  return (
    <View testID={testID} style={[styles.reqRow, last && { marginBottom: 0 }]}>
      <Text style={[styles.reqIcon, ok ? styles.reqIconOk : styles.reqIconNo]}>
        {ok ? "✓" : "✗"}
      </Text>
      <Text style={styles.reqText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  infoBox: {
    backgroundColor: "#F4B40010",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F4B40030",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 14,
    color: AMBER,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#aaaaaa",
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    backgroundColor: "#ef444420",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
  },
  fieldContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: FG4,
    marginBottom: 6,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: FG,
    // Sem height fixo: com secureTextEntry o placeholder "Mínimo 8 caracteres"
    // era cortado verticalmente. minHeight garante área de toque sem clipar.
    minHeight: 24,
    paddingVertical: 2,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  fieldError: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
  },
  reqContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
  },
  reqTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: FG4,
    marginBottom: 10,
    fontFamily: "Inter_600SemiBold",
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  reqIcon: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  reqIconOk: {
    color: "#22c55e",
  },
  reqIconNo: {
    color: "#444444",
  },
  reqText: {
    fontSize: 12,
    color: FG,
    fontFamily: "Inter_400Regular",
  },
  ctaWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnDisabled: {
    opacity: 0.4,
  },
  ctaBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: "#0d0d0d",
  },
});
