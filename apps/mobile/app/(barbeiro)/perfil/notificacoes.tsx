import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SecaoCard } from "@/src/features/perfil/SecaoCard";
import {
  useAtualizarPreferenciasNotificacao,
  useNotificacaoPreferencias,
} from "@/src/shared/hooks/perfil/use-notificacao-preferencias";
import { useTheme } from "@/src/shared/theme";
import { Button, Divider, ListItem, ScreenHeader } from "@/src/shared/ui";

type Canal = "email" | "push" | "whatsapp" | "sms";

const LABEL: Record<Canal, string> = {
  email: "E-mail",
  push: "Notificações push",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

const SUBTITLE: Record<Canal, string> = {
  email: "Receber confirmações e lembretes por e-mail",
  push: "Notificações no dispositivo (requer Development Build)",
  whatsapp: "Mensagens via WhatsApp Business (se configurado)",
  sms: "Mensagens de texto (custo adicional)",
};

export default function PerfilNotificacoesScreen() {
  const { palette, spacing, typography } = useTheme();
  const { data, isLoading, isError } = useNotificacaoPreferencias();
  const atualizar = useAtualizarPreferenciasNotificacao();

  const setCanal = (canal: Canal, value: boolean) => {
    if (!data) return;
    atualizar.mutate({ ...data, [canal]: value });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Notificações"
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
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        testID="notif-scroll"
      >
        {isLoading ? (
          <View style={styles.center} testID="notif-loading">
            <ActivityIndicator color={palette.text} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text
              style={{
                ...typography.body,
                color: palette.textMuted,
                textAlign: "center",
              }}
            >
              Não foi possível carregar as preferências.
            </Text>
          </View>
        ) : data ? (
          <SecaoCard title="Canais de notificação">
            {(["email", "push", "whatsapp", "sms"] as Canal[]).map(
              (canal, idx) => (
                <View key={canal}>
                  {idx > 0 ? <Divider indent={16} /> : null}
                  <ListItem
                    label={LABEL[canal]}
                    subtitle={SUBTITLE[canal]}
                    trailing={{
                      kind: "switch",
                      value: data[canal],
                      onValueChange: (v) => setCanal(canal, v),
                    }}
                    testID={`canal-${canal}`}
                  />
                </View>
              ),
            )}
          </SecaoCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
