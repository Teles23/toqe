// Agenda do barbeiro — testa o CÓDIGO REAL: hooks de dados reais
// (useAgendaDia / useUpdateStatus) + api-client real. Só o boundary HTTP
// (global.fetch) e a sessão (useAuth) são mockados. Sheets/modais e a
// FilaSection são stubados aqui porque têm specs próprios — o foco deste
// arquivo é a orquestração da tela + integração com a API.

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
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

const mockShowToast = jest.fn();
jest.mock("@/src/shared/hooks/use-toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("@/src/shared/ui", () => {
  const real = jest.requireActual("@/src/shared/ui");
  const RN = jest.requireActual("react-native");
  return {
    ...real,
    TenantSwitcherSheet: ({ visible }: { visible: boolean }) =>
      visible ? <RN.View testID="tenant-switcher-sheet" /> : null,
  };
});

// Stubs leves para sheets testados em arquivo próprio.
jest.mock("@/src/features/barbeiro/ActionMenuSheet", () => {
  const RN = jest.requireActual("react-native");
  return {
    ActionMenuSheet: ({
      visible,
      onWalkin,
      onBloqueio,
    }: {
      visible: boolean;
      onWalkin: () => void;
      onBloqueio: () => void;
    }) =>
      visible ? (
        <RN.View testID="action-menu-sheet">
          <RN.Text testID="menu-walkin-btn" onPress={onWalkin}>
            walk-in
          </RN.Text>
          <RN.Text testID="menu-bloqueio-btn" onPress={onBloqueio}>
            bloqueio
          </RN.Text>
        </RN.View>
      ) : null,
  };
});

jest.mock("@/src/features/barbeiro/AppointmentDetailSheet", () => {
  const RN = jest.requireActual("react-native");
  return {
    AppointmentDetailSheet: ({
      visible,
      agendamento,
      onAction,
    }: {
      visible: boolean;
      agendamento: { codigo: number; cliente: { nome: string } } | null;
      onAction: (a: string) => void;
    }) =>
      visible && agendamento ? (
        <RN.View testID="detail-sheet">
          <RN.Text>{agendamento.cliente.nome}</RN.Text>
          <RN.Text
            testID="action-aceitar-btn"
            onPress={() => onAction("aceitar")}
          >
            aceitar
          </RN.Text>
          <RN.Text
            testID="action-iniciar-btn"
            onPress={() => onAction("iniciar")}
          >
            iniciar
          </RN.Text>
        </RN.View>
      ) : null,
  };
});

jest.mock("@/src/features/barbeiro/BloqueioSheet", () => {
  const RN = jest.requireActual("react-native");
  return {
    BloqueioSheet: ({ visible }: { visible: boolean }) =>
      visible ? <RN.View testID="bloqueio-sheet" /> : null,
  };
});

jest.mock("@/src/features/barbeiro/AdicionarWalkInModal", () => {
  const RN = jest.requireActual("react-native");
  return {
    AdicionarWalkInModal: ({ visible }: { visible: boolean }) =>
      visible ? <RN.View testID="walkin-modal" /> : null,
  };
});

// FilaSection é testada em seu próprio spec; aqui é stub para isolar a Agenda.
jest.mock("@/src/features/barbeiro/FilaSection", () => ({
  FilaSection: () => null,
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

import BarbeiroAgendaScreen from "../agenda";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// ─── Boundary HTTP (mock só do fetch; api-client e hooks são reais) ──────────

const originalFetch = global.fetch;

interface FakeRes {
  ok: boolean;
  status: number;
  url: string;
  json: () => Promise<unknown>;
}
function makeRes(body: unknown, status = 200): FakeRes {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1",
    json: async () => body,
  };
}

/** Roteia por URL/método. `dia` alimenta GET /agendamentos?... */
function setupFetch(opts: { dia?: AgendamentoResponse[]; diaStatus?: number }) {
  const { dia = [], diaStatus = 200 } = opts;
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "PATCH" && /\/agendamentos\/\d+\/status/.test(u)) {
      return makeRes({});
    }
    if (u.includes("/agendamentos/atual")) return makeRes(null);
    if (u.includes("/agendamentos?")) return makeRes(dia, diaStatus);
    return makeRes([]);
  }) as unknown as typeof fetch;
}

