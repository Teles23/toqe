import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

interface Slide {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  accent: string;
  desc: string;
}

const SLIDES: Slide[] = [
  {
    icon: "search",
    title: "Encontre",
    accent: "sua barbearia",
    desc: "Barbearias da sua cidade, com fotos, avaliações e os profissionais disponíveis.",
  },
  {
    icon: "clock",
    title: "Agende",
    accent: "em 1 toque",
    desc: "Veja os próximos horários livres do seu barbeiro favorito. Toca, confirma, pronto.",
  },
  {
    icon: "bell",
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
          <Feather name="arrow-right" size={14} color={palette.textMuted} />
        </Pressable>
      </View>

      {/* Slide content */}
      <View
        testID={`slide-${step}`}
        style={[styles.slideContent, { paddingHorizontal: spacing.lg }]}
      >
        {/* Icon container — quadrado arredondado */}
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
          <Feather name={slide.icon} size={36} color={palette.primary} />
        </View>

        {/* Title + accent (esquerda) */}
        <View style={[styles.titleRow, { marginBottom: spacing.md }]}>
          <Text style={[styles.titleText, { color: palette.text }]}>
            {slide.title}{" "}
          </Text>
          <Text style={[styles.titleText, { color: palette.primary }]}>
            {slide.accent}.
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
                  : { width: 6, backgroundColor: "#333333" },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  titleText: {
    fontFamily: "Sora_700Bold",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 14 * 1.6,
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
