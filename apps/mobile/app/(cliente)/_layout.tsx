import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

const TINT_LIGHT = "#1a73e8";
const TINT_DARK = "#4da3ff";

export default function ClienteLayout() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === "dark" ? TINT_DARK : TINT_LIGHT;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Início" }} />
      <Tabs.Screen name="buscar" options={{ title: "Buscar" }} />
      <Tabs.Screen
        name="agendamentos/index"
        options={{ title: "Agendamentos", href: "/(cliente)/agendamentos" }}
      />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
