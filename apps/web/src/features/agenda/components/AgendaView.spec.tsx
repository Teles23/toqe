import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { createWrapper, mockAuthContext } from "@/test/render-helpers";
import { Perfil } from "@toqe/shared";
import { AgendaView } from "./AgendaView";

/* ── mocks globais ──────────────────────────────────────────────────────── */

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
          React.createElement(tag as string, props, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockAuthValue = { ...mockAuthContext };

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => mockAuthValue,
}));

const slotDono = {
  id: 1,
  time: "09:00",
  endTime: "09:30",
  client: "Cliente A",
  clientInitial: "C",
  service: "Corte",
  barbeiro: "Carlos",
  barbeiroInitial: "C",
  barbeiroUsrCodigo: 10,
  duration: 30,
  status: "pending" as const,
};

const slotBarbeiro = {
  id: 2,
  time: "10:00",
  endTime: "10:30",
  client: "Cliente B",
  clientInitial: "C",
  service: "Barba",
  barbeiro: "João",
  barbeiroInitial: "J",
  barbeiroUsrCodigo: 1, // codigo do user mockado
  duration: 30,
  status: "confirmed" as const,
};

vi.mock("../hooks/use-agenda", () => ({
  useAgenda: () => ({
    slots: [slotDono, slotBarbeiro],
    barbeiros: [
      { id: 10, nome: "Carlos", initial: "C", state: "idle", agendamentos: 1, livres: 2 },
      { id: 1, nome: "João", initial: "J", state: "idle", agendamentos: 1, livres: 2 },
    ],
    isLoading: false,
    isError: false,
  }),
  useAgendaSocket: vi.fn(),
}));

vi.mock("./AgendamentoModal", () => ({
  AgendamentoModal: () => null,
}));

vi.mock("./AgendaMetrics", () => ({
  AgendaMetrics: () => <div data-testid="agenda-metrics" />,
}));

vi.mock("./DateSelector", () => ({
  DateSelector: () => <div data-testid="date-selector" />,
}));

vi.mock("./BarbeiroPanel", () => ({
  BarbeiroPanel: () => <div data-testid="barbeiro-panel" />,
}));

vi.mock("./AgendaSlot", () => ({
  AgendaSlot: ({ slot }: { slot: { client: string } }) => (
    <div data-testid="agenda-slot">{slot.client}</div>
  ),
  AgendaSlotEmpty: () => <div data-testid="slot-empty" />,
}));

/* ── helpers ─────────────────────────────────────────────────────────────── */

function renderView() {
  const { Wrapper } = createWrapper();
  return render(<AgendaView />, { wrapper: Wrapper });
}

/* ── testes ──────────────────────────────────────────────────────────────── */

describe("AgendaView — filtro por role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset para dono por padrão
    Object.assign(mockAuthValue, {
      ...mockAuthContext,
      perfil: Perfil.DONO,
      user: { ...mockAuthContext.user, codigo: 99 },
    });
  });

  it("dono vê todos os agendamentos (2 slots)", () => {
    renderView();
    const slots = screen.getAllByTestId("agenda-slot");
    expect(slots).toHaveLength(2);
    expect(screen.getByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("Cliente B")).toBeInTheDocument();
  });

  it("barbeiro vê apenas os próprios agendamentos (barbeiroUsrCodigo === user.codigo)", () => {
    Object.assign(mockAuthValue, {
      ...mockAuthContext,
      perfil: Perfil.BARBEIRO,
      user: { ...mockAuthContext.user, codigo: 1 }, // mesmo codigo do slotBarbeiro
    });

    renderView();

    const slots = screen.getAllByTestId("agenda-slot");
    expect(slots).toHaveLength(1);
    expect(screen.getByText("Cliente B")).toBeInTheDocument();
    expect(screen.queryByText("Cliente A")).not.toBeInTheDocument();
  });

  it("barbeiro não vê slots de outros barbeiros mesmo que tenham mesmo nome", () => {
    Object.assign(mockAuthValue, {
      ...mockAuthContext,
      perfil: Perfil.BARBEIRO,
      user: { ...mockAuthContext.user, codigo: 999 }, // ID diferente de ambos os slots
    });

    renderView();

    expect(screen.queryByTestId("agenda-slot")).not.toBeInTheDocument();
    expect(screen.getByTestId("slot-empty")).toBeInTheDocument();
  });

  it("gerente vê todos os agendamentos", () => {
    Object.assign(mockAuthValue, {
      ...mockAuthContext,
      perfil: Perfil.GERENTE,
      user: { ...mockAuthContext.user, codigo: 99 },
    });

    renderView();

    const slots = screen.getAllByTestId("agenda-slot");
    expect(slots).toHaveLength(2);
  });

  it("barbeiro não recebe filtro de barbeiros (lista vazia passada ao AgendaFilters)", () => {
    // Indiretamente: barbeiro não vê botões de filtro por nome de barbeiro
    Object.assign(mockAuthValue, {
      ...mockAuthContext,
      perfil: Perfil.BARBEIRO,
      user: { ...mockAuthContext.user, codigo: 1 },
    });

    renderView();

    // Nenhum botão de filtro com nomes de barbeiros visível
    expect(screen.queryByRole("button", { name: /carlos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /joão/i })).not.toBeInTheDocument();
  });
});