function fetchUrls(): string[] {
  return (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<BarbeiroAgendaScreen />, { wrapper });
}

function makeAgendamento(
  overrides: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T13:00:00.000Z",
    fim: "2026-05-15T13:45:00.000Z",
    status: "confirmado",
    barbeiro: { usrCodigo: 99, nome: "Bob", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "Carlos", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-14T20:00:00.000Z",
    ...overrides,
  };
}

describe("BarbeiroAgendaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 1, nome: "Urban Barber", perfil: "barbeiro" },
      barbearias: [{ codigo: 1, nome: "Urban Barber", perfil: "barbeiro" }],
      user: { codigo: 42, nome: "Bob", linkPublico: null },
    } as unknown as ReturnType<typeof useAuth>);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("mostra loading enquanto a agenda do dia carrega", () => {
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
    renderScreen();
    expect(screen.getByTestId("lista-agendamentos-loading")).toBeTruthy();
  });

  it("mostra estado vazio quando a API não retorna agendamentos (hoje)", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    expect(await screen.findByText("Dia livre")).toBeTruthy();
  });

  it("mostra erro quando a API responde 500", async () => {
    setupFetch({ dia: [], diaStatus: 500 });
    renderScreen();
    expect(
      await screen.findByText(/Não foi possível carregar a agenda/i),
    ).toBeTruthy();
  });

  it("renderiza a lista vinda da API", async () => {
    setupFetch({
      dia: [
        makeAgendamento({ codigo: 1 }),
        makeAgendamento({
          codigo: 2,
          cliente: { usrCodigo: 7, nome: "Ana", telefone: null },
        }),
      ],
    });
    renderScreen();
    expect(await screen.findByText("Carlos")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByTestId("lista-agendamentos")).toBeTruthy();
  });

  it("ao tocar em 'Próximo dia' busca a agenda do dia seguinte", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");

    act(() => {
      fireEvent.press(screen.getByLabelText("Próximo dia"));
    });

    const amanha = format(addDays(new Date(), 1), "yyyy-MM-dd");
    await waitFor(() =>
      expect(fetchUrls().some((u) => u.includes(`data=${amanha}`))).toBe(true),
    );
    expect(await screen.findByText(/Nada marcado para este dia/i)).toBeTruthy();
  });

  it("ao tocar em 'Dia anterior' busca a agenda do dia anterior", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");

    act(() => {
      fireEvent.press(screen.getByLabelText("Dia anterior"));
    });

    const ontem = format(subDays(new Date(), 1), "yyyy-MM-dd");
    await waitFor(() =>
      expect(fetchUrls().some((u) => u.includes(`data=${ontem}`))).toBe(true),
    );
  });

  it("'Ir para hoje' volta a buscar a data atual", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");

    act(() => {
      fireEvent.press(screen.getByLabelText("Próximo dia"));
      fireEvent.press(screen.getByLabelText("Próximo dia"));
    });
    act(() => {
      fireEvent.press(screen.getByLabelText("Ir para hoje"));
    });

    const hoje = format(new Date(), "yyyy-MM-dd");
    await waitFor(() =>
      expect(fetchUrls().some((u) => u.includes(`data=${hoje}`))).toBe(true),
    );
    expect(screen.getByText(/Hoje/)).toBeTruthy();
  });

  it("label central exibe a data formatada em pt-BR", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    const hojeShort = format(new Date(), "EEE, dd 'de' MMM", { locale: ptBR });
    expect(screen.getByText(new RegExp(hojeShort))).toBeTruthy();
  });

  it("exibe título 'Sua agenda' e pill da barbearia ativa", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    expect(screen.getByText("Sua agenda")).toBeTruthy();
    expect(screen.getByTestId("btn-tenant-switcher")).toBeTruthy();
    expect(screen.getByText("Urban Barber")).toBeTruthy();
  });

  it("sino dispara toast 'Notificações em breve'", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    fireEvent.press(screen.getByTestId("btn-notificacoes"));
    expect(mockShowToast).toHaveBeenCalledWith("Notificações em breve", "info");
  });

  it("FAB abre o ActionMenuSheet", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    expect(screen.queryByTestId("action-menu-sheet")).toBeNull();
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    expect(screen.getByTestId("action-menu-sheet")).toBeTruthy();
  });

  it("action menu → walk-in abre AdicionarWalkInModal", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    fireEvent.press(screen.getByTestId("menu-walkin-btn"));
    expect(screen.getByTestId("walkin-modal")).toBeTruthy();
  });

  it("action menu → bloqueio abre BloqueioSheet", async () => {
    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    fireEvent.press(screen.getByTestId("menu-bloqueio-btn"));
    expect(screen.getByTestId("bloqueio-sheet")).toBeTruthy();
  });

  it("tap em agendamento abre AppointmentDetailSheet", async () => {
    setupFetch({
      dia: [
        makeAgendamento({
          codigo: 5,
          cliente: { usrCodigo: 42, nome: "Pedro", telefone: null },
        }),
      ],
    });
    renderScreen();
    fireEvent.press(await screen.findByTestId("agenda-row-5"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
    expect(screen.getAllByText("Pedro").length).toBeGreaterThan(0);
  });

  it("stats strip aparece com dados e some quando vazio", async () => {
    setupFetch({
      dia: [
        makeAgendamento({ codigo: 1, status: "concluido" }),
        makeAgendamento({ codigo: 2, status: "pendente" }),
      ],
    });
    const { unmount } = renderScreen();
    expect(await screen.findByTestId("stats-strip")).toBeTruthy();
    unmount();

    setupFetch({ dia: [] });
    renderScreen();
    await screen.findByText("Dia livre");
    expect(screen.queryByTestId("stats-strip")).toBeNull();
  });

  it("ação 'aceitar' faz PATCH status=confirmado e dispara toast", async () => {
    setupFetch({
      dia: [
        makeAgendamento({
          codigo: 8,
          status: "pendente",
          cliente: { usrCodigo: 42, nome: "Lucas", telefone: null },
        }),
      ],
    });
    renderScreen();
    fireEvent.press(await screen.findByTestId("agenda-row-8"));
    fireEvent.press(screen.getByTestId("action-aceitar-btn"));

    expect(mockShowToast).toHaveBeenCalledWith(
      "Aceito · cliente avisado",
      "success",
    );
    await waitFor(() => {
      const patch = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/agendamentos\/8\/status/.test(String(u)) &&
          (init as { method?: string })?.method === "PATCH",
      );
      expect(patch).toBeTruthy();
      expect(String((patch?.[1] as { body?: string }).body)).toContain(
        "confirmado",
      );
    });
  });

  it("ação 'iniciar' faz PATCH status=em_andamento e dispara toast", async () => {
    setupFetch({
      dia: [
        makeAgendamento({
          codigo: 9,
          status: "confirmado",
          cliente: { usrCodigo: 42, nome: "Bia", telefone: null },
        }),
      ],
    });
    renderScreen();
    fireEvent.press(await screen.findByTestId("agenda-row-9"));
    fireEvent.press(screen.getByTestId("action-iniciar-btn"));

    expect(mockShowToast).toHaveBeenCalledWith(
      "Atendimento iniciado",
      "success",
    );
    await waitFor(() => {
      const patch = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/agendamentos\/9\/status/.test(String(u)) &&
          (init as { method?: string })?.method === "PATCH",
      );
      expect(patch).toBeTruthy();
      expect(String((patch?.[1] as { body?: string }).body)).toContain(
        "em_andamento",
      );
    });
  });
});
