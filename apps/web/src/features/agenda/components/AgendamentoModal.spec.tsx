import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import React from "react";
import { AgendamentoModal } from "./AgendamentoModal";
import { createWrapper, mockAuthContext } from "@/test/render-helpers";
import { server } from "@/test/msw-handlers";

// ─── Mocks: só infra/sessão. Os hooks de dados (useBarbeiros/useClientes/
// useServicos/useAgenda*) rodam de VERDADE, alimentados pelos handlers MSW. ──

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: vi.fn(() => mockAuthContext),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

const mockToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

const BASE = "http://localhost:3000/api/v1";
const TEST_DATE = new Date("2026-05-15T12:00:00.000Z");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(onClose = vi.fn()) {
  const { Wrapper } = createWrapper();
  return {
    onClose,
    ...render(<AgendamentoModal date={TEST_DATE} onClose={onClose} />, {
      wrapper: Wrapper,
    }),
  };
}

/** Preenche barbeiro (10), cliente (20), aguarda os slots e seleciona 09:00,
 *  marca o serviço (Corte) e submete. Exercita os hooks reais + MSW. */
async function fillValidAndSubmit() {
  // Espera as opções (vindas dos hooks reais) renderizarem.
  await screen.findByText("Carlos Silva");
  fireEvent.change(screen.getAllByRole("combobox")[0]!, {
    target: { value: "10" },
  });
  fireEvent.change(screen.getAllByRole("combobox")[1]!, {
    target: { value: "20" },
  });
  // Disponibilidade carrega após escolher o barbeiro.
  await screen.findByRole("option", { name: "09:00" });
  fireEvent.change(screen.getAllByRole("combobox")[2]!, {
    target: { value: "09:00" },
  });
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AgendamentoModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // servicoService.list usa tenantApi("/servicos") → ${BASE}/servicos
    // (não há handler default para essa rota exata). Registramos aqui para
    // que o hook real useServicos resolva com o fixture esperado.
    server.use(
      http.get(`${BASE}/servicos`, () =>
        HttpResponse.json([
          {
            codigo: 1,
            barCodigo: 1,
            nome: "Corte",
            precoBase: 25,
            duracaoBase: 30,
            ativo: true,
          },
        ]),
      ),
    );
  });

  it("renderiza barbeiros, clientes e serviços vindos da API (hooks reais)", async () => {
    renderModal();

    expect(screen.getByText("Novo agendamento")).toBeInTheDocument();
    expect(await screen.findByText("Carlos Silva")).toBeInTheDocument();
    expect(await screen.findByText("Ana Lima")).toBeInTheDocument();
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("desabilita o botão e mostra 'Agendando...' enquanto o POST está pendente", async () => {
    server.use(
      http.post(`${BASE}/agendamentos`, async () => {
        await delay("infinite");
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    renderModal();
    await fillValidAndSubmit();

    const btn = await screen.findByRole("button", { name: /agendando/i });
    expect(btn).toBeDisabled();
  });

  it("POSTa o agendamento com os dados corretos e fecha com toast de sucesso", async () => {
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(`${BASE}/agendamentos`, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { codigo: 999, status: "pendente" },
          { status: 201 },
        );
      }),
    );
    const { onClose } = renderModal();
    await fillValidAndSubmit();

    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({
      barbeiroId: 10,
      clienteId: 20,
      servicosIds: [1],
    });
    // ISO de 15/05 09:00 — pode deslocar ±1 dia conforme TZ do runner.
    expect(String(captured!.inicio)).toMatch(/^2026-05-1\d/);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        "Agendamento criado com sucesso!",
      );
    });
  });

  it("mostra erro inline e toast quando o POST falha (409)", async () => {
    server.use(
      http.post(`${BASE}/agendamentos`, () =>
        HttpResponse.json({ message: "Conflito de horário" }, { status: 409 }),
      ),
    );
    renderModal();
    await fillValidAndSubmit();

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Conflito de horário"),
    );
    expect(await screen.findByText("Conflito de horário")).toBeInTheDocument();
  });

  it("não submete com campos vazios — validação real do schema", async () => {
    renderModal();
    await screen.findByText("Carlos Silva"); // garante hooks resolvidos
    fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));

    expect(
      await screen.findByText("Selecione um barbeiro"),
    ).toBeInTheDocument();
  });

  it("não submete sem serviço selecionado", async () => {
    renderModal();
    await screen.findByText("Carlos Silva");
    fireEvent.change(screen.getAllByRole("combobox")[0]!, {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[1]!, {
      target: { value: "20" },
    });
    await screen.findByRole("option", { name: "09:00" });
    fireEvent.change(screen.getAllByRole("combobox")[2]!, {
      target: { value: "09:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));

    expect(
      await screen.findByText("Selecione ao menos um serviço"),
    ).toBeInTheDocument();
  });

  it("não submete sem horário selecionado", async () => {
    renderModal();
    await screen.findByText("Carlos Silva");
    fireEvent.change(screen.getAllByRole("combobox")[0]!, {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[1]!, {
      target: { value: "20" },
    });
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));

    expect(
      await screen.findByText("Data/hora de início inválida"),
    ).toBeInTheDocument();
  });

  it("exibe mensagem quando não há horários disponíveis", async () => {
    server.use(
      http.get(`${BASE}/agenda/disponibilidade/:barbeiroId`, () =>
        HttpResponse.json([]),
      ),
    );
    renderModal();
    await screen.findByText("Carlos Silva");
    fireEvent.change(screen.getAllByRole("combobox")[0]!, {
      target: { value: "10" },
    });

    expect(
      await screen.findByText("Nenhum horário disponível para esta data"),
    ).toBeInTheDocument();
  });

  it("desabilita o slot picker quando nenhum barbeiro está selecionado", async () => {
    renderModal();
    await screen.findByText("Carlos Silva");
    expect(screen.getAllByRole("combobox")[2]).toBeDisabled();
    expect(
      screen.getByText("Selecione um barbeiro primeiro"),
    ).toBeInTheDocument();
  });
});
