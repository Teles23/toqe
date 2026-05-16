import { Stack } from "expo-router";

/**
 * Stack interno do perfil — permite navegação back nativa entre
 * subtelas (editar, senha, 2fa, sessoes, notificacoes) sem perder
 * a tab atual.
 */
export default function PerfilStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
