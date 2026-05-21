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
  router: { replace: jest.fn() },
}));

jest.mock("@/src/shared/hooks/barbeiro/use-barbeiros-da-barbearia", () => ({
  useBarbeirosDaBarbearia: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-servicos", () => ({
  useServicos: jest.fn(),
}));

jest.mock("@/src/shared/hooks/barbeiro/use-criar-walk-in", () => ({
  useCriarWalkIn: jest.fn(),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import { useBarbeirosDaBarbearia } from "@/src/shared/hooks/barbeiro/use-barbeiros-da-barbearia";
import { useCriarWalkIn } from "@/src/shared/hooks/barbeiro/use-criar-walk-in";
import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";

import { AdicionarWalkInModal } from "../AdicionarWalkInModal";

const mockUseBarbeiros = useBarbeirosDaBarbearia as jest.MockedFunction<
  typeof useBarbeirosDaBarbearia
>;
const mockUseServicos = useServicos as jest.MockedFunction<typeof useServicos>;
const mockUseCriar = useCriarWalkIn as jest.MockedFunction<
  typeof useCriarWalkIn
>;

describe("AdicionarWalkInModal", () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBarbeiros.mockReturnValue({
      data: [
        { usrCodigo: 10, nome: "Carlos", avatarUrl: null },
        { usrCodigo: 11, nome: "Pedro", avatarUrl: null },
      ],
    } as unknown as ReturnType<typeof useBarbeirosDaBarbearia>);
    mockUseServicos.mockReturnValue({
      data: [
        {
          codigo: 1,
          nome: "Corte",
          duracaoBase: 30,
          precoBase: 40,
          ativo: true,
        },
        {
          codigo: 2,
          nome: "Barba",
          duracaoBase: 15,
          precoBase: 20,
          ativo: true,
        },
      ],
    } as unknown as ReturnType<typeof useServicos>);
    mockUseCriar.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCriarWalkIn>);
  });

  it("não renderiza quando visible=false", () => {
    render(<AdicionarWalkInModal visible={false} onClose={jest.fn()} />);
    expect(screen.queryByText(/Atender agora/)).toBeNull();
  });

  it("renderiza todos os campos quando visible=true", () => {
    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);
    expect(screen.getByLabelText("Nome do cliente")).toBeTruthy();
    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    expect(screen.getByLabelText("Telefone")).toBeTruthy();
    expect(screen.getByLabelText("Atender com")).toBeTruthy();
    expect(screen.getByLabelText("Serviço")).toBeTruthy();
  });

  it("validação Zod impede submit sem campos obrigatórios", async () => {
    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora →" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Nome deve ter ao menos 2/i)).toBeTruthy();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submete com payload correto e chama onClose no sucesso", async () => {
    mutateAsync.mockResolvedValueOnce({ codigo: 999 });
    const onClose = jest.fn();

    render(<AdicionarWalkInModal visible onClose={onClose} />);

    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");
    fireEvent.changeText(screen.getByLabelText("E-mail"), "j@x.com");

    // Seleciona barbeiro via Select (abre + clica)
    fireEvent.press(screen.getByTestId("select-barbeiro"));
    fireEvent.press(screen.getByTestId("select-barbeiro-option-10"));

    fireEvent.press(screen.getByTestId("select-servico"));
    fireEvent.press(screen.getByTestId("select-servico-option-1"));

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora →" }));
    });

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));

    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      cliente: { nome: "João", email: "j@x.com" },
      barbeiroId: 10,
      servicosIds: [1],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("erro na mutation exibe mensagem de falha", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("network"));

    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");
    fireEvent.changeText(screen.getByLabelText("E-mail"), "j@x.com");
    fireEvent.press(screen.getByTestId("select-barbeiro"));
    fireEvent.press(screen.getByTestId("select-barbeiro-option-10"));
    fireEvent.press(screen.getByTestId("select-servico"));
    fireEvent.press(screen.getByTestId("select-servico-option-1"));

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora →" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível adicionar/i)).toBeTruthy();
    });
  });
});
