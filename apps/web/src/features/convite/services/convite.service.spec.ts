import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-handlers";
import {
  fetchConvite,
  requestAceitarConvite,
  requestRejeitarConvite,
  ConviteServiceError,
} from "./convite.service";

describe("convite.service", () => {
  describe("fetchConvite", () => {
    it("retorna os dados do convite no sucesso", async () => {
      server.use(
        http.get("/api/convite/:token", ({ params }) =>
          HttpResponse.json({
            token: String(params.token),
            barbeariaNome: "Studio Navalha",
            barbeariaSlug: "studio-navalha",
            email: "novo@barbeiro.com",
            perfil: "barbeiro",
            expiresAt: "2026-06-01T00:00:00.000Z",
            isNew: true,
          }),
        ),
      );

      const data = await fetchConvite("tok");
      expect(data.barbeariaNome).toBe("Studio Navalha");
      expect(data.isNew).toBe(true);
    });

    it("lança ConviteServiceError com status 404 quando expirado", async () => {
      server.use(
        http.get(
          "/api/convite/:token",
          () =>
            new HttpResponse(JSON.stringify({ message: "expirado" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }),
        ),
      );

      await expect(fetchConvite("tok")).rejects.toMatchObject({
        name: "ConviteServiceError",
        status: 404,
      });
    });

    it("codifica o token na URL (caracteres especiais)", async () => {
      let received = "";
      server.use(
        http.get("/api/convite/:token", ({ params }) => {
          received = String(params.token);
          return HttpResponse.json({
            token: received,
            barbeariaNome: "B",
            barbeariaSlug: "b",
            email: "x@y.com",
            perfil: "barbeiro",
            expiresAt: "2026-06-01T00:00:00.000Z",
            isNew: false,
          });
        }),
      );

      await fetchConvite("a b/c");
      expect(received).toBe("a b/c");
    });
  });

  describe("requestAceitarConvite", () => {
    it("retorna o resumo do aceite no sucesso", async () => {
      server.use(
        http.post("/api/convite/:token/aceitar", () =>
          HttpResponse.json({
            user: { codigo: 7, nome: "Carlos", email: "c@x.com" },
            isNew: true,
            barbeariaNome: "Studio Navalha",
          }),
        ),
      );

      const result = await requestAceitarConvite("tok", {
        nome: "Carlos",
        senha: "senha12345",
      });
      expect(result.user.nome).toBe("Carlos");
      expect(result.barbeariaNome).toBe("Studio Navalha");
    });

    it("lança ConviteServiceError 409 quando já utilizado", async () => {
      server.use(
        http.post(
          "/api/convite/:token/aceitar",
          () =>
            new HttpResponse(JSON.stringify({ message: "já utilizado" }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }),
        ),
      );

      await expect(
        requestAceitarConvite("tok", { senha: "senha12345" }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it("lança ConviteServiceError 401 quando senha incorreta", async () => {
      server.use(
        http.post(
          "/api/convite/:token/aceitar",
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      await expect(
        requestAceitarConvite("tok", { senha: "errada123" }),
      ).rejects.toBeInstanceOf(ConviteServiceError);
    });
  });

  describe("requestRejeitarConvite", () => {
    it("resolve sem erro no sucesso (idempotente)", async () => {
      server.use(
        http.delete("/api/convite/:token", () =>
          HttpResponse.json({ sucesso: true }),
        ),
      );

      await expect(requestRejeitarConvite("tok")).resolves.toBeUndefined();
    });

    it("lança ConviteServiceError em falha do servidor", async () => {
      server.use(
        http.delete(
          "/api/convite/:token",
          () => new HttpResponse(null, { status: 503 }),
        ),
      );

      await expect(requestRejeitarConvite("tok")).rejects.toMatchObject({
        status: 503,
      });
    });
  });
});
