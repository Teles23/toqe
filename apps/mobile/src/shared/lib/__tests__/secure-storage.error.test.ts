jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";

import { TokenStorage } from "../secure-storage";

const mockSS = SecureStore as jest.Mocked<typeof SecureStore>;

describe("TokenStorage — error cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAccessToken propaga erro quando SecureStore.getItemAsync rejeita", async () => {
    mockSS.getItemAsync.mockRejectedValueOnce(new Error("Keychain locked"));
    await expect(TokenStorage.getAccessToken()).rejects.toThrow(
      "Keychain locked",
    );
  });

  it("getRefreshToken propaga erro quando SecureStore rejeita", async () => {
    mockSS.getItemAsync.mockRejectedValueOnce(new Error("Keychain locked"));
    await expect(TokenStorage.getRefreshToken()).rejects.toThrow(
      "Keychain locked",
    );
  });

  it("saveTokens rejeita se qualquer um dos dois setItemAsync falhar", async () => {
    mockSS.setItemAsync
      .mockResolvedValueOnce(undefined) // access ok
      .mockRejectedValueOnce(new Error("Disk full")); // refresh falha

    await expect(TokenStorage.saveTokens("a", "b")).rejects.toThrow(
      "Disk full",
    );
  });

  it("clearTokens rejeita se qualquer um dos deletes falhar", async () => {
    mockSS.deleteItemAsync
      .mockRejectedValueOnce(new Error("Native crash"))
      .mockResolvedValueOnce(undefined);

    await expect(TokenStorage.clearTokens()).rejects.toThrow("Native crash");
  });

  it("saveTokens chama setItemAsync com ambas as chaves canônicas", async () => {
    mockSS.setItemAsync.mockResolvedValue(undefined);

    await TokenStorage.saveTokens("access_xyz", "refresh_xyz");

    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_access_token",
      "access_xyz",
    );
    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_refresh_token",
      "refresh_xyz",
    );
    expect(mockSS.setItemAsync).toHaveBeenCalledTimes(2);
  });

  it("clearTokens deleta ambas as chaves canônicas", async () => {
    mockSS.deleteItemAsync.mockResolvedValue(undefined);

    await TokenStorage.clearTokens();

    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_access_token");
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_refresh_token");
    expect(mockSS.deleteItemAsync).toHaveBeenCalledTimes(2);
  });
});
