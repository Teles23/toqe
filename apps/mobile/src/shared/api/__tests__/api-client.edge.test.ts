jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

import * as SecureStore from "expo-secure-store";

import { api } from "../api-client";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "http://localhost:3000/api/v1/test",
    json: () => Promise.resolve(body),
  } as Response;
}

function makeBrokenJsonResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "http://localhost:3000/api/v1/test",
    json: () => Promise.reject(new SyntaxError("Unexpected token")),
  } as Response;
}

describe("api-client — edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe("Resposta com JSON malformado", () => {
    it("erro HTTP com body não-JSON → ainda lança ApiError com status correto", async () => {
      mockFetch.mockResolvedValueOnce(makeBrokenJsonResponse(500));

      await expect(api.get("/erro")).rejects.toMatchObject({
        name: "ApiError",
        status: 500,
      });
    });

    it("resposta 200 com JSON malformado propaga SyntaxError", async () => {
      mockFetch.mockResolvedValueOnce(makeBrokenJsonResponse(200));

      await expect(api.get("/test")).rejects.toThrow(SyntaxError);
    });
  });

  describe("Falhas de rede", () => {
    it("fetch rejeitado (offline) propaga TypeError, não vira ApiError", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));

      await expect(api.get("/test")).rejects.toThrow(TypeError);
    });
  });

  describe("Refresh concorrente (dedup)", () => {
    it("2 requests simultâneas com 401 → apenas 1 chamada a /auth/refresh", async () => {
      // Acesso inicial: ambas as chamadas pegam o mesmo token velho
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce("old_access") // request 1 - access
        .mockResolvedValueOnce("old_access") // request 2 - access
        .mockResolvedValue("old_refresh"); // todos os getRefreshToken subsequentes

      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      // Sequência de fetch:
      //   call 1: /a → 401
      //   call 2: /b → 401
      //   call 3: /auth/refresh → 200 (deve ser ÚNICA)
      //   call 4: retry /a → 200
      //   call 5: retry /b → 200
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {})) // /a
        .mockResolvedValueOnce(makeResponse(401, {})) // /b
        .mockResolvedValueOnce(
          makeResponse(200, {
            access_token: "new_access",
            refresh_token: "new_refresh",
          }),
        ) // /auth/refresh
        .mockResolvedValueOnce(makeResponse(200, { id: 1 })) // retry /a
        .mockResolvedValueOnce(makeResponse(200, { id: 2 })); // retry /b

      const [r1, r2] = await Promise.all([api.get("/a"), api.get("/b")]);

      expect(r1).toEqual({ id: 1 });
      expect(r2).toEqual({ id: 2 });

      // Conta quantas chamadas foram para /auth/refresh
      const refreshCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("/auth/refresh"),
      );
      expect(refreshCalls).toHaveLength(1);
    });
  });
});
