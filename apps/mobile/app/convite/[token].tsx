import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConvite } from "@/src/shared/hooks/cliente/use-convite";
import { useAceitarConvite } from "@/src/shared/hooks/use-aceitar-convite";
import { ApiError } from "@/src/shared/api/api-client";
import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

// ─── View state ───────────────────────────────────────────────────────────────
type ConviteView =
  | "loading"
  | "expired"
  | "landing"
  | "form"
  | "accepting"
  | "success"
  | "already_member";

export default function ConviteTokenScreen() {
  const { palette, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { data, isLoading, isError } = useConvite(token);
  const { mutate: aceitarConvite } = useAceitarConvite();

  const [view, setView] = useState<ConviteView | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  // Derive current view
  const resolvedView: ConviteView = (() => {
    if (
      view === "form" ||
      view === "accepting" ||
      view === "success" ||
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
        onSuccess: () => setView("success"),
        onError: (e) => {
          const status = e instanceof ApiError ? e.status : 0;
          const msg =
            status === 409
              ? "Convite já utilizado."
              : status === 404
                ? "Convite expirado ou não encontrado."
                : (e.message ?? "Erro ao aceitar convite. Tente novamente.");
          setErroConvite(msg);
          setView("form");
        },
      },
    );
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
        <View style={styles.iconBoxRed}>
          <Text style={styles.iconTextRed}>{"✖"}</Text>
        </View>
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          Link inválido
        </Text>
        <Text style={[styles.screenSubtitle]}>
          Este convite expirou ou já foi utilizado.
        </Text>
        <Pressable
          disabled
          style={styles.outlineBtnDisabled}
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
        <View style={styles.iconBoxGreen}>
          <Text style={styles.iconTextGreen}>{"✓"}</Text>
        </View>
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          Você já é membro
        </Text>
        <Text style={[styles.screenSubtitle]}>
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

  // ─── Success ─────────────────────────────────────────────────────────────────
  if (resolvedView === "success") {
    return (
      <View
        testID="convite-success"
        style={[
          styles.center,
          styles.screenPad,
          { backgroundColor: palette.bg, flex: 1 },
        ]}
      >
        <View style={styles.iconBoxGreen}>
          <Text style={styles.iconTextGreen}>{"✓"}</Text>
        </View>
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          Vinculação concluída!
        </Text>
        <Text style={[styles.screenSubtitle]}>
          {`Você agora faz parte da ${data?.barbeariaNome ?? ""}`}
        </Text>
        <AmberButton
          label="Ir para o app"
          onPress={() => router.replace("/")}
          accessibilityLabel="Ir para o app"
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

  // ─── Form ─────────────────────────────────────────────────────────────────────
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
            typography.heading,
            { color: palette.text, marginBottom: spacing.sm },
          ]}
        >
          {data?.isNew ? "Criar conta" : "Confirmar acesso"}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: palette.textMuted, marginBottom: spacing.xl },
          ]}
        >
          {data?.barbeariaNome}
        </Text>

        {data?.isNew ? (
          <View style={{ marginBottom: spacing.md }}>
            <Text
              style={[
                typography.label,
                { color: palette.textMuted, marginBottom: spacing.xs },
              ]}
            >
              Nome completo
            </Text>
            <TextInput
              testID="input-nome"
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor={palette.textDisabled}
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  borderRadius: radius.sm,
                  color: palette.text,
                  padding: spacing.md,
                },
              ]}
            />
          </View>
        ) : null}

        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={[
              typography.label,
              { color: palette.textMuted, marginBottom: spacing.xs },
            ]}
          >
            Senha
          </Text>
          <TextInput
            testID="input-senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            placeholderTextColor={palette.textDisabled}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                borderRadius: radius.sm,
                color: palette.text,
                padding: spacing.md,
              },
            ]}
          />
        </View>

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
          label={data?.isNew ? "Criar conta" : "Confirmar"}
          onPress={handleAccept}
        />
      </ScrollView>
    );
  }

  // ─── Landing ─────────────────────────────────────────────────────────────────
  const primeiraLetra = data?.barbeariaNome?.charAt(0)?.toUpperCase() ?? "B";

  return (
    <ScrollView
      testID="convite-landing"
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: spacing.xxxl,
      }}
    >
      <BackButton palette={palette} spacing={spacing} typography={typography} />

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: radius.md,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            alignItems: "center",
          },
        ]}
      >
        {/* Barbearia logo placeholder */}
        <View style={styles.barbeariaBadge}>
          <Text style={styles.barbeariaBadgeText}>{primeiraLetra}</Text>
        </View>

        <Text style={styles.conviteLabel}>Você foi convidado para</Text>
        <Text style={[styles.barbeariaNome, { color: palette.text }]}>
          {data!.barbeariaNome}
        </Text>

        <View style={styles.divider} />

        <InfoRow
          label="E-mail"
          value={data!.email}
          palette={palette}
          typography={typography}
          spacing={spacing}
        />
        <InfoRow
          label="Função"
          value="Barbeiro"
          palette={palette}
          typography={typography}
          spacing={spacing}
        />
      </View>

      <AmberButton
        label="Aceitar convite"
        onPress={() => setView("form")}
        accessibilityLabel="Aceitar convite"
      />

      <Pressable
        testID="btn-rejeitar"
        onPress={() => router.back()}
        accessibilityLabel="Rejeitar convite"
        style={styles.rejeitarBtn}
      >
        <Text style={styles.rejeitarBtnText}>Rejeitar convite</Text>
      </Pressable>
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
      style={{ marginBottom: spacing.lg, alignSelf: "flex-start" }}
    >
      <Text style={[typography.label, { color: palette.textMuted }]}>
        {"← Voltar"}
      </Text>
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  palette,
  typography,
  spacing,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof useTheme>["palette"];
  typography: ReturnType<typeof useTheme>["typography"];
  spacing: ReturnType<typeof useTheme>["spacing"];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
        width: "100%",
      }}
    >
      <Text style={[typography.caption, { color: palette.textMuted }]}>
        {label}
      </Text>
      <Text style={[typography.captionBold, { color: palette.text }]}>
        {value}
      </Text>
    </View>
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
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  infoCard: {
    borderWidth: 1,
  },
  // ─── Icon boxes ───────────────────────────────────────────────────────────────
  iconBoxGreen: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22c55e20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconTextGreen: {
    fontSize: 32,
    color: "#22c55e",
  },
  iconBoxRed: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ef44441a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconTextRed: {
    fontSize: 32,
    color: "#ef4444",
  },
  // ─── Screen typography ────────────────────────────────────────────────────────
  screenTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 24,
  },
  // ─── Expired outline button ───────────────────────────────────────────────────
  outlineBtnDisabled: {
    backgroundColor: "#171717",
    borderRadius: 24,
    height: 44,
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    opacity: 0.6,
    width: "100%",
  },
  // ─── Landing: barbearia badge ─────────────────────────────────────────────────
  barbeariaBadge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  barbeariaBadgeText: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#0d0d0d",
  },
  conviteLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888888",
    marginBottom: 4,
  },
  barbeariaNome: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#262626",
    width: "100%",
    marginBottom: 16,
  },
  // ─── Landing: reject button ───────────────────────────────────────────────────
  rejeitarBtn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    width: "100%",
  },
  rejeitarBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#888888",
  },
});
