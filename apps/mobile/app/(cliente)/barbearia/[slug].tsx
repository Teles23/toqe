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
import { AmberButton, Avatar } from "@/src/shared/ui";

export default function BarbeariaPublicaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { palette, spacing, typography, radius } = useTheme();
  const { data, isLoading } = useBarbeariaPublica(slug);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
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
        style={[styles.centered, { backgroundColor: palette.bg }]}
      >
        <Text style={{ ...typography.heading, color: palette.text }}>
          Barbearia não encontrada
        </Text>
        <Pressable
          testID="btn-voltar-barbearia"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        >
          <Text style={{ ...typography.label, color: palette.primary }}>
            ← Voltar
          </Text>
        </Pressable>
      </View>
    );
  }

  function handleReservar() {
    router.push(`/(cliente)/agendar?slug=${slug}` as never);
  }

  return (
    <View
      testID="barbearia-detalhe"
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: spacing.xxl + spacing.sm,
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderColor: palette.border,
          },
        ]}
      >
        <Pressable
          testID="btn-voltar-barbearia"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            {
              backgroundColor: palette.surface,
              borderRadius: radius.full,
              marginRight: spacing.md,
            },
          ]}
        >
          <Text style={{ ...typography.body, color: palette.text }}>‹</Text>
        </Pressable>
        <Text
          style={{
            fontFamily: "Sora_700Bold",
            fontSize: 20,
            lineHeight: 28,
            color: palette.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {data.nome}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Avatar */}
        <View style={[styles.centered, { paddingVertical: spacing.xl }]}>
          <Avatar
            name={data.nome}
            uri={data.tema?.logoUrl ?? undefined}
            size="xl"
          />

          {/* Rating */}
          {data.ratingMedio != null && data.ratingMedio > 0 && (
            <Text
              style={{
                ...typography.bodyBold,
                color: palette.primary,
                marginTop: spacing.sm,
              }}
            >
              ★ {data.ratingMedio.toFixed(1)}
            </Text>
          )}
        </View>

        {/* Description */}
        {data.descricao ? (
          <View
            style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}
          >
            <Text
              style={{
                ...typography.body,
                color: palette.textMuted,
                textAlign: "center",
              }}
            >
              {data.descricao}
            </Text>
          </View>
        ) : null}

        {/* Serviços count chip */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <Text
            style={{
              ...typography.captionBold,
              color: palette.textMuted,
              letterSpacing: 1,
              marginBottom: spacing.sm,
            }}
          >
            SERVIÇOS
          </Text>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: palette.primaryDim,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                alignSelf: "flex-start",
              },
            ]}
          >
            <Text style={{ ...typography.label, color: palette.primary }}>
              {data.servicoCount}{" "}
              {data.servicoCount === 1 ? "serviço" : "serviços"} disponíveis
            </Text>
          </View>
        </View>

        {/* Barbeiros */}
        {data.barbeiros.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
            <Text
              style={{
                ...typography.captionBold,
                color: palette.textMuted,
                letterSpacing: 1,
                marginBottom: spacing.sm,
              }}
            >
              BARBEIROS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.barbeiros.map((b) => (
                <View
                  key={b.usrCodigo}
                  style={[
                    styles.barbeiroChip,
                    {
                      backgroundColor: palette.surface,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: spacing.sm,
                      marginRight: spacing.sm,
                      alignItems: "center",
                    },
                  ]}
                >
                  <Avatar
                    name={b.nome}
                    uri={b.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <Text
                    style={{
                      ...typography.caption,
                      color: palette.text,
                      marginTop: spacing.xs,
                    }}
                    numberOfLines={1}
                  >
                    {b.nome.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Reservar button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: palette.bg,
            borderTopWidth: 1,
            borderColor: palette.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <AmberButton
          label="Reservar"
          testID="btn-reservar"
          onPress={handleReservar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    flex: 0,
  },
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 24,
  },
  chip: {},
  barbeiroChip: {
    minWidth: 64,
  },
  footer: {},
});
