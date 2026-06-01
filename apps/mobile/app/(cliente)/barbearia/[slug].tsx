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

import { useBarbeariaPublica } from "@/src/shared/hooks/use-barbearia-publica";
import { useTheme } from "@/src/shared/theme";
import { AmberButton } from "@/src/shared/ui";

// ─── Info line ──────────────────────────────────────────────────────────────────

function InfoLine({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color?: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.infoLine}>
      <Feather
        name={icon}
        size={14}
        color={color ?? palette.textDisabled}
        style={styles.infoIcon}
      />
      <Text
        style={[styles.infoText, { color: color ?? palette.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function BarbeariaPublicaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useBarbeariaPublica(slug);

  if (isLoading) {
    return (
      <View style={[styles.centeredFlex, { backgroundColor: palette.bg }]}>
        <ActivityIndicator
          color={palette.primary}
          size="large"
          testID="barbearia-loading"
        />
      </View>
    );
  }

  if (!data) {
    return (
      <View
        testID="barbearia-nao-encontrada"
        style={[styles.centeredFlex, { backgroundColor: palette.bg }]}
      >
        <Text style={[styles.notFoundTitle, { color: palette.text }]}>
          Barbearia não encontrada
        </Text>
        <Pressable
          testID="btn-voltar-barbearia"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.notFoundBack}
        >
          <Feather name="arrow-left" size={16} color={palette.primary} />
          <Text style={[styles.notFoundBackText, { color: palette.primary }]}>
            Voltar
          </Text>
        </Pressable>
      </View>
    );
  }

  function handleReservar() {
    router.push(`/(cliente)/agendar?slug=${slug}` as never);
  }

  const initial = data.nome.charAt(0).toUpperCase();
  const temRating = data.ratingMedio != null && data.ratingMedio > 0;
  const barbeiros = data.barbeiros ?? [];

  return (
    <View
      testID="barbearia-detalhe"
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      {/* ── Top bar (absolute) ── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          testID="btn-voltar-barbearia"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.topBarBtn}
        >
          <Feather name="arrow-left" size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Favoritar"
          style={styles.topBarBtn}
        >
          <Feather name="star" size={16} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero block ── */}
        <View style={[styles.hero, { backgroundColor: palette.primary }]}>
          <Feather
            name="scissors"
            size={180}
            color={palette.primaryOn}
            style={styles.heroWatermark}
          />
        </View>

        {/* ── Body card (overlaps hero) ── */}
        <View style={[styles.bodyCard, { backgroundColor: palette.bg }]}>
          {/* Logo + name row */}
          <View style={styles.identityRow}>
            <View
              style={[
                styles.logoBox,
                { backgroundColor: palette.primary, borderColor: palette.bg },
              ]}
            >
              <Text style={[styles.logoLetter, { color: palette.primaryOn }]}>
                {initial}
              </Text>
            </View>
            <View style={styles.nameSection}>
              <Text
                style={[styles.barbeariaNome, { color: palette.text }]}
                numberOfLines={2}
              >
                {data.nome}
              </Text>
              {temRating ? (
                <View style={styles.ratingRow}>
                  <Feather name="star" size={11} color={palette.primary} />
                  <Text style={[styles.ratingNum, { color: palette.text }]}>
                    {data.ratingMedio!.toFixed(1)}
                  </Text>
                  <Text
                    style={[styles.ratingLabel, { color: palette.textMuted }]}
                  >
                    · avaliações
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Info card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: palette.surfaceHigh,
                borderColor: palette.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <InfoLine
              icon="map-pin"
              label={data.endereco ?? "Endereço não informado"}
            />
            <InfoLine
              icon="clock"
              label="Horários disponíveis"
              color={palette.success}
            />
            {data.telefone ? (
              <InfoLine icon="phone" label={data.telefone} />
            ) : null}
          </View>

          {/* Sobre */}
          {data.descricao ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
                SOBRE
              </Text>
              <View
                style={[
                  styles.sobreCard,
                  {
                    backgroundColor: palette.surfaceHigh,
                    borderColor: palette.border,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Text style={[styles.sobreText, { color: palette.textMuted }]}>
                  {data.descricao}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Profissionais */}
          {barbeiros.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
                PROFISSIONAIS
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.profScroll}
              >
                {barbeiros.map((b) => {
                  const bInitial = b.nome.charAt(0).toUpperCase();
                  return (
                    <View
                      key={b.usrCodigo}
                      style={[
                        styles.profCard,
                        {
                          backgroundColor: palette.surfaceHigh,
                          borderColor: palette.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.profAvatar,
                          { backgroundColor: palette.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.profAvatarLetter,
                            { color: palette.primaryOn },
                          ]}
                        >
                          {bInitial}
                        </Text>
                      </View>
                      <Text
                        style={[styles.profName, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {b.nome.split(" ")[0]}
                      </Text>
                      <View style={styles.profRating}>
                        <Feather name="star" size={9} color={palette.primary} />
                        <Text
                          style={[
                            styles.profRatingNum,
                            { color: palette.textMuted },
                          ]}
                        >
                          —
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Spacer for CTA */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* ── CTA fixo ── */}
      <View style={styles.ctaWrap}>
        <AmberButton
          testID="btn-reservar"
          label="Reservar horário"
          iconRight="arrow-right"
          onPress={handleReservar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
  },
  notFoundBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  notFoundBackText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  // ── Top bar
  topBar: {
    position: "absolute",
    top: 16,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Scroll
  scrollContent: {
    flexGrow: 1,
  },
  // ── Hero
  hero: {
    height: 200,
    overflow: "hidden",
    position: "relative",
  },
  heroWatermark: {
    position: "absolute",
    right: -10,
    bottom: -20,
    opacity: 0.15,
    transform: [{ rotate: "-10deg" }],
  },
  // ── Body card
  bodyCard: {
    marginTop: -60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingBottom: 24,
    position: "relative",
    zIndex: 1,
  },
  // ── Identity row
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    paddingHorizontal: 18,
    marginTop: -50,
    marginBottom: 14,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  logoLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
  },
  nameSection: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 8,
  },
  barbeariaNome: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingNum: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
  },
  ratingLabel: {
    fontSize: 12,
  },
  // ── Info card
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 18,
    textAlign: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  // ── Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sobreCard: {
    borderWidth: 1,
    padding: 14,
  },
  sobreText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  // ── Profissionais
  profScroll: {
    gap: 10,
    paddingBottom: 6,
  },
  profCard: {
    width: 104,
    padding: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  profAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profAvatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
  },
  profName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
    textAlign: "center",
  },
  profRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  profRatingNum: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
  },
  // ── CTA fixo
  ctaWrap: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
    zIndex: 10,
  },
});
