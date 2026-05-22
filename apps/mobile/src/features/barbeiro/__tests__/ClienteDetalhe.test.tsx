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

jest.mock("@/src/shared/hooks/barbeiro/use-historico-cliente", () => ({
  useHistoricoCliente: jest.fn(),
}));

const mockSalvarNotaMutate = jest.fn();
jest.mock("@/src/shared/hooks/barbeiro/use-cliente-nota", () => ({
  useClienteNota: jest.fn(() => ({
    data: { conteudo: "", atualizadoEm: null },
  })),
  useSalvarNotaCliente: jest.fn(() => ({ mutate: mockSalvarNotaMutate })),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useHistoricoCliente } from "@/src/shared/hooks/barbeiro/use-historico-cliente";
import type { ClienteAPI } from "@toqe/contracts";
import type { AgendamentoResponse } from "@toqe/shared";

import { ClienteDetalhe } from "../ClienteDetalhe";

const mockHistorico = useHistoricoCliente as jest.MockedFunction<
  typeof useHistoricoCliente
>;

function makeCliente(over: Partial<ClienteAPI> = {}): ClienteAPI {
  return {
    codigo: 1,
    nome: "João Barbosa",
    email: "joao@x.com",
    telefone: "+5511999999999",
    avatarUrl: null,
    perfil: "cliente",
    totalVisitas: 5,
    totalGasto: 250,
    ticketMedio: 50,
    ultimaVisita: "2026-05-10T14:00:00.000Z",
    servicoFav: "Corte Masculino",
    ...over,
  };
}

function makeHistoricoItem(
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo: 100,
    inicio: "2026-05-10T14:00:00.000Z",
    fim: "2026-05-10T14:30:00.000Z",
    status: "concluido",
    barbeiro: { usrCodigo: 10, nome: "Bob", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "João Barbosa", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-09T20:00:00.000Z",
    ...over,
  };
}

function mockHistoricoResult(
  over: Partial<ReturnType<typeof useHistoricoCliente>> = {},
) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...over,
  } as unknown as ReturnType<typeof useHistoricoCliente>;
}

describe("ClienteDetalhe", () => {
  beforeEach(() => {
    mockHistorico.mockReset();
    mockHistorico.mockReturnValue(mockHistoricoResult());
    mockSalvarNotaMutate.mockReset();
  });

  it("não renderiza quando cliente é null", () => {
    render(<ClienteDetalhe cliente={null} visible onClose={jest.fn()} />);
    expect(screen.queryByTestId("cliente-detalhe-modal")).toBeNull();
  });

  it("não renderiza quando visible=false", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente()}
        visible={false}
        onClose={jest.fn()}
      />,
    );
    expect(screen.queryByText("João Barbosa")).toBeNull();
  });

  it("renderiza nome, total de visitas e ticket médio quando visible=true", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.getAllByText("João Barbosa").length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeTruthy(); // totalVisitas
    expect(screen.getByText("R$50")).toBeTruthy(); // ticketMedio
  });

  it("exibe telefone no formato mono", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.getByText("+5511999999999")).toBeTruthy();
  });

  it("exibe serviço favorito quando definido", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.getByText("Corte Masculino")).toBeTruthy();
  });

  it("não exibe card de serviço favorito quando null", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente({ servicoFav: null })}
        visible
        onClose={jest.fn()}
      />,
    );
    expect(screen.queryByText("SERVIÇO FAVORITO")).toBeNull();
  });

  it("quick action Ligar desabilitado quando telefone é null", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente({ telefone: null })}
        visible
        onClose={jest.fn()}
      />,
    );
    const btn = screen.getByTestId("qa-ligar");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("quick action WhatsApp desabilitado quando telefone é null", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente({ telefone: null })}
        visible
        onClose={jest.fn()}
      />,
    );
    const btn = screen.getByTestId("qa-whatsapp");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("exibe vazio de histórico quando histórico está vazio", () => {
    mockHistorico.mockReturnValue(mockHistoricoResult({ data: [] }));
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.getByTestId("historico-vazio")).toBeTruthy();
  });

  it("exibe lista de histórico quando há itens", () => {
    mockHistorico.mockReturnValue(
      mockHistoricoResult({ data: [makeHistoricoItem()] }),
    );
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.getByTestId("historico-lista")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
  });

  it("botão Editar exibe TextInput de nota", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    expect(screen.queryByTestId("input-nota")).toBeNull();
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    expect(screen.getByTestId("input-nota")).toBeTruthy();
  });

  it("nota pode ser editada no TextInput", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    fireEvent.changeText(
      screen.getByTestId("input-nota"),
      "Prefere degradê alto",
    );
    expect(screen.getByDisplayValue("Prefere degradê alto")).toBeTruthy();
  });

  it("pressionar Salvar fecha o TextInput e persiste a nota via mutation", () => {
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={jest.fn()} />,
    );
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    fireEvent.changeText(
      screen.getByTestId("input-nota"),
      "Prefere degradê alto",
    );
    // Pressiona "Salvar" (toggled state do mesmo botão)
    fireEvent.press(screen.getByTestId("btn-editar-nota"));
    expect(screen.queryByTestId("input-nota")).toBeNull();
    expect(mockSalvarNotaMutate).toHaveBeenCalledWith("Prefere degradê alto");
  });

  it("botão voltar chama onClose", () => {
    const onClose = jest.fn();
    render(
      <ClienteDetalhe cliente={makeCliente()} visible onClose={onClose} />,
    );
    fireEvent.press(screen.getByTestId("btn-voltar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ultimaVisita null exibe '—' nas stats", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente({ ultimaVisita: null })}
        visible
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("ticketMedio zero exibe '—'", () => {
    render(
      <ClienteDetalhe
        cliente={makeCliente({ ticketMedio: 0 })}
        visible
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeTruthy();
  });
});
