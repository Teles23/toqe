import { router } from "expo-router";
import { useCallback } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { PerfilHeader } from "@/src/features/perfil/PerfilHeader";
import { SecaoCard } from "@/src/features/perfil/SecaoCard";
import { usePerfilBasePath } from "@/src/features/perfil/use-perfil-base-path";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { DangerButton, Divider, ListItem, ScreenHeader } from "@/src/shared/ui";

const ROLE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  barbeiro: "Barbeiro",
  dono: "Dono",
  admin: "Admin",
};

/**
 * Tela principal de perfil — compartilhada entre (barbeiro) e (cliente) via
 * re-export. Layout Urban Flow: avatar grande hash-color centralizado,
 * nome + role, seções tipograficamente fortes (Barbearia → Conta →
 * Segurança → Preferências), DangerButton de saída no rodapé.
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
  const temBarbeariaUnica = barbearias.length === 1;
  // Cast `as never` — typedRoutes resolve cada path concretamente, mas o
  // basePath é dinâmico (depende do grupo barbeiro/cliente). Em runtime
  // Expo aceita ambos.
  const go = (path: string) => router.push(`${basePath}${path}` as never);

  const roleLabel = perfil ? (ROLE_LABEL[perfil] ?? perfil) : undefined;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        testID="perfil-scroll"
      >
        <PerfilHeader nome={user?.nome} roleLabel={roleLabel} />

        {/* BARBEARIA — quando single, mostra readonly; quando multi, switch */}
        {temBarbeariaUnica && barbearia ? (
          <SecaoCard title="Barbearia">
            <ListItem
              label={barbearia.nome}
              subtitle="Sua barbearia"
              testID={`barbearia-${barbearia.codigo}`}
            />
          </SecaoCard>
        ) : null}

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

        {/* CONTA — Email readonly + Editar perfil + Mudar senha */}
        <SecaoCard title="Conta">
          {user?.email ? (
            <>
              <ListItem
                label="E-mail"
                subtitle={user.email}
                testID="ir-email"
              />
              <Divider indent={16} />
            </>
          ) : null}
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
        </SecaoCard>

        {/* SEGURANÇA — 2FA + sessões */}
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

        {/* PREFERÊNCIAS — notificações */}
        <SecaoCard title="Preferências">
          <ListItem
            label="Notificações"
            trailing={{ kind: "arrow" }}
            onPress={() => go("/notificacoes")}
            testID="ir-notificacoes"
          />
        </SecaoCard>

        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.xl }}>
          <DangerButton
            label="Sair da conta"
            onPress={handleLogout}
            accessibilityLabel="Sair da conta"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
