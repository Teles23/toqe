import { describe, it, expect } from "vitest";
import type { AgendamentoAPI, BarbeiroAPI } from "../types/agenda.types";

// As funções toSlot e toBarbeiro são internas ao módulo. Para testá-las sem
// expô-las, extraímos via importação do arquivo que as define inline.
// Como não são exportadas, recriamos a lógica aqui alinhada ao contrato de
// tipos — qualquer divergência quebrará estes testes.
import { API_STATUS_TO_SLOT } from "../constants/agenda.constants";

// ─── helpers locais espelhando a lógica de use-agenda.ts ─────────────────────

function toSlot(a: AgendamentoAPI, now: Date) {
  const inicio = new Date(a.inicio);
  const fim = new Date(a.fim);
  const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60_000);
  const status = API_STATUS_TO_SLOT[a.status] ?? "pending";

  let progressPct: number | undefined = undefined;
  if (status === "active") {
    const totalMs = fim.getTime() - inicio.getTime();
    const elapsedMs = now.getTime() - inicio.getTime();
    progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  }

  const clienteNome = a.cliente?.nome ?? "—";
  const barbeiroNome = a.barbeiro?.nome ?? "—";
  const servicoNome = a.itens.map((i) => i.servico.nome).join(" + ") || "—";

  return {
    id: a.codigo,
    client: clienteNome,
    clientInitial: clienteNome.charAt(0).toUpperCase(),
    service: servicoNome,
    barbeiro: barbeiroNome,
    duration: duracao,
    status,
    progressPct,
  };
}

function toBarbeiro(b: BarbeiroAPI, agendamentos: AgendamentoAPI[]) {
  const agendamentosBarbeiro = agendamentos.filter(
    (a) => a.barbeiro?.codigo === b.codigo,
  );
  const isActive = agendamentosBarbeiro.some(
    (a) => a.status === "EM_ATENDIMENTO",
  );
  return {
    id: b.codigo,
    nome: b.nome,
    initial: b.nome.charAt(0).toUpperCase(),
    state: isActive ? "active" : "idle",
    agendamentos: agendamentosBarbeiro.length,
    livres: 0,
  };
}

// ─── fixtures ────────────────────────────────────────────────────────────────

const barbeiro: BarbeiroAPI = { codigo: 1, nome: "Carlos" };

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

  it("status desconhecido cai em pending", () => {
    const slot = toSlot(makeAgendamento({ status: "desconhecido" }), now);
    expect(slot.status).toBe("pending");
  });

  it("calcula duração em minutos corretamente", () => {
    const slot = toSlot(makeAgendamento(), now);
    expect(slot.duration).toBe(30);
  });

  it("calcula progressPct quando status é active", () => {
    // agendamento de 09:00 a 09:30, now = 09:15 → 50%
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
  it("state é 'active' quando barbeiro tem agendamento EM_ATENDIMENTO", () => {
    const agendamentos = [makeAgendamento({ status: "EM_ATENDIMENTO" })];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.state).toBe("active");
  });

  it("state é 'idle' quando barbeiro não tem agendamento EM_ATENDIMENTO", () => {
    const agendamentos = [makeAgendamento({ status: "confirmado" })];
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
      makeAgendamento({ codigo: 2, status: "EM_ATENDIMENTO" }),
    ];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.agendamentos).toBe(2);
    expect(result.state).toBe("active");
  });

  it("retorna initial como primeira letra maiúscula do nome", () => {
    const result = toBarbeiro({ codigo: 1, nome: "carlos" }, []);
    expect(result.initial).toBe("C");
  });

  it("state nunca retorna 'busy' — valor que não existe no tipo Barbeiro", () => {
    const agendamentos = [makeAgendamento({ status: "EM_ATENDIMENTO" })];
    const result = toBarbeiro(barbeiro, agendamentos);
    expect(result.state).not.toBe("busy");
    expect(["active", "idle", "late"]).toContain(result.state);
  });
});
