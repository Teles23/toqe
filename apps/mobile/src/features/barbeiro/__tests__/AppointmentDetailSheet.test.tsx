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

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import { AppointmentDetailSheet } from "../AppointmentDetailSheet";

function makeApt(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 1,
    inicio: "2026-05-15T14:00:00.000Z",
    fim: "2026-05-15T14:30:00.000Z",
    status: "confirmado",
    barbeiro: { usrCodigo: 10, nome: "Bob", avatarUrl: null },
    cliente: { usrCodigo: 42, nome: "Maria Souza", telefone: null },
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

describe("AppointmentDetailSheet", () => {
  it("não renderiza quando agendamento é null", () => {
    render(
      <AppointmentDetailSheet
        agendamento={null}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.queryByText("Maria Souza")).toBeNull();
  });

  it("não renderiza quando visible=false", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt()}
        visible={false}
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.queryByText("Maria Souza")).toBeNull();
  });

  it("renderiza nome do cliente e serviço quando visible=true", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt()}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByText("Maria Souza")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
    expect(screen.getByText(/R\$ 40/)).toBeTruthy();
    expect(screen.getByText("30 minutos")).toBeTruthy();
  });

  // ─── Ações por status ─────────────────────────────────────────────────────

  it("status pendente → exibe Recusar e Aceitar", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "pendente" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByTestId("action-recusar")).toBeTruthy();
    expect(screen.getByTestId("action-aceitar")).toBeTruthy();
  });

  it("status confirmado → exibe Iniciar + Não compareceu (cliente ainda pode faltar)", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "confirmado" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByTestId("action-iniciar")).toBeTruthy();
    expect(screen.getByTestId("action-no_show")).toBeTruthy();
    expect(screen.queryByTestId("action-aceitar")).toBeNull();
  });

  it("status em_andamento → só Concluir (sem Não compareceu — já iniciou)", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "em_andamento" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByTestId("action-concluir")).toBeTruthy();
    expect(screen.queryByTestId("action-no_show")).toBeNull();
    expect(screen.queryByTestId("action-iniciar")).toBeNull();
  });

  it("status concluido → exibe Histórico e Reagendar", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "concluido" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByTestId("action-historico")).toBeTruthy();
    expect(screen.getByTestId("action-reagendar")).toBeTruthy();
  });

  it("status no_show → exibe Tentar reagendar", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "no_show" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByTestId("action-reagendar-noshow")).toBeTruthy();
  });

  it("status cancelado → sem ações visíveis", () => {
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "cancelado" })}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("action-aceitar")).toBeNull();
    expect(screen.queryByTestId("action-iniciar")).toBeNull();
    expect(screen.queryByTestId("action-historico")).toBeNull();
  });

  // ─── Callbacks ────────────────────────────────────────────────────────────

  it("chama onAction('aceitar') ao pressionar Aceitar", () => {
    const onAction = jest.fn();
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "pendente" })}
        visible
        onClose={jest.fn()}
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId("action-aceitar"));
    expect(onAction).toHaveBeenCalledWith("aceitar");
  });

  it("chama onAction('recusar') ao pressionar Recusar", () => {
    const onAction = jest.fn();
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "pendente" })}
        visible
        onClose={jest.fn()}
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId("action-recusar"));
    expect(onAction).toHaveBeenCalledWith("recusar");
  });

  it("chama onAction('iniciar') ao pressionar Iniciar", () => {
    const onAction = jest.fn();
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "confirmado" })}
        visible
        onClose={jest.fn()}
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId("action-iniciar"));
    expect(onAction).toHaveBeenCalledWith("iniciar");
  });

  it("chama onAction('historico') ao pressionar Histórico", () => {
    const onAction = jest.fn();
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "concluido" })}
        visible
        onClose={jest.fn()}
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId("action-historico"));
    expect(onAction).toHaveBeenCalledWith("historico");
  });

  it("chama onAction('reagendar') ao pressionar Reagendar em no_show", () => {
    const onAction = jest.fn();
    render(
      <AppointmentDetailSheet
        agendamento={makeApt({ status: "no_show" })}
        visible
        onClose={jest.fn()}
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId("action-reagendar-noshow"));
    expect(onAction).toHaveBeenCalledWith("reagendar");
  });

  it("combina serviços múltiplos como 'Nome +N'", () => {
    const apt = makeApt({
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
    render(
      <AppointmentDetailSheet
        agendamento={apt}
        visible
        onClose={jest.fn()}
        onAction={jest.fn()}
      />,
    );
    expect(screen.getByText("Corte +1")).toBeTruthy();
  });
});
