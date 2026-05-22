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

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
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

import { useAuth } from "@/src/shared/hooks/use-auth";
import { useCriarWalkIn } from "@/src/shared/hooks/barbeiro/use-criar-walk-in";
import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";

import { AdicionarWalkInModal } from "../AdicionarWalkInModal";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseServicos = useServicos as jest.MockedFunction<typeof useServicos>;
const mockUseCriar = useCriarWalkIn as jest.MockedFunction<
  typeof useCriarWalkIn
>;

describe("AdicionarWalkInModal (walk-in chips)", () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({ codigo: 999 });
    mockUseAuth.mockReturnValue({
      user: { codigo: 50, nome: "Carlos", email: "c@x.com" },
    } as unknown as ReturnType<typeof useAuth>);
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
          nome: "Corte + Barba",
          duracaoBase: 45,
          precoBase: 75,
          ativo: true,
        },
        {
          codigo: 3,
          nome: "Pigmentação",
          duracaoBase: 60,
          precoBase: 90,
          ativo: false,
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
    expect(screen.queryByText("Encaixe agora")).toBeNull();
  });

  it("renderiza chips só de serviços ativos", () => {
    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);
    expect(screen.getByTestId("walkin-servico-1")).toBeTruthy();
    expect(screen.getByTestId("walkin-servico-2")).toBeTruthy();
    // serviço inativo não vira chip
    expect(screen.queryByTestId("walkin-servico-3")).toBeNull();
  });

  it("submete com barbeiroId do usuário logado e servicosIds do chip selecionado", async () => {
    const onClose = jest.fn();
    render(<AdicionarWalkInModal visible onClose={onClose} />);

    // seleciona o 2º serviço
    fireEvent.press(screen.getByTestId("walkin-servico-2"));
    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora" }));
    });

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const payload = mutateAsync.mock.calls[0][0];
    expect(payload).toMatchObject({
      barbeiroId: 50,
      servicosIds: [2],
      cliente: { nome: "João" },
    });
    // email sintético é gerado
    expect(payload.cliente.email).toMatch(/@walk-in\.local$/);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("botão fica desabilitado quando nome está vazio", () => {
    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);
    const btn = screen.getByRole("button", { name: "Atender agora" });
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("botão habilita ao preencher nome e submete corretamente", async () => {
    const onClose = jest.fn();
    render(<AdicionarWalkInModal visible onClose={onClose} />);

    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "Ana");
    const btn = screen.getByRole("button", { name: "Atender agora" });
    expect(btn.props.accessibilityState?.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(btn);
    });

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      cliente: { nome: "Ana" },
    });
  });

  it("erro na mutation exibe mensagem de falha", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("network"));
    render(<AdicionarWalkInModal visible onClose={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText("Nome do cliente"), "João");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Atender agora" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível adicionar/i)).toBeTruthy();
    });
  });
});
