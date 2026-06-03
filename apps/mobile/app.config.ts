import fs from "fs";
import path from "path";
import { ExpoConfig } from "expo/config";

// Algumas propriedades do SDK 56 ainda não estão em @expo/config-types@56.0.5.
type AppConfig = ExpoConfig & {
  newArchEnabled?: boolean;
  android?: NonNullable<ExpoConfig["android"]> & {
    edgeToEdgeEnabled?: boolean;
  };
};

const projectId = "d9c90eca-f4b9-4a14-a740-523935615a09";

const firebaseAndroidJson = process.env.GOOGLE_SERVICES_JSON;
const androidGoogleServicesPath = path.resolve(
  __dirname,
  "google-services.json",
);

if (firebaseAndroidJson) {
  try {
    JSON.parse(firebaseAndroidJson);
    fs.writeFileSync(androidGoogleServicesPath, firebaseAndroidJson, "utf8");
  } catch (error) {
    console.warn(
      "GOOGLE_SERVICES_JSON is set but invalid JSON. google-services.json will not be written.",
      error,
    );
  }
}

// URL da API resolvida por ambiente:
//  - dev (expo start): vem de EXPO_PUBLIC_API_URL (definido em .env.local →
//    aponta para o container dev na sua máquina). Ver docs/dev.
//  - build EAS (APK/loja): cada perfil em eas.json define EXPO_PUBLIC_API_URL;
//    production usa a URL de produção.
//  - fallback (nada definido): produção, para nunca vazar dev num build.
const API_URL_PROD = "https://api.toqe-barber.com.br/api/v1";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? API_URL_PROD;
const APP_LINK_DOMAIN_PROD = "app.toqe-barber.com.br";
const appLinkDomain =
  process.env.EXPO_PUBLIC_APP_LINK_DOMAIN ??
  process.env.APP_LINK_DOMAIN ??
  APP_LINK_DOMAIN_PROD;

const config: AppConfig = {
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
    associatedDomains: [`applinks:${appLinkDomain}`],
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
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: appLinkDomain,
            pathPrefix: "/b",
          },
          {
            scheme: "https",
            host: appLinkDomain,
            pathPrefix: "/u",
          },
          {
            scheme: "https",
            host: appLinkDomain,
            pathPrefix: "/convite",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
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
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#F4B400",
        sounds: [],
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "O Toqe precisa acessar a câmera para escanear QR codes de barbearias e tirar fotos de perfil.",
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "O Toqe acessa sua galeria para você escolher uma foto de perfil.",
        cameraPermission:
          "O Toqe acessa a câmera para tirar sua foto de perfil.",
      },
    ],
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
    appLinkDomain,
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
