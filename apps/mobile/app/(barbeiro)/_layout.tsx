import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  buildTabBarOptions,
  tabBarIcon,
} from "@/src/shared/ui/tab-bar-options";
import { Perfil } from "@toqe/shared";

/** Perfis com acesso ao portal de barbeiro/staff. */
const BARBEIRO_PERFIS: readonly Perfil[] = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

/**
 * Tab bar do barbeiro — 4 tabs no estilo Urban Flow native.
 *
 * Guard de acesso: verifica autenticação e perfil antes de renderizar
 * as tabs. Impede que um usuário com perfil CLIENTE acesse rotas do
 * grupo `(barbeiro)` via deep link ou navegação programática direta.
 *
 * A validação real dos dados continua no backend (JwtAuthGuard +
 * RolesGuard). Este guard é defense-in-depth para evitar que a UI
 * exiba dados de outros perfis.
 */
export default function BarbeiroLayout() {
  const { user, perfil, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Não autenticado → login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Perfil sem acesso ao portal de barbeiro → área do cliente
  if (!perfil || !BARBEIRO_PERFIS.includes(perfil)) {
    return <Redirect href="/(cliente)/home" />;
  }

  return (
    <Tabs screenOptions={buildTabBarOptions(theme)}>
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: tabBarIcon("calendar"),
        }}
      />
      <Tabs.Screen
        name="fila"
        options={{
          title: "Fila",
          tabBarIcon: tabBarIcon("users"),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: tabBarIcon("user-check"),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: tabBarIcon("user"),
        }}
      />
    </Tabs>
  );
}
