import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";

import {
  useRevogarSessao,
  useRevogarTodasSessoes,
} from "@/src/shared/hooks/perfil/use-revogar-sessao";
import {
  useSessoes,
  type SessaoAtiva,
} from "@/src/shared/hooks/perfil/use-sessoes";
import { useTheme } from "@/src/shared/theme";
import {
  Button,
  DataListWrapper,
  Divider,
  ListItem,
  ScreenHeader,
} from "@/src/shared/ui";

export default function PerfilSessoesScreen() {
  const { palette, spacing } = useTheme();
  const { data, isLoading, isError, isRefetching, refetch } = useSessoes();
  const revogarUma = useRevogarSessao();
  const revogarTodas = useRevogarTodasSessoes();

  const handleRevogar = useCallback(
    (codigo: number) => {
      Alert.alert("Encerrar sessão", "Esta sessão será encerrada.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: () => revogarUma.mutate(codigo),
        },
      ]);
    },
    [revogarUma],
  );

  const handleRevogarTodas = useCallback(() => {
    Alert.alert(
      "Encerrar todas as sessões",
      "Todos os outros logins serão encerrados. Você continua nesta sessão.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar todas",
          style: "destructive",
          onPress: () => revogarTodas.mutate(),
        },
      ],
    );
  }, [revogarTodas]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Sessões ativas"
        right={
          <Button
            label="Voltar"
            variant="secondary"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
        }
      />

      <DataListWrapper<SessaoAtiva>
        testID="lista-sessoes"
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        refetch={refetch}
        emptyMessage="Nenhuma sessão ativa."
        errorMessage="Não foi possível carregar as sessões."
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 100 }}
        keyExtractor={(item) => String(item.codigo)}
        ItemSeparatorComponent={() => <Divider indent={16} />}
        renderItem={({ item }) => (
          <ListItem
            label={`Sessão · ${format(parseISO(item.criadoEm), "dd/MM HH:mm", {
              locale: ptBR,
            })}`}
            subtitle={`Expira em ${format(
              parseISO(item.expiraEm),
              "dd/MM/yyyy",
              {
                locale: ptBR,
              },
            )}`}
            trailing={{
              kind: "node",
              node: (
                <Button
                  label="Encerrar"
                  variant="danger"
                  onPress={() => handleRevogar(item.codigo)}
                  accessibilityLabel={`Encerrar sessão ${item.codigo}`}
                />
              ),
            }}
            testID={`sessao-${item.codigo}`}
          />
        )}
      />

      <View
        style={[
          styles.footer,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            padding: spacing.md,
          },
        ]}
      >
        <Button
          label="Encerrar todas as outras"
          variant="danger"
          onPress={handleRevogarTodas}
          loading={revogarTodas.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
});
