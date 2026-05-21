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
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock("@/src/shared/hooks/cliente/use-proximo-agendamento", () => ({
  useProximoAgendamento: jest.fn(),
}));

jest.mock("@/src/shared/hooks/cliente/use-proximos-slots", () => ({
  useProximosSlots: jest.fn(),
}));

jest.mock("@/src/shared/hooks/cliente/use-agendamentos-meus", () => ({
  useAgendamentosMeus: jest.fn(),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useProximoAgendamento } from "@/src/shared/hooks/cliente/use-proximo-agendamento";
import { useProximosSlots } from "@/src/shared/hooks/cliente/use-proximos-slots";
import ClienteHomeScreen from "../home";

const mockUseProximoAgendamento = useProximoAgendamento as jest.Mock;
const mockUseProximosSlots = useProximosSlots as jest.Mock;
const mockUseAgendamentosMeus = useAgendamentosMeus as jest.Mock;

function authWithBarbearia(nome = "Urban Flow") {
  return {
    user: {
      codigo: 1,
      nome: "Carlos Silva",
      email: "c@x.com",
      telefone: null,
      avatarUrl: null,
    },
    barbearia: { codigo: 1, nome, perfil: "cliente" },
    barbearias: [{ codigo: 1, nome, perfil: "cliente" }],
  };
}

function authWithoutBarbearia() {
  return {
    user: {
      codigo: 1,
      nome: "Carlos Silva",
      email: "c@x.com",
      telefone: null,
      avatarUrl: null,
    },
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
    jest.useFakeTimers();
    mockUseAuth.mockReset();
    mockUseProximoAgendamento.mockReturnValue({ data: null });
    mockUseProximosSlots.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    mockUseAgendamentosMeus.mockReturnValue({ data: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('1. renderiza "Início" no header quando barbearia está configurada', () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    render(<ClienteHomeScreen />);
    expect(screen.getByText("Início")).toBeTruthy();
  });

  it("2. mostra nome da barbearia no header pill", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia("Urban Flow"));
    render(<ClienteHomeScreen />);
    expect(screen.getByText("Urban Flow")).toBeTruthy();
  });

  it("3. mostra home-sem-barbearia quando sem barbearia", () => {
    mockUseAuth.mockReturnValue(authWithoutBarbearia());
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("home-sem-barbearia")).toBeTruthy();
    expect(
      screen.getByText(/Encontre e agende em barbearias perto de você/),
    ).toBeTruthy();
  });

  it("4. mostra quick-book-empty quando slots retorna array vazio", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximosSlots.mockReturnValue({
      data: { ...slotsMock, slots: [] },
      isLoading: false,
      isError: false,
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("quick-book-empty")).toBeTruthy();
  });

  it("5. mostra quick-book-empty quando slots hook retorna data null", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximosSlots.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("quick-book-empty")).toBeTruthy();
  });

  it("6. mostra quick-book-btn-ver-horarios quando há slots disponíveis", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximosSlots.mockReturnValue({
      data: slotsMock,
      isLoading: false,
      isError: false,
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("quick-book-btn-ver-horarios")).toBeTruthy();
  });

  it("7. pressionar Ver horários mostra os slots disponíveis", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximosSlots.mockReturnValue({
      data: slotsMock,
      isLoading: false,
      isError: false,
    });
    render(<ClienteHomeScreen />);
    fireEvent.press(screen.getByTestId("quick-book-btn-ver-horarios"));
    expect(screen.getByTestId("slot-14-30")).toBeTruthy();
    expect(screen.getByTestId("slot-15-00")).toBeTruthy();
  });

  it("8. mostra quick-book-confirmed após pressionar confirmar", async () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximosSlots.mockReturnValue({
      data: slotsMock,
      isLoading: false,
      isError: false,
    });
    render(<ClienteHomeScreen />);

    // Navigate to loaded view
    fireEvent.press(screen.getByTestId("quick-book-btn-ver-horarios"));

    // Press confirm
    fireEvent.press(screen.getByTestId("quick-book-btn-confirmar"));

    // Advance timers to complete the mock setTimeout (1000ms)
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId("quick-book-confirmed")).toBeTruthy();
  });

  it("9. mostra next-apt-card quando há próximo agendamento", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximoAgendamento.mockReturnValue({
      data: {
        codigo: 1,
        inicio: "2026-05-22T14:30:00Z",
        status: "confirmado",
        itens: [{ servico: { nome: "Corte" } }],
        barbeiro: { nome: "João" },
      },
    });
    render(<ClienteHomeScreen />);
    expect(screen.getByTestId("next-apt-card")).toBeTruthy();
  });

  it("10. não mostra next-apt-card quando não há próximo agendamento", () => {
    mockUseAuth.mockReturnValue(authWithBarbearia());
    mockUseProximoAgendamento.mockReturnValue({ data: null });
    render(<ClienteHomeScreen />);
    expect(screen.queryByTestId("next-apt-card")).toBeNull();
  });
});
