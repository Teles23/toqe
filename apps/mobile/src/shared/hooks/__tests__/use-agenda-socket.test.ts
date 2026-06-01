const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockDisconnect = jest.fn();
const mockSocket = { on: mockOn, emit: mockEmit, disconnect: mockDisconnect };

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocket),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

import { renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useAgendaSocket } from "../use-agenda-socket";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockIo = io as jest.MockedFunction<typeof io>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      ),
  };
}

describe("useAgendaSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIo.mockReturnValue(mockSocket as unknown as ReturnType<typeof io>);
  });

  it("não conecta quando barbearia é null", () => {
    mockUseAuth.mockReturnValue({
      barbearia: null,
      user: null,
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { wrapper } = makeWrapper();
    renderHook(() => useAgendaSocket(), { wrapper });

    expect(mockIo).not.toHaveBeenCalled();
  });

  it("conecta no namespace /agenda quando barbearia está definida", () => {
    mockUseAuth.mockReturnValue({
      barbearia: {
        codigo: 1,
        nome: "Barbearia Test",
        slug: "barbearia-test",
        perfil: null as never,
      },
      user: {
        codigo: 9,
        nome: "Barbeiro",
        email: "b@b.com",
        telefone: null,
        avatarUrl: null,
        linkPublico: null,
        dataNascimento: null,
      },
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { wrapper } = makeWrapper();
    renderHook(() => useAgendaSocket(), { wrapper });

    expect(mockIo).toHaveBeenCalledWith(
      "http://localhost:3000/agenda",
      expect.objectContaining({ transports: ["websocket"] }),
    );
  });

  it("ao receber evento 'connect', emite 'join-barbearia' com o codigo", () => {
    mockUseAuth.mockReturnValue({
      barbearia: {
        codigo: 1,
        nome: "Barbearia Test",
        slug: "barbearia-test",
        perfil: null as never,
      },
      user: {
        codigo: 9,
        nome: "Barbeiro",
        email: "b@b.com",
        telefone: null,
        avatarUrl: null,
        linkPublico: null,
        dataNascimento: null,
      },
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { wrapper } = makeWrapper();
    renderHook(() => useAgendaSocket(), { wrapper });

    // Simula o evento 'connect' chamando o handler registrado
    const connectCall = mockOn.mock.calls.find(
      ([event]) => event === "connect",
    );
    expect(connectCall).toBeDefined();
    const connectHandler = connectCall![1] as () => void;
    connectHandler();

    expect(mockEmit).toHaveBeenCalledWith("join-barbearia", 1);
  });

  it("ao receber 'agendamento:criado', invalida as queries agendamentos e fila", () => {
    mockUseAuth.mockReturnValue({
      barbearia: {
        codigo: 1,
        nome: "Barbearia Test",
        slug: "barbearia-test",
        perfil: null as never,
      },
      user: {
        codigo: 9,
        nome: "Barbeiro",
        email: "b@b.com",
        telefone: null,
        avatarUrl: null,
        linkPublico: null,
        dataNascimento: null,
      },
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useAgendaSocket(), { wrapper });

    const criadoCall = mockOn.mock.calls.find(
      ([event]) => event === "agendamento:criado",
    );
    expect(criadoCall).toBeDefined();
    const criadoHandler = criadoCall![1] as () => void;
    criadoHandler();

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["agendamentos"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["fila"] }),
    );
  });

  it("ao receber 'agendamento:status', invalida as queries agendamentos e fila", () => {
    mockUseAuth.mockReturnValue({
      barbearia: {
        codigo: 1,
        nome: "Barbearia Test",
        slug: "barbearia-test",
        perfil: null as never,
      },
      user: {
        codigo: 9,
        nome: "Barbeiro",
        email: "b@b.com",
        telefone: null,
        avatarUrl: null,
        linkPublico: null,
        dataNascimento: null,
      },
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useAgendaSocket(), { wrapper });

    const statusCall = mockOn.mock.calls.find(
      ([event]) => event === "agendamento:status",
    );
    expect(statusCall).toBeDefined();
    const statusHandler = statusCall![1] as () => void;
    statusHandler();

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["agendamentos"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["fila"] }),
    );
  });

  it("ao desmontar, emite 'leave-barbearia' e desconecta o socket", () => {
    mockUseAuth.mockReturnValue({
      barbearia: {
        codigo: 1,
        nome: "Barbearia Test",
        slug: "barbearia-test",
        perfil: null as never,
      },
      user: {
        codigo: 9,
        nome: "Barbeiro",
        email: "b@b.com",
        telefone: null,
        avatarUrl: null,
        linkPublico: null,
        dataNascimento: null,
      },
      perfil: null,
      barbearias: [],
      loading: false,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      establishSession: jest.fn(),
      logout: jest.fn(),
      reloadUser: jest.fn(),
      switchBarbearia: jest.fn(),
    });

    const { wrapper } = makeWrapper();
    const { unmount } = renderHook(() => useAgendaSocket(), { wrapper });

    unmount();

    expect(mockEmit).toHaveBeenCalledWith("leave-barbearia", 1);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
