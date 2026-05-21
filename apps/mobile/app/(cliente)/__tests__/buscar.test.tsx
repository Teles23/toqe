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
  router: { push: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-barbearias-publico", () => ({
  useBarbeariasPublico: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { router } from "expo-router";

import { useBarbeariasPublico } from "@/src/shared/hooks/use-barbearias-publico";
import ClienteBuscarScreen from "../buscar";

const mockRouterPush = router.push as jest.Mock;
const mockUseBarbeariasPublico = useBarbeariasPublico as jest.Mock;

const barbeariasFixture = [
  {
    codigo: 1,
    nome: "Urban Flow Barber",
    slug: "urban-flow",
    tema: { logoUrl: null },
  },
  {
    codigo: 2,
    nome: "Barber Shop Classic",
    slug: "barber-classic",
    tema: null,
  },
];

describe("ClienteBuscarScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. exibe loading indicator quando isLoading=true", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    expect(screen.getByTestId("buscar-loading")).toBeTruthy();
  });

  it("2. exibe lista de barbearias quando dados carregados", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: barbeariasFixture,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    expect(screen.getByTestId("lista-barbearias-publicas")).toBeTruthy();
    expect(screen.getByTestId("barbearia-publica-1")).toBeTruthy();
    expect(screen.getByTestId("barbearia-publica-2")).toBeTruthy();
    expect(screen.getByText("Urban Flow Barber")).toBeTruthy();
    expect(screen.getByText("Barber Shop Classic")).toBeTruthy();
  });

  it("3. exibe buscar-empty quando array está vazio", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    expect(screen.getByTestId("buscar-empty")).toBeTruthy();
    expect(screen.getByText("Nenhuma barbearia encontrada")).toBeTruthy();
  });

  it("4. tocar em uma barbearia chama router.push com o slug correto", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: barbeariasFixture,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    fireEvent.press(screen.getByTestId("barbearia-publica-1"));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/(cliente)/barbearia/urban-flow",
    );
  });

  it("5. digitar no input altera o valor do campo de busca", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    const input = screen.getByTestId("buscar-input");
    fireEvent.changeText(input, "urban");
    // After typing, the input shows the new value
    expect(input.props.value).toBe("urban");
  });

  it("6. exibe título 'Descobrir' no header", () => {
    mockUseBarbeariasPublico.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ClienteBuscarScreen />);
    expect(screen.getByText("Descobrir")).toBeTruthy();
  });
});
