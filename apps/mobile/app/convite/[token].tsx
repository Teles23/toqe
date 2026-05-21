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
          { backgroundColor: palette.bg, flex: 1, padding: spacing.xl },
        ]}
      >
        <BackButton
          palette={palette}
          spacing={spacing}
          typography={typography}
        />
        <Text style={{ fontSize: 40, marginBottom: spacing.md }}>{"⚠️"}</Text>
        <Text
          style={[
            typography.heading,
            {
              color: palette.text,
              textAlign: "center",
              marginBottom: spacing.sm,
            },
          ]}
        >
          Convite expirado
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: palette.textMuted,
              textAlign: "center",
              marginBottom: spacing.xl,
            },
          ]}
        >
          Este link de convite não é mais válido ou expirou.
        </Text>
        <Pressable
          disabled
          style={[
            styles.disabledBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderRadius: radius.sm,
              padding: spacing.md,
              alignItems: "center",
              opacity: 0.5,
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
          { backgroundColor: palette.bg, flex: 1, padding: spacing.xl },
        ]}
      >
        <BackButton
          palette={palette}
          spacing={spacing}
          typography={typography}
        />
        <Text
          style={[
            typography.heading,
            {
              color: palette.text,
              textAlign: "center",
              marginBottom: spacing.sm,
            },
          ]}
        >
          Você já é membro
        </Text>
        <Text
          style={[
            typography.body,
            { color: palette.textMuted, textAlign: "center" },
          ]}
        >
          Sua conta já está vinculada a esta barbearia.
        </Text>
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
          { backgroundColor: palette.bg, flex: 1, padding: spacing.xl },
        ]}
      >
        <Text
          style={[
            typography.heading,
            {
              color: palette.success,
              textAlign: "center",
              marginBottom: spacing.sm,
            },
          ]}
        >
          Acesso liberado!
        </Text>
        <Text
          style={[
            typography.body,
            { color: palette.textMuted, textAlign: "center" },
          ]}
        >
          Você foi vinculado à barbearia {data?.barbeariaNome ?? ""} como
          Barbeiro.
        </Text>
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
  return (
    <ScrollView
      testID="convite-landing"
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
      }}
    >
      <BackButton palette={palette} spacing={spacing} typography={typography} />

      <Text
        style={[
          typography.heading,
          { color: palette.text, marginBottom: spacing.sm },
        ]}
      >
        Convite para a barbearia
      </Text>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <InfoRow
          label="Barbearia"
          value={data!.barbeariaNome}
          palette={palette}
          typography={typography}
          spacing={spacing}
        />
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
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  infoCard: {
    borderWidth: 1,
  },
  disabledBtn: {
    borderWidth: 1,
  },
});
