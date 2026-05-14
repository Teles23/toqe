import { describe, it, expect } from "vitest";
import { toSlot, toBarbeiro } from "./use-agenda";
import type { AgendamentoAPI, BarbeiroAPI } from "../types/agenda.types";

// ─── fixtures ────────────────────────────────────────────────────────────────

const barbeiro: BarbeiroAPI = {
  codigo: 1,
  nome: "Carlos",
  email: "carlos@test.com",
  telefone: null,
  avatarUrl: null,
  perfil: "BARBEIRO",
  atendimentosHoje: 0,
  atendimentosMes: 0,
  faturamentoMes: 0,
  ticketMedio: 0,
};

function makeAgendamento(
  overrides: Partial<AgendamentoAPI> = {},
): AgendamentoAPI {
  return {
    codigo: 10,
    inicio: "2024-06-01T09:00:00.000Z",
    fim: "2024-06-01T09:30:00.000Z",
    status: "confirmado",
    cliente: { codigo: 5, nome: "João Silva", email: "j@test.com" },
    barbeiro: { codigo: 1, nome: "Carlos" },
    itens: [
      { servico: { nome: "Corte" }, duracaoMin: 30 },
      { servico: { nome: "Barba" }, duracaoMin: 15 },
    ],
    ...overrides,
  };
}

// ─── toSlot ──────────────────────────────────────────────────────────────────

describe("toSlot", () => {
  const now = new Date("2024-06-01T09:15:00.000Z");

  it("mapeia status confirmado → confirmed", () => {
    const slot = toSlot(makeAgendamento({ status: "confirmado" }), now);
    expect(slot.status).toBe("confirmed");
  });

  it("mapeia status concluido → active", () => {
    const slot = toSlot(makeAgendamento({ status: "concluido" }), now);
    expect(slot.status).toBe("active");
  });

  it("mapeia status cancelado → blocked", () => {
    const slot = toSlot(makeAgendamento({ status: "cancelado" }), now);
    expect(slot.status).toBe("blocked");
  });

  it("mapeia status no_show → late", () => {
    const slot = toSlot(makeAgendamento({ status: "no_show" }), now);
    expect(slot.status).toBe("late");
  });

  it("calcula duração em minutos corretamente", () => {
    const slot = toSlot(makeAgendamento(), now);
    expect(slot.duration).toBe(30);
  });

  it("calcula progressPct quando status é active (50% no meio do intervalo)", () => {
    const slot = toSlot(makeAgendamento({ status: "concluido" }), now);
    expect(slot.progressPct).toBeCloseTo(50, 0);
  });

  it("progressPct é undefined quando status não é active", () => {
    const slot = toSlot(makeAgendamento({ status: "confirmado" }), now);
    expect(slot.progressPct).toBeUndefined();
  });

  it("progressPct é limitado a 100 mesmo após o fim", () => {
    const depois = new Date("2024-06-01T10:00:00.000Z");
    const slot = toSlot(makeAgendamento({ status: "concluido" }), depois);
    expect(slot.progressPct).toBe(100);
  });

  it("progressPct é 0 quando agendamento ainda não começou", () => {
    const antes = new Date("2024-06-01T08:00:00.000Z");
    const slot = toSlot(makeAgendamento({ status: "concluido" }), antes);
    expect(slot.progressPct).toBe(0);
  });

  it("junta múltiplos serviços com ' + '", () => {
    const slot = toSlot(makeAgendamento(), now);
    expect(slot.service).toBe("Corte + Barba");
  });

  it("usa '—' quando cliente é null", () => {
    const slot = toSlot(makeAgendamento({ cliente: null }), now);
    expect(slot.client).toBe("—");
    expect(slot.clientInitial).toBe("—");
  });

  it("usa '—' quando barbeiro é null", () => {
    const slot = toSlot(makeAgendamento({ barbeiro: null }), now);
    expect(slot.barbeiro).toBe("—");
  });

  it("usa '—' quando não há itens", () => {
    const slot = toSlot(makeAgendamento({ itens: [] }), now);
    expect(slot.service).toBe("—");
  });
});

// ─── toBarbeiro ───────────────────────────────────────────────────────────────

describe("toBarbeiro", () => {
  it("state é 'active' quando barbeiro tem agendamento confirmado", () => {
    const agendamentos = [makeAgendamento({ status: "confirmado" })];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.state).toBe("active");
  });

  it("state é 'idle' quando barbeiro só tem agendamentos concluídos", () => {
    const agendamentos = [makeAgendamento({ status: "concluido" })];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.state).toBe("idle");
  });

  it("state é 'idle' quando não há agendamentos", () => {
    const result = toBarbeiro(barbeiro, []);
    expect(result.state).toBe("idle");
  });

  it("conta apenas agendamentos do barbeiro correto", () => {
    const outroAgendamento = makeAgendamento({
      barbeiro: { codigo: 99, nome: "Outro" },
    });
    const result = toBarbeiro(barbeiro, [outroAgendamento]);
    expect(result.agendamentos).toBe(0);
    expect(result.state).toBe("idle");
  });

  it("conta todos os agendamentos do barbeiro independente de status", () => {
    const agendamentos = [
      makeAgendamento({ codigo: 1, status: "confirmado" }),
      makeAgendamento({ codigo: 2, status: "confirmado" }),
    ];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.agendamentos).toBe(2);
    expect(result.state).toBe("active");
  });

  it("retorna initial como primeira letra maiúscula do nome", () => {
    const result = toBarbeiro({ ...barbeiro, nome: "carlos" }, []);
    expect(result.initial).toBe("C");
  });

  it("state respeita o contrato do tipo Barbeiro — nunca retorna valor fora de 'active'|'idle'|'late'", () => {
    const comAtendimento = [makeAgendamento({ status: "confirmado" })];
    const semAtendimento = [makeAgendamento({ status: "confirmado" })];
    const valoresValidos = ["active", "idle", "late"];

    expect(valoresValidos).toContain(
      toBarbeiro(barbeiro, comAtendimento).state,
    );
    expect(valoresValidos).toContain(
      toBarbeiro(barbeiro, semAtendimento).state,
    );
    expect(valoresValidos).toContain(toBarbeiro(barbeiro, []).state);
  });
});

// ─── useAgendaMutations ───────────────────────────────────────────────────────

import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { useAgendaMutations } from "./use-agenda";
import { createWrapper } from "@/test/render-helpers";

const mockCriar = vi.fn();

vi.mock("../services/agenda.service", () => ({
  agendaService: {
    listAgendamentos: vi.fn().mockResolvedValue([]),
    listBarbeiros: vi.fn().mockResolvedValue([]),
    patchStatus: vi.fn(),
    criar: (...args: unknown[]) => mockCriar(...args),
  },
}));

describe("useAgendaMutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("criar envia POST com dados do agendamento", async () => {
    const agendamento = {
      codigo: 999,
      status: "pendente",
      barbeiroId: 1,
      clienteId: 2,
      inicio: "2026-05-15T09:00:00.000Z",
      servicosIds: [1],
    };
    mockCriar.mockResolvedValueOnce(agendamento);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgendaMutations(1, "2026-05-15"), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.criar.mutate({
        barbeiroId: 1,
        clienteId: 2,
        inicio: "2026-05-15T09:00:00.000Z",
        servicosIds: [1],
      });
    });

    await waitFor(() => expect(result.current.criar.isSuccess).toBe(true));
    expect(mockCriar).toHaveBeenCalledWith(1, {
      barbeiroId: 1,
      clienteId: 2,
      inicio: "2026-05-15T09:00:00.000Z",
      servicosIds: [1],
    });
  });
});
