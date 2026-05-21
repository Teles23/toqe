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
  router: { replace: jest.fn(), back: jest.fn() },
}));

const mockMutateAsync = jest.fn();
const mockMutate = jest.fn();
jest.mock("@/src/shared/hooks/cliente/use-avaliar-agendamento", () => ({
  useAvaliarAgendamento: jest.fn(() => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 } }),
}));

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AvaliacaoSheet } from "../AvaliacaoSheet";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderSheet(
  props: Partial<React.ComponentProps<typeof AvaliacaoSheet>> = {},
) {
  const qc = makeClient();
  const defaults = {
    visible: true,
    onClose: jest.fn(),
    agendamentoCodigo: 42,
    barbeiroNome: "Carlos",
    servicoNome: "Corte Degradê",
    onSuccess: jest.fn(),
  };
  return render(
    <QueryClientProvider client={qc}>
      <AvaliacaoSheet {...defaults} {...props} />
    </QueryClientProvider>,
  );
}

describe("AvaliacaoSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it("1. não renderiza conteúdo quando visible=false", () => {
    renderSheet({ visible: false });
    // BottomSheet usa Modal — quando visible=false o Modal não é apresentado
    expect(screen.queryByTestId("avaliacao-sheet")).toBeNull();
  });

  it("2. renderiza quando visible=true (testID avaliacao-sheet)", () => {
    renderSheet({ visible: true });
    expect(screen.getByTestId("avaliacao-sheet")).toBeTruthy();
  });

  it("3. mostra o título 'Como foi seu corte?'", () => {
    renderSheet();
    expect(screen.getByText("Como foi seu corte?")).toBeTruthy();
  });

  it("4. btn-enviar-avaliacao está desabilitado quando nenhuma estrela selecionada", () => {
    renderSheet();
    const btn = screen.getByTestId("btn-enviar-avaliacao");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("5. pressionar star-3 habilita o botão btn-enviar-avaliacao", () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-3"));
    const btn = screen.getByTestId("btn-enviar-avaliacao");
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it("6. campo input-comentario aparece após selecionar uma nota", () => {
    renderSheet();
    expect(screen.queryByTestId("input-comentario")).toBeNull();
    fireEvent.press(screen.getByTestId("star-4"));
    expect(screen.getByTestId("input-comentario")).toBeTruthy();
  });

  it("7. pressionar btn-enviar chama mutateAsync com os parâmetros corretos", async () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-5"));
    fireEvent.changeText(screen.getByTestId("input-comentario"), "Excelente!");
    fireEvent.press(screen.getByTestId("btn-enviar-avaliacao"));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        codigo: 42,
        nota: 5,
        comentario: "Excelente!",
      });
    });
  });

  it("8. mostra o label da nota após seleção (ex: 'Muito bom!')", () => {
    renderSheet();
    fireEvent.press(screen.getByTestId("star-4"));
    expect(screen.getByText("Muito bom!")).toBeTruthy();
  });

  it("9. mostra nome do barbeiro e serviço no subtítulo", () => {
    renderSheet({ barbeiroNome: "João", servicoNome: "Barba" });
    expect(screen.getByText("João · Barba")).toBeTruthy();
  });
});
