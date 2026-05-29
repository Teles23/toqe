import { render, screen } from "@testing-library/react-native";
import React from "react";

import { AgendamentoCard } from "../AgendamentoCard";
import type { AgendamentoResponse } from "@toqe/shared";

function makeAgendamento(
  overrides: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T13:00:00.000Z", // 10:00 BRT (UTC-3)
    fim: "2026-05-15T13:45:00.000Z", // 10:45 BRT
    status: "confirmado",
    barbeiro: { usrCodigo: 99, nome: "João Barbeiro", avatarUrl: null },
    cliente: {
      usrCodigo: 42,
      nome: "Carlos Cliente",
      telefone: "+5511999999999",
      tipo: "usuario" as const,
    },
    itens: [
      {
        codigo: 1,
        servico: {
          codigo: 1,
          nome: "Corte Masculino",
          precoBase: 50,
          duracaoBase: 30,
        },
        preco: 50,
        duracaoMin: 30,
      },
    ],
    criadoEm: "2026-05-14T20:00:00.000Z",
    ...overrides,
  };
}

describe("AgendamentoCard", () => {
  it("renderiza horário, cliente e serviço", () => {
    render(<AgendamentoCard agendamento={makeAgendamento()} />);

    expect(screen.getByText("Carlos Cliente")).toBeTruthy();
    expect(screen.getByText("Corte Masculino")).toBeTruthy();
    // horário formatado HH:mm – HH:mm (qualquer separador entre os dois)
    expect(screen.getByText(/\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2}/)).toBeTruthy();
  });

  it("exibe label de status correto para cada status", () => {
    const cases: { status: AgendamentoResponse["status"]; label: string }[] = [
      { status: "pendente", label: "Pendente" },
      { status: "confirmado", label: "Confirmado" },
      { status: "concluido", label: "Concluído" },
      { status: "cancelado", label: "Cancelado" },
      { status: "no_show", label: "Não compareceu" },
    ];

    for (const { status, label } of cases) {
      const { unmount } = render(
        <AgendamentoCard
          agendamento={makeAgendamento({ status, codigo: 99 })}
        />,
      );
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    }
  });

  it('quando há mais de um item, mostra "+N" no nome do serviço', () => {
    const agendamento = makeAgendamento({
      itens: [
        {
          codigo: 1,
          servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 20 },
          preco: 40,
          duracaoMin: 20,
        },
        {
          codigo: 2,
          servico: { codigo: 2, nome: "Barba", precoBase: 30, duracaoBase: 15 },
          preco: 30,
          duracaoMin: 15,
        },
      ],
    });
    render(<AgendamentoCard agendamento={agendamento} />);
    expect(screen.getByText("Corte +1")).toBeTruthy();
  });

  it("expõe testID padrão por código", () => {
    render(<AgendamentoCard agendamento={makeAgendamento({ codigo: 777 })} />);
    expect(screen.getByTestId("agendamento-777")).toBeTruthy();
  });
});
