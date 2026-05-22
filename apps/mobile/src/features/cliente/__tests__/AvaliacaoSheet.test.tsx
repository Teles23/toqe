// AvaliacaoSheet — exercita o hook real useAvaliarAgendamento + api-client
// real. Só o boundary HTTP (global.fetch) e a sessão (useAuth) são mockados.

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

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 } }),
}));

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AvaliacaoSheet } from "../AvaliacaoSheet";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agendamentos/42/avaliacao",
    json: async () => body,
  };
}

function renderSheet(
  props: Partial<React.ComponentProps<typeof AvaliacaoSheet>> = {},
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const defaults = {
    visible: true,
    onClose: jest.fn(),
    agendamentoCodigo: 42,
    barbeiroNome: "Carlos",
    servicoNome: "Corte Degradê",
    onSuccess: jest.fn(),
  };
  return render(
    <QueryClientProvider client={qc}>
      <AvaliacaoSheet {...defaults} {...props} />
    </QueryClientProvider>,
  );
}

describe("AvaliacaoSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => makeRes({})) as unknown as typeof fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("1. não renderiza conteúdo quando visible=false", () => {
    renderSheet({ visible: false });
    expect(screen.queryByTestId("avaliacao-sheet")).toBeNull();
  });

  it("2. renderiza quando visible=true", () => {
    renderSheet({ visible: true });
    expect(screen.getByTestId("avaliacao-sheet")).toBeTruthy();
  });

  it("3. mostra o título 'Como foi seu corte?'", () => {
    renderSheet();
    expect(screen.getByText("Como foi seu corte?")).toBeTruthy();
  });

  it("4. botão enviar desabilitado sem estrela selecionada", () => {
    renderSheet();
    const btn = screen.getByTestId("btn-enviar-avaliacao");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("5. selecionar star-3 habilita o botão", () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-3"));
    const btn = screen.getByTestId("btn-enviar-avaliacao");
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it("6. campo comentário aparece após selecionar nota", () => {
    renderSheet();
    expect(screen.queryByTestId("input-comentario")).toBeNull();
    fireEvent.press(screen.getByTestId("star-4"));
    expect(screen.getByTestId("input-comentario")).toBeTruthy();
  });

  it("7. enviar faz POST /agendamentos/42/avaliacao com nota+comentário", async () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-5"));
    fireEvent.changeText(screen.getByTestId("input-comentario"), "Excelente!");
    fireEvent.press(screen.getByTestId("btn-enviar-avaliacao"));

    await waitFor(() => {
      const post = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/agendamentos\/42\/avaliacao/.test(String(u)) &&
          (init as { method?: string })?.method === "POST",
      );
      expect(post).toBeTruthy();
      const body = JSON.parse(String((post?.[1] as { body?: string }).body));
      expect(body).toMatchObject({ nota: 5, comentario: "Excelente!" });
    });
  });

  it("8. mostra o label da nota após seleção", () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-4"));
    expect(screen.getByText("Muito bom!")).toBeTruthy();
  });

  it("9. mostra nome do barbeiro e serviço no subtítulo", () => {
    renderSheet({ barbeiroNome: "João", servicoNome: "Barba" });
    expect(screen.getByText("João · Barba")).toBeTruthy();
  });
});
