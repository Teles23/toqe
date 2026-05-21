/**
 * BarbeiroClientesScreen — Clientes (Urban Flow v2).
 *
 * Redesign pixel-accurate do protótipo Claude Design:
 *  - Header: "Clientes" (Sora 700 24px) + total count + botão + (AdicionarWalkInModal)
 *  - Search pill 44px height, borderRadius 22, bg #1c1c1c, border #262626
 *  - Filtros chips horizontais com estados ativo/inativo corretos
 *  - Rows de cliente com Avatar + nome + visitas + última visita
 *  - Tap → ClienteDetalhe (modal full-screen)
 */

import { differenceInDays, parseISO } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { ClienteCard } from "@/src/features/barbeiro/ClienteCard";
import { ClienteDetalhe } from "@/src/features/barbeiro/ClienteDetalhe";
import { useClientesDaBarbearia } from "@/src/shared/hooks/barbeiro/use-clientes-da-barbearia";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper } from "@/src/shared/ui";
import type { ClienteAPI } from "@toqe/contracts";

// ─── Filtros ──────────────────────────────────────────────────────────────────

type FilterId = "todos" | "recentes" | "sumidos";
type Sort = "nome" | "ultimaVisita";

interface FilterChip {
  id: FilterId | "vip" | "novos";
  label: string;
  disabled?: boolean;
  test?: (c: ClienteAPI) => boolean;
}

const FILTERS: FilterChip[] = [
  { id: "todos", label: "Todos" },
  {
    id: "recentes",
    label: "Recentes (7d)",
    test: (c) => {
      if (!c.ultimaVisita) return false;
      return differenceInDays(new Date(), parseISO(c.ultimaVisita)) <= 7;
    },
  },
  {
    id: "sumidos",
    label: "Sumidos (30d+)",
    test: (c) => {
      if (!c.ultimaVisita) return c.totalVisitas > 0;
      return differenceInDays(new Date(), parseISO(c.ultimaVisita)) >= 30;
    },
  },
  { id: "vip", label: "VIP", disabled: true },
  { id: "novos", label: "Novos", disabled: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function BarbeiroClientesScreen() {
  const { palette, spacing } = useTheme();

  const { data, isLoading, isError, isRefetching, refetch } =
    useClientesDaBarbearia();

  const [busca, setBusca] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [sort, setSort] = useState<Sort>("nome");
  const [selected, setSelected] = useState<ClienteAPI | null>(null);
  const [walkinOpen, setWalkinOpen] = useState(false);

  const handleSelect = useCallback((cliente: ClienteAPI) => {
    setSelected(cliente);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const filtered = useMemo(() => {
    if (!data) return undefined;

    const filterFn = FILTERS.find((f) => f.id === filter);
    const q = normalize(busca.trim());

    let result = data;

    // Aplica filtro de categoria
    if (filterFn?.test) {
      result = result.filter(filterFn.test);
    }

    // Aplica busca textual
    if (q) {
      result = result.filter(
        (c) => normalize(c.nome).includes(q) || normalize(c.email).includes(q),
      );
    }

    // Aplica ordenação
    return [...result].sort((a, b) => {
      if (sort === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      const av = a.ultimaVisita ?? "";
      const bv = b.ultimaVisita ?? "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return bv.localeCompare(av);
    });
  }, [data, busca, filter, sort]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Clientes</Text>
          {data && (
            <View style={styles.headerSubRow}>
              <Text style={styles.headerSubIcon}>👤</Text>
              <Text style={styles.headerSubText}>{data.length} no total</Text>
            </View>
          )}
        </View>
        <Pressable
          testID="btn-adicionar-walkin"
          onPress={() => setWalkinOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar cliente"
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <Text style={[styles.addBtnText, { color: palette.primary }]}>+</Text>
        </Pressable>
      </View>

      {/* Search + filtros */}
      <View style={[styles.searchWrap, { paddingHorizontal: spacing.md }]}>
        {/* Search pill — design: height 44, borderRadius 22, bg #1c1c1c, border #262626 */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="clientes-busca"
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome ou e-mail"
            placeholderTextColor="#666666"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <Pressable
              onPress={() => setBusca("")}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              style={styles.searchClear}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id && !f.disabled;
            return (
              <Pressable
                key={f.id}
                testID={`filter-${f.id}`}
                onPress={() => !f.disabled && setFilter(f.id)}
                disabled={f.disabled}
                accessibilityRole="radio"
                accessibilityState={{ checked: active, disabled: f.disabled }}
                style={({ pressed }) => [
                  styles.chip,
                  active ? styles.chipActive : styles.chipInactive,
                  f.disabled && styles.chipDisabled,
                  pressed && !f.disabled && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Ordenação */}
        <View style={styles.sortRow}>
          <SortButton
            active={sort === "nome"}
            label="Nome"
            onPress={() => setSort("nome")}
            testID="sort-nome"
          />
          <SortButton
            active={sort === "ultimaVisita"}
            label="Última visita"
            onPress={() => setSort("ultimaVisita")}
            testID="sort-ultimaVisita"
          />
        </View>
      </View>

      {/* Contagem */}
      {data && data.length > 0 ? (
        <Text
          style={[
            styles.countText,
            { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
          ]}
          testID="clientes-contagem"
        >
          {filtered?.length ?? 0} de {data.length}
        </Text>
      ) : null}

      {/* Lista */}
      <DataListWrapper
        testID="lista-clientes"
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage={
          busca || filter !== "todos"
            ? "Nenhum cliente encontrado para sua busca."
            : "Nenhum cliente cadastrado ainda."
        }
        errorMessage="Não foi possível carregar os clientes. Puxe para tentar novamente."
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item }) => (
          <ClienteCard cliente={item} onPress={handleSelect} />
        )}
      />

      {/* Detalhe do cliente */}
      <ClienteDetalhe
        cliente={selected}
        visible={!!selected}
        onClose={handleClose}
      />

      {/* Walk-in modal */}
      <AdicionarWalkInModal
        visible={walkinOpen}
        onClose={() => setWalkinOpen(false)}
      />
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SortButton({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${label}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.sortBtn,
        active ? styles.sortBtnActive : styles.sortBtnInactive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.sortBtnText,
          active ? styles.sortBtnTextActive : styles.sortBtnTextInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  pressed: { opacity: 0.7 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#f5f5f5",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  headerSubIcon: {
    fontSize: 12,
    color: "#888888",
  },
  headerSubText: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 28,
    marginTop: -2,
  },
  searchWrap: {
    paddingBottom: 8,
    gap: 10,
  },
  // Search pill
  searchContainer: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    fontSize: 14,
    color: "#666666",
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 14,
    color: "#f5f5f5",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  searchClear: {
    position: "absolute",
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchClearText: {
    fontSize: 13,
    color: "#888888",
  },
  // Chips
  chipsContainer: {
    gap: 6,
    paddingBottom: 2,
  },
  chip: {
    flexShrink: 0,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: 100,
    borderWidth: 1,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#F4B4001c",
    borderColor: "#F4B400",
  },
  chipInactive: {
    backgroundColor: "#1c1c1c",
    borderColor: "#262626",
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#F4B400",
  },
  chipTextInactive: {
    color: "#888888",
  },
  // Sort row
  sortRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  sortBtnActive: {
    backgroundColor: "#F4B400",
    borderColor: "#F4B400",
  },
  sortBtnInactive: {
    backgroundColor: "transparent",
    borderColor: "#262626",
  },
  sortBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  sortBtnTextActive: {
    color: "#0a0a0a",
  },
  sortBtnTextInactive: {
    color: "#f5f5f5",
  },
  // Count
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
  },
});
