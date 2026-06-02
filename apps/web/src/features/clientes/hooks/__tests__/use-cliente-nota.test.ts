import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useClienteNota } from "../use-cliente-nota";
import { createWrapper } from "@/test/render-helpers";
import { server } from "@/test/msw-handlers";
import { http, HttpResponse } from "msw";

const BASE = "http://localhost:3000/api/v1";

describe("useClienteNota", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClienteNota(null, 20), {
      wrapper: Wrapper,
    });
    expect(result.current.nota).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("retorna conteúdo vazio por padrão quando GET retorna conteudo vazio", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClienteNota(1, 20), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.nota).toBe("");
  });

  it("retorna conteúdo da nota quando GET retorna dados", async () => {
    server.use(
      http.get(
        `${BASE}/clientes/:clienteCodigo/nota`,
        () => {
          return HttpResponse.json({
            conteudo: "Nota de teste",
            atualizadoEm: "2026-05-24T10:00:00.000Z",
          });
        },
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClienteNota(1, 20), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.nota).toBe("Nota de teste"));
  });

  it("salvar chama PUT e invalida a query", async () => {
    let putCalled = false;
    server.use(
      http.put(
        `${BASE}/clientes/:clienteCodigo/nota`,
        async ({ request }) => {
          const body = (await request.json()) as { conteudo: string };
          putCalled = true;
          return HttpResponse.json({
            conteudo: body.conteudo,
            atualizadoEm: new Date().toISOString(),
          });
        },
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClienteNota(1, 20), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.salvar("Nova nota");
    });

    await waitFor(() => expect(result.current.isSalvando).toBe(false));
    expect(putCalled).toBe(true);
  });
});
