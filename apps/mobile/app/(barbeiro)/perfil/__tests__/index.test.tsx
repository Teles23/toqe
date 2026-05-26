// Perfil do barbeiro — exercita o hook real useBarbeiroStats + api-client real.
// Só o boundary HTTP (global.fetch) e a sessão (useAuth) são mockados. As
// asserções dependem da sessão (useAuth); as stats (GET /me/stats) ficam
// pendentes — a tela não precisa delas para os cenários abaixo.

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

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useSegments: jest.fn(() => ["(barbeiro)", "perfil"]),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockShowToast = jest.fn();
jest.mock("@/src/shared/hooks/use-toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import PerfilIndexScreen from "../index";

const originalFetch = global.fetch;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<PerfilIndexScreen />, { wrapper });
}

function makeAuth(over = {}) {
  return {
    user: {
      codigo: 1,
      nome: "Carlos",
      email: "c@x.com",
      telefone: null,
      avatarUrl: null,
    },
    perfil: "barbeiro",
    barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
    barbearia: { codigo: 1, nome: "Centro" },
    switchBarbearia: jest.fn(),
    logout: jest.fn(),
    ...over,
  };
}

describe("PerfilIndexScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // GET /me/stats fica pendente — sem churn de estado durante o teste.
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renderiza nome e email do user", () => {
    mockUseAuth.mockReturnValue(
      makeAuth({
        user: {
          codigo: 1,
          nome: "Carlos",
          email: "c@x.com",
          telefone: null,
          avatarUrl: null,
        },
      }),
    );
    renderScreen();
    expect(screen.getByText("Carlos")).toBeTruthy();
    expect(screen.getByText("c@x.com")).toBeTruthy();
  });

  it("renderiza seções Conta e Segurança (sem Barbearia se 1 só)", () => {
    mockUseAuth.mockReturnValue(makeAuth());
    renderScreen();
    expect(screen.getByText("Conta")).toBeTruthy();
    expect(screen.getByText("Segurança")).toBeTruthy();
    expect(screen.queryByText("Barbearia ativa")).toBeNull();
  });

  it("mostra seção Barbearia quando >1 e troca ao tocar", () => {
    const switchBarb = jest.fn();
    mockUseAuth.mockReturnValue(
      makeAuth({
        barbearias: [
          { codigo: 1, nome: "Centro", perfil: "barbeiro" },
          { codigo: 2, nome: "Norte", perfil: "dono" },
        ],
        switchBarbearia: switchBarb,
      }),
    );
    renderScreen();
    expect(screen.getByText("Barbearia ativa")).toBeTruthy();
    expect(screen.getByTestId("barbearia-1")).toBeTruthy();
    expect(screen.getByTestId("barbearia-2")).toBeTruthy();
    fireEvent.press(screen.getByTestId("barbearia-2"));
    expect(switchBarb).toHaveBeenCalledWith(2);
  });

  it("navega para /editar ao tap em 'Editar perfil'", () => {
    mockUseAuth.mockReturnValue(makeAuth());
    renderScreen();
    fireEvent.press(screen.getByTestId("ir-editar"));
    expect(mockPush).toHaveBeenCalledWith("/(barbeiro)/perfil/editar");
  });

  it("navega para /notificacoes ao tap em 'Notificações push'", () => {
    mockUseAuth.mockReturnValue(makeAuth());
    renderScreen();
    fireEvent.press(screen.getByTestId("ir-notificacoes"));
    expect(mockPush).toHaveBeenCalledWith("/(barbeiro)/perfil/notificacoes");
  });

  it("mostra toast 'em breve' ao tap em WhatsApp (não navega)", () => {
    mockUseAuth.mockReturnValue(makeAuth());
    renderScreen();
    fireEvent.press(screen.getByTestId("ir-whatsapp"));
    expect(mockShowToast).toHaveBeenCalledWith(
      "Integração com WhatsApp em breve",
      "info",
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Sair abre sheet de confirmação e chama logout ao confirmar", () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue(makeAuth({ logout }));
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));
    fireEvent.press(screen.getByRole("button", { name: "Sair" }));

    expect(logout).toHaveBeenCalled();
  });

  it("Cancelar no sheet de logout não chama logout", () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue(makeAuth({ logout }));
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(logout).not.toHaveBeenCalled();
  });
});
