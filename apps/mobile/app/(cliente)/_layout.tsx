import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import {
  buildTabBarOptions,
  tabBarIcon,
} from "@/src/shared/ui/tab-bar-options";
import { Perfil } from "@toqe/shared";

/** Perfis que pertencem ao portal de barbeiro/staff (não ao portal do cliente). */
const BARBEIRO_PERFIS: readonly Perfil[] = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

/**
 * Tab bar do cliente — 4 tabs no estilo Urban Flow native.
 *
 * Guard de acesso: verifica autenticação e redireciona perfis de
 * staff para o portal correto. Impede que um usuário barbeiro acesse
 * rotas do grupo `(cliente)` via deep link ou navegação direta.
 *
 * A validação real dos dados continua no backend. Este guard é
 * defense-in-depth para consistência de UX e proteção de rotas.
 */
export default function ClienteLayout() {
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

  // Perfil de staff → portal do barbeiro
  if (perfil && BARBEIRO_PERFIS.includes(perfil)) {
    return <Redirect href="/(barbeiro)/agenda" />;
  }

  return (
    <Tabs screenOptions={buildTabBarOptions(theme)}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: tabBarIcon("home"),
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: "Buscar",
          tabBarIcon: tabBarIcon("search"),
        }}
      />
      <Tabs.Screen
        name="agendamentos/index"
        options={{
          title: "Agendamentos",
          href: "/(cliente)/agendamentos",
          tabBarIcon: tabBarIcon("calendar"),
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
