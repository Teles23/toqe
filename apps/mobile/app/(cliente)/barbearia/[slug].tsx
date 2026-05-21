import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { useBarbeariaPublica } from "@/src/shared/hooks/use-barbearia-publica";
import { useTheme } from "@/src/shared/theme";

export default function BarbeariaPublicaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { palette } = useTheme();
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
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: palette.primary, fontSize: 14 }}>← Voltar</Text>
        </Pressable>
      </View>
    );
  }

  function handleReservar() {
    router.push(`/(cliente)/agendar?slug=${slug}` as never);
  }

  const initial = data.nome.charAt(0).toUpperCase();

  return (
    <View
      testID="barbearia-detalhe"
      style={[styles.container, { backgroundColor: palette.bg }]}
    >
      {/* ── Top bar (absolute) ── */}
      <View style={styles.topBar}>
        <Pressable
          testID="btn-voltar-barbearia"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.topBarBtn}
        >
          <Text style={styles.topBarBtnText}>‹</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.topBarBtn}>
          <Text style={styles.topBarBtnText}>☆</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero block ── */}
        <View style={[styles.hero, { backgroundColor: palette.primary }]}>
          <Text style={styles.heroWatermark}>✂</Text>
        </View>

        {/* ── Body card (overlaps hero) ── */}
        <View style={[styles.bodyCard, { backgroundColor: palette.bg }]}>
          {/* Logo overlapping */}
          <View style={styles.logoWrap}>
            <View
              style={[
                styles.logoBox,
                { backgroundColor: palette.primary, borderColor: palette.bg },
              ]}
            >
              <Text style={styles.logoLetter}>{initial}</Text>
            </View>
          </View>

          {/* Name + rating */}
          <View style={styles.nameSection}>
            <Text style={[styles.barbeariaNome, { color: palette.text }]}>
              {data.nome}
            </Text>
            {data.ratingMedio != null && data.ratingMedio > 0 ? (
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingStar, { color: palette.primary }]}>
                  {`★ ${data.ratingMedio.toFixed(1)}`}
                </Text>
                <Text style={styles.ratingLabel}>{" · avaliações"}</Text>
              </View>
            ) : null}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            {/* Endereço */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {data.endereco ?? "Endereço não informado"}
              </Text>
            </View>
            {/* Horário */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>🕐</Text>
              <Text style={styles.infoText}>Horários disponíveis</Text>
            </View>
            {/* Telefone */}
            {data.telefone ? (
              <View style={styles.infoLine}>
                <Text style={styles.infoIcon}>📞</Text>
                <Text style={styles.infoText}>{data.telefone}</Text>
              </View>
            ) : null}
          </View>

          {/* Sobre */}
          {data.descricao ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SOBRE</Text>
              <View style={styles.sobreCard}>
                <Text style={styles.sobreText}>{data.descricao}</Text>
              </View>
            </View>
          ) : null}

          {/* Profissionais */}
          {data.barbeiros.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PROFISSIONAIS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.profScroll}
              >
                {data.barbeiros.map((b) => {
                  const bInitial = b.nome.charAt(0).toUpperCase();
                  return (
                    <View key={b.usrCodigo} style={styles.profCard}>
                      <View
                        style={[
                          styles.profAvatar,
                          { backgroundColor: palette.primary },
                        ]}
                      >
                        <Text style={styles.profAvatarLetter}>{bInitial}</Text>
                      </View>
                      <Text
                        style={[styles.profName, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {b.nome.split(" ")[0]}
                      </Text>
                      <Text style={styles.profRatingNum}>nota —</Text>
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
        <Pressable
          testID="btn-reservar"
          accessibilityRole="button"
          onPress={handleReservar}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.ctaBtnText}>Reservar horário</Text>
        </Pressable>
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
  topBarBtnText: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 26,
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
    right: 20,
    bottom: -20,
    fontSize: 120,
    opacity: 0.15,
    color: "#0d0d0d",
    transform: [{ rotate: "-10deg" }],
  },
  // ── Body card
  bodyCard: {
    marginTop: -60,
    borderRadius: 20,
    paddingBottom: 24,
    position: "relative",
    zIndex: 1,
  },
  // ── Logo
  logoWrap: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 12,
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
    color: "#0d0d0d",
  },
  // ── Name section
  nameSection: {
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  barbeariaNome: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingNum: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#f5f5f5",
  },
  ratingDot: {
    fontSize: 12,
    color: "#444444",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#888888",
  },
  // ── Info card
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    fontSize: 14,
    width: 18,
    textAlign: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#aaaaaa",
    fontFamily: "Inter_400Regular",
  },
  // ── Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    color: "#666666",
    letterSpacing: 1.5,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sobreCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
    padding: 14,
  },
  sobreText: {
    fontSize: 12,
    color: "#aaaaaa",
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
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
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
    color: "#0d0d0d",
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
  profRatingStar: {
    fontSize: 9,
  },
  profRatingNum: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: "#888888",
  },
  // ── CTA fixo
  ctaWrap: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: "#0d0d0d",
  },
});
