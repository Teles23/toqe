import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ClienteCard } from "@/src/features/barbeiro/ClienteCard";
import { ClienteDetalheModal } from "@/src/features/barbeiro/ClienteDetalheModal";
import { useClientesDaBarbearia } from "@/src/shared/hooks/barbeiro/use-clientes-da-barbearia";
import { useTheme } from "@/src/shared/theme";
import { DataListWrapper, ScreenHeader, SearchInput } from "@/src/shared/ui";
import type { ClienteAPI } from "@toqe/contracts";

type Sort = "nome" | "ultimaVisita";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function BarbeiroClientesScreen() {
  const { palette, spacing, typography } = useTheme();
  const { data, isLoading, isError, isRefetching, refetch } =
    useClientesDaBarbearia();

  const [busca, setBusca] = useState("");
  const [sort, setSort] = useState<Sort>("nome");
  const [selected, setSelected] = useState<ClienteAPI | null>(null);

  const handleSelect = useCallback((cliente: ClienteAPI) => {
    setSelected(cliente);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const filtered = useMemo(() => {
    if (!data) return undefined;
    const q = normalize(busca.trim());
    const matched = q
      ? data.filter(
          (c) =>
            normalize(c.nome).includes(q) || normalize(c.email).includes(q),
        )
      : data;

    return [...matched].sort((a, b) => {
      if (sort === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      // ultimaVisita: descending; null vai pro fim
      const av = a.ultimaVisita ?? "";
      const bv = b.ultimaVisita ?? "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return bv.localeCompare(av);
    });
  }, [data, busca, sort]);

  const sortToggle = (
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
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Clientes"
        subheader={
          <View style={{ gap: spacing.sm }}>
            <SearchInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou e-mail"
              testID="clientes-busca"
            />
            {sortToggle}
          </View>
        }
      />

      {data && data.length > 0 ? (
        <Text
          style={{
            ...typography.caption,
            color: palette.textMuted,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
          }}
          testID="clientes-contagem"
        >
          {filtered?.length ?? 0} de {data.length}
        </Text>
      ) : null}

      <DataListWrapper
        testID="lista-clientes"
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage={
          busca
            ? "Nenhum cliente encontrado para sua busca."
            : "Nenhum cliente cadastrado ainda."
        }
        errorMessage="Não foi possível carregar os clientes. Puxe para tentar novamente."
        keyExtractor={(item) => String(item.codigo)}
        renderItem={({ item }) => (
          <ClienteCard cliente={item} onPress={handleSelect} />
        )}
      />

      <ClienteDetalheModal
        cliente={selected}
        visible={!!selected}
        onClose={handleClose}
      />
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  sortRow: { flexDirection: "row" },
});
