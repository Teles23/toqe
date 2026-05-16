import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useAgendamento,
  useCancelarAgendamento,
} from "@/src/shared/hooks/cliente/use-agendamento";
import { useTheme } from "@/src/shared/theme";
import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyScreen,
  ScreenHeader,
} from "@/src/shared/ui";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "No-show",
};

export default function AgendamentoDetalheScreen() {
  const { palette, spacing, typography } = useTheme();
  const { codigo: codigoStr } = useLocalSearchParams<{ codigo: string }>();
  const codigo = Number(codigoStr);
  const { data, isLoading, isError, refetch } = useAgendamento(codigo);
  const cancelar = useCancelarAgendamento();

  const handleCancelar = useCallback(() => {
    Alert.alert(
      "Cancelar agendamento",
      "Tem certeza? Esta ação não pode ser desfeita.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelar.mutateAsync(codigo);
              await refetch();
              Alert.alert("Cancelado", "Agendamento cancelado com sucesso.");
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível cancelar. Tente novamente.",
              );
            }
          },
        },
      ],
    );
  }, [cancelar, codigo, refetch]);

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: palette.bg }]}
        testID="agendamento-loading"
      >
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenHeader
          title="Agendamento"
          right={
            <Button
              label="Voltar"
              variant="secondary"
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
            />
          }
        />
        <EmptyScreen
          icon="⚠️"
          title="Agendamento não encontrado"
          description="Verifique se o link está correto ou tente novamente."
          action={<Button label="Tentar novamente" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  const inicio = parseISO(data.inicio);
  const fim = parseISO(data.fim);
  const dataStr = format(inicio, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const horarioStr = `${format(inicio, "HH:mm", { locale: ptBR })} – ${format(fim, "HH:mm", { locale: ptBR })}`;
  const podeCancelar =
    data.status === "pendente" || data.status === "confirmado";

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Agendamento"
        right={
          <Button
            label="Voltar"
            variant="secondary"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
        }
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        <SectionLabel>Status</SectionLabel>
        <Card testID="status-card">
          <Text
            style={{ ...typography.heading, color: palette.text }}
            testID="status-text"
          >
            {STATUS_LABEL[data.status] ?? data.status}
          </Text>
        </Card>

        <View style={{ height: spacing.sm }} />

        <SectionLabel>Quando</SectionLabel>
        <Card testID="data-card">
          <Text
            style={{
              ...typography.body,
              color: palette.text,
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            {dataStr}
          </Text>
          <Text
            style={{
              ...typography.bodyBold,
              color: palette.text,
              marginTop: 2,
            }}
          >
            {horarioStr}
          </Text>
        </Card>

        <View style={{ height: spacing.sm }} />

        {data.barbeiro ? (
          <>
            <SectionLabel>Com</SectionLabel>
            <Card testID="barbeiro-card">
              <View style={styles.row}>
                <Avatar
                  uri={data.barbeiro.avatarUrl}
                  name={data.barbeiro.nome}
                  size="md"
                />
                <View style={[styles.info, { marginLeft: spacing.md - 4 }]}>
                  <Text
                    style={{ ...typography.bodyBold, color: palette.text }}
                    numberOfLines={1}
                  >
                    {data.barbeiro.nome}
                  </Text>
                </View>
              </View>
            </Card>
            <View style={{ height: spacing.sm }} />
          </>
        ) : null}

        <SectionLabel>Serviços</SectionLabel>
        <Card testID="servicos-card">
          {data.itens.map((item, idx) => (
            <View key={item.codigo}>
              {idx > 0 ? <Divider /> : null}
              <View
                style={{
                  paddingVertical: spacing.sm,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ ...typography.body, color: palette.text }}
                  numberOfLines={1}
                >
                  {item.servico.nome}
                </Text>
                <Text style={{ ...typography.body, color: palette.textMuted }}>
                  {item.duracao}min
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {podeCancelar ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label="Cancelar agendamento"
              variant="danger"
              onPress={handleCancelar}
              loading={cancelar.isPending}
              testID="botao-cancelar"
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette, spacing, typography } = useTheme();
  return (
    <Text
      style={{
        ...typography.caption,
        color: palette.textMuted,
        textTransform: "uppercase",
        fontSize: 11,
        letterSpacing: 0.6,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: spacing.xs,
      }}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
});
