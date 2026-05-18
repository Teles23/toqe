import { Tabs } from "expo-router";

import { useTheme } from "@/src/shared/theme";
import {
  buildTabBarOptions,
  tabBarIcon,
} from "@/src/shared/ui/tab-bar-options";

/**
 * Tab bar do cliente — 4 tabs no estilo Urban Flow native.
 * Mesma fábrica do barbeiro (`buildTabBarOptions`) — DRY entre layouts.
 */
export default function ClienteLayout() {
  const theme = useTheme();

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
