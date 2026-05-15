import * as SecureStore from "expo-secure-store";

import { TokenStorage } from "../secure-storage";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("TokenStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccessToken", () => {
    it("retorna o token de acesso quando existe", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce("access_token_123");

      const result = await TokenStorage.getAccessToken();

      expect(result).toBe("access_token_123");
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        "toqe_access_token",
      );
    });

    it("retorna null quando não existe", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await TokenStorage.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe("getRefreshToken", () => {
    it("retorna o refresh token quando existe", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce("refresh_token_456");

      const result = await TokenStorage.getRefreshToken();

      expect(result).toBe("refresh_token_456");
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        "toqe_refresh_token",
      );
    });
  });

  describe("saveTokens", () => {
    it("salva access token e refresh token em paralelo", async () => {
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      await TokenStorage.saveTokens("access_abc", "refresh_xyz");

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "toqe_access_token",
        "access_abc",
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "toqe_refresh_token",
        "refresh_xyz",
      );
    });
  });

  describe("clearTokens", () => {
    it("remove access token e refresh token em paralelo", async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await TokenStorage.clearTokens();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "toqe_access_token",
      );
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "toqe_refresh_token",
      );
    });
  });
});
