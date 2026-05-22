jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
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

jest.mock("@/src/shared/hooks/barbeiro/use-agenda-dia", () => ({
  useAgendaDia: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-update-status", () => ({
  useUpdateStatus: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-agendamento-atual", () => ({
  useAgendamentoAtual: jest.fn().mockReturnValue({ data: null }),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-criar-bloqueio", () => ({
  useCriarBloqueio: jest.fn(),
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
    TenantSwitcherSheet: ({
      visible,
    }: {
      visible: boolean;
      onClose: () => void;
    }) => (visible ? <RN.View testID="tenant-switcher-sheet" /> : null),
  };
});

// Stubs leves para sheets testados em arquivo próprio
jest.mock("@/src/features/barbeiro/ActionMenuSheet", () => {
  const RN = jest.requireActual("react-native");
  return {
    ActionMenuSheet: ({
      visible,
      onWalkin,
      onBloqueio,
    }: {
      visible: boolean;
      onClose: () => void;
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
      onClose: () => void;
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
    BloqueioSheet: ({
      visible,
    }: {
      visible: boolean;
      onClose: () => void;
      onConfirm: (d: unknown) => void;
    }) => (visible ? <RN.View testID="bloqueio-sheet" /> : null),
  };
});

jest.mock("@/src/features/barbeiro/AdicionarWalkInModal", () => {
  const RN = jest.requireActual("react-native");
  return {
    AdicionarWalkInModal: ({
      visible,
    }: {
      visible: boolean;
      onClose: () => void;
    }) => (visible ? <RN.View testID="walkin-modal" /> : null),
  };
});

// FilaSection é testada em seu próprio spec; aqui é stub para isolar a Agenda.
jest.mock("@/src/features/barbeiro/FilaSection", () => ({
  FilaSection: () => null,
}));

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useCriarBloqueio } from "@/src/shared/hooks/barbeiro/use-criar-bloqueio";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

import BarbeiroAgendaScreen from "../agenda";

const mockUseAgendaDia = useAgendaDia as jest.MockedFunction<
  typeof useAgendaDia
>;
const mockUseUpdateStatus = useUpdateStatus as jest.MockedFunction<
  typeof useUpdateStatus
>;
const mockUseCriarBloqueio = useCriarBloqueio as jest.MockedFunction<
  typeof useCriarBloqueio
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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

function mockQueryResult(over: Partial<ReturnType<typeof useAgendaDia>> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: jest.fn(),
    ...over,
  } as unknown as ReturnType<typeof useAgendaDia>;
}

