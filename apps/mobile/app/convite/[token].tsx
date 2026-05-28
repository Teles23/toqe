import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConvite } from "@/src/shared/hooks/cliente/use-convite";
import { useAceitarConvite } from "@/src/shared/hooks/use-aceitar-convite";
import { useRejeitarConvite } from "@/src/shared/hooks/use-rejeitar-convite";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { ApiError } from "@/src/shared/api/api-client";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, FormInput, GhostButton } from "@/src/shared/ui";

// ─── View state ───────────────────────────────────────────────────────────────
type ConviteView =
  | "loading"
  | "expired"
  | "landing"
  | "form"
  | "accepting"
  | "welcome"
  | "already_member";

export default function ConviteTokenScreen() {
  const { palette, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { data, isLoading, isError } = useConvite(token);
  const { mutate: aceitarConvite } = useAceitarConvite();
  const { mutate: rejeitarConvite } = useRejeitarConvite();
  const { establishSession } = useAuth();

  const [view, setView] = useState<ConviteView | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [welcomeNome, setWelcomeNome] = useState("");
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  // Derive current view
  const resolvedView: ConviteView = (() => {
    if (
      view === "form" ||
      view === "accepting" ||
      view === "welcome" ||
      view === "already_member"
    ) {
      return view;
    }
    if (isLoading) return "loading";
    if (isError || !data) return "expired";
    return "landing";
  })();

  const handleAccept = () => {
    setErroConvite(null);
    setView("accepting");
    aceitarConvite(
      { token: token!, nome: nome || undefined, senha: senha || undefined },
      {
        onSuccess: async (result) => {
          // Auto-login: estabelece a sessão a partir dos tokens retornados.
          setWelcomeNome(result.user.nome);
          await establishSession(result.access_token, result.refresh_token);
          setView("welcome");
        },
        onError: (e) => {
          const status = e instanceof ApiError ? e.status : 0;
          const msg =
            status === 409
              ? "Convite já utilizado."
              : status === 404
                ? "Convite expirado ou não encontrado."
                : status === 401
                  ? "Senha incorreta."
                  : status === 400
                    ? "Senha de ao menos 8 caracteres."
                    : (e.message ??
                      "Erro ao aceitar convite. Tente novamente.");
          setErroConvite(msg);
          setView("form");
        },
      },
    );
  };

  const handleReject = () => {
    // Remove o token no backend (não cria conta/vínculo) e sai da tela.
    if (token) rejeitarConvite(token);
    router.back();
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (resolvedView === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg, flex: 1 }]}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  // ─── Expired ─────────────────────────────────────────────────────────────────
  if (resolvedView === "expired") {
    return (
      <View
        testID="convite-expirado"
        style={[
          styles.center,
          styles.screenPad,
          { backgroundColor: palette.bg, flex: 1 },
        ]}
      >
        <View
          style={[
            styles.statusIconBox,
            { backgroundColor: palette.dangerDim, borderColor: palette.danger },
          ]}
        >
          <Feather name="x-circle" size={40} color={palette.danger} />
        </View>
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          Link inválido
        </Text>
        <Text style={[styles.screenSubtitle, { color: palette.textMuted }]}>
          Este convite expirou ou já foi utilizado.
        </Text>
        <Pressable
          disabled
          style={[
            styles.outlineBtnDisabled,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderRadius: radius.xl,
            },
          ]}
          accessibilityLabel="Solicitar novo convite"
        >
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Solicitar novo convite
          </Text>
        </Pressable>
      </View>
    );
  }

  // ─── Already member ──────────────────────────────────────────────────────────
  if (resolvedView === "already_member") {
    return (
      <View
        testID="convite-ja-membro"
        style={[
          styles.center,
          styles.screenPad,
          { backgroundColor: palette.bg, flex: 1 },
        ]}
      >
        <View
          style={[
            styles.statusIconBox,
            {
              backgroundColor: palette.successDim,
              borderColor: palette.success,
            },
          ]}
        >
          <Feather name="check-circle" size={40} color={palette.success} />
        </View>
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          Você já é membro
        </Text>
        <Text style={[styles.screenSubtitle, { color: palette.textMuted }]}>
          Sua conta já está vinculada a esta barbearia.
        </Text>
        <AmberButton
          label="Ir para o app"
          onPress={() => router.replace("/")}
          accessibilityLabel="Ir para o app"
        />
      </View>
    );
  }

  // ─── Welcome (slide 04 — boas-vindas após auto-login) ──────────────────────────
  if (resolvedView === "welcome") {
    const primeiroNome = welcomeNome.trim().split(/\s+/)[0] || "barbeiro";
    return (
      <View
        testID="convite-success"
        style={[
          styles.center,
          styles.screenPad,
          { backgroundColor: palette.bg, flex: 1 },
        ]}
      >
        <View
          style={[
            styles.welcomeIconBox,
            {
              backgroundColor: palette.primaryDim,
              borderColor: palette.primary,
            },
          ]}
        >
          <Feather name="scissors" size={42} color={palette.primary} />
        </View>
        <Text style={[styles.welcomeTitle, { color: palette.text }]}>
          {`Bem-vindo,\n${primeiroNome}.`}
        </Text>
        <Text style={[styles.screenSubtitle, { color: palette.textMuted }]}>
          {`Você agora faz parte da ${data?.barbeariaNome ?? "equipe"}. Vamos configurar sua agenda?`}
        </Text>
        <AmberButton
          label="Ver minha agenda"
          icon="calendar"
          iconRight="arrow-right"
          onPress={() => router.replace("/(barbeiro)/agenda")}
          accessibilityLabel="Ver minha agenda"
        />
      </View>
    );
  }

  // ─── Accepting ───────────────────────────────────────────────────────────────
  if (resolvedView === "accepting") {
    return (
      <View
        testID="convite-accepting"
        style={[styles.center, { backgroundColor: palette.bg, flex: 1 }]}
      >
        <ActivityIndicator color={palette.primary} size="large" />
        <Text
          style={[
            typography.body,
            { color: palette.textMuted, marginTop: spacing.md },
          ]}
        >
          Vinculando à barbearia…
        </Text>
      </View>
    );
  }

  // ─── Form (slide 03 — "Criar sua conta" / "Confirmar acesso") ──────────────────
  if (resolvedView === "form") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bg }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
      >
        <BackButton
          palette={palette}
          spacing={spacing}
          typography={typography}
        />

        <Text
          style={[
            styles.formTitle,
            { color: palette.text, marginBottom: spacing.sm },
          ]}
        >
          {data?.isNew ? "Criar sua conta" : "Confirmar acesso"}
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: palette.textMuted,
              lineHeight: 18,
              marginBottom: spacing.xl,
            },
          ]}
        >
          {data?.isNew
            ? "Você é novo por aqui. Informe nome e crie uma senha — o e-mail já vem do convite."
            : `Confirme sua senha para entrar na ${data?.barbeariaNome ?? "equipe"}.`}
        </Text>

        {data?.isNew ? (
          <FormInput
            testID="input-nome"
            label="Nome completo"
            leftIcon="user"
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            autoCapitalize="words"
          />
        ) : null}

        <FormInput
          label="E-mail · do convite"
          leftIcon="mail"
          value={data?.email ?? ""}
          editable={false}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormInput
          testID="input-senha"
          label="Criar senha"
          hint="mín. 8 chars"
          leftIcon="shield"
          value={senha}
          onChangeText={setSenha}
          placeholder="Mínimo 8 caracteres"
          secureToggle
          autoCapitalize="none"
          autoCorrect={false}
        />

        {erroConvite ? (
          <Text
            testID="convite-error"
            style={[
              typography.caption,
              {
                color: palette.danger,
                marginBottom: spacing.md,
                textAlign: "center",
              },
            ]}
          >
            {erroConvite}
          </Text>
        ) : null}

        <AmberButton
          testID="btn-aceitar"
          label={data?.isNew ? "Criar conta e aceitar" : "Confirmar acesso"}
          iconRight="arrow-right"
          onPress={handleAccept}
        />
      </ScrollView>
    );
  }

  // ─── Landing (slide 02 — convite editorial) ────────────────────────────────────
  return (
    <ScrollView
      testID="convite-landing"
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: spacing.xxxl,
        flexGrow: 1,
      }}
    >
      <BackButton palette={palette} spacing={spacing} typography={typography} />

      <View style={styles.landingBody}>
        <View
          style={[
            styles.landingIconBox,
            {
              backgroundColor: palette.primaryDim,
              borderColor: palette.primary,
              borderRadius: radius.md,
            },
          ]}
        >
          <Feather name="mail" size={22} color={palette.primary} />
        </View>

        <Text style={[styles.eyebrow, { color: palette.primary }]}>
          Convite · barbeiro
        </Text>

        <Text style={[styles.landingTitle, { color: palette.text }]}>
          {`${data!.barbeariaNome} quer você na equipe.`}
        </Text>

        <Text style={[styles.landingParagraph, { color: palette.textMuted }]}>
          {"O dono enviou um convite para "}
          <Text style={{ color: palette.text }}>{data!.email}</Text>
          {" integrar a equipe como "}
          <Text style={{ color: palette.text }}>barbeiro</Text>
          {"."}
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <AmberButton
          label="Aceitar convite"
          iconRight="arrow-right"
          onPress={() => setView("form")}
          accessibilityLabel="Aceitar convite"
        />

        <GhostButton
          testID="btn-rejeitar"
          label="Rejeitar"
          onPress={handleReject}
          accessibilityLabel="Rejeitar convite"
        />
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BackButton({
  palette,
  spacing,
  typography,
}: {
  palette: ReturnType<typeof useTheme>["palette"];
  spacing: ReturnType<typeof useTheme>["spacing"];
  typography: ReturnType<typeof useTheme>["typography"];
}) {
  return (
    <Pressable
      testID="btn-voltar-convite"
      onPress={() => router.back()}
      accessibilityLabel="Voltar"
      style={{
        marginBottom: spacing.lg,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <Feather name="arrow-left" size={16} color={palette.textMuted} />
      <Text style={[typography.label, { color: palette.textMuted }]}>
        Voltar
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  screenPad: {
    padding: 24,
  },
  // ─── Status icon boxes (expired / already member) ───────────────────────────────
  statusIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  // ─── Welcome (slide 04) ─────────────────────────────────────────────────────────
  welcomeIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  welcomeTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 10,
  },
  // ─── Shared screen typography (status + welcome subtitle) ────────────────────────
  screenTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
  },
  // ─── Expired outline button ───────────────────────────────────────────────────
  outlineBtnDisabled: {
    height: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    opacity: 0.6,
    width: "100%",
  },
  // ─── Form (slide 03) ────────────────────────────────────────────────────────────
  formTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  // ─── Landing (slide 02) ─────────────────────────────────────────────────────────
  landingBody: {
    flex: 1,
    justifyContent: "center",
  },
  landingIconBox: {
    width: 46,
    height: 46,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  landingTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 30,
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: 14,
  },
  landingParagraph: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
});
