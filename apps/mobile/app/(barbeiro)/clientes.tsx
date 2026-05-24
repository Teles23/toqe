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

import { Feather } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdicionarClienteModal } from "@/src/features/barbeiro/AdicionarClienteModal";
import { ClienteCard } from "@/src/features/barbeiro/ClienteCard";
import { ClienteDetalhe } from "@/src/features/barbeiro/ClienteDetalhe";
import {
  OrdenarClientesSheet,
  type SortClientes,
} from "@/src/features/barbeiro/OrdenarClientesSheet";
import { useClientesDaBarbearia } from "@/src/shared/hooks/barbeiro/use-clientes-da-barbearia";
import { useTheme } from "@/src/shared/theme";
import { emailVisivel } from "@/src/shared/utils/cliente";
import { DataListWrapper, EmptyScreen, ListSkeleton } from "@/src/shared/ui";
import type { ClienteAPI } from "@toqe/contracts";

// ─── Filtros ──────────────────────────────────────────────────────────────────

type FilterId = "todos" | "recentes" | "sumidos";

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
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, isRefetching, refetch } =
    useClientesDaBarbearia();

  const [busca, setBusca] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [sort, setSort] = useState<SortClientes>("nomeAsc");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<ClienteAPI | null>(null);
  const [addClienteOpen, setAddClienteOpen] = useState(false);

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

    // Aplica busca textual (e-mail só conta se for real, não sintético)
    if (q) {
      result = result.filter((c) => {
        const email = emailVisivel(c.email) ?? "";
        return normalize(c.nome).includes(q) || normalize(email).includes(q);
      });
    }

    // Aplica ordenação
    return [...result].sort((a, b) => {
      switch (sort) {
        case "nomeAsc":
          return a.nome.localeCompare(b.nome, "pt-BR");
        case "nomeDesc":
          return b.nome.localeCompare(a.nome, "pt-BR");
        case "totalGasto":
          return b.totalGasto - a.totalGasto;
        case "ultimaRecente":
        case "ultimaAntiga": {
          // Clientes sem visita vão sempre para o fim, em ambas as direções.
          const av = a.ultimaVisita ?? "";
          const bv = b.ultimaVisita ?? "";
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          return sort === "ultimaRecente"
            ? bv.localeCompare(av)
            : av.localeCompare(bv);
        }
        default:
          return 0;
      }
    });
  }, [data, busca, filter, sort]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.md, paddingTop: insets.top + 10 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Clientes</Text>
          {data && (
            <View style={styles.headerSubRow}>
              <Feather name="users" size={12} color="#888888" />
              <Text style={styles.headerSubText}>{data.length} no total</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            testID="btn-ordenar"
            onPress={() => setSortOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ordenar clientes"
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Feather name="sliders" size={18} color="#888888" />
          </Pressable>
          <Pressable
            testID="btn-adicionar-cliente"
            onPress={() => setAddClienteOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Adicionar cliente"
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Feather name="plus" size={20} color={palette.primary} />
          </Pressable>
        </View>
      </View>

      {/* Search + filtros */}
      <View style={[styles.searchWrap, { paddingHorizontal: spacing.md }]}>
        {/* Search pill — design: height 44, borderRadius 22, bg #1c1c1c, border #262626 */}
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={16}
            color="#666666"
            style={styles.searchIcon}
          />
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
              <Feather name="x" size={14} color="#888888" />
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
        refreshProgressViewOffset={0}
        loadingComponent={<ListSkeleton testID="clientes-skeleton" />}
        emptyComponent={
          busca || filter !== "todos" ? (
            <EmptyScreen
              featherIcon="search"
              title="Ninguém encontrado"
              description="Tenta outro nome ou número. Ou desative os filtros."
              testID="clientes-empty"
            />
          ) : (
            <EmptyScreen
              featherIcon="user"
              title="Sem clientes ainda"
              description="Seus clientes aparecem aqui depois do primeiro atendimento."
              testID="clientes-empty"
            />
          )
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

      {/* Cadastro manual de cliente */}
      <AdicionarClienteModal
        visible={addClienteOpen}
        onClose={() => setAddClienteOpen(false)}
      />

      {/* Ordenação */}
      <OrdenarClientesSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onSelect={setSort}
      />
    </View>
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
  headerSubText: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  // Count
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
  },
});
