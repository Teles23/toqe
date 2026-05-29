// ClienteDetalhe — exercita os hooks reais (useHistoricoCliente,
// useClienteNota, useSalvarNotaCliente) + api-client real. Só o boundary HTTP
// (global.fetch) e a sessão (useAuth) são mockados. FilaCard tem timers
// internos → stub leve.

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
  router: { replace: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 } }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { PessoaAPI } from "@toqe/contracts";
import type { AgendamentoResponse } from "@toqe/shared";

import { ClienteDetalhe } from "../ClienteDetalhe";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1",
    json: async () => body,
  };
}

function setupFetch(
  opts: {
    historico?: AgendamentoResponse[];
    nota?: string;
    clientes?: PessoaAPI[];
  } = {},
) {
  const { historico = [], nota = "", clientes = [] } = opts;
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const m = (init?.method ?? "GET").toUpperCase();
    if (u.includes("/nota")) {
      if (m === "PUT") return makeRes({ conteudo: "", atualizadoEm: null });
      return makeRes({ conteudo: nota, atualizadoEm: null });
    }
    // GET /barbearias/:id/clientes (enriquecimento de stats) — antes de
    // /agendamentos pois a URL não contém "agendamentos".
    if (/\/clientes(\?|$)/.test(u)) return makeRes(clientes);
    if (u.includes("/agendamentos")) return makeRes(historico);
    return makeRes([]);
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderDetalhe(
  props: Partial<React.ComponentProps<typeof ClienteDetalhe>> = {},
) {
  const defaults = {
    cliente: makeCliente(),
    visible: true,
    onClose: jest.fn(),
  };
  return render(<ClienteDetalhe {...defaults} {...props} />, { wrapper });
}

function makeCliente(over: Partial<PessoaAPI> = {}): PessoaAPI {
  return {
    codigo: 1,
    nome: "João Barbosa",
    tipo: "usuario",
    email: "joao@x.com",
    telefone: "+5511999999999",
    avatarUrl: null,
    totalVisitas: 5,
    totalGasto: 250,
    ticketMedio: 50,
    ultimaVisita: "2026-05-10T14:00:00.000Z",
    servicoFav: "Corte Masculino",
    ...over,
  };
}

function makeHistoricoItem(
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo: 100,
    inicio: "2026-05-10T14:00:00.000Z",
    fim: "2026-05-10T14:30:00.000Z",
    status: "concluido",
    barbeiro: { usrCodigo: 10, nome: "Bob", avatarUrl: null },
    cliente: {
      usrCodigo: 1,
      nome: "João Barbosa",
      telefone: null,
      tipo: "usuario" as const,
    },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracaoMin: 30,
      },
    ],
    criadoEm: "2026-05-09T20:00:00.000Z",
    ...over,
  };
}

describe("ClienteDetalhe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetch();
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("não renderiza quando cliente é null", () => {
    renderDetalhe({ cliente: null });
    expect(screen.queryByTestId("cliente-detalhe-modal")).toBeNull();
  });

  it("não renderiza quando visible=false", () => {
    renderDetalhe({ visible: false });
    expect(screen.queryByText("João Barbosa")).toBeNull();
  });

  it("renderiza nome, total de visitas e ticket médio", () => {
    renderDetalhe();
    expect(screen.getAllByText("João Barbosa").length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("R$50")).toBeTruthy();
  });

  it("enriquece stats pela lista de clientes quando recebe só dados parciais (abrir pela agenda)", async () => {
    // Caller (agenda "Ver histórico") passa só codigo/nome com stats zerados.
    // O detalhe deve buscar os stats reais pela mesma fonte da aba Clientes.
    setupFetch({
      clientes: [
        makeCliente({
          codigo: 7,
          nome: "Maria Silva",
          totalVisitas: 9,
          ticketMedio: 70,
          servicoFav: "Coloração",
        }),
      ],
    });
    renderDetalhe({
      cliente: makeCliente({
        codigo: 7,
        nome: "Maria Silva",
        telefone: null,
        avatarUrl: null,
        totalVisitas: 0,
        totalGasto: 0,
        ticketMedio: 0,
        ultimaVisita: null,
        servicoFav: null,
      }),
    });
    // stats reais aparecem após a query resolver (não os zeros do parcial)
    expect(await screen.findByText("9")).toBeTruthy();
    expect(screen.getByText("R$70")).toBeTruthy();
    expect(screen.getByText("Coloração")).toBeTruthy();
  });

  it("exibe telefone no formato mono", () => {
    renderDetalhe();
    expect(screen.getByText("+5511999999999")).toBeTruthy();
  });

  it("exibe serviço favorito quando definido", () => {
    renderDetalhe();
    expect(screen.getByText("Corte Masculino")).toBeTruthy();
  });

  it("não exibe card de serviço favorito quando null", () => {
    renderDetalhe({ cliente: makeCliente({ servicoFav: null }) });
    expect(screen.queryByText("SERVIÇO FAVORITO")).toBeNull();
  });

  it("quick action Ligar desabilitado quando telefone é null", () => {
    renderDetalhe({ cliente: makeCliente({ telefone: null }) });
    const btn = screen.getByTestId("qa-ligar");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("quick action WhatsApp desabilitado quando telefone é null", () => {
    renderDetalhe({ cliente: makeCliente({ telefone: null }) });
    const btn = screen.getByTestId("qa-whatsapp");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("exibe vazio de histórico quando a API retorna lista vazia", async () => {
    setupFetch({ historico: [] });
    renderDetalhe();
    expect(await screen.findByTestId("historico-vazio")).toBeTruthy();
  });

  it("exibe lista de histórico quando a API retorna itens", async () => {
    setupFetch({ historico: [makeHistoricoItem()] });
    renderDetalhe();
    expect(await screen.findByTestId("historico-lista")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
  });

  it("botão Editar exibe TextInput de nota", () => {
    renderDetalhe();
    expect(screen.queryByTestId("input-nota")).toBeNull();
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    expect(screen.getByTestId("input-nota")).toBeTruthy();
  });

  it("nota pode ser editada no TextInput", () => {
    renderDetalhe();
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    fireEvent.changeText(
      screen.getByTestId("input-nota"),
      "Prefere degradê alto",
    );
    expect(screen.getByDisplayValue("Prefere degradê alto")).toBeTruthy();
  });

  it("Salvar fecha o input e persiste a nota via PUT /clientes/1/nota", async () => {
    renderDetalhe();
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    fireEvent.changeText(
      screen.getByTestId("input-nota"),
      "Prefere degradê alto",
    );
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    expect(screen.queryByTestId("input-nota")).toBeNull();

    await waitFor(() => {
      const put = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/clientes\/1\/nota$/.test(String(u)) &&
          (init as { method?: string })?.method === "PUT",
      );
      expect(put).toBeTruthy();
      const body = JSON.parse(String((put?.[1] as { body?: string }).body));
      expect(body.conteudo).toBe("Prefere degradê alto");
    });
  });

  it("botão voltar chama onClose", () => {
    const onClose = jest.fn();
    renderDetalhe({ onClose });
    fireEvent.press(screen.getByTestId("btn-voltar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ultimaVisita null exibe '—' nas stats", () => {
    renderDetalhe({ cliente: makeCliente({ ultimaVisita: null }) });
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("ticketMedio zero exibe '—'", () => {
    renderDetalhe({ cliente: makeCliente({ ticketMedio: 0 }) });
    expect(screen.getByText("—")).toBeTruthy();
  });
});
