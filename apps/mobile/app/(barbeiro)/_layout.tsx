import { Tabs } from "expo-router";

import { useTheme } from "@/src/shared/theme";
import {
  buildTabBarOptions,
  tabBarIcon,
} from "@/src/shared/ui/tab-bar-options";

/**
 * Tab bar do barbeiro — 4 tabs no estilo Urban Flow native.
 * Ícones do Feather (visualmente equivalente ao Lucide) já vêm com
 * `@expo/vector-icons` — sem dep extra.
 */
export default function BarbeiroLayout() {
  const theme = useTheme();

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
