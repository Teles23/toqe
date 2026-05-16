import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { QrCodeView } from "@/src/features/perfil/QrCodeView";
import {
  use2faDisable,
  use2faEnable,
  use2faSetup,
} from "@/src/shared/hooks/perfil/use-2fa";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { Button, FormErrorBox, FormInput, ScreenHeader } from "@/src/shared/ui";

export default function Perfil2faScreen() {
  const { palette, spacing, typography } = useTheme();
  // user.twoFaEnabled vem de /usuarios/me — porém o auth-provider atual não
  // expõe esse campo diretamente. Como fallback, decidimos pelo state local
  // baseado em enable/disable que o user fez nesta sessão. Para precisão
  // pós-refresh, refetch do user é cosmético.
  const { user } = useAuth();
  const [enabledLocal, setEnabledLocal] = useState<boolean | null>(null);
  const enabled =
    enabledLocal ?? (user as { twoFaEnabled?: boolean })?.twoFaEnabled ?? false;

  const setup = use2faSetup();
  const enable = use2faEnable();
  const disable = use2faDisable();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSetup = async () => {
    setError(null);
    try {
      await setup.mutateAsync();
    } catch {
      setError("Não foi possível iniciar a configuração. Tente novamente.");
    }
  };

  const onEnable = async () => {
    setError(null);
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos do seu app autenticador.");
      return;
    }
    try {
      await enable.mutateAsync(code);
      setEnabledLocal(true);
      setCode("");
      Alert.alert(
        "2FA ativado",
        "Autenticação de 2 fatores ativada com sucesso.",
      );
    } catch {
      setError("Código inválido ou expirado.");
    }
  };

  const onDisable = () => {
    Alert.alert(
      "Desativar 2FA",
      "Tem certeza? Sua conta ficará menos protegida.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            setError(null);
            if (code.length !== 6) {
              setError("Digite o código atual do seu app autenticador.");
              return;
            }
            try {
              await disable.mutateAsync(code);
              setEnabledLocal(false);
              setCode("");
            } catch {
              setError("Código inválido.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Autenticação 2 fatores"
        right={
          <Button
            label="Voltar"
            variant="secondary"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <FormErrorBox error={error} />

        {enabled ? (
          <View testID="2fa-enabled-section">
            <Text
              style={{
                ...typography.body,
                color: palette.success,
                marginBottom: spacing.md,
                fontWeight: "600",
              }}
            >
              ✓ 2FA ativo
            </Text>
            <Text
              style={{
                ...typography.body,
                color: palette.textMuted,
                marginBottom: spacing.lg,
              }}
            >
              Para desativar, digite o código atual do seu app autenticador.
            </Text>
            <FormInput
              label="Código atual (6 dígitos)"
              placeholder="123456"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
            />
            <Button
              label="Desativar 2FA"
              variant="danger"
              onPress={onDisable}
              loading={disable.isPending}
            />
          </View>
        ) : setup.data ? (
          <View testID="2fa-setup-section">
            <QrCodeView
              qrCodeDataUrl={setup.data.qrCode}
              secret={setup.data.secret}
            />
            <View style={{ marginTop: spacing.lg }}>
              <FormInput
                label="Código gerado pelo app (6 dígitos)"
                placeholder="123456"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
              />
              <Button
                label="Ativar"
                onPress={onEnable}
                loading={enable.isPending}
              />
            </View>
          </View>
        ) : (
          <View testID="2fa-intro-section">
            <Text
              style={{
                ...typography.body,
                color: palette.text,
                marginBottom: spacing.md,
              }}
            >
              Adicione uma camada extra de segurança. Após ativar, será
              necessário digitar um código do seu app autenticador a cada login.
            </Text>
            <Button
              label="Configurar 2FA"
              onPress={onSetup}
              loading={setup.isPending}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
