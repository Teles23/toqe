// Home do cliente — exercita os hooks reais (useProximoAgendamento /
// useProximosSlots / useAgendamentosMeus) + api-client real. Só o boundary
// HTTP (global.fetch) e a sessão (useAuth) são mockados.

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
  router: { replace: jest.fn(), push: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import ClienteHomeScreen from "../home";

// ─── Boundary HTTP ───────────────────────────────────────────────────────────

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1",
    json: async () => body,
  };
}

function setupFetch(opts: {
  proximo?: unknown;
  slots?: unknown;
  slotsStatus?: number;
  meus?: unknown[];
}) {
  const { proximo = null, slots = null, slotsStatus = 200, meus = [] } = opts;
  global.fetch = jest.fn(async (url: unknown) => {
    const u = String(url);
    if (u.includes("/agendamentos/proximo")) return makeRes(proximo);
    if (u.includes("/agenda/proximos")) return makeRes(slots, slotsStatus);
    if (u.includes("/agendamentos/meus")) return makeRes(meus);
    return makeRes([]);
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<ClienteHomeScreen />, { wrapper });
}

function authWithBarbearia(nome = "Urban Flow") {
  return {
    user: { codigo: 1, nome: "Carlos Silva", email: "c@x.com" },
    barbearia: { codigo: 1, nome, perfil: "cliente" },
    barbearias: [{ codigo: 1, nome, perfil: "cliente" }],
  };
}
function authWithoutBarbearia() {
  return {
    user: { codigo: 1, nome: "Carlos Silva", email: "c@x.com" },
    barbearia: null,
    barbearias: [],
  };
}

const slotsMock = {
  barbeiroNome: "João",
  barbeiroInicial: "J",
  servicoNome: "Corte",
  servicoDuracao: 30,
  servicoPreco: 4000,
  slots: [
    { inicio: "2026-05-22T14:30:00Z", hora: "14:30", dia: "Hoje" },
    { inicio: "2026-05-22T15:00:00Z", hora: "15:00", dia: "Hoje" },
  ],
};

describe("ClienteHomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReset();
    setupFetch({}); // default: tudo vazio/null
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('1. renderiza "Início" no header quando barbearia está configurada', async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    renderScreen();
    await screen.findByTestId("quick-book-empty"); // aguarda hooks resolverem
    expect(screen.getByText("Início")).toBeTruthy();
  });

  it("2. mostra nome da barbearia no header pill", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia("Urban Flow"));
    renderScreen();
    await screen.findByTestId("quick-book-empty");
    expect(screen.getByText("Urban Flow")).toBeTruthy();
  });

  it("3. mostra home-sem-barbearia quando sem barbearia", () => {
    mockUseAuth.mockReturnValue(authWithoutBarbearia());
    renderScreen();
    expect(screen.getByTestId("home-sem-barbearia")).toBeTruthy();
    expect(
      screen.getByText(/Encontre e agende em barbearias perto de você/),
    ).toBeTruthy();
  });

  it("4. mostra quick-book-empty quando a API retorna slots vazios", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ slots: { ...slotsMock, slots: [] } });
    renderScreen();
    expect(await screen.findByTestId("quick-book-empty")).toBeTruthy();
  });

  it("5. mostra quick-book-empty quando a API retorna null", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ slots: null });
    renderScreen();
    expect(await screen.findByTestId("quick-book-empty")).toBeTruthy();
  });

  it("6. mostra botão Ver horários quando há slots disponíveis", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ slots: slotsMock });
    renderScreen();
    expect(
      await screen.findByTestId("quick-book-btn-ver-horarios"),
    ).toBeTruthy();
  });

  it("7. pressionar Ver horários mostra os slots disponíveis", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ slots: slotsMock });
    renderScreen();
    fireEvent.press(await screen.findByTestId("quick-book-btn-ver-horarios"));
    expect(screen.getByTestId("slot-14-30")).toBeTruthy();
    expect(screen.getByTestId("slot-15-00")).toBeTruthy();
  });

  it("8. mostra quick-book-confirmed após confirmar (fluxo client-side)", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ slots: slotsMock });
    renderScreen();
    fireEvent.press(await screen.findByTestId("quick-book-btn-ver-horarios"));
    fireEvent.press(screen.getByTestId("quick-book-btn-confirmar"));
    // handleConfirm aguarda ~1s antes de marcar como confirmado.
    expect(
      await screen.findByTestId("quick-book-confirmed", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
  });

  it("9. mostra next-apt-card quando há próximo agendamento", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({
      slots: slotsMock,
      proximo: {
        codigo: 1,
        inicio: "2026-05-22T14:30:00Z",
        status: "confirmado",
        itens: [{ servico: { nome: "Corte" } }],
        barbeiro: { nome: "João" },
      },
    });
    renderScreen();
    expect(await screen.findByTestId("next-apt-card")).toBeTruthy();
  });

  it("10. não mostra next-apt-card quando não há próximo agendamento", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    setupFetch({ proximo: null, slots: slotsMock });
    renderScreen();
    await screen.findByTestId("quick-book-btn-ver-horarios"); // settle
    expect(screen.queryByTestId("next-apt-card")).toBeNull();
  });
});
