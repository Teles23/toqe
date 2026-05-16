// Bootstrap nativo do Google Sign-In — efeito colateral antes do AuthProvider
import "@/src/_init/google-signin";

// O import de `hideSplash` já carrega o módulo `splash.ts`, cujo top-level
// chama `SplashScreen.preventAutoHideAsync()` por efeito colateral antes de
// qualquer render. Mantém o splash visível até `hideSplash()` ser chamado abaixo.
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { hideSplash } from "@/src/_init/splash";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { AuthProvider } from "@/src/shared/providers/auth-provider";
import { QueryProvider } from "@/src/shared/providers/query-provider";
import { FONT_MAP } from "@/src/shared/theme/fonts";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Wrapper interno que consome `useAuth().loading` e o estado das fontes
 * para esconder o splash apenas quando tudo está pronto.
 * Precisa estar DENTRO do AuthProvider — por isso é um componente separado.
 */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const colorScheme = useColorScheme();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading && fontsReady) {
      void hideSplash();
    }
  }, [loading, fontsReady]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(cliente)" />
        <Stack.Screen name="(barbeiro)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Sora / Inter / JetBrains Mono — fontes Urban Flow do design system.
  // O cast é necessário porque a tupla `[loaded, error]` do `useFonts`
  // não permite o tipo `as const` de `FONT_MAP` sem flexibilizar.
  const [fontsReady] = useFonts(FONT_MAP);

  return (
    <QueryProvider>
      <AuthProvider>
        <RootNavigator fontsReady={fontsReady} />
      </AuthProvider>
    </QueryProvider>
  );
}
