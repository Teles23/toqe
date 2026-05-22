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
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ token: "abc123" })),
}));

jest.mock("@/src/shared/hooks/cliente/use-convite", () => ({
  useConvite: jest.fn(),
}));

const mockAceitarMutate = jest.fn();
jest.mock("@/src/shared/hooks/use-aceitar-convite", () => ({
  useAceitarConvite: () => ({ mutate: mockAceitarMutate }),
}));

const mockRejeitarMutate = jest.fn();
jest.mock("@/src/shared/hooks/use-rejeitar-convite", () => ({
  useRejeitarConvite: () => ({ mutate: mockRejeitarMutate }),
}));

const mockEstablishSession = jest.fn().mockResolvedValue(null);
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ establishSession: mockEstablishSession }),
}));

const aceitarOk = {
  access_token: "acc",
  refresh_token: "ref",
  user: { codigo: 1, nome: "Carlos Mendes", email: "joao@test.com" },
  isNew: true,
  barbeariaNome: "Urban Flow Barber",
};

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { router } from "expo-router";

import { useConvite } from "@/src/shared/hooks/cliente/use-convite";
import ConviteTokenScreen from "../[token]";

const mockUseConvite = useConvite as jest.Mock;

const validConvite = {
  token: "abc123",
  barbeariaNome: "Urban Flow Barber",
  barbeariaSlug: "urban-flow",
  email: "joao@test.com",
  perfil: "barbeiro",
  expiresAt: "2026-06-01T00:00:00Z",
  isNew: true,
};

describe("ConviteTokenScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseConvite.mockReset();
    mockAceitarMutate.mockReset();
    mockRejeitarMutate.mockReset();
    mockEstablishSession.mockClear();
    (router.back as jest.Mock).mockReset();
    (router.replace as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("1. mostra loading quando isLoading=true", () => {
    mockUseConvite.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    // ActivityIndicator is rendered; no landing or expired
    expect(screen.queryByTestId("convite-expirado")).toBeNull();
    expect(screen.queryByTestId("convite-landing")).toBeNull();
  });

  it("2. mostra convite-expirado quando isError=true", () => {
    mockUseConvite.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });
    render(<ConviteTokenScreen />);
    expect(screen.getByTestId("convite-expirado")).toBeTruthy();
  });

  it("3. mostra convite-expirado quando data=null", () => {
    mockUseConvite.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    expect(screen.getByTestId("convite-expirado")).toBeTruthy();
  });

  it("4. mostra convite-landing quando data é válido", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    expect(screen.getByTestId("convite-landing")).toBeTruthy();
  });

  it("5. landing mostra nome da barbearia", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    expect(screen.getByText("Urban Flow Barber")).toBeTruthy();
  });

  it("6. landing mostra o e-mail do convite", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    expect(screen.getByText("joao@test.com")).toBeTruthy();
  });

  it("7. pressionar Aceitar convite mostra formulário com input-nome para novo usuário", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByText("Aceitar convite"));
    expect(screen.getByTestId("input-nome")).toBeTruthy();
    expect(screen.getByTestId("input-senha")).toBeTruthy();
  });

  it("8. para usuário existente (isNew=false) mostra apenas input-senha no formulário", () => {
    mockUseConvite.mockReturnValue({
      data: { ...validConvite, isNew: false },
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByText("Aceitar convite"));
    expect(screen.queryByTestId("input-nome")).toBeNull();
    expect(screen.getByTestId("input-senha")).toBeTruthy();
  });

  it("9. pressionar btn-aceitar mostra estado convite-accepting", async () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByText("Aceitar convite"));
    fireEvent.press(screen.getByTestId("btn-aceitar"));
    // Should immediately show accepting state before timer resolves
    expect(screen.getByTestId("convite-accepting")).toBeTruthy();
  });

  it("10. onSuccess faz auto-login (establishSession) e mostra boas-vindas", async () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    // Simula mutate que chama onSuccess com a resposta de auto-login
    mockAceitarMutate.mockImplementation(
      (
        _input: unknown,
        callbacks: { onSuccess?: (r: typeof aceitarOk) => void },
      ) => {
        callbacks?.onSuccess?.(aceitarOk);
      },
    );

    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByText("Aceitar convite"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-aceitar"));
    });

    expect(mockEstablishSession).toHaveBeenCalledWith("acc", "ref");
    expect(screen.getByTestId("convite-success")).toBeTruthy();
    expect(screen.getByText(/Bem-vindo/)).toBeTruthy();
  });

  it("11. boas-vindas → 'Ver minha agenda' navega para a agenda", async () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    mockAceitarMutate.mockImplementation(
      (
        _input: unknown,
        callbacks: { onSuccess?: (r: typeof aceitarOk) => void },
      ) => {
        callbacks?.onSuccess?.(aceitarOk);
      },
    );

    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByText("Aceitar convite"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-aceitar"));
    });
    fireEvent.press(screen.getByText("Ver minha agenda"));

    expect(router.replace).toHaveBeenCalledWith("/(barbeiro)/agenda");
  });

  it("12. btn-voltar-convite chama router.back()", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByTestId("btn-voltar-convite"));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("13. rejeitar convite chama DELETE (useRejeitarConvite) e volta", () => {
    mockUseConvite.mockReturnValue({
      data: validConvite,
      isLoading: false,
      isError: false,
    });
    render(<ConviteTokenScreen />);
    fireEvent.press(screen.getByTestId("btn-rejeitar"));
    expect(mockRejeitarMutate).toHaveBeenCalledWith("abc123");
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
