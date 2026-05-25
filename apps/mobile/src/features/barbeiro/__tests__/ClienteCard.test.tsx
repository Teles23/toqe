import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { ClienteCard } from "../ClienteCard";
import type { PessoaAPI } from "@toqe/contracts";

function make(over: Partial<PessoaAPI> = {}): PessoaAPI {
  return {
    codigo: 1,
    nome: "Carlos Silva",
    tipo: "usuario",
    email: "carlos@toqe.com",
    telefone: "+5511999999999",
    avatarUrl: null,
    totalVisitas: 5,
    totalGasto: 250.5,
    ticketMedio: 50.1,
    ultimaVisita: "2026-05-01T13:00:00.000Z",
    servicoFav: "Corte Masculino",
    ...over,
  };
}

describe("ClienteCard", () => {
  it("renderiza nome, telefone (mono) e métricas formatadas", () => {
    render(<ClienteCard cliente={make()} />);
    expect(screen.getByText("Carlos Silva")).toBeTruthy();
    // Telefone agora é o identificador secundário (mono font)
    expect(screen.getByText("+5511999999999")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy(); // visitas
    // Formatação BRL — pode variar em separador (espaço regular vs nbsp/narrow)
    expect(screen.getByText(/R\$\s?50,10/)).toBeTruthy();
    expect(screen.getByText(/R\$\s?250,50/)).toBeTruthy();
  });

  it("cai para email REAL quando telefone é null (não some o identificador)", () => {
    render(<ClienteCard cliente={make({ telefone: null })} />);
    expect(screen.getByText("carlos@toqe.com")).toBeTruthy();
  });

  it("NÃO exibe e-mail sintético (@toqe.internal) quando telefone é null", () => {
    render(
      <ClienteCard
        cliente={make({
          telefone: null,
          email: "encaixe-1-abc@toqe.internal",
        })}
      />,
    );
    // Nenhum identificador secundário falso aparece
    expect(screen.queryByText(/@toqe\.internal/)).toBeNull();
  });

  it("prefere telefone ao e-mail mesmo quando há e-mail sintético", () => {
    render(
      <ClienteCard
        cliente={make({
          telefone: "+5511988887777",
          email: "encaixe-2-xyz@toqe.internal",
        })}
      />,
    );
    expect(screen.getByText("+5511988887777")).toBeTruthy();
    expect(screen.queryByText(/@toqe\.internal/)).toBeNull();
  });

  it("formata última visita como dd/MM/yyyy", () => {
    render(<ClienteCard cliente={make()} />);
    expect(screen.getByText("01/05/2026")).toBeTruthy();
  });

  it("exibe 'Sem visitas' quando ultimaVisita é null", () => {
    render(
      <ClienteCard cliente={make({ ultimaVisita: null, totalVisitas: 0 })} />,
    );
    expect(screen.getByText("Sem visitas")).toBeTruthy();
  });

  it("exibe serviço favorito quando definido", () => {
    render(<ClienteCard cliente={make()} />);
    expect(screen.getByText(/Favorito: Corte Masculino/)).toBeTruthy();
  });

  it("não exibe linha de favorito quando null", () => {
    render(<ClienteCard cliente={make({ servicoFav: null })} />);
    expect(screen.queryByText(/Favorito:/)).toBeNull();
  });

  it("chama onPress(cliente) ao tocar no card", () => {
    const onPress = jest.fn();
    const c = make({ codigo: 99 });
    render(<ClienteCard cliente={c} onPress={onPress} testID="cli-99" />);
    fireEvent.press(screen.getByTestId("cli-99"));
    expect(onPress).toHaveBeenCalledWith(c);
  });

  it("não é Pressable quando onPress ausente", () => {
    render(<ClienteCard cliente={make()} testID="cli-static" />);
    const node = screen.getByTestId("cli-static");
    expect(node.props.accessibilityRole).toBeUndefined();
  });

  it("exibe badge WALK-IN para contato (tipo='contato')", () => {
    render(
      <ClienteCard
        cliente={make({ tipo: "contato", email: null, totalVisitas: 0 })}
      />,
    );
    expect(screen.getByTestId("badge-walk-in")).toBeTruthy();
    expect(screen.getByText("WALK-IN")).toBeTruthy();
    // badge NOVO nunca aparece para contatos
    expect(screen.queryByText("NOVO")).toBeNull();
  });

  it("não exibe badge WALK-IN para usuário (tipo='usuario')", () => {
    render(<ClienteCard cliente={make({ tipo: "usuario" })} />);
    expect(screen.queryByTestId("badge-walk-in")).toBeNull();
  });
});
