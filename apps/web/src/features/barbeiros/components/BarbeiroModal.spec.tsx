import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { createWrapper, mockAuthContext } from "@/test/render-helpers";
import { BarbeiroModal } from "./BarbeiroModal";

/* ── mocks ──────────────────────────────────────────────────────────────── */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

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
          React.createElement(
            tag === "aside" ? "aside" : "div",
            props,
            children,
          ),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockConvidar = vi.fn();
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock("../hooks/use-barbeiros", () => ({
  useBarbeiroMutations: () => ({
    convidar: {
      mutate: mockConvidar,
      isPending: false,
    },
    remover: { mutate: vi.fn() },
  }),
}));

vi.mock("@/features/servicos/hooks/use-servicos", () => ({
  useServicos: () => ({
    data: [
      { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
      { codigo: 2, nome: "Barba", precoBase: 35, duracaoBase: 25 },
    ],
  }),
}));

/* ── helpers ────────────────────────────────────────────────────────────── */

function renderModal(onClose = vi.fn()) {
  const { Wrapper } = createWrapper();
  return render(<BarbeiroModal onClose={onClose} />, { wrapper: Wrapper });
}

/* ── tests ──────────────────────────────────────────────────────────────── */

describe("BarbeiroModal — drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o drawer com título e 5 seções", () => {
    renderModal();

    expect(screen.getByText("Adicionar barbeiro")).toBeInTheDocument();
    expect(screen.getByText(/01 · Quem é ele/i)).toBeInTheDocument();
    expect(screen.getByText(/02 · Contato e acesso/i)).toBeInTheDocument();
    expect(screen.getByText(/03 · Serviços que faz/i)).toBeInTheDocument();
    expect(screen.getByText(/04 · Quando trabalha/i)).toBeInTheDocument();
    expect(screen.getByText(/05 · Comissão/i)).toBeInTheDocument();
  });

  it("botão 'Convidar →' está desabilitado sem nome e e-mail", () => {
    renderModal();
    const btns = screen.getAllByRole("button", { name: /convidar/i });
    btns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("botão habilita ao preencher nome e e-mail válido", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });

    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar/i });
      expect(btns.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });
  });

  it("magic link WhatsApp está desabilitado visualmente", () => {
    renderModal();
    const magicCell = screen.getByText(/magic link whatsapp/i);
    // o elemento pai tem classe tqe-ab-pick-disabled / cursor not-allowed
    const pickEl = magicCell.closest(".tqe-ab-pick-disabled");
    expect(pickEl).toBeTruthy();
  });

  it("badge 'EM BREVE' aparece ao lado do magic link", () => {
    renderModal();
    expect(screen.getByText("EM BREVE")).toBeInTheDocument();
  });

  it("renderiza lista de serviços da API", () => {
    renderModal();
    expect(screen.getByText("Corte")).toBeInTheDocument();
    expect(screen.getByText("Barba")).toBeInTheDocument();
  });

  it("toggle de serviço atualiza contagem de selecionados", async () => {
    renderModal();

    // Inicialmente 0 selecionados
    expect(screen.getByText(/0 serviços/i)).toBeInTheDocument();

    // Clica em "Corte"
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 serviço/i)).toBeInTheDocument();
    });
  });

  it("submit chama convidar.mutate com email e perfil", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });

    // Clica no botão do footer
    await waitFor(() => {
      const footerBtn = screen.getByRole("button", {
        name: /convidar barbeiro/i,
      });
      expect(footerBtn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /convidar barbeiro/i }));

    expect(mockConvidar).toHaveBeenCalledWith(
      { email: "carlos@barbearia.com", perfil: "barbeiro" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("exibe tela de sucesso após convite enviado", async () => {
    // Simula mutação que chama onSuccess imediatamente
    mockConvidar.mockImplementation(
      (_data: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess(),
    );

    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Ana Paula" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "ana@barbosa.com" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /convidar barbeiro/i }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /convidar barbeiro/i }));

    await waitFor(() => {
      expect(screen.getByText(/adicionado!/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Voltar à equipe")).toBeInTheDocument();
    expect(screen.getByText("+ Adicionar outro")).toBeInTheDocument();
  });

  it('"Adicionar outro" reseta o formulário e volta ao form', async () => {
    mockConvidar.mockImplementation(
      (_data: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess(),
    );

    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Pedro Souza" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "pedro@corte.com" },
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /convidar barbeiro/i }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /convidar barbeiro/i }));

    await waitFor(() =>
      expect(screen.getByText(/adicionado!/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("+ Adicionar outro"));

    await waitFor(() => {
      expect(screen.getByText("Adicionar barbeiro")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"),
      ).toHaveValue("");
    });
  });
});
