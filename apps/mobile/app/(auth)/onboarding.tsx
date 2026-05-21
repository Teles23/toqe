import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

interface Slide {
  icon: string;
  title: string;
  accent: string;
  desc: string;
}

const SLIDES: Slide[] = [
  {
    icon: "🔍",
    title: "Encontre",
    accent: "sua barbearia",
    desc: "Barbearias da sua cidade, com fotos, avaliações e os profissionais disponíveis.",
  },
  {
    icon: "⏱",
    title: "Agende",
    accent: "em 1 toque",
    desc: "Veja os próximos horários livres do seu barbeiro favorito. Toca, confirma, pronto.",
  },
  {
    icon: "🔔",
    title: "Sem",
    accent: "esquecimentos",
    desc: "A gente te avisa antes do horário. Cancelou? Reagenda em 2 toques.",
  },
];

export default function OnboardingScreen() {
  const { palette, spacing, typography } = useTheme();
  const [step, setStep] = useState(0);

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const handleSkip = () => router.replace("/(auth)/login" as never);

  const handleNext = () => {
    if (isLast) {
      router.replace("/(auth)/login" as never);
    } else {
      setStep((s) => s + 1);
    }
  };

  // Cor para o container do ícone
  const iconBg = palette.primary + "14";
  const iconBorder = palette.primary + "38";

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Skip button — top-right */}
      <View
        style={[
          styles.topBar,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
        ]}
      >
        <Pressable
          testID="btn-pular"
          onPress={handleSkip}
          style={styles.skipPressable}
        >
          <Text style={[typography.label, { color: palette.textMuted }]}>
            Pular
          </Text>
        </Pressable>
      </View>

      {/* Slide content */}
      <View
        testID={`slide-${step}`}
        style={[styles.slideContent, { paddingHorizontal: spacing.lg }]}
      >
        {/* Icon container */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconBg,
              borderColor: iconBorder,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <Text style={styles.iconText}>{slide.icon}</Text>
        </View>

        {/* Title + accent */}
        <View style={[styles.titleRow, { marginBottom: spacing.md }]}>
          <Text style={[styles.titleText, { color: palette.text }]}>
            {slide.title}{" "}
          </Text>
          <Text style={[styles.titleText, { color: palette.primary }]}>
            {slide.accent}
          </Text>
        </View>

        {/* Description */}
        <Text style={[styles.desc, { color: palette.textMuted }]}>
          {slide.desc}
        </Text>
      </View>

      {/* Bottom area: dots + CTA */}
      <View
        style={[
          styles.bottomArea,
          { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
        ]}
      >
        {/* Dot indicators */}
        <View style={[styles.dotsRow, { marginBottom: spacing.xl }]}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              testID={`dot-${i}`}
              style={[
                styles.dot,
                i === step
                  ? { width: 22, backgroundColor: palette.primary }
                  : { width: 6, backgroundColor: palette.border },
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <AmberButton
          testID="btn-proximo"
          label={isLast ? "Começar" : "Próximo"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipPressable: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 32,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  titleText: {
    fontFamily: "Sora_700Bold",
    fontSize: 34,
    lineHeight: 42,
    textAlign: "center",
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 14 * 1.6,
    textAlign: "center",
    maxWidth: 300,
  },
  bottomArea: {
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
});
