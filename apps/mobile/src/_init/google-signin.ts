import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

/**
 * Bootstrap do Google Sign-In nativo.
 * Importado por efeito colateral em `app/_layout.tsx`, depois do `splash`
 * init, antes do `AuthProvider` montar.
 *
 * O `webClientId` vem do `app.config.ts` (extra.googleWebClientId), que por
 * sua vez lê o mesmo Client ID configurado no backend (audience da
 * verificação do ID token).
 */
const webClientId = Constants.expoConfig?.extra?.googleWebClientId as
  | string
  | undefined;

if (webClientId) {
  GoogleSignin.configure({ webClientId });
}
// Se webClientId estiver vazio (ex.: rodando sem .env), GoogleSignin.signIn()
// vai falhar no momento do clique — comportamento defensivo, sem crash de
// inicialização.
