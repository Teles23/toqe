import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
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

import { api, ApiError } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, FormErrorBox, FormInput } from "@/src/shared/ui";
import { registerSchema } from "@toqe/contracts";

// Estende o schema com confirmação de senha (campo apenas no mobile)
const cadastroSchema = registerSchema
  .extend({
    confirmarSenha: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type CadastroInput = z.infer<typeof cadastroSchema>;

export default function CadastroScreen() {
  const { login } = useAuth();
  const { palette, spacing, typography } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      telefone: "",
    },
  });

  const onSubmit = async (data: CadastroInput) => {
    try {
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
        {/* Brand sutil + título — coerente com login, sem competir com o form */}
        <View style={[styles.header, { marginBottom: spacing.xl }]}>
          <Text
            style={[
              styles.brandTag,
              {
                color: palette.primary,
                backgroundColor: palette.primaryDim,
              },
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
          <Text
            style={[
              typography.body,
              { color: palette.textMuted, marginTop: spacing.xs },
            ]}
          >
            Preencha seus dados para começar
          </Text>
        </View>

        <FormErrorBox error={errors.root?.message} />

        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Nome"
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.nome?.message}
            />
          )}
        />

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
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
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
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="senha"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
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
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmarSenha?.message}
            />
          )}
        />

        <View style={{ marginTop: spacing.md }}>
          <AmberButton
            label="Criar conta"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>

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
  footer: { flexDirection: "row", justifyContent: "center" },
});
