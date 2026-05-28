import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

/**
 * Onboarding minimal — 1 tela, 1 promessa, 1 ação (filosofia "1 toque").
 *
 * Decisão de design (Toqe Fluxo Cliente, slide 02): rejeitamos o onboarding
 * multi-step de 3 telas porque abandono > valor. Quem chega aqui organicamente
 * é o cliente final — o barbeiro entra pelo convite e não passa por este fluxo.
 *
 * Estrutura: marca (gradiente âmbar) + título display + value prop + CTA
 * primário "Começar" e link secundário "Já tenho conta · entrar". Ambos levam
 * ao login. Nenhum literal de cor/spacing/fonte — tudo via `useTheme()`.
 */
export default function OnboardingScreen() {
  const { palette, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const goToLogin = () => router.replace("/(auth)/login" as never);

  return (
    <View
      testID="onboarding-minimal"
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        {/* ── Bloco central: marca + promessa ── */}
        <View style={styles.hero}>
          {/* Marca — quadrado arredondado âmbar com "T" */}
          <View
            style={[
              styles.brandMark,
              {
                backgroundColor: palette.primary,
                borderRadius: radius.md,
                marginBottom: spacing.xl,
              },
            ]}
          >
            <Text style={[styles.brandLetter, { color: palette.primaryOn }]}>
              T
            </Text>
          </View>

          {/* Título display — "Sua barbearia, em 1 toque." */}
          <Text style={[styles.title, { color: palette.text }]}>
            Sua barbearia,{"\n"}em{" "}
            <Text style={{ color: palette.primary }}>1 toque</Text>.
          </Text>

          {/* Value prop */}
          <Text
            style={[
              styles.subtitle,
              typography.body,
              { color: palette.textMuted, marginTop: spacing.md },
            ]}
          >
            Encontre, agende e seja lembrado. Sem ligar, sem WhatsApp, sem
            complicação.
          </Text>
        </View>

        {/* ── Ações ── */}
        <View style={[styles.actions, { gap: spacing.sm }]}>
          <AmberButton
            testID="btn-comecar"
            label="Começar"
            iconRight="arrow-right"
            onPress={goToLogin}
          />
          <Text
            testID="btn-ja-tenho-conta"
            accessibilityRole="button"
            accessibilityLabel="Já tenho conta, entrar"
            onPress={goToLogin}
            style={[
              styles.secondaryLink,
              typography.label,
              { color: palette.textMuted, paddingVertical: spacing.md },
            ]}
          >
            Já tenho conta · entrar
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
  },
  brandMark: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 26,
    letterSpacing: -1,
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.6,
  },
  subtitle: {
    maxWidth: 300,
  },
  actions: {
    alignItems: "stretch",
  },
  secondaryLink: {
    textAlign: "center",
  },
});
