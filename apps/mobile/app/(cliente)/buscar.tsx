import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import {
  useBarbeariasPublico,
  type BarbeariaPublica,
} from "@/src/shared/hooks/use-barbearias-publico";
import { useTheme } from "@/src/shared/theme";
import {
  Avatar,
  Card,
  EmptyScreen,
  ScreenHeader,
  SearchInput,
} from "@/src/shared/ui";

function BarbeariaCard({ item }: { item: BarbeariaPublica }) {
  const { palette, spacing, typography } = useTheme();
  return (
    <View
      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}
    >
      <Card testID={`barbearia-publica-${item.codigo}`}>
        <View style={styles.row}>
          <Avatar
            name={item.nome}
            uri={item.tema?.logoUrl ?? undefined}
            size="md"
          />
          <View style={[styles.info, { marginLeft: spacing.md - 4 }]}>
            <Text
              style={{ ...typography.bodyBold, color: palette.text }}
              numberOfLines={1}
            >
              {item.nome}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: palette.textMuted,
                marginTop: 2,
              }}
            >
              @{item.slug}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

export default function ClienteBuscarScreen() {
  const { palette, spacing } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenHeader title="Buscar barbearias" />
      <View
        style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
      >
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Nome da barbearia..."
          testID="buscar-input"
        />
      </View>

      {isError ? (
        <EmptyScreen
          icon="⚠️"
          title="Erro ao buscar"
          description="Não foi possível carregar as barbearias."
        />
      ) : data.length === 0 && !isLoading ? (
        <EmptyScreen
          icon="🔍"
          title={
            search.trim().length >= 2
              ? "Nenhuma barbearia encontrada"
              : "Descubra barbearias"
          }
          description={
            search.trim().length >= 2
              ? `Nenhuma barbearia encontrada para "${search}".`
              : "Digite o nome de uma barbearia para buscar."
          }
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.codigo)}
          renderItem={({ item }) => <BarbeariaCard item={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: spacing.xs }}
          testID="lista-barbearias"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
});
