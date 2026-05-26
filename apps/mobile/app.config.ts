import { ExpoConfig } from "expo/config";

// EAS project ID — público (não é secret), versionado no repo.
// Liga o app à conta @thiagoteles/toqe-mobile em expo.dev.
// Hardcoded (em vez de process.env) porque EAS exige config estática para
// gerenciar o link do projeto via `eas init` / `eas credentials`.
const projectId = "d9c90eca-f4b9-4a14-a740-523935615a09";

// URL da API resolvida por ambiente:
//  - dev (expo start): vem de EXPO_PUBLIC_API_URL (definido em .env.local →
//    aponta para o container dev na sua máquina). Ver docs/dev.
//  - build EAS (APK/loja): cada perfil em eas.json define EXPO_PUBLIC_API_URL;
//    production usa a URL de produção.
//  - fallback (nada definido): produção, para nunca vazar dev num build.
const API_URL_PROD = "https://toqe.duckdns.org/api/v1";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? API_URL_PROD;

const config: ExpoConfig = {
  name: "Toqe",
  slug: "toqe-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "toqe",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.teles23.toqe",
  },

  android: {
    package: "com.teles23.toqe",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      // Cor da marca Toqe (âmbar) — bate com splash + icon principal
      backgroundColor: "#F4B400",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-updates",
    [
      "@react-native-google-signin/google-signin",
      {
        // REVERSED do Web Client ID — placeholder para satisfazer validação do
        // plugin (que exige string não-vazia começando com "com.googleusercontent.apps.").
        // Para build Android este valor NÃO é usado em runtime.
        // Quando for fazer build iOS: criar OAuth Client iOS no Google Cloud
        // (Application type: iOS, bundle id: com.teles23.toqe) e substituir
        // por: com.googleusercontent.apps.<reversed-do-iOS-Client-ID>
        iosUrlScheme:
          "com.googleusercontent.apps.1095847529893-b71gjl8nqpjl5vo0ppd5c5iljfof684m",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        // Fundo escuro da marca Toqe — sem flash branco entre splash e 1ª tela
        backgroundColor: "#0d0d0d",
        dark: {
          backgroundColor: "#0d0d0d",
        },
      },
    ],
  ],

  // OTA via EAS Update — URL derivada do projectId.
  updates: {
    url: `https://u.expo.dev/${projectId}`,
    fallbackToCacheTimeout: 0,
  },
  // Updates só se aplicam dentro da mesma versão nativa (mudou `version` → novo build).
  runtimeVersion: { policy: "appVersion" },

  extra: {
    apiUrl,
    googleWebClientId:
      "1095847529893-b71gjl8nqpjl5vo0ppd5c5iljfof684m.apps.googleusercontent.com",
    eas: { projectId },
  },

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
