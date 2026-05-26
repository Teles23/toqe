// AdicionarWalkInModal — exercita os hooks reais useServicos + useCriarWalkIn
// + api-client real. Só o boundary HTTP (global.fetch) e a sessão (useAuth)
// são mockados.

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
  useAuth: () => ({
    user: { codigo: 50, nome: "Carlos", email: "c@x.com" },
    barbearia: { codigo: 1, nome: "Centro" },
  }),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { AdicionarWalkInModal } from "../AdicionarWalkInModal";

const originalFetch = global.fetch;

const SERVICOS = [
  { codigo: 1, nome: "Corte", duracaoBase: 30, precoBase: 40, ativo: true },
  {
    codigo: 2,
    nome: "Corte + Barba",
    duracaoBase: 45,
    precoBase: 75,
    ativo: true,
  },
  {
    codigo: 3,
    nome: "Pigmentação",
    duracaoBase: 60,
    precoBase: 90,
    ativo: false,
  },
];

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1",
    json: async () => body,
  };
}

function setupFetch(opts: { walkinStatus?: number } = {}) {
  const { walkinStatus = 200 } = opts;
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const m = (init?.method ?? "GET").toUpperCase();
    if (m === "POST" && u.includes("/agendamentos/walk-in")) {
      return makeRes({ codigo: 999, tipo: "WALK_IN" }, walkinStatus);
    }
    if (u.includes("/servicos")) return makeRes(SERVICOS);
    return makeRes([]);
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderModal(onClose = jest.fn()) {
  return {
    onClose,
    ...render(<AdicionarWalkInModal visible onClose={onClose} />, { wrapper }),
  };
}

describe("AdicionarWalkInModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetch();
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("não renderiza quando visible=false", () => {
    render(<AdicionarWalkInModal visible={false} onClose={jest.fn()} />, {
      wrapper,
    });
    expect(screen.queryByText("Encaixe agora")).toBeNull();
  });

  it("renderiza chips só de serviços ativos (vindos da API)", async () => {
    renderModal();
    expect(await screen.findByTestId("walkin-servico-1")).toBeTruthy();
    expect(screen.getByTestId("walkin-servico-2")).toBeTruthy();
    expect(screen.queryByTestId("walkin-servico-3")).toBeNull();
  });

  it("submete via POST /agendamentos/walk-in com barbeiroId e serviço", async () => {
    const { onClose } = renderModal();
    fireEvent.press(await screen.findByTestId("walkin-servico-2"));
    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora" }));
    });

    await waitFor(() => {
      const post = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          String(u).includes("/agendamentos/walk-in") &&
          (init as { method?: string })?.method === "POST",
      );
      expect(post).toBeTruthy();
      const body = JSON.parse(String((post?.[1] as { body?: string }).body));
      expect(body).toMatchObject({
        barbeiroId: 50,
        servicosIds: [2],
        contato: { nome: "João" },
      });
      expect(body.cliente).toBeUndefined();
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("botão desabilitado quando nome vazio", async () => {
    renderModal();
    await screen.findByTestId("walkin-servico-1");
    const btn = screen.getByRole("button", { name: "Atender agora" });
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("habilita ao preencher nome e submete", async () => {
    renderModal();
    await screen.findByTestId("walkin-servico-1");
    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "Ana");
    const btn = screen.getByRole("button", { name: "Atender agora" });
    expect(btn.props.accessibilityState?.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(btn);
    });

    await waitFor(() => {
      const post = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          String(u).includes("/agendamentos/walk-in") &&
          (init as { method?: string })?.method === "POST",
      );
      expect(post).toBeTruthy();
      const body = JSON.parse(String((post?.[1] as { body?: string }).body));
      expect(body.contato.nome).toBe("Ana");
    });
  });

  it("erro na API exibe mensagem de falha", async () => {
    setupFetch({ walkinStatus: 500 });
    renderModal();
    await screen.findByTestId("walkin-servico-1");
    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível adicionar/i)).toBeTruthy();
    });
  });
});
