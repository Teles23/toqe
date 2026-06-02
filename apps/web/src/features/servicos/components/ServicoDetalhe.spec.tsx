import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ServicoDetalhe } from "./ServicoDetalhe";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
        }) =>
          React.createElement(tag as string, props, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockServico = {
  codigo: 1,
  barCodigo: 1,
  nome: "Corte Clássico",
  descricao: null,
  precoBase: 50,
  duracaoBase: 30,
  ativo: true,
};

function renderDetalhe(
  props: Partial<{
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }> = {},
) {
  const onClose = props.onClose ?? vi.fn();
  const onEdit = props.onEdit ?? vi.fn();
  const onDelete = props.onDelete ?? vi.fn();

  const result = render(
    <ServicoDetalhe
      s={mockServico}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );

  return { onClose, onEdit, onDelete, ...result };
}

describe("ServicoDetalhe — confirmação de exclusão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nome e ações iniciais sem diálogo de confirmação", () => {
    renderDetalhe();
    expect(screen.getByText("Corte Clássico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    // O botão de lixeira existe (via aria-label)
    expect(
      screen.getByRole("button", { name: /excluir serviço/i }),
    ).toBeInTheDocument();
    // Mas o diálogo de confirmação NÃO aparece ainda
    expect(screen.queryByText(/Esta ação não pode ser desfeita/i)).toBeNull();
  });

  it("clicar no ícone de lixeira exibe o diálogo de confirmação com nome do serviço", () => {
    renderDetalhe();

    const trashBtn = screen.getByRole("button", { name: /excluir serviço/i });
    fireEvent.click(trashBtn);

    expect(
      screen.getByText(/Esta ação não pode ser desfeita/i),
    ).toBeInTheDocument();
    // O nome aparece no header e também na mensagem de confirmação
    expect(screen.getAllByText("Corte Clássico").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getByRole("button", { name: /^cancelar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^excluir$/i }),
    ).toBeInTheDocument();
  });

  it("clicar em Cancelar fecha o diálogo sem chamar onDelete", () => {
    const { onDelete } = renderDetalhe();

    const trashBtn = screen.getByRole("button", { name: /excluir serviço/i });
    fireEvent.click(trashBtn);

    expect(screen.getByText(/Esta ação não pode ser desfeita/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/Esta ação não pode ser desfeita/i)).toBeNull();
  });

  it("clicar em Excluir chama onDelete e fecha o diálogo", () => {
    const { onDelete } = renderDetalhe();

    const trashBtn = screen.getByRole("button", { name: /excluir serviço/i });
    fireEvent.click(trashBtn);

    fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Esta ação não pode ser desfeita/i)).toBeNull();
  });

  it("onEdit é chamado ao clicar em Editar (sem confirmação)", () => {
    const { onEdit } = renderDetalhe();

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("onDelete não é chamado ao clicar apenas no ícone de lixeira (abre confirmação)", () => {
    const { onDelete } = renderDetalhe();

    const trashBtn = screen.getByRole("button", { name: /excluir serviço/i });
    fireEvent.click(trashBtn);

    expect(onDelete).not.toHaveBeenCalled();
  });
});
