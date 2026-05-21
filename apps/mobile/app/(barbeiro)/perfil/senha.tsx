import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ApiError } from "@/src/shared/api/api-client";
import { useMudarSenha } from "@/src/shared/hooks/perfil/use-mudar-senha";

const AMBER = "#F4B400";
const CARD = "#171717";
const BORDER = "#262626";
const BG = "#0d0d0d";
const FG = "#f5f5f5";
const FG4 = "#666666";

export default function PerfilSenhaScreen() {
  const mudar = useMudarSenha();

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
      Alert.alert(
        "Senha alterada",
        "Sua senha foi alterada. Outras sessões foram encerradas por segurança.",
      );
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
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
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Trocar senha</Text>
      </View>

      <ScrollView
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
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>SENHA ATUAL</Text>
          <TextInput
            testID="input-senha-atual"
            style={styles.fieldInput}
            placeholder="••••••••"
            placeholderTextColor="#444"
            secureTextEntry
            autoComplete="password"
            maxLength={128}
            value={senhaAtual}
            onChangeText={(v) => {
              setSenhaAtual(v);
              setSenhaAtualError(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => novaSenhaRef.current?.focus()}
          />
          {senhaAtualError ? (
            <Text style={styles.fieldError}>{senhaAtualError}</Text>
          ) : null}
        </View>

        {/* Nova senha */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>NOVA SENHA</Text>
          <TextInput
            testID="input-nova-senha"
            ref={novaSenhaRef}
            style={styles.fieldInput}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#444"
            secureTextEntry
            autoComplete="new-password"
            maxLength={128}
            value={novaSenha}
            onChangeText={setNovaSenha}
            returnKeyType="next"
            onSubmitEditing={() => confirmarRef.current?.focus()}
          />
        </View>

        {/* Confirmar nova senha */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>CONFIRMAR NOVA SENHA</Text>
          <TextInput
            testID="input-confirmar"
            ref={confirmarRef}
            style={styles.fieldInput}
            placeholder="Repita a senha"
            placeholderTextColor="#444"
            secureTextEntry
            autoComplete="new-password"
            maxLength={128}
            value={confirmar}
            onChangeText={setConfirmar}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>

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

      {/* CTA sticky */}
      <View style={styles.ctaWrapper}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: FG,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    color: FG,
    letterSpacing: -0.45,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
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
  fieldInput: {
    fontSize: 15,
    color: FG,
    height: 30,
    fontFamily: "Inter_400Regular",
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
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
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
