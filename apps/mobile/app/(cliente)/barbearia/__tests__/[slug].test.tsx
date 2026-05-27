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
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/src/shared/hooks/use-barbearia-publica", () => ({
  useBarbeariaPublica: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";

import { useBarbeariaPublica } from "@/src/shared/hooks/use-barbearia-publica";
import BarbeariaPublicaScreen from "../[slug]";

const mockRouterPush = router.push as jest.Mock;
const mockRouterBack = router.back as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseBarbeariaPublica = useBarbeariaPublica as jest.Mock;

const barbeariaFixture = {
  codigo: 42,
  nome: "Urban Flow Barber",
  slug: "urban-flow",
  descricao: "A melhor barbearia da cidade.",
  telefone: "(11) 91234-5678",
  endereco: "Rua Teste, 100",
  ratingMedio: 4.8,
  servicoCount: 5,
  barbeiros: [
    {
      usrCodigo: 1,
      nome: "João Silva",
      avatarUrl: null,
      especialidade: "Corte degradê",
    },
    {
      usrCodigo: 2,
      nome: "Pedro Lima",
      avatarUrl: null,
      especialidade: null,
    },
  ],
  tema: { logoUrl: null },
};

describe("BarbeariaPublicaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ slug: "urban-flow" });
  });

  it("1. exibe loading spinner quando isLoading=true", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    render(<BarbeariaPublicaScreen />);
    expect(screen.getByTestId("barbearia-loading")).toBeTruthy();
  });

  it("2. exibe barbearia-nao-encontrada quando data é null", () => {
    mockUseBarbeariaPublica.mockReturnValue({ data: null, isLoading: false });
    render(<BarbeariaPublicaScreen />);
    expect(screen.getByTestId("barbearia-nao-encontrada")).toBeTruthy();
  });

  it("3. exibe nome da barbearia quando carregada", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: barbeariaFixture,
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    expect(screen.getByText("Urban Flow Barber")).toBeTruthy();
  });

  it("4. exibe botão btn-reservar quando carregada", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: barbeariaFixture,
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    expect(screen.getByTestId("btn-reservar")).toBeTruthy();
  });

  it("5. pressionar btn-reservar chama router.push com rota correta", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: barbeariaFixture,
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    fireEvent.press(screen.getByTestId("btn-reservar"));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/(cliente)/agendar?slug=urban-flow",
    );
  });

  it("6. pressionar btn-voltar-barbearia chama router.back", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: barbeariaFixture,
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    // There are two back buttons (header + not-found state doesn't apply here).
    // Press the first one that appears in the header.
    const btns = screen.getAllByTestId("btn-voltar-barbearia");
    fireEvent.press(btns[0]);
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it("7. exibe a nota (rating) quando ratingMedio > 0", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: barbeariaFixture,
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    // A estrela virou ícone Feather; a nota numérica continua como texto.
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText("· avaliações")).toBeTruthy();
  });

  it("8. não exibe rating quando ratingMedio é null", () => {
    mockUseBarbeariaPublica.mockReturnValue({
      data: { ...barbeariaFixture, ratingMedio: null },
      isLoading: false,
    });
    render(<BarbeariaPublicaScreen />);
    expect(screen.queryByText("· avaliações")).toBeNull();
  });
});
