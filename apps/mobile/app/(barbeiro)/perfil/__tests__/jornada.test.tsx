// JornadaScreen — exercita os hooks reais (useJornada + useSalvarJornada) +
// api-client real. Só o boundary HTTP (global.fetch), a sessão (useAuth) e o
// router são mockados.

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

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { back: () => mockBack() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 }, user: { codigo: 7 } }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import JornadaScreen from "../jornada";

const originalFetch = global.fetch;

interface FakeReq {
  method?: string;
  body?: string;
}
function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agenda/jornada/7",
    json: async () => body,
  };
}

/** GET retorna `jornada`; PUT ecoa sucesso e captura o body enviado. */
function setupFetch(jornada: unknown[], putStatus = 200) {
  const captured: { body?: unknown } = {};
  global.fetch = jest.fn(async (_url: unknown, init?: FakeReq) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "PUT") {
      captured.body = init?.body ? JSON.parse(init.body) : undefined;
      return makeRes([], putStatus);
    }
    return makeRes(jornada);
  }) as unknown as typeof fetch;
  return captured;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<JornadaScreen />, { wrapper });
}

const seg = {
  codigo: 1,
  diaSemana: 1,
  inicio: "08:00",
  fim: "17:00",
  almocoIni: "12:00",
  almocoFim: "13:00",
};

describe("JornadaScreen", () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("carrega e mostra os horários reais nos campos editáveis", async () => {
    setupFetch([seg]);
    renderScreen();
    const abre = await screen.findByTestId("hora-abre-seg");
    expect(abre.props.value).toBe("08:00");
    expect(screen.getByTestId("hora-almoco-de-seg").props.value).toBe("12:00");
  });

  it("ativar um dia de folga revela os campos de horário", async () => {
    setupFetch([seg]);
    renderScreen();
    await screen.findByTestId("hora-abre-seg");

    // Domingo não tem registro → inativo, sem campos
    expect(screen.queryByTestId("hora-abre-dom")).toBeNull();
    fireEvent(screen.getByTestId("toggle-dom"), "valueChange", true);
    expect(screen.getByTestId("hora-abre-dom").props.value).toBe("09:00");
  });

  it("salvar envia o almoço REAL no PUT", async () => {
    const captured = setupFetch([seg]);
    renderScreen();
    await screen.findByTestId("hora-abre-seg");

    fireEvent.press(screen.getByTestId("btn-salvar-jornada"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const dias = (
      captured.body as { dias: { diaSemana: number; almocoIni: string }[] }
    ).dias;
    const diaSeg = dias.find((d) => d.diaSemana === 1)!;
    expect(diaSeg.almocoIni).toBe("12:00");
  });

  it("bloqueia salvar com horário inválido (abertura após fechamento)", async () => {
    const captured = setupFetch([seg]);
    renderScreen();
    const abre = await screen.findByTestId("hora-abre-seg");

    fireEvent.changeText(abre, "19:00"); // depois do fechamento 17:00
    fireEvent.press(screen.getByTestId("btn-salvar-jornada"));

    expect(await screen.findByTestId("jornada-error")).toBeTruthy();
    expect(captured.body).toBeUndefined(); // não chamou PUT
  });
});
