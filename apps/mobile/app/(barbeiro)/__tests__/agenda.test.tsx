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

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import { useAgendaDia } from "@/src/shared/hooks/barbeiro/use-agenda-dia";
import { useUpdateStatus } from "@/src/shared/hooks/barbeiro/use-update-status";
import type { AgendamentoResponse } from "@toqe/shared";

import BarbeiroAgendaScreen from "../agenda";

const mockUseAgendaDia = useAgendaDia as jest.MockedFunction<
  typeof useAgendaDia
>;
const mockUseUpdateStatus = useUpdateStatus as jest.MockedFunction<
  typeof useUpdateStatus
>;

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
  });

  it("mostra loading state inicial", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ isLoading: true }));

    render(<BarbeiroAgendaScreen />);

    expect(screen.getByTestId("lista-agendamentos-loading")).toBeTruthy();
  });

  it("mostra estado vazio quando não há agendamentos no dia (hoje)", () => {
    mockUseAgendaDia.mockReturnValue(mockQueryResult({ data: [] }));

    render(<BarbeiroAgendaScreen />);

    expect(screen.getByText(/Sem agendamentos para hoje/i)).toBeTruthy();
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
    // Empty state textual muda para "este dia" (não "hoje")
    expect(screen.getByText(/Sem agendamentos para este dia/i)).toBeTruthy();
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
});
