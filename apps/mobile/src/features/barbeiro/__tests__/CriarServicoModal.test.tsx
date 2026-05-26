// CriarServicoModal — exercita o hook real useCriarServico + api-client real.
// Só o boundary HTTP (global.fetch) e a sessão (useAuth) são mockados.

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
  useAuth: () => ({ barbearia: { codigo: 1, nome: "Centro" } }),
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

import { CriarServicoModal } from "../CriarServicoModal";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/servicos",
    json: async () => body,
  };
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
    ...render(<CriarServicoModal visible onClose={onClose} />, { wrapper }),
  };
}

describe("CriarServicoModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () =>
      makeRes({
        codigo: 10,
        nome: "x",
        precoBase: 0,
        duracaoBase: 0,
        ativo: true,
      }),
    ) as unknown as typeof fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("não renderiza quando visible=false", () => {
    render(<CriarServicoModal visible={false} onClose={jest.fn()} />, {
      wrapper,
    });
    expect(screen.queryByText("Novo serviço")).toBeNull();
  });

  it("submete via POST /servicos com preço e duração numéricos", async () => {
    const { onClose } = renderModal();

    fireEvent.changeText(
      screen.getByLabelText("Nome do serviço"),
      "Corte + Barba",
    );
    fireEvent.changeText(screen.getByLabelText("Preço (R$)"), "75,50");
    fireEvent.changeText(screen.getByLabelText("Duração (min)"), "45");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Criar serviço" }));
    });

    await waitFor(() => {
      const post = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/servicos$/.test(String(u)) &&
          (init as { method?: string })?.method === "POST",
      );
      expect(post).toBeTruthy();
      const body = JSON.parse(String((post?.[1] as { body?: string }).body));
      expect(body).toMatchObject({
        nome: "Corte + Barba",
        precoBase: 75.5,
        duracaoBase: 45,
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("mostra erro de validação quando campos inválidos (não faz POST)", async () => {
    renderModal();
    fireEvent.changeText(screen.getByLabelText("Nome do serviço"), "A");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Criar serviço" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Nome deve ter ao menos 2/i)).toBeTruthy();
    });
    const post = (global.fetch as jest.Mock).mock.calls.find(
      ([u, init]) =>
        /\/servicos$/.test(String(u)) &&
        (init as { method?: string })?.method === "POST",
    );
    expect(post).toBeUndefined();
  });
});
