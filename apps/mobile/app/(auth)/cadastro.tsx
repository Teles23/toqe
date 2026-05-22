import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { StepIndicator } from "@/src/features/auth/cadastro/components/StepIndicator";
import {
  type TipoConta,
  TipoContaToggle,
} from "@/src/features/auth/cadastro/components/TipoContaToggle";
import { api, ApiError } from "@/src/shared/api/api-client";
import { maskTelefone } from "@/src/shared/utils/masks";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  FormErrorBox,
  FormInput,
  GhostButton,
} from "@/src/shared/ui";
import { registerSchema } from "@toqe/contracts";

// Schema completo (todos os campos) — usado pelo react-hook-form em `mode:"onSubmit"`
// e via `trigger(['email','senha','confirmarSenha'])` para validar só o step 1
// antes do avanço; o resto dos campos é validado quando se chega no step 3.
const cadastroSchema = z
  .object({
    email: registerSchema.shape.email,
    senha: registerSchema.shape.senha,
    confirmarSenha: z.string().min(1, "Confirme sua senha"),
    nome: registerSchema.shape.nome,
    telefone: registerSchema.shape.telefone,
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type CadastroInput = z.infer<typeof cadastroSchema>;

type Step = 1 | 2 | 3;

export default function CadastroScreen() {
  const { login } = useAuth();
  const { palette, spacing, typography, radius } = useTheme();
  const [step, setStep] = useState<Step>(1);
  const [tipoConta, setTipoConta] = useState<TipoConta>("cliente");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    trigger,
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    mode: "onSubmit",
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      telefone: "",
    },
  });

  async function advanceFromStep1() {
    // valida apenas os campos do step 1 antes de avançar
    const ok = await trigger(["email", "senha", "confirmarSenha"]);
    if (ok) setStep(2);
  }

  async function advanceFromStep2() {
    const ok = await trigger(["nome"]);
    if (ok) setStep(3);
  }

  const onSubmit = async (data: CadastroInput) => {
    try {
      // `tipoConta` por ora é cosmético — o backend cria como "cliente" por
      // default. Quando o endpoint aceitar role, basta incluir aqui.
      await api.post("/auth/register", {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone || undefined,
      });
      // Login automático após cadastro
      await login(data.email, data.senha);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("email", { message: "Este e-mail já está cadastrado." });
        setStep(1); // volta para o step onde o erro mora
      } else if (err instanceof ApiError && err.status >= 500) {
        setError("root", { message: "Erro no servidor. Tente novamente." });
      } else {
        setError("root", { message: "Sem conexão. Verifique sua internet." });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand sutil + título */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <Text
            style={[
              styles.brandTag,
              { color: palette.primary, backgroundColor: palette.primaryDim },
            ]}
            accessibilityLabel="Toqe"
          >
            toqe
          </Text>
          <Text
            style={[
              typography.title,
              { color: palette.text, marginTop: spacing.md },
            ]}
          >
            Criar conta
          </Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <StepIndicator total={3} current={step} testID="cadastro-progress" />
        </View>

        <FormErrorBox error={errors.root?.message} />

        {step === 1 ? (
          <View testID="cadastro-step-1">
            <Text
              style={[
                typography.subheading,
                { color: palette.text, marginBottom: spacing.md },
              ]}
            >
              Comece pelo seu acesso
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="E-mail"
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="senha"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Senha"
                  placeholder="Mínimo 8 caracteres"
                  secureToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={128}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.senha?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Confirmar senha"
                  placeholder="Repita a senha"
                  secureToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={128}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmarSenha?.message}
                />
              )}
            />

            <View style={{ marginTop: spacing.md }}>
              <AmberButton
                label="Continuar"
                onPress={advanceFromStep1}
                testID="continuar-step-1"
              />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View testID="cadastro-step-2">
            <Text
              style={[
                typography.subheading,
                { color: palette.text, marginBottom: spacing.md },
              ]}
            >
              Como você se chama?
            </Text>

            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Nome completo"
                  placeholder="Seu nome completo"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.nome?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="telefone"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Telefone"
                  hint="(opcional)"
                  placeholder="+55 11 99999-9999"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={20}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(maskTelefone(text))}
                  value={value ?? ""}
                />
              )}
            />

            <View
              style={[
                styles.stepNav,
                { marginTop: spacing.md, gap: spacing.sm },
              ]}
            >
              <View style={styles.stepBack}>
                <GhostButton
                  label="Voltar"
                  onPress={() => setStep(1)}
                  testID="voltar-step-2"
                />
              </View>
              <View style={styles.stepForward}>
                <AmberButton
                  label="Continuar"
                  onPress={advanceFromStep2}
                  testID="continuar-step-2"
                />
              </View>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View testID="cadastro-step-3">
            <Text
              style={[
                typography.subheading,
                { color: palette.text, marginBottom: spacing.md },
              ]}
            >
              Tipo de conta
            </Text>
            <Text
              style={[
                typography.caption,
                { color: palette.textMuted, marginBottom: spacing.md },
              ]}
            >
              Como você usa o Toqe?
            </Text>

            <TipoContaToggle value={tipoConta} onChange={setTipoConta} />

            <Text
              style={[
                typography.caption,
                {
                  color: palette.textMuted,
                  marginTop: spacing.md,
                  marginBottom: spacing.sm,
                  lineHeight: 18,
                },
              ]}
            >
              {tipoConta === "cliente"
                ? "Você poderá agendar horários nas barbearias do Toqe."
                : "Solicite o vínculo a uma barbearia após o cadastro."}
            </Text>

            <View
              style={[
                styles.stepNav,
                { marginTop: spacing.lg, gap: spacing.sm },
              ]}
            >
              <View style={styles.stepBack}>
                <GhostButton
                  label="Voltar"
                  onPress={() => setStep(2)}
                  testID="voltar-step-3"
                />
              </View>
              <View style={styles.stepForward}>
                <AmberButton
                  label="Criar conta"
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  testID="criar-conta"
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.footer, { marginTop: spacing.xl }]}>
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Já tem uma conta?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link">
              <Text
                style={[
                  typography.label,
                  { color: palette.primary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                Entrar
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* radius é consumido em estilos inline; referência aqui evita
            warning de unused-var quando o block compila */}
        <View style={{ borderRadius: radius.xs, height: 0 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingBottom: 40 },
  header: { alignItems: "flex-start" },
  brandTag: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  stepNav: {
    flexDirection: "row",
  },
  stepBack: { flex: 1 },
  stepForward: { flex: 2 },
  footer: { flexDirection: "row", justifyContent: "center" },
});
