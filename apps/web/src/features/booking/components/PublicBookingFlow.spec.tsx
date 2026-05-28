import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-handlers";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { createWrapper } from "@/test/render-helpers";

// AnimatePresence mode="wait" atrasa a renderização do próximo step até que
// a animação de saída termine. Em jsdom (CI sem GPU) isso não completa dentro
// do timeout do waitFor → flakiness. Mock elimina animações em testes.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
        }) =>
          React.createElement(String(tag), props, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

const BASE = "http://localhost:3000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderFlow(slug = "urban") {
  const { Wrapper } = createWrapper();
  return render(<PublicBookingFlow slug={slug} />, { wrapper: Wrapper });
}

describe("PublicBookingFlow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe loader enquanto carrega a barbearia", () => {
    server.use(
      http.get(`${BASE}/publico/:slug`, async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({
          codigo: 1,
          nome: "X",
          slug: "x",
          ativo: true,
          timezone: "UTC",
          tema: null,
        });
      }),
    );
    renderFlow();
    // Não há texto específico durante o loader, só o spinner. Verifica que
    // o título do hero ainda não apareceu.
    expect(screen.queryByText("Barbearia Mock")).not.toBeInTheDocument();
  });

  it("mostra mensagem amigável quando slug não existe", async () => {
    server.use(
      http.get(`${BASE}/publico/:slug`, () =>
        HttpResponse.json({ message: "Não encontrada" }, { status: 404 }),
      ),
    );
    renderFlow("nao-existe");
    expect(
      await screen.findByText("Barbearia não encontrada"),
    ).toBeInTheDocument();
  });

  it("renderiza hero com nome da barbearia e step 1 (serviços)", async () => {
    renderFlow();
    expect(await screen.findByText("Barbearia Mock")).toBeInTheDocument();
    expect(screen.getByText(/Passo 1 de 5/i)).toBeInTheDocument();
    expect(await screen.findByText("Corte")).toBeInTheDocument();
    expect(screen.getByText("Barba")).toBeInTheDocument();
  });

  it("habilita CTA depois de selecionar um serviço e avança para step 2", async () => {
    renderFlow();
    const corte = await screen.findByText("Corte");
    fireEvent.click(corte.closest("button")!);

    const cta = screen.getByRole("button", {
      name: /Continuar · R\$/i,
    });
    expect(cta).not.toBeDisabled();
    fireEvent.click(cta);

    expect(await screen.findByText(/Passo 2 de 5/i)).toBeInTheDocument();
    expect(screen.getByText("Com qual barbeiro?")).toBeInTheDocument();
  });

  it("fluxo completo: seleciona serviço → barbeiro → slot → dados → confirma", async () => {
    renderFlow();

    // Step 1: serviço
    const corte = await screen.findByText("Corte");
    fireEvent.click(corte.closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Continuar · R\$/i }));

    // Step 2: barbeiro (escolhe "Qualquer disponível")
    expect(await screen.findByText("Qualquer disponível")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Qualquer disponível").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /^Continuar/i }));

    // Step 3: data/hora (slots vêm do MSW)
    expect(await screen.findByText("Quando fica bom?")).toBeInTheDocument();
    const slot = await screen.findByRole("button", { name: "09:00" });
    fireEvent.click(slot);
    fireEvent.click(screen.getByRole("button", { name: /Continuar · 09:00/i }));

    // Step 4: dados cliente
    expect(await screen.findByText("Seus dados")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "Thiago Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@email.com"), {
      target: { value: "thiago@toqe.dev" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Revisar/i }));

    // Step 5: confirmação
    expect(
      await screen.findByText("Confirme seu agendamento"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Corte").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", { name: /Confirmar agendamento/i }),
    );

    // Step 6: sucesso
    await waitFor(() =>
      expect(screen.getByText("Agendamento confirmado!")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Fazer novo agendamento/i)).toBeInTheDocument();
  });

  it("exibe seção de avaliações quando há avaliações disponíveis", async () => {
    renderFlow();
    // O hero carrega a barbearia
    expect(await screen.findByText("Barbearia Mock")).toBeInTheDocument();
    // A seção de avaliações deve aparecer
    expect(await screen.findByTestId("avaliacoes-section")).toBeInTheDocument();
    // Média e comentários devem estar visíveis
    expect(screen.getByTestId("media-label")).toHaveTextContent("4.8");
    expect(screen.getByText("Excelente atendimento!")).toBeInTheDocument();
  });

  it("não exibe seção de avaliações quando não há avaliações", async () => {
    server.use(
      http.get(`${BASE}/publico/:slug/avaliacoes`, () =>
        HttpResponse.json({ media: 0, total: 0, items: [] }),
      ),
    );
    renderFlow();
    await screen.findByText("Barbearia Mock");
    expect(screen.queryByTestId("avaliacoes-section")).not.toBeInTheDocument();
  });

  it("validação Zod: nome curto bloqueia avanço do step 4", async () => {
    renderFlow();

    // Avança até step 4 rapidamente
    fireEvent.click((await screen.findByText("Corte")).closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Continuar · R\$/i }));
    fireEvent.click(
      (await screen.findByText("Qualquer disponível")).closest("button")!,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continuar/i }));
    fireEvent.click(await screen.findByRole("button", { name: "09:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar · 09:00/i }));

    // Step 4
    await screen.findByText("Seus dados");
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@email.com"), {
      target: { value: "thiago@toqe.dev" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Revisar/i }));

    expect(
      await screen.findByText(/Nome deve ter ao menos 2 caracteres/i),
    ).toBeInTheDocument();
    // Não deve ter avançado
    expect(
      screen.queryByText("Confirme seu agendamento"),
    ).not.toBeInTheDocument();
  });
});
