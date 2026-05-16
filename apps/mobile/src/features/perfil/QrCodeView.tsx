import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

interface Props {
  /** QR code como data URL (base64 PNG) — vem direto do backend */
  qrCodeDataUrl: string;
  /** Chave secret TOTP (fallback caso o user não consiga escanear o QR) */
  secret: string;
}

/**
 * Exibe o QR code para configurar o autenticador (Google Authenticator,
 * Authy, etc.) + a chave secret como fallback caso o user não consiga
 * escanear (ex: app autenticador em outro device).
 *
 * RN aceita data URL diretamente em <Image source={{ uri }} /> — sem libs extras.
 */
export function QrCodeView({ qrCodeDataUrl, secret }: Props) {
  const { palette, spacing, typography } = useTheme();

  return (
    <View style={styles.container} testID="qr-code-view">
      <View
        style={[
          styles.qrFrame,
          {
            backgroundColor: "#fff", // QR codes precisam de fundo branco para leitura
            padding: spacing.md,
            borderRadius: 12,
          },
        ]}
      >
        <Image
          source={{ uri: qrCodeDataUrl }}
          style={styles.qr}
          accessibilityLabel="QR Code do 2FA"
        />
      </View>

      <Text
        style={{
          ...typography.caption,
          color: palette.textMuted,
          textAlign: "center",
          marginTop: spacing.md,
        }}
      >
        Escaneie no Google Authenticator, Authy ou app similar.
      </Text>

      <View
        style={[
          styles.secretBox,
          {
            backgroundColor: palette.overlay,
            borderRadius: 8,
            padding: spacing.md - 2,
            marginTop: spacing.md,
          },
        ]}
      >
        <Text
          style={{
            ...typography.caption,
            color: palette.textMuted,
            marginBottom: 4,
          }}
        >
          Ou digite esta chave manualmente:
        </Text>
        <Text
          selectable
          testID="qr-secret"
          style={{
            ...typography.bodyBold,
            color: palette.text,
            fontFamily: "monospace",
            letterSpacing: 1,
          }}
        >
          {secret}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  qrFrame: {
    alignSelf: "center",
  },
  qr: {
    width: 220,
    height: 220,
  },
  secretBox: {
    width: "100%",
  },
});
