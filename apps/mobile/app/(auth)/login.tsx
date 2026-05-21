import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Animated,
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
import {
  AmberButton,
  FormErrorBox,
  FormInput,
  GhostButton,
} from "@/src/shared/ui";
import { loginSchema, type LoginInput } from "@toqe/contracts";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { palette, spacing, typography } = useTheme();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // Pulsing dot animation for sent state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

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
      // login() redireciona internamente em caso de sucesso com tokens.
      // Se chegarmos aqui sem redirect (ex: magic link futuro), exibimos sent state.
      setSentEmail(data.email);
      setEmailSent(true);
      startPulse();
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

  // ── "Link enviado" state ──────────────────────────────────────────────────
  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          testID="login-sent"
          style={[styles.sentContainer, { paddingHorizontal: spacing.xl }]}
        >
          {/* Envelope icon */}
          <View style={styles.sentIconWrap}>
            <Text style={styles.sentIconEmoji}>✉</Text>
          </View>

          <Text style={[styles.sentTitle, { color: palette.text }]}>
            Verifique seu e-mail
          </Text>
          <Text style={[typography.caption, styles.sentSubtitle]}>
            {`Enviamos um link para\n${sentEmail}`}
          </Text>

          {/* Pulsing amber dot */}
          <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />

          {/* Reenviar */}
          <Pressable
            testID="btn-reenviar"
            accessibilityRole="button"
            accessibilityLabel="Reenviar link"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={styles.reenviarBtn}
          >
            <Text style={styles.reenviarText}>Reenviar link</Text>
          </Pressable>

          {/* Usar outra conta */}
          <Pressable
            testID="btn-outra-conta"
            accessibilityRole="button"
            accessibilityLabel="Usar outra conta"
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.outraContaText}>Usar outra conta →</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
            paddingTop: spacing.xxxl,
          },
        ]}
      >
        {/* Header block — brand mark + boas-vindas (esquerda, Urban Flow v2) */}
        <View style={styles.headerBlock}>
          {/* Brand mark — quadrado âmbar com a tesoura oficial Toqe */}
          <View
            style={styles.brandMark}
            accessibilityLabel="Logotipo Toqe"
            accessibilityRole="image"
          >
            <Feather name="scissors" size={22} color="#0d0d0d" />
          </View>

          {/* Headline de boas-vindas */}
          <View>
            <Text style={[styles.headline, { color: palette.text }]}>
              Bom te ver de{"\n"}volta.
            </Text>
            <Text style={styles.subtitle}>
              Entre com seu e-mail e senha do Toqe.
            </Text>
          </View>
        </View>

        <FormErrorBox error={errors.root?.message} />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="E-mail"
              placeholder="voce@email.com"
              leftIcon="mail"
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
              placeholder="••••••"
              leftIcon="lock"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              maxLength={128}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.senha?.message}
            />
          )}
        />

        {/* Esqueci a senha */}
        <Pressable
          testID="btn-esqueci-senha"
          accessibilityRole="button"
          accessibilityLabel="Esqueci a senha"
          onPress={() => {}}
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotText}>Esqueci a senha</Text>
        </Pressable>

        <View style={{ marginTop: spacing.md }}>
          <AmberButton
            label="Entrar"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>

        {/* Divider "ou" — separa CTAs principal e alternativo */}
        <View
          style={[styles.dividerRow, { marginVertical: spacing.lg }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <View style={[styles.line, { backgroundColor: palette.border }]} />
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginHorizontal: spacing.md },
            ]}
          >
            ou
          </Text>
          <View style={[styles.line, { backgroundColor: palette.border }]} />
        </View>

        <GhostButton
          label="Entrar com Google"
          onPress={onGoogle}
          accessibilityLabel="Entrar com Google"
        />

        <View style={[styles.footer, { marginTop: spacing.xl }]}>
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Novo por aqui?{" "}
          </Text>
          <Link href="/(auth)/cadastro" asChild>
            <Pressable accessibilityRole="link">
              <Text
                style={[
                  typography.label,
                  { color: palette.primary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                Crie sua conta
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
  // ── Header block (left-aligned)
  headerBlock: {
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 28,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4B400",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  headline: {
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "#888888",
    marginTop: 6,
  },
  // ── Esqueci a senha
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#F4B400",
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  line: { flex: 1, height: 1 },
  footer: { flexDirection: "row", justifyContent: "center" },
  // ── Sent state
  sentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sentIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#F4B40014",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  sentIconEmoji: {
    fontSize: 36,
  },
  sentTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginTop: 24,
  },
  sentSubtitle: {
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F4B400",
    marginTop: 24,
  },
  reenviarBtn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingHorizontal: 32,
    minWidth: 160,
  },
  reenviarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#F4B400",
    fontWeight: "700",
  },
  outraContaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#F4B400",
    textAlign: "center",
    marginTop: 16,
  },
});
