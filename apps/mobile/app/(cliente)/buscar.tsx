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
import { router } from "expo-router";

import {
  useBarbeariasPublico,
  type BarbeariaPublica,
} from "@/src/shared/hooks/use-barbearias-publico";
import { useTheme } from "@/src/shared/theme";

// ─── Barbeiro card row ────────────────────────────────────────────────────────

function BarbeariaRow({ item }: { item: BarbeariaPublica }) {
  const { palette } = useTheme();
  const initial = item.nome.charAt(0).toUpperCase();

  function handlePress() {
    router.push(`/(cliente)/barbearia/${item.slug}` as never);
  }

  return (
    <Pressable
      testID={`barbearia-publica-${item.codigo}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      {/* Logo square */}
      <View style={[styles.logoBox, { backgroundColor: palette.primary }]}>
        <Text style={styles.logoLetter}>{initial}</Text>
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
          <Text style={styles.cardDistance}>— km</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardRatingStar}>★ </Text>
          <Text style={styles.cardRatingNum}>—</Text>
        </View>
        {/* Feature chips — not available in API, skip */}
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ClienteBuscarScreen() {
  const { palette } = useTheme();
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
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>

        <View style={styles.headerTitle}>
          <Text style={[styles.titleText, { color: palette.text }]}>
            Descobrir
          </Text>
          <Text style={styles.subtitleText}>
            {data.length} barbearia{data.length !== 1 ? "s" : ""} encontrada
            {data.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <Pressable accessibilityRole="button" style={styles.qrChip}>
          <Text style={styles.qrChipText}>📷 Escanear QR</Text>
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="buscar-input"
            value={search}
            onChangeText={setSearch}
            placeholder="Nome da barbearia ou bairro…"
            placeholderTextColor="#444444"
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
          <Text style={[styles.emptyText, { color: "#888888" }]}>
            Não foi possível carregar as barbearias.
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centered} testID="buscar-empty">
          <Text style={[styles.emptyText, { color: "#888888" }]}>
            Nenhuma barbearia encontrada
          </Text>
          {search.trim().length >= 2 ? (
            <Text
              style={[styles.emptyText, { color: "#666666", marginTop: 4 }]}
            >
              {`para "${search}"`}
            </Text>
          ) : (
            <Text
              style={[styles.emptyText, { color: "#666666", marginTop: 4 }]}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#aaaaaa",
    fontSize: 22,
    lineHeight: 26,
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
    color: "#888888",
    marginTop: 1,
  },
  qrChip: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: "#F4B40014",
    borderWidth: 1,
    borderColor: "#F4B40038",
    borderRadius: 100,
  },
  qrChipText: {
    color: "#F4B400",
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
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 23,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
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
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
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
    color: "#0d0d0d",
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
    color: "#888888",
  },
  cardDot: {
    fontSize: 11,
    color: "#444444",
  },
  cardRatingStar: {
    fontSize: 11,
    color: "#F4B400",
  },
  cardRatingNum: {
    fontSize: 11,
    color: "#aaaaaa",
    fontFamily: "JetBrainsMono_400Regular",
  },
  chevron: {
    fontSize: 16,
    color: "#444444",
    flexShrink: 0,
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
