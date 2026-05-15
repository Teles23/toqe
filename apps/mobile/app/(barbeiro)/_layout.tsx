import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

const TINT_LIGHT = "#1a73e8";
const TINT_DARK = "#4da3ff";

export default function BarbeiroLayout() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === "dark" ? TINT_DARK : TINT_LIGHT;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="agenda" options={{ title: "Agenda do Dia" }} />
      <Tabs.Screen name="fila" options={{ title: "Fila" }} />
      <Tabs.Screen name="clientes" options={{ title: "Clientes" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
