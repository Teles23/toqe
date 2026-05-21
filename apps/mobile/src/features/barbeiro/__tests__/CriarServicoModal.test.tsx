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

jest.mock("@/src/shared/hooks/barbeiro/use-criar-servico", () => ({
  useCriarServico: jest.fn(),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import { useCriarServico } from "@/src/shared/hooks/barbeiro/use-criar-servico";

import { CriarServicoModal } from "../CriarServicoModal";

const mockUseCriar = useCriarServico as jest.MockedFunction<
  typeof useCriarServico
>;

describe("CriarServicoModal", () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({ codigo: 10 });
    mockUseCriar.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCriarServico>);
  });

  it("não renderiza quando visible=false", () => {
    render(<CriarServicoModal visible={false} onClose={jest.fn()} />);
    expect(screen.queryByText("Novo serviço")).toBeNull();
  });

  it("submete com nome, preço e duração convertidos para número", async () => {
    const onClose = jest.fn();
    render(<CriarServicoModal visible onClose={onClose} />);

    fireEvent.changeText(
      screen.getByLabelText("Nome do serviço"),
      "Corte + Barba",
    );
    fireEvent.changeText(screen.getByLabelText("Preço (R$)"), "75,50");
    fireEvent.changeText(screen.getByLabelText("Duração (min)"), "45");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Criar serviço" }));
    });

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      nome: "Corte + Barba",
      precoBase: 75.5,
      duracaoBase: 45,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("mostra erro de validação quando campos inválidos", async () => {
    render(<CriarServicoModal visible onClose={jest.fn()} />);

    // nome muito curto + sem preço/duração
    fireEvent.changeText(screen.getByLabelText("Nome do serviço"), "A");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Criar serviço" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Nome deve ter ao menos 2/i)).toBeTruthy();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
