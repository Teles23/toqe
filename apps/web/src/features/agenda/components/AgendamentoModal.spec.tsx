import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AgendamentoModal } from "./AgendamentoModal";
import { createWrapper, mockAuthContext } from "@/test/render-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/barbeiros/hooks/use-barbeiros", () => ({
  useBarbeiros: vi.fn(),
}));

vi.mock("@/features/clientes/hooks/use-clientes", () => ({
  useClientes: vi.fn(),
}));

vi.mock("@/features/servicos/hooks/use-servicos", () => ({
  useServicos: vi.fn(),
}));

vi.mock("../hooks/use-agenda", () => ({
  useAgendaMutations: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuth } from "@/shared/hooks/use-auth";
import { useBarbeiros } from "@/features/barbeiros/hooks/use-barbeiros";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import { useServicos } from "@/features/servicos/hooks/use-servicos";
import { useAgendaMutations } from "../hooks/use-agenda";
import { toast } from "sonner";

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseBarbeiros = useBarbeiros as unknown as ReturnType<typeof vi.fn>;
const mockUseClientes = useClientes as unknown as ReturnType<typeof vi.fn>;
const mockUseServicos = useServicos as unknown as ReturnType<typeof vi.fn>;
const mockUseAgendaMutations = useAgendaMutations as unknown as ReturnType<
  typeof vi.fn
>;
const mockToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEST_DATE = new Date("2026-05-15T12:00:00.000Z");

const mockBarbeiro = {
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
  initial: "C",
  estado: "idle",
  especialidade: "",
  avaliacao: 0,
  horarioEntrada: "08:00",
  diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex"],
};

const mockCliente = {
  codigo: 2,
  nome: "João Silva",
  email: "joao@test.com",
  telefone: null,
  avatarUrl: null,
  perfil: "CLIENTE",
  totalVisitas: 0,
  totalGasto: 0,
  ticketMedio: 0,
  ultimaVisita: null,
  servicoFav: null,
  initial: "J",
  status: "novo",
};

const mockServico = {
  codigo: 1,
  barCodigo: 1,
  nome: "Corte",
  precoBase: 25,
  duracaoBase: 30,
  ativo: true,
};

function makeCriar(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function setupMocks(criar = makeCriar()) {
  mockUseAuth.mockReturnValue(mockAuthContext);
  mockUseBarbeiros.mockReturnValue({ data: [mockBarbeiro] });
  mockUseClientes.mockReturnValue({ data: [mockCliente] });
  mockUseServicos.mockReturnValue({ data: [mockServico] });
  mockUseAgendaMutations.mockReturnValue({ criar });
}

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

function fillAndSubmit() {
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0]!, { target: { value: "1" } });
  fireEvent.change(selects[1]!, { target: { value: "2" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AgendamentoModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza campos de barbeiro, cliente, data/hora e serviços", () => {
    setupMocks();
    renderModal();

    expect(screen.getByText("Novo agendamento")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText(/Corte/)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("botão 'Agendar' fica desabilitado enquanto isPending", () => {
    setupMocks(makeCriar({ isPending: true }));
    renderModal();

    const btn = screen.getByRole("button", { name: /agendando/i });
    expect(btn).toBeDisabled();
  });

  it("chama criar.mutate com os dados corretos ao submeter", async () => {
    const mutate = vi.fn();
    setupMocks(makeCriar({ mutate }));
    renderModal();

    fillAndSubmit();

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          barbeiroId: 1,
          clienteId: 2,
          servicosIds: [1],
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it("fecha o modal (onClose) e exibe toast de sucesso após criação", async () => {
    const mutate = vi.fn().mockImplementation((_data, cbs) => {
      cbs.onSuccess();
    });
    setupMocks(makeCriar({ mutate }));
    const { onClose } = renderModal();

    fillAndSubmit();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        "Agendamento criado com sucesso!",
      );
    });
  });

  it("exibe mensagem de erro inline e toast quando a mutation falha", async () => {
    const errMsg = "Conflito de horário";
    const mutate = vi.fn().mockImplementation((_data, cbs) => {
      cbs.onError(new Error(errMsg));
    });
    setupMocks(makeCriar({ mutate, isError: true, error: new Error(errMsg) }));
    renderModal();

    expect(screen.getByText(errMsg)).toBeInTheDocument();

    fillAndSubmit();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errMsg);
    });
  });

  it("não submete com campos obrigatórios vazios — exibe erro de validação", async () => {
    const mutate = vi.fn();
    setupMocks(makeCriar({ mutate }));
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));

    await waitFor(() => {
      expect(screen.getByText("Selecione um barbeiro")).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("não submete sem serviço selecionado — exibe erro de validação", async () => {
    const mutate = vi.fn();
    setupMocks(makeCriar({ mutate }));
    renderModal();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0]!, { target: { value: "1" } });
    fireEvent.change(selects[1]!, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /^agendar$/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Selecione ao menos um serviço"),
      ).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });
});
