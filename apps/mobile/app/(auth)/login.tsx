import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { ApiError } from "@/src/shared/api/api-client";
import { loginSchema, type LoginInput } from "@toqe/contracts";

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.senha);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("root", { message: "E-mail ou senha incorretos." });
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
      <View style={styles.inner}>
        {/* Cabeçalho */}
        <Text style={[styles.title, { color: colors.text }]}>Toqe</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Entre na sua conta
        </Text>

        {/* Erro global */}
        {errors.root && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{errors.root.message}</Text>
          </View>
        )}

        {/* Campo e-mail */}
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

        {/* Campo senha */}
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
                autoComplete="password"
                textContentType="password"
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

        {/* Botão entrar */}
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
          accessibilityLabel="Entrar"
          accessibilityState={{ busy: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        {/* Link cadastro */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Não tem uma conta?{" "}
          </Text>
          <Link href="/(auth)/cadastro" asChild>
            <Pressable accessibilityRole="link">
              <Text style={[styles.link, { color: colors.primary }]}>
                Cadastre-se
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
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
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: "#fdecea",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    minHeight: 44, // a11y
  },
  inputError: {
    borderColor: "#c62828",
  },
  fieldError: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 44, // a11y
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
});
