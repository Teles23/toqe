import { render, screen } from "@testing-library/react-native";
import React from "react";

import { FilaCard } from "../FilaCard";
import type { AgendamentoResponse } from "@toqe/shared";

function make(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T13:00:00.000Z",
    fim: "2026-05-15T13:30:00.000Z",
    status: "pendente",
    barbeiro: { usrCodigo: 99, nome: "Carlos", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "João", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-15T12:55:00.000Z",
    ...over,
  };
}

describe("FilaCard", () => {
  it("exibe a posição na fila como '1º', '2º' etc.", () => {
    render(<FilaCard agendamento={make()} posicao={1} />);
    expect(screen.getByTestId("posicao").props.children).toBe("1º");
  });

  it("exibe nome do cliente e nome do serviço", () => {
    render(<FilaCard agendamento={make()} posicao={1} />);
    expect(screen.getByText("João")).toBeTruthy();
    expect(screen.getByText(/Corte/)).toBeTruthy();
  });

  it("exibe label de status traduzido", () => {
    render(<FilaCard agendamento={make({ status: "pendente" })} posicao={2} />);
    expect(screen.getByTestId("status-badge").props.children).toBe(
      "Aguardando",
    );
  });

  it("exibe 'Em atendimento' para status confirmado", () => {
    render(
      <FilaCard agendamento={make({ status: "confirmado" })} posicao={1} />,
    );
    expect(screen.getByTestId("status-badge").props.children).toBe(
      "Em atendimento",
    );
  });

  it("exibe '+N' quando há mais de um serviço", () => {
    const ag = make({
      itens: [
        {
          codigo: 1,
          servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
          preco: 40,
          duracao: 30,
        },
        {
          codigo: 2,
          servico: { codigo: 2, nome: "Barba", precoBase: 30, duracaoBase: 15 },
          preco: 30,
          duracao: 15,
        },
      ],
    });
    render(<FilaCard agendamento={ag} posicao={1} />);
    expect(screen.getByText(/Corte \+1/)).toBeTruthy();
  });

  it("testID customizado é respeitado", () => {
    render(
      <FilaCard agendamento={make({ codigo: 777 })} posicao={1} testID="x" />,
    );
    expect(screen.getByTestId("x")).toBeTruthy();
  });
});