describe("BarbeiroAgendaScreen", () => {
  beforeEach(() => {
    mockUseAgendaDia.mockReset();
    mockUseUpdateStatus.mockReset();
    mockUseUpdateStatus.mockReturnValue({
      mutate: jest.fn(),
    } as unknown as ReturnType<typeof useUpdateStatus>);
    mockUseCriarBloqueio.mockReset();
    mockUseCriarBloqueio.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCriarBloqueio>);
    mockUseAuth.mockReturnValue({
      barbearia: { codigo: 1, nome: "Urban Barber", perfil: "barbeiro" },
      barbearias: [{ codigo: 1, nome: "Urban Barber", perfil: "barbeiro" }],
    } as unknown as ReturnType<typeof useAuth>);
    mockShowToast.mockClear();
  });

  it("mostra loading state inicial", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ isLoading: true }));

    render(<BarbeiroAgendaScreen />);

    expect(screen.getByTestId("lista-agendamentos-loading")).toBeTruthy();
  });

  it("mostra estado vazio quando não há agendamentos no dia (hoje)", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);

    expect(screen.getByText("Dia livre")).toBeTruthy();
  });

  it("mostra erro quando isError=true", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ isError: true }));

    render(<BarbeiroAgendaScreen />);

    expect(
      screen.getByText(/Não foi possível carregar a agenda/i),
    ).toBeTruthy();
  });

  it("renderiza lista de agendamentos quando há dados", () => {
    mockUseAgendaDia.mockReturnValue(
      mockQueryResult({
        data: [
          makeAgendamento({ codigo: 1 }),
          makeAgendamento({
            codigo: 2,
            cliente: { usrCodigo: 7, nome: "Ana", telefone: null },
          }),
        ],
      }),
    );

    render(<BarbeiroAgendaScreen />);

    expect(screen.getByTestId("lista-agendamentos")).toBeTruthy();
    expect(screen.getByText("Carlos")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("muda a data ao tocar em 'Próximo dia'", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);
    act(() => {
      fireEvent.press(screen.getByLabelText("Próximo dia"));
    });

    // Após avançar, o hook recebe uma data != hoje
    const lastCallArg = mockUseAgendaDia.mock.calls.at(-1)?.[0] as Date;
    const amanha = addDays(new Date(), 1);
    expect(format(lastCallArg, "yyyy-MM-dd")).toBe(
      format(amanha, "yyyy-MM-dd"),
    );
    // Empty state muda para o dia não-hoje
    expect(screen.getByText(/Nada marcado para este dia/i)).toBeTruthy();
  });

  it("muda a data ao tocar em 'Dia anterior'", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);
    act(() => {
      fireEvent.press(screen.getByLabelText("Dia anterior"));
    });

    const lastCallArg = mockUseAgendaDia.mock.calls.at(-1)?.[0] as Date;
    const ontem = subDays(new Date(), 1);
    expect(format(lastCallArg, "yyyy-MM-dd")).toBe(format(ontem, "yyyy-MM-dd"));
  });

  it("'Ir para hoje' volta para data atual", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);
    // Avança 2 dias
    act(() => {
      fireEvent.press(screen.getByLabelText("Próximo dia"));
      fireEvent.press(screen.getByLabelText("Próximo dia"));
    });
    // Volta para hoje
    act(() => {
      fireEvent.press(screen.getByLabelText("Ir para hoje"));
    });

    const lastCallArg = mockUseAgendaDia.mock.calls.at(-1)?.[0] as Date;
    expect(format(lastCallArg, "yyyy-MM-dd")).toBe(
      format(new Date(), "yyyy-MM-dd"),
    );
    // Texto "Hoje" + dia formatado deve aparecer no label central
    expect(screen.getByText(/Hoje/)).toBeTruthy();
  });

  it("label central exibe a data formatada em pt-BR", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);
    const hojeShort = format(new Date(), "EEE, dd 'de' MMM", { locale: ptBR });
    expect(screen.getByText(new RegExp(hojeShort))).toBeTruthy();
  });

  it("exibe título 'Sua agenda' e pill da barbearia ativa (mesmo com 1 vínculo)", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    expect(screen.getByText("Sua agenda")).toBeTruthy();
    expect(screen.getByTestId("btn-tenant-switcher")).toBeTruthy();
    expect(screen.getByText("Urban Barber")).toBeTruthy();
  });

  it("sino dispara toast 'Notificações em breve'", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    fireEvent.press(screen.getByTestId("btn-notificacoes"));
    expect(mockShowToast).toHaveBeenCalledWith("Notificações em breve", "info");
  });

  it("FAB está presente na tela", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    expect(screen.getByTestId("fab-adicionar")).toBeTruthy();
  });

  it("FAB abre ActionMenuSheet ao pressionar", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    expect(screen.queryByTestId("action-menu-sheet")).toBeNull();
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    expect(screen.getByTestId("action-menu-sheet")).toBeTruthy();
  });

  it("action menu → walk-in abre AdicionarWalkInModal", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    fireEvent.press(screen.getByTestId("menu-walkin-btn"));
    expect(screen.getByTestId("walkin-modal")).toBeTruthy();
  });

  it("action menu → bloqueio abre BloqueioSheet", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    fireEvent.press(screen.getByTestId("fab-adicionar"));
    fireEvent.press(screen.getByTestId("menu-bloqueio-btn"));
    expect(screen.getByTestId("bloqueio-sheet")).toBeTruthy();
  });

  it("tap em agendamento abre AppointmentDetailSheet", () => {
    mockUseAgendaDia.mockReturnValue(
      mockQueryResult({
        data: [
          makeAgendamento({
            codigo: 5,
            cliente: { usrCodigo: 42, nome: "Pedro", telefone: null },
          }),
        ],
      }),
    );
    render(<BarbeiroAgendaScreen />);
    expect(screen.queryByTestId("detail-sheet")).toBeNull();
    fireEvent.press(screen.getByTestId("agenda-row-5"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
    // "Pedro" aparece tanto na row quanto no sheet stub — verifica via getAllByText
    expect(screen.getAllByText("Pedro").length).toBeGreaterThan(0);
  });

  it("stats strip exibe contadores quando há agendamentos", () => {
    mockUseAgendaDia.mockReturnValue(
      mockQueryResult({
        data: [
          makeAgendamento({ codigo: 1, status: "concluido" }),
          makeAgendamento({ codigo: 2, status: "pendente" }),
        ],
      }),
    );
    render(<BarbeiroAgendaScreen />);
    expect(screen.getByTestId("stats-strip")).toBeTruthy();
    // Pelo menos um dos contadores "1" deve estar presente
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("stats strip não aparece quando lista vazia", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));
    render(<BarbeiroAgendaScreen />);
    expect(screen.queryByTestId("stats-strip")).toBeNull();
  });

  it("ação aceitar no detail sheet chama updateStatus com 'confirmado'", () => {
    const mutateFn = jest.fn();
    mockUseUpdateStatus.mockReturnValue({
      mutate: mutateFn,
    } as unknown as ReturnType<typeof useUpdateStatus>);
    mockUseAgendaDia.mockReturnValue(
      mockQueryResult({
        data: [
          makeAgendamento({
            codigo: 8,
            status: "pendente",
            cliente: { usrCodigo: 42, nome: "Lucas", telefone: null },
          }),
        ],
      }),
    );
    render(<BarbeiroAgendaScreen />);
    fireEvent.press(screen.getByTestId("agenda-row-8"));
    fireEvent.press(screen.getByTestId("action-aceitar-btn"));
    expect(mutateFn).toHaveBeenCalledWith(
      { codigo: 8, status: "confirmado" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it("ação iniciar no detail sheet chama updateStatus com 'em_andamento'", () => {
    const mutateFn = jest.fn();
    mockUseUpdateStatus.mockReturnValue({
      mutate: mutateFn,
    } as unknown as ReturnType<typeof useUpdateStatus>);
    mockUseAgendaDia.mockReturnValue(
      mockQueryResult({
        data: [
          makeAgendamento({
            codigo: 9,
            status: "confirmado",
            cliente: { usrCodigo: 42, nome: "Bia", telefone: null },
          }),
        ],
      }),
    );
    render(<BarbeiroAgendaScreen />);
    fireEvent.press(screen.getByTestId("agenda-row-9"));
    fireEvent.press(screen.getByTestId("action-iniciar-btn"));
    expect(mutateFn).toHaveBeenCalledWith(
      { codigo: 9, status: "em_andamento" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });
});
