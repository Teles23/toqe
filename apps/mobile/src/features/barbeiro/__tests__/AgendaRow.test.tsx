import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import { AgendaRow, STATUS_DOT_COLORS, getStatusLabel } from "../AgendaRow";

function makeAgendamento(
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T14:00:00.000Z",
    fim: "2026-05-15T14:30:00.000Z",
    status: "confirmado",
    barbeiro: { usrCodigo: 10, nome: "Bob", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "Ana Lima", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        preco: 40,
        duracao: 30,
      },
    ],
    criadoEm: "2026-05-14T20:00:00.000Z",
    ...over,
  };
}

describe("AgendaRow", () => {
  it("renderiza nome do cliente e serviço", () => {
    render(<AgendaRow agendamento={makeAgendamento()} onPress={jest.fn()} />);
    expect(screen.getByText("Ana Lima")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
  });

  it("renderiza horário de início formatado", () => {
    render(<AgendaRow agendamento={makeAgendamento()} onPress={jest.fn()} />);
    // 14:00 UTC → depende do fuso; verifica apenas formato HH:mm
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeTruthy();
  });

  it("renderiza duração em minutos", () => {
    render(<AgendaRow agendamento={makeAgendamento()} onPress={jest.fn()} />);
    expect(screen.getByText("30m")).toBeTruthy();
  });

  it("renderiza preço quando > 0", () => {
    render(<AgendaRow agendamento={makeAgendamento()} onPress={jest.fn()} />);
    expect(screen.getByText(/R\$ 40/)).toBeTruthy();
  });

  it("combina nomes de serviços múltiplos com sufixo +N", () => {
    const apt = makeAgendamento({
      itens: [
        {
          codigo: 1,
          servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
          preco: 40,
          duracao: 30,
        },
        {
          codigo: 2,
          servico: { codigo: 2, nome: "Barba", precoBase: 20, duracaoBase: 15 },
          preco: 20,
          duracao: 15,
        },
      ],
    });
    render(<AgendaRow agendamento={apt} onPress={jest.fn()} />);
    expect(screen.getByText("Corte +1")).toBeTruthy();
  });

  it("exibe badge AGUARDANDO ACEITE quando status === pendente", () => {
    render(
      <AgendaRow
        agendamento={makeAgendamento({ status: "pendente" })}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText("AGUARDANDO ACEITE")).toBeTruthy();
  });

  it("não exibe badge AGUARDANDO ACEITE para outros status", () => {
    render(
      <AgendaRow
        agendamento={makeAgendamento({ status: "confirmado" })}
        onPress={jest.fn()}
      />,
    );
    expect(screen.queryByText("AGUARDANDO ACEITE")).toBeNull();
  });

  it("usa testID padrão agenda-row-{codigo}", () => {
    render(
      <AgendaRow
        agendamento={makeAgendamento({ codigo: 7 })}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("agenda-row-7")).toBeTruthy();
  });

  it("usa testID customizado quando fornecido", () => {
    render(
      <AgendaRow
        agendamento={makeAgendamento()}
        onPress={jest.fn()}
        testID="custom-row"
      />,
    );
    expect(screen.getByTestId("custom-row")).toBeTruthy();
  });

  it("chama onPress ao tocar na linha", () => {
    const onPress = jest.fn();
    render(
      <AgendaRow
        agendamento={makeAgendamento({ codigo: 3 })}
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByTestId("agenda-row-3"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("STATUS_DOT_COLORS", () => {
  it("define cor para todos os status conhecidos", () => {
    const statuses = [
      "pendente",
      "confirmado",
      "em_andamento",
      "concluido",
      "cancelado",
      "no_show",
    ];
    statuses.forEach((s) => {
      expect(STATUS_DOT_COLORS[s]).toBeTruthy();
    });
  });
});

describe("getStatusLabel", () => {
  it.each([
    ["pendente", "Aguardando"],
    ["confirmado", "Confirmado"],
    ["em_andamento", "Atendendo"],
    ["concluido", "Concluído"],
    ["cancelado", "Cancelado"],
    ["no_show", "No-show"],
  ])("status %s → label %s", (status, label) => {
    expect(getStatusLabel(status)).toBe(label);
  });

  it("retorna o próprio valor para status desconhecido", () => {
    expect(getStatusLabel("outro")).toBe("outro");
  });
});
