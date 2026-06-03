import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { createWrapper } from "@/test/render-helpers";
import { SecaoHorarios } from "./SecaoHorarios";

const mockMutate = vi.fn();

const todosAbertos = [
  { diaSemana: 1, aberto: true, abertura: "09:00", fechamento: "19:00" },
  { diaSemana: 2, aberto: true, abertura: "09:00", fechamento: "19:00" },
  { diaSemana: 3, aberto: true, abertura: "09:00", fechamento: "19:00" },
  { diaSemana: 4, aberto: true, abertura: "09:00", fechamento: "19:00" },
  { diaSemana: 5, aberto: true, abertura: "09:00", fechamento: "19:00" },
  { diaSemana: 6, aberto: true, abertura: "08:00", fechamento: "18:00" },
  { diaSemana: 0, aberto: false, abertura: "09:00", fechamento: "18:00" },
];

vi.mock("../hooks/use-configuracao", () => ({
  useConfiguracaoHorarios: () => ({
    data: todosAbertos,
    update: { mutate: mockMutate, isPending: false },
  }),
}));

vi.mock("@/shared/components/toggle", () => ({
  Toggle: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      data-testid={`toggle-${checked}`}
    >
      toggle
    </button>
  ),
}));

function renderSecao() {
  const { Wrapper } = createWrapper();
  return render(<SecaoHorarios barCodigo={1} />, { wrapper: Wrapper });
}

describe("SecaoHorarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza os 7 dias da semana", () => {
    renderSecao();
    const toggles = screen.getAllByRole("switch");
    expect(toggles).toHaveLength(7);
  });

  it("salvar com ao menos 1 dia ativo chama update.mutate", () => {
    renderSecao();
    fireEvent.click(screen.getByRole("button", { name: /salvar horários/i }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/ative ao menos/i)).not.toBeInTheDocument();
  });

  it("bloqueia salvar quando todos os dias estão fechados", () => {
    renderSecao();
    // Fecha todos os dias que estão abertos (6 dias abertos por padrão)
    const togglesAbertos = screen.getAllByTestId("toggle-true");
    togglesAbertos.forEach((t) => fireEvent.click(t));

    fireEvent.click(screen.getByRole("button", { name: /salvar horários/i }));

    expect(
      screen.getByText(/ative ao menos um dia de funcionamento/i),
    ).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("erro de validação some ao ativar um dia e salvar com sucesso", () => {
    renderSecao();

    // Fecha todos os dias abertos
    const togglesAbertos = screen.getAllByTestId("toggle-true");
    togglesAbertos.forEach((t) => fireEvent.click(t));

    // Tenta salvar sem dias ativos
    fireEvent.click(screen.getByRole("button", { name: /salvar horários/i }));
    expect(
      screen.getByText(/ative ao menos um dia de funcionamento/i),
    ).toBeInTheDocument();

    // Reativa um dia
    const togglesFechados = screen.getAllByTestId("toggle-false");
    fireEvent.click(togglesFechados[0]!);

    // Salva com sucesso
    fireEvent.click(screen.getByRole("button", { name: /salvar horários/i }));
    expect(
      screen.queryByText(/ative ao menos um dia de funcionamento/i),
    ).not.toBeInTheDocument();
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
