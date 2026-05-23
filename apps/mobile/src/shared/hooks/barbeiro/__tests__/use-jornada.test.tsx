jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("fake-access-token"),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 }, user: { codigo: 7 } }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import type { JornadaResponse } from "@toqe/shared";

import { mergeJornadaComSemana, useJornada } from "../use-jornada";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agenda/jornada/7",
    json: async () => body,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function reg(over: Partial<JornadaResponse> = {}): JornadaResponse {
  return {
    codigo: 1,
    diaSemana: 1,
    inicio: "09:00",
    fim: "18:00",
    almocoIni: "12:00",
    almocoFim: "13:00",
    ...over,
  };
}

describe("mergeJornadaComSemana", () => {
  it("retorna 7 dias na ordem segunda → domingo", () => {
    const r = mergeJornadaComSemana([]);
    expect(r.map((d) => d.diaShort)).toEqual([
      "SEG",
      "TER",
      "QUA",
      "QUI",
      "SEX",
      "SAB",
      "DOM",
    ]);
  });

  it("lista vazia → todos os dias inativos com horários null", () => {
    const r = mergeJornadaComSemana([]);
    expect(r.every((d) => !d.ativo)).toBe(true);
    expect(r.every((d) => d.abre === null && d.fecha === null)).toBe(true);
    expect(r.every((d) => d.almoco === null)).toBe(true);
  });

  it("dias com registro ficam ativos com horários e almoço reais", () => {
    const r = mergeJornadaComSemana([
      reg({ diaSemana: 1, inicio: "08:00", fim: "17:00" }),
      reg({
        diaSemana: 5,
        inicio: "10:00",
        fim: "20:00",
        almocoIni: "13:00",
        almocoFim: "14:00",
      }),
    ]);
    const seg = r.find((d) => d.diaSemana === 1)!;
    const sex = r.find((d) => d.diaSemana === 5)!;
    const ter = r.find((d) => d.diaSemana === 2)!;

    expect(seg.ativo).toBe(true);
    expect(seg.abre).toBe("08:00");
    expect(seg.fecha).toBe("17:00");
    expect(seg.almoco).toEqual({ de: "12:00", ate: "13:00" });

    expect(sex.almoco).toEqual({ de: "13:00", ate: "14:00" });

    // dia sem registro continua inativo
    expect(ter.ativo).toBe(false);
    expect(ter.abre).toBeNull();
  });

  it("aceita undefined (query ainda carregando)", () => {
    const r = mergeJornadaComSemana(undefined);
    expect(r).toHaveLength(7);
    expect(r.every((d) => !d.ativo)).toBe(true);
  });
});

describe("useJornada", () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("busca GET /agenda/jornada/:barbeiroId e retorna os registros", async () => {
    const dados = [reg({ diaSemana: 1 }), reg({ diaSemana: 2 })];
    global.fetch = jest.fn(async (url: unknown) => {
      expect(String(url)).toContain("/agenda/jornada/7");
      return makeRes(dados);
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useJornada(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(dados);
  });

  it("propaga erro quando a API falha", async () => {
    global.fetch = jest.fn(async () =>
      makeRes({ message: "erro" }, 500),
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useJornada(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
