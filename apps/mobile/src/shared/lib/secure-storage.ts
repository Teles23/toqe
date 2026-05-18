import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEYS = {
  ACCESS_TOKEN: "toqe_access_token",
  REFRESH_TOKEN: "toqe_refresh_token",
} as const;

/**
 * Backend de armazenamento de tokens.
 *
 * - **Nativo (iOS/Android):** usa `expo-secure-store` que mora no
 *   Keychain (iOS) ou EncryptedSharedPreferences (Android). É a opção
 *   recomendada em produção: tokens ficam criptografados em repouso.
 *
 * - **Web:** `expo-secure-store` não tem implementação para web e
 *   crasha com `getValueWithKeyAsync is not a function`. Para que o
 *   Metro web (`expo start --web`) suba sem quebrar, caímos em
 *   `window.localStorage`. **Atenção:** localStorage NÃO é seguro
 *   para tokens em produção — qualquer XSS lê. O modo web aqui serve
 *   apenas para desenvolvimento / preview rápido; produção deve usar
 *   nativo ou trocar por cookies HttpOnly.
 *
 * - **Fallback "sem storage":** se `localStorage` também não existir
 *   (SSR, ambiente exótico), as operações viram no-ops resolvidos
 *   sem efeito — o app cai no fluxo de "deslogado".
 */
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function pickStorage(): Storage {
  if (Platform.OS !== "web") {
    return {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    };
  }

  // window.localStorage pode não estar disponível em SSR
  const hasLocalStorage =
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { localStorage?: Storage }).localStorage !==
      "undefined";

  if (!hasLocalStorage) {
    return {
      getItem: async () => null,
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };
  }

  const ls = (globalThis as unknown as { localStorage: globalThis.Storage })
    .localStorage;
  return {
    getItem: async (key) => ls.getItem(key),
    setItem: async (key, value) => {
      ls.setItem(key, value);
    },
    removeItem: async (key) => {
      ls.removeItem(key);
    },
  };
}

const storage = pickStorage();

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return storage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(KEYS.REFRESH_TOKEN);
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.setItem(KEYS.ACCESS_TOKEN, accessToken),
      storage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      storage.removeItem(KEYS.ACCESS_TOKEN),
      storage.removeItem(KEYS.REFRESH_TOKEN),
    ]);
  },
};
