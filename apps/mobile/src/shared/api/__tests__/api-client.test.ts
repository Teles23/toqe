// Mock das dependências nativas — jest.mock é hoistado pelo babel antes dos imports
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: "http://localhost:3000/api/v1",
      },
    },
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { api, ApiError } from "../api-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockRouter = router as jest.Mocked<typeof router>;

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "http://localhost:3000/api/v1/test",
    json: () => Promise.resolve(body),
  } as Response;
}

describe("api-client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe("GET bem-sucedido", () => {
    it("retorna os dados da resposta", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(200, { id: 1, nome: "Test" }),
      );

      const result = await api.get<{ id: number; nome: string }>("/test");

      expect(result).toEqual({ id: 1, nome: "Test" });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("inclui Authorization header quando há token", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce("my_access_token");
      mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

      await api.get("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer my_access_token",
      );
    });

    it("inclui x-tenant-id quando tenantId é fornecido", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

      await api.get("/test", { tenantId: 42 });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)["x-tenant-id"]).toBe(
        "42",
      );
    });
  });

  describe("401 com refresh automático", () => {
    it("faz refresh e repete a request em 401", async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce("old_access_token") // request inicial
        .mockResolvedValueOnce("old_refresh_token") // getRefreshToken no refreshTokens()
        .mockResolvedValueOnce("new_access_token"); // retry

      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      // Request inicial → 401
      mockFetch.mockResolvedValueOnce(
        makeResponse(401, { message: "Unauthorized" }),
      );
      // /auth/refresh → 200
      mockFetch.mockResolvedValueOnce(
        makeResponse(200, {
          access_token: "new_access_token",
          refresh_token: "new_refresh_token",
        }),
      );
      // Retry → 200
      mockFetch.mockResolvedValueOnce(makeResponse(200, { id: 1 }));

      const result = await api.get<{ id: number }>("/protected");

      expect(result).toEqual({ id: 1 });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("redireciona para login se refresh falhar", async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce("old_access_token")
        .mockResolvedValueOnce("old_refresh_token");
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      // Request inicial → 401
      mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
      // Refresh → falha
      mockFetch.mockResolvedValueOnce(makeResponse(401, {}));

      await expect(api.get("/protected")).rejects.toThrow(ApiError);
      expect(mockRouter.replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  describe("ApiError", () => {
    it("lança ApiError com o status correto em erros HTTP", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(404, { message: "Not found" }),
      );

      await expect(api.get("/nao-existe")).rejects.toMatchObject({
        name: "ApiError",
        status: 404,
      });
    });

    it("lança ApiError em 500", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(500, { message: "Server error" }),
      );

      await expect(api.get("/erro")).rejects.toMatchObject({
        name: "ApiError",
        status: 500,
      });
    });
  });

  describe("POST", () => {
    it("envia o body serializado como JSON", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(201, { ok: true }));

      await api.post("/usuarios", { nome: "João", email: "joao@test.com" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect(options.body).toBe(
        JSON.stringify({ nome: "João", email: "joao@test.com" }),
      );
    });
  });
});
