import { ExpoConfig } from "expo/config";

// Preenchido após rodar: cd apps/mobile && eas init
// Copiar o UUID gerado para .env: EAS_PROJECT_ID=<uuid>
const projectId = process.env.EAS_PROJECT_ID ?? "";

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
        iosUrlScheme: "",
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

  // OTA: ativo apenas quando EAS_PROJECT_ID estiver definido no ambiente de build.
  // Localmente (sem projectId) o app funciona normalmente sem verificar updates.
  ...(projectId
    ? {
        updates: {
          url: `https://u.expo.dev/${projectId}`,
          fallbackToCacheTimeout: 0,
        },
        runtimeVersion: { policy: "appVersion" },
      }
    : {}),

  extra: {
    apiUrl: "https://toqe.duckdns.org/api/v1",
    googleWebClientId:
      "330194878953-3iql45i1robhr8di453uhtp92qtqhrrh.apps.googleusercontent.com",
    eas: { projectId },
  },

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
