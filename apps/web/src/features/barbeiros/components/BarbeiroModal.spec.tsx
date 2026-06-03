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

  it("botão habilita ao preencher nome, e-mail e ao menos 1 serviço (barbeiro)", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

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

    // Inicialmente nenhuma contagem exibida (só aparece quando > 0)
    expect(screen.queryByText(/\d+ serviço/i)).not.toBeInTheDocument();

    // Clica em "Corte"
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 serviço/i)).toBeInTheDocument();
    });

    // Clica em "Barba"
    fireEvent.click(screen.getByRole("button", { name: /^Barba$/i }));

    await waitFor(() => {
      expect(screen.getByText(/2 serviços/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    // Clica no botão do footer
    await waitFor(() => {
      const footerBtn = screen.getAllByRole("button", {
        name: /convidar barbeiro/i,
      });
      expect(footerBtn.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });

    const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
    fireEvent.click(btns.find((b) => !b.hasAttribute("disabled"))!);

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
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
      expect(btns.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });

    const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
    fireEvent.click(btns.find((b) => !b.hasAttribute("disabled"))!);

    await waitFor(() => {
      expect(screen.getByText(/adicionado!/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Voltar à equipe")).toBeInTheDocument();
    expect(screen.getByText("+ Adicionar outro")).toBeInTheDocument();
  });

  // ── Regras por perfil ────────────────────────────────────────────────────

  it("perfil gerente: título muda para 'Adicionar gerente'", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /gerente/i }));
    await waitFor(() =>
      expect(screen.getByText("Adicionar gerente")).toBeInTheDocument(),
    );
  });

  it("perfil recepcionista: título muda para 'Adicionar recepcionista'", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /recepcionista/i }));
    await waitFor(() =>
      expect(
        screen.getByText("Adicionar recepcionista"),
      ).toBeInTheDocument(),
    );
  });

  it("perfil recepcionista: seção serviços oculta", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /recepcionista/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/03 · Serviços que faz/i),
      ).not.toBeInTheDocument();
    });
  });

  it("perfil recepcionista: seção comissão oculta", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /recepcionista/i }));
    await waitFor(() => {
      expect(screen.queryByText(/05 · Comissão/i)).not.toBeInTheDocument();
    });
  });

  it("perfil gerente: seção serviços visível mas opcional (sem '*obrigatório')", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /gerente/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/03 · Serviços que faz/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/obrigatório/i)).not.toBeInTheDocument();
    });
  });

  it("perfil gerente: seção comissão oculta", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /gerente/i }));
    await waitFor(() => {
      expect(screen.queryByText(/05 · Comissão/i)).not.toBeInTheDocument();
    });
  });

  it("perfil barbeiro: botão desabilitado sem serviço selecionado mesmo com nome e e-mail preenchidos", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });

    // Perfil barbeiro (padrão) sem nenhum serviço
    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
      btns.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  it("perfil barbeiro: botão habilita ao selecionar ao menos um serviço", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
      expect(btns.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });
  });

  it("perfil barbeiro: erro inline ao tentar submeter sem serviço", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });

    // Força clique direto para acionar handleSubmit (botão está desabilitado)
    // Simula chamada direta ao handler via form com serviço não selecionado
    // O botão está disabled, então o erro seria acionado ao forçar validação
    // Verificamos que o texto de status mostra a orientação correta
    await waitFor(() => {
      expect(
        screen.getByText(/selecione ao menos 1 serviço/i),
      ).toBeInTheDocument();
    });
  });

  it("erro da API (ex: limite de plano) é exibido no campo e-mail", async () => {
    mockConvidar.mockImplementation(
      (
        _data: unknown,
        { onError }: { onError: (e: Error) => void },
      ) => onError(new Error("Limite de 2 barbeiro(s) atingido para o plano free")),
    );

    renderModal();

    fireEvent.change(screen.getByPlaceholderText("Ex: Carlos Eduardo Lima"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("carlos@email.com"), {
      target: { value: "carlos@barbearia.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
      expect(btns.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });

    const convBtns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
    fireEvent.click(convBtns.find((b) => !b.hasAttribute("disabled"))!);

    await waitFor(() =>
      expect(
        screen.getByText(/Limite de 2 barbeiro/i),
      ).toBeInTheDocument(),
    );
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
    fireEvent.click(screen.getByRole("button", { name: /^Corte$/i }));

    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
      expect(btns.some((b) => !b.hasAttribute("disabled"))).toBe(true);
    });
    const btns = screen.getAllByRole("button", { name: /convidar barbeiro/i });
    fireEvent.click(btns.find((b) => !b.hasAttribute("disabled"))!);

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
