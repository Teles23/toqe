import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type BarbeariaPublica,
  useBarbeariasPublico,
} from "@/src/shared/hooks/use-barbearias-publico";
import { useTheme } from "@/src/shared/theme";
import { CircleIconButton } from "@/src/shared/ui";

// ─── Barbearia card row ─────────────────────────────────────────────────────────

function BarbeariaRow({ item }: { item: BarbeariaPublica }) {
  const { palette, radius } = useTheme();
  const initial = item.nome.charAt(0).toUpperCase();

  function handlePress() {
    router.push(`/(cliente)/barbearia/${item.slug}` as never);
  }

  return (
    <Pressable
      testID={`barbearia-publica-${item.codigo}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surfaceHigh,
          borderColor: palette.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Logo square */}
      <View style={[styles.logoBox, { backgroundColor: palette.primary }]}>
        <Text style={[styles.logoLetter, { color: palette.primaryOn }]}>
          {initial}
        </Text>
      </View>

      {/* Info column */}
      <View style={styles.cardInfo}>
        <Text
          style={[styles.cardName, { color: palette.text }]}
          numberOfLines={1}
        >
          {item.nome}
        </Text>
        <View style={styles.cardMeta}>
          <Feather name="map-pin" size={11} color={palette.textDisabled} />
          <Text style={[styles.cardDistance, { color: palette.textMuted }]}>
            — km
          </Text>
          <Text style={[styles.cardDot, { color: palette.textDisabled }]}>
            ·
          </Text>
          <Feather name="star" size={11} color={palette.primary} />
          <Text style={[styles.cardRatingNum, { color: palette.textMuted }]}>
            —
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Feather name="chevron-right" size={18} color={palette.textDisabled} />
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ClienteBuscarScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useBarbeariasPublico(
    search.trim().length >= 2 ? search.trim() : undefined,
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <CircleIconButton
          icon="arrow-left"
          iconColor={palette.textMuted}
          size={40}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        />

        <View style={styles.headerTitle}>
          <Text style={[styles.titleText, { color: palette.text }]}>
            Descobrir
          </Text>
          <Text style={[styles.subtitleText, { color: palette.textMuted }]}>
            {data.length} barbearia{data.length !== 1 ? "s" : ""} encontrada
            {data.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <Pressable
          testID="btn-escanear-qr"
          accessibilityRole="button"
          accessibilityLabel="Escanear QR"
          onPress={() => router.push("/(cliente)/buscar/qr" as never)}
          style={({ pressed }) => [
            styles.qrChip,
            {
              backgroundColor: palette.primary + "14",
              borderColor: palette.primary + "38",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="maximize" size={14} color={palette.primary} />
          <Text style={[styles.qrChipText, { color: palette.primary }]}>
            Escanear QR
          </Text>
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: palette.surfaceHigh,
              borderColor: palette.border,
              borderRadius: radius.full,
            },
          ]}
        >
          <Feather name="search" size={16} color={palette.textDisabled} />
          <TextInput
            testID="buscar-input"
            value={search}
            onChangeText={setSearch}
            placeholder="Nome da barbearia ou bairro…"
            placeholderTextColor={palette.textDisabled}
            style={[styles.searchInput, { color: palette.text }]}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator
            color={palette.primary}
            size="large"
            testID="buscar-loading"
          />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Não foi possível carregar as barbearias.
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centered} testID="buscar-empty">
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Nenhuma barbearia encontrada
          </Text>
          {search.trim().length >= 2 ? (
            <Text
              style={[
                styles.emptyText,
                { color: palette.textDisabled, marginTop: 4 },
              ]}
            >
              {`para "${search}"`}
            </Text>
          ) : (
            <Text
              style={[
                styles.emptyText,
                { color: palette.textDisabled, marginTop: 4 },
              ]}
            >
              Digite o nome de uma barbearia para buscar.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          testID="lista-barbearias-publicas"
          data={data}
          keyExtractor={(item) => String(item.codigo)}
          renderItem={({ item }) => <BarbeariaRow item={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 11,
    marginTop: 1,
  },
  qrChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 100,
  },
  qrChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Search
  searchWrap: {
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    height: 46,
  },
  // ── List
  list: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    gap: 10,
  },
  // ── Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  cardDistance: {
    fontSize: 11,
  },
  cardDot: {
    fontSize: 11,
  },
  cardRatingNum: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
  },
  // ── States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
