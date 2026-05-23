// FilaSection — exercita os hooks reais useFilaDia + useUpdateStatus +
// api-client real. Só o boundary HTTP (global.fetch) e a sessão (useAuth) são
// mockados. FilaCard tem timers internos (recalc de espera) → stub leve.

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
  useAuth: () => ({ barbearia: { codigo: 1 }, user: { codigo: 99 } }),
}));

const mockShowToast = jest.fn();
jest.mock("@/src/shared/hooks/use-toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("@/src/features/barbeiro/FilaCard", () => {
  const RN = jest.requireActual("react-native");
  return {
    FilaCard: ({
      agendamento,
      onAtender,
      testID,
    }: {
      agendamento: { codigo: number; cliente: { nome: string } };
      onAtender?: (codigo: number) => void;
      testID?: string;
    }) => (
      <RN.Pressable
        testID={testID ?? "fila-card"}
        onPress={() => onAtender?.(agendamento.codigo)}
      >
        <RN.Text>{agendamento.cliente.nome}</RN.Text>
      </RN.Pressable>
    ),
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import { FilaSection } from "../FilaSection";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agendamentos",
    json: async () => body,
  };
}

function setupFetch(fila: AgendamentoResponse[]) {
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const m = (init?.method ?? "GET").toUpperCase();
    if (m === "PATCH" && /\/agendamentos\/\d+\/status/.test(u)) {
      return makeRes({});
    }
    if (u.includes("tipo=WALK_IN")) return makeRes(fila);
    return makeRes([]);
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderFila() {
  return render(<FilaSection />, { wrapper });
}

function makeAg(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T13:00:00.000Z",
    fim: "2026-05-15T13:30:00.000Z",
    status: "pendente",
    barbeiro: { usrCodigo: 99, nome: "Carlos", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "João", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-15T12:50:00.000Z",
    ...over,
  };
}

describe("FilaSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("não renderiza nada quando a fila está vazia", async () => {
    setupFetch([]);
    renderFila();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByTestId("fila-section")).toBeNull();
  });

  it("colapsado: mostra prévia do primeiro e esconde a lista detalhada", async () => {
    setupFetch([
      makeAg({
        codigo: 1,
        cliente: { usrCodigo: 1, nome: "João", telefone: null },
      }),
      makeAg({
        codigo: 2,
        cliente: { usrCodigo: 2, nome: "Maria", telefone: null },
      }),
    ]);
    renderFila();
    await screen.findByTestId("fila-section");
    expect(screen.queryByTestId("fila-expanded")).toBeNull();
    expect(screen.queryByTestId("fila-card-2")).toBeNull();
    expect(screen.getByText(/João/)).toBeTruthy();
  });

  it("expande ao tocar no banner e revela os cards da fila", async () => {
    setupFetch([
      makeAg({
        codigo: 1,
        cliente: { usrCodigo: 1, nome: "João", telefone: null },
      }),
      makeAg({
        codigo: 2,
        cliente: { usrCodigo: 2, nome: "Maria", telefone: null },
      }),
    ]);
    renderFila();
    fireEvent.press(await screen.findByTestId("fila-banner-toggle"));
    expect(screen.getByTestId("fila-expanded")).toBeTruthy();
    expect(screen.getByTestId("fila-card-1")).toBeTruthy();
    expect(screen.getByTestId("fila-card-2")).toBeTruthy();
    expect(screen.getByText("Maria")).toBeTruthy();
  });

  it("o cabeçalho conta quem aguarda (pendente + confirmado)", async () => {
    setupFetch([
      makeAg({ codigo: 1, status: "pendente" }),
      makeAg({ codigo: 2, status: "confirmado" }),
    ]);
    renderFila();
    expect(await screen.findByText(/FILA · esperando \(2\)/)).toBeTruthy();
  });

  it("remove da fila quem já está em atendimento (em_andamento)", async () => {
    setupFetch([
      makeAg({
        codigo: 1,
        status: "pendente",
        cliente: { usrCodigo: 1, nome: "João", telefone: null },
      }),
      makeAg({
        codigo: 2,
        status: "em_andamento",
        cliente: { usrCodigo: 2, nome: "Maria", telefone: null },
      }),
    ]);
    renderFila();
    // Só 1 aguardando — o em_andamento não conta nem aparece ao expandir.
    expect(await screen.findByText(/FILA · esperando \(1\)/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("fila-banner-toggle"));
    expect(screen.getByTestId("fila-card-1")).toBeTruthy();
    expect(screen.queryByTestId("fila-card-2")).toBeNull();
  });

  it("atalho Atender faz PATCH /agendamentos/7/status com em_andamento", async () => {
    setupFetch([makeAg({ codigo: 7 })]);
    renderFila();
    fireEvent.press(await screen.findByTestId("btn-atender-7"));

    await waitFor(() => {
      const patch = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/agendamentos\/7\/status/.test(String(u)) &&
          (init as { method?: string })?.method === "PATCH",
      );
      expect(patch).toBeTruthy();
      expect(String((patch?.[1] as { body?: string }).body)).toContain(
        "em_andamento",
      );
    });
  });

  it("exibe toast com a mensagem do backend quando o PATCH retorna 403", async () => {
    const msg403 =
      "Você não realiza este serviço. Outro barbeiro deve atender.";
    // GET da fila → 1 encaixe; PATCH /status → 403 com a mensagem do backend.
    global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
      const u = String(url);
      const m = (init?.method ?? "GET").toUpperCase();
      if (m === "PATCH" && /\/agendamentos\/\d+\/status/.test(u)) {
        return makeRes({ statusCode: 403, message: msg403 }, 403);
      }
      if (u.includes("tipo=WALK_IN")) return makeRes([makeAg({ codigo: 7 })]);
      return makeRes([]);
    }) as unknown as typeof fetch;

    renderFila();
    fireEvent.press(await screen.findByTestId("btn-atender-7"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(msg403, "error");
    });
  });
});
