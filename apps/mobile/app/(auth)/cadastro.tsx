import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { api, ApiError } from "@/src/shared/api/api-client";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const colors = isDark ? darkColors : lightColors;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Preencha seus dados para começar
        </Text>

        {errors.root && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{errors.root.message}</Text>
          </View>
        )}

        {/* Nome */}
        <View style={styles.fieldWrapper}>
          <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  errors.nome ? styles.inputError : undefined,
                ]}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Nome"
              />
            )}
          />
          {errors.nome && (
            <Text style={styles.fieldError}>{errors.nome.message}</Text>
          )}
        </View>

        {/* E-mail */}
        <View style={styles.fieldWrapper}>
          <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  errors.email ? styles.inputError : undefined,
                ]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="E-mail"
              />
            )}
          />
          {errors.email && (
            <Text style={styles.fieldError}>{errors.email.message}</Text>
          )}
        </View>

        {/* Telefone (opcional) */}
        <View style={styles.fieldWrapper}>
          <Text style={[styles.label, { color: colors.text }]}>
            Telefone <Text style={{ color: colors.textMuted }}>(opcional)</Text>
          </Text>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="+55 11 99999-9999"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Telefone"
              />
            )}
          />
        </View>

        {/* Senha */}
        <View style={styles.fieldWrapper}>
          <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
          <Controller
            control={control}
            name="senha"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  errors.senha ? styles.inputError : undefined,
                ]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Senha"
              />
            )}
          />
          {errors.senha && (
            <Text style={styles.fieldError}>{errors.senha.message}</Text>
          )}
        </View>

        {/* Confirmar senha */}
        <View style={styles.fieldWrapper}>
          <Text style={[styles.label, { color: colors.text }]}>
            Confirmar senha
          </Text>
          <Controller
            control={control}
            name="confirmarSenha"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                  errors.confirmarSenha ? styles.inputError : undefined,
                ]}
                placeholder="Repita a senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Confirmar senha"
              />
            )}
          />
          {errors.confirmarSenha && (
            <Text style={styles.fieldError}>
              {errors.confirmarSenha.message}
            </Text>
          )}
        </View>

        {/* Botão cadastrar */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Criar conta"
          accessibilityState={{ busy: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar conta</Text>
          )}
        </Pressable>

        {/* Link login */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Já tem uma conta?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link">
              <Text style={[styles.link, { color: colors.primary }]}>
                Entrar
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const lightColors = {
  bg: "#f5f5f5",
  text: "#111",
  textMuted: "#666",
  inputBg: "#fff",
  border: "#ddd",
  primary: "#1a73e8",
};

const darkColors = {
  bg: "#111",
  text: "#f5f5f5",
  textMuted: "#999",
  inputBg: "#1e1e1e",
  border: "#333",
  primary: "#4da3ff",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  errorBox: {
    backgroundColor: "#fdecea",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#c62828", fontSize: 14 },
  fieldWrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    minHeight: 44,
  },
  inputError: { borderColor: "#c62828" },
  fieldError: { color: "#c62828", fontSize: 12, marginTop: 4 },
  button: {
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 44,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: "600" },
});
