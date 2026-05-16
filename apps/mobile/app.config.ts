import { ExpoConfig } from "expo/config";

// EAS project ID — público (não é secret), versionado no repo.
// Liga o app à conta @thiagoteles/toqe-mobile em expo.dev.
// Hardcoded (em vez de process.env) porque EAS exige config estática para
// gerenciar o link do projeto via `eas init` / `eas credentials`.
const projectId = "d9c90eca-f4b9-4a14-a740-523935615a09";

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
    adaptiveIcon: {
      // Cor da marca — bate com splash + icon principal
      backgroundColor: "#1a73e8",
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
        imageWidth: 240,
        resizeMode: "contain",
        // Fundo da marca — sem flash branco entre splash e primeira tela
        backgroundColor: "#1a73e8",
        dark: {
          backgroundColor: "#0d1117",
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
    apiUrl: "https://toqe.duckdns.org/api/v1",
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
