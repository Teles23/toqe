/**
 * BarbeiroClientesScreen — Clientes (Urban Flow v2).
 *
 * Redesign fiel ao protótipo Claude Design `dTVtmzWT4ykmhzZusl4Mog`:
 *  - Header: "Clientes" + total count + botão + (AdicionarWalkInModal)
 *  - Search pill + filtros chips horizontais
 *  - Rows de cliente com Avatar + nome + visitas + última visita
 *  - Tap → ClienteDetalhe (modal full-screen)
 */

import { differenceInDays, parseISO } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdicionarWalkInModal } from "@/src/features/barbeiro/AdicionarWalkInModal";
import { ClienteCard } from "@/src/features/barbeiro/ClienteCard";
import { ClienteDetalhe } from "@/src/features/barbeiro/ClienteDetalhe";
import { useClientesDaBarbearia } from "@/src/shared/hooks/barbeiro/use-clientes-da-barbearia";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper, SearchInput } from "@/src/shared/ui";
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
  const { palette, spacing, radius, typography } = useTheme();

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
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            Clientes
          </Text>
          {data && (
            <Text
              style={[
                typography.caption,
                { color: palette.textMuted, marginTop: 2 },
              ]}
            >
              {data.length} no total
            </Text>
          )}
        </View>
        <Pressable
          testID="btn-adicionar-walkin"
          onPress={() => setWalkinOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar cliente"
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: palette.surfaceHigh,
              borderColor: palette.borderStrong,
              borderRadius: radius.full,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.addBtnText, { color: palette.primary }]}>+</Text>
        </Pressable>
      </View>

      {/* Search + filtros */}
      <View
        style={[
          styles.searchWrap,
          { paddingHorizontal: spacing.md, gap: spacing.sm },
        ]}
      >
        <SearchInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome ou e-mail"
          testID="clientes-busca"
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
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
                  {
                    backgroundColor: active
                      ? palette.primary + "1c"
                      : palette.surfaceHigh,
                    borderColor: active
                      ? palette.primary
                      : palette.borderStrong,
                    borderRadius: radius.full,
                    opacity: f.disabled ? 0.4 : pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: active ? palette.primary : palette.textMuted,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Ordenação */}
        <View style={[styles.sortRow, { gap: spacing.sm }]}>
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
            typography.caption,
            {
              color: palette.textMuted,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
            },
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
  const { palette, radius, typography } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${label}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: radius.full,
          borderWidth: 1,
          backgroundColor: active ? palette.primary : palette.surface,
          borderColor: active ? palette.primary : palette.borderStrong,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          typography.captionBold,
          { color: active ? palette.primaryOn : palette.text },
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 26,
    marginTop: -2,
  },
  searchWrap: {
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
    borderWidth: 1,
    justifyContent: "center",
  },
  sortRow: { flexDirection: "row" },
});
