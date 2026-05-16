import * as SplashScreen from "expo-splash-screen";

/**
 * Splash control — single source of truth para esconder a splash screen.
 *
 * `preventAutoHideAsync` é chamado no import deste módulo (efeito colateral
 * intencional) para bloquear o auto-hide antes do JS bundle iniciar.
 * Sem isso, o splash some assim que o bundle carrega — antes do AuthProvider
 * ler tokens do SecureStore, gerando flash de tela vazia.
 *
 * O hide é feito explicitamente quando o `AuthProvider.loading` resolve.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Pode falhar se já foi escondido (hot reload, segundo import) — não é fatal
});

let hidden = false;

/** Esconde o splash. Idempotente — chamadas duplicadas são no-op. */
export async function hideSplash(): Promise<void> {
  if (hidden) return;
  hidden = true;
  try {
    await SplashScreen.hideAsync();
  } catch {
    // SplashScreen já escondido por outro caminho — ok
  }
}

/** Reset interno — apenas para testes. */
export function __resetForTests(): void {
  hidden = false;
}
