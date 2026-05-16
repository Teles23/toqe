import { router } from "expo-router";
import { useCallback } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { PerfilHeader } from "@/src/features/perfil/PerfilHeader";
import { SecaoCard } from "@/src/features/perfil/SecaoCard";
import { usePerfilBasePath } from "@/src/features/perfil/use-perfil-base-path";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { DangerButton, Divider, ListItem, ScreenHeader } from "@/src/shared/ui";

/**
 * Tela principal de perfil — compartilhada entre (barbeiro) e (cliente)
 * via re-export do arquivo `(cliente)/perfil/index.tsx`.
 * `usePerfilBasePath()` detecta o grupo via useSegments() para gerar
 * as rotas de navegação corretas.
 */
export default function PerfilIndexScreen() {
  const { palette, spacing } = useTheme();
  const basePath = usePerfilBasePath();
  const { user, perfil, barbearias, barbearia, switchBarbearia, logout } =
    useAuth();

  const handleLogout = useCallback(() => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  }, [logout]);

  const temMultiBarbearia = barbearias.length > 1;
  // Cast `as never` — typedRoutes resolve cada path concretamente, mas o
  // basePath é dinâmico (depende do grupo barbeiro/cliente). Em runtime
  // Expo aceita ambos.
  const go = (path: string) => router.push(`${basePath}${path}` as never);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        testID="perfil-scroll"
      >
        <PerfilHeader
          nome={user?.nome}
          email={user?.email}
          avatarUrl={user?.avatarUrl}
        />

        <SecaoCard title="Conta">
          <ListItem
            label="Editar perfil"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/editar")}
            testID="ir-editar"
          />
          <Divider indent={16} />
          <ListItem
            label="Mudar senha"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/senha")}
            testID="ir-senha"
          />
          <Divider indent={16} />
          <ListItem
            label="Notificações"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/notificacoes")}
            testID="ir-notificacoes"
          />
        </SecaoCard>

        <SecaoCard title="Segurança">
          <ListItem
            label="Autenticação 2 fatores"
            subtitle="Aumenta a segurança da conta"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/2fa")}
            testID="ir-2fa"
          />
          <Divider indent={16} />
          <ListItem
            label="Sessões ativas"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/sessoes")}
            testID="ir-sessoes"
          />
        </SecaoCard>

        {temMultiBarbearia ? (
          <SecaoCard title="Barbearia ativa">
            {barbearias.map((b, idx) => {
              const isAtiva = b.codigo === barbearia?.codigo;
              return (
                <View key={b.codigo}>
                  {idx > 0 ? <Divider indent={16} /> : null}
                  <ListItem
                    label={b.nome}
                    subtitle={isAtiva ? "Ativa" : undefined}
                    trailing={{ kind: "radio", selected: isAtiva }}
                    onPress={() => switchBarbearia(b.codigo)}
                    testID={`barbearia-${b.codigo}`}
                  />
                </View>
              );
            })}
          </SecaoCard>
        ) : null}

        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.xl }}>
          <DangerButton
            label="Sair da conta"
            onPress={handleLogout}
            accessibilityLabel="Sair da conta"
          />
        </View>

        {/* Texto de debug oculto pra perfis multi-tenant */}
        {perfil ? null : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
