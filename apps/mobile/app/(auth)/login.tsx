import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { Button, FormErrorBox, FormInput } from "@/src/shared/ui";
import { loginSchema, type LoginInput } from "@toqe/contracts";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { palette, spacing, typography } = useTheme();

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

  const onGoogle = async () => {
    try {
      const result = (await GoogleSignin.signIn()) as {
        idToken?: string | null;
        data?: { idToken?: string | null };
      };
      // SDK pode retornar idToken direto ou dentro de `data` dependendo da versão
      const idToken = result.idToken ?? result.data?.idToken ?? null;
      if (!idToken) {
        setError("root", { message: "Falha ao obter token Google." });
        return;
      }
      await loginWithGoogle(idToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("root", { message: "Conta Google não autorizada." });
      } else {
        setError("root", {
          message: "Falha no login Google. Tente novamente.",
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xxl + spacing.xl,
          },
        ]}
      >
        <Text
          style={[
            {
              ...typography.display,
              color: palette.text,
              marginBottom: spacing.xs,
            },
          ]}
        >
          Toqe
        </Text>
        <Text
          style={[
            {
              ...typography.body,
              color: palette.textMuted,
              marginBottom: spacing.xl,
            },
          ]}
        >
          Entre na sua conta
        </Text>

        <FormErrorBox error={errors.root?.message} />

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
          name="senha"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.senha?.message}
            />
          )}
        />

        <View style={{ marginTop: spacing.sm }}>
          <Button
            label="Entrar"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>

        <View style={{ marginTop: spacing.sm }}>
          <Button
            label="Entrar com Google"
            variant="secondary"
            onPress={onGoogle}
            accessibilityLabel="Entrar com Google"
          />
        </View>

        <View style={[styles.footer, { marginTop: spacing.lg }]}>
          <Text style={{ ...typography.label, color: palette.textMuted }}>
            Não tem uma conta?{" "}
          </Text>
          <Link href="/(auth)/cadastro" asChild>
            <Pressable accessibilityRole="link">
              <Text
                style={{
                  ...typography.label,
                  fontWeight: "600",
                  color: palette.primary,
                }}
              >
                Cadastre-se
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingBottom: 40 },
  footer: { flexDirection: "row", justifyContent: "center" },
});
