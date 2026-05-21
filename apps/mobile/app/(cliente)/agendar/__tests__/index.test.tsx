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

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: mockPush, back: mockBack, replace: jest.fn() },
  useLocalSearchParams: () => ({ slug: "urban-flow" }),
}));

jest.mock("@/src/shared/api/api-client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  tenantApi: jest.fn(),
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { codigo: 1 },
    barbearia: { codigo: 1 },
    barbearias: [],
    switchBarbearia: jest.fn(),
    logout: jest.fn(),
  }),
}));

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";
import AgendarScreen from "../index";

const mockApiGet = api.get as jest.Mock;
const mockApiPost = api.post as jest.Mock;

const SERVICOS = [
  { codigo: 1, nome: "Corte Degradê", duracao: 30, preco: 40 },
  { codigo: 2, nome: "Barba", duracao: 20, preco: 25 },
];

const BARBEIROS = [
  { usrCodigo: 10, nome: "Lucas Barbeiro", avatarUrl: null },
  { usrCodigo: 11, nome: "Pedro Barbeiro", avatarUrl: null },
];

const SLOTS = [
  { inicio: "2026-05-22T09:00:00.000Z", hora: "09:00" },
  { inicio: "2026-05-22T09:30:00.000Z", hora: "09:30" },
];

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderScreen() {
  const qc = makeClient();
  return render(
    <QueryClientProvider client={qc}>
      <AgendarScreen />
    </QueryClientProvider>,
  );
}

describe("AgendarScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockImplementation((path: string) => {
      if (path.includes("/servicos"))
        return Promise.resolve({ items: SERVICOS });
      if (path.includes("/barbeiros"))
        return Promise.resolve({ items: BARBEIROS });
      if (path.includes("/slots")) return Promise.resolve({ slots: SLOTS });
      return Promise.reject(new Error("Unknown path"));
    });
    mockApiPost.mockResolvedValue({ codigo: 99 });
  });

  it("1. mostra step-servico (step 0) no mount", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("step-servico")).toBeTruthy();
    });
  });

  it("2. mostra a barra de progresso", () => {
    renderScreen();
    expect(screen.getByTestId("progress-bar")).toBeTruthy();
  });

  it("3. botão Continuar está desabilitado quando nenhum serviço selecionado", async () => {
    renderScreen();
    await waitFor(() => screen.getByTestId("step-servico"));
    const btn = screen.getByTestId("agendar-btn-continuar");
    // disabled prop via accessibilityState
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("4. selecionar serviço habilita o botão Continuar", async () => {
    renderScreen();
    await waitFor(() => screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("servico-1"));
    await waitFor(() => {
      const btn = screen.getByTestId("agendar-btn-continuar");
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });
  });

  it("5. pressionar Continuar avança para step-barbeiro (step 1)", async () => {
    renderScreen();
    await waitFor(() => screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));
    await waitFor(() => {
      expect(screen.getByTestId("step-barbeiro")).toBeTruthy();
    });
  });

  it("6. botão voltar no step 1 retorna ao step 0", async () => {
    renderScreen();
    await waitFor(() => screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));
    await waitFor(() => screen.getByTestId("step-barbeiro"));
    fireEvent.press(screen.getByTestId("agendar-btn-voltar"));
    await waitFor(() => {
      expect(screen.getByTestId("step-servico")).toBeTruthy();
    });
  });

  it("7. confirmar no step 3 exibe agendar-confirmado após POST com sucesso", async () => {
    renderScreen();
    // step 0 — selecionar serviço
    await waitFor(() => screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("servico-1"));
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));

    // step 1 — selecionar barbeiro
    await waitFor(() => screen.getByTestId("barbeiro-10"));
    fireEvent.press(screen.getByTestId("barbeiro-10"));
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));

    // step 2 — selecionar data (primeiro chip)
    await waitFor(() => screen.getByTestId("step-data"));
    const allDayChips = screen.getAllByTestId(/^data-/);
    fireEvent.press(allDayChips[0]);
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));

    // step 3 — selecionar slot e confirmar
    await waitFor(() => screen.getByTestId("step-horario"));
    await waitFor(() => screen.getByTestId("slot-09-00"));
    fireEvent.press(screen.getByTestId("slot-09-00"));
    fireEvent.press(screen.getByTestId("agendar-btn-continuar"));

    await waitFor(() => {
      expect(screen.getByTestId("agendar-confirmado")).toBeTruthy();
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      "/publico/urban-flow/agendamentos",
      expect.objectContaining({
        barbeiroId: 10,
        servicoId: 1,
        inicio: SLOTS[0].inicio,
      }),
    );
  });
});
