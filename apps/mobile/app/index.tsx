import { Redirect } from "expo-router";

/**
 * Rota raiz — redireciona imediatamente.
 * A lógica de redirecionamento por autenticação/perfil
 * fica no AuthProvider (app/_layout.tsx).
 * Este arquivo existe apenas para satisfazer o Expo Router.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
