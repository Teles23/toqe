import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  useBarbeariasPublico,
  type BarbeariaPublica,
} from "@/src/shared/hooks/use-barbearias-publico";
import { useTheme } from "@/src/shared/theme";
import {
  Avatar,
  EmptyScreen,
  ScreenHeader,
  SearchInput,
} from "@/src/shared/ui";

function BarbeariaRow({ item }: { item: BarbeariaPublica }) {
  const { palette, spacing, typography, radius } = useTheme();

  function handlePress() {
    router.push(`/(cliente)/barbearia/${item.slug}` as never);
  }

  return (
    <Pressable
      testID={`barbearia-publica-${item.codigo}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          backgroundColor: pressed ? palette.surfaceHigh : palette.surface,
          borderRadius: radius.md,
          marginHorizontal: spacing.md,
          marginVertical: spacing.xs,
          borderWidth: 1,
          borderColor: palette.border,
        },
      ]}
    >
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
          numberOfLines={1}
        >
          @{item.slug}
        </Text>
      </View>
      <Text style={{ ...typography.body, color: palette.textMuted }}>›</Text>
    </Pressable>
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
      <ScreenHeader title="Descobrir" />
      <View
        style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
      >
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar barbearias..."
          testID="buscar-input"
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator
            color={palette.primary}
            size="large"
            testID="buscar-loading"
          />
        </View>
      ) : isError ? (
        <EmptyScreen
          icon="⚠️"
          title="Erro ao buscar"
          description="Não foi possível carregar as barbearias."
        />
      ) : data.length === 0 ? (
        <EmptyScreen
          icon="🔍"
          title="Nenhuma barbearia encontrada"
          description={
            search.trim().length >= 2
              ? `Nenhuma barbearia encontrada para "${search}".`
              : "Digite o nome de uma barbearia para buscar."
          }
          testID="buscar-empty"
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.codigo)}
          renderItem={({ item }) => <BarbeariaRow item={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: spacing.xs }}
          testID="lista-barbearias-publicas"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
