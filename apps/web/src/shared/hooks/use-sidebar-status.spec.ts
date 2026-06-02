import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Perfil } from "@toqe/shared";
import {
  useSidebarStatus,
  calcularAberta,
} from "./use-sidebar-status";
import { createWrapper } from "@/test/render-helpers";
import type { HorarioDia } from "@/features/configuracoes/types/configuracao.types";

const mockFetchDashboard = vi.fn();
const mockGetHorarios = vi.fn();

vi.mock("@/features/dashboard/services/dashboard.service", () => ({
  fetchDashboardOverview: (...args: unknown[]) =>
    mockFetchDashboard(...args),
}));

vi.mock("@/features/configuracoes/services/configuracao.service", () => ({
  configuracaoService: {
    getBarbearia: vi.fn(),
    getHorarios: (...args: unknown[]) => mockGetHorarios(...args),
    updateBarbearia: vi.fn(),
    updateHorarios: vi.fn(),
    getNotificacoes: vi.fn(),
    updateNotificacoes: vi.fn(),
    uploadLogo: vi.fn(),
  },
}));

// ─── calcularAberta ────────────────────────────────────────────────────────

describe("calcularAberta", () => {
  const diaAberto = (diaSemana: number): HorarioDia => ({
    diaSemana,
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  });

  it("retorna false quando horarios está vazio", () => {
    expect(calcularAberta([])).toBe(false);
  });

  it("retorna false quando o dia está marcado como fechado", () => {
    const agora = new Date();
    const horarios: HorarioDia[] = [
      { diaSemana: agora.getDay(), aberto: false, abertura: "09:00", fechamento: "19:00" },
    ];
    expect(calcularAberta(horarios)).toBe(false);
  });

  it("retorna false quando o dia atual não consta nos horarios", () => {
    // Usa um dia diferente do atual
    const diaDiferente = (new Date().getDay() + 1) % 7;
    expect(calcularAberta([diaAberto(diaDiferente)])).toBe(false);
  });

  it("retorna true quando estamos dentro do horário de funcionamento", () => {
    const agora = new Date();
    const hInicio = agora.getHours() - 1;
    const hFim = agora.getHours() + 1;
    const horarios: HorarioDia[] = [
      {
        diaSemana: agora.getDay(),
        aberto: true,
        abertura: `${String(hInicio).padStart(2, "0")}:00`,
        fechamento: `${String(hFim).padStart(2, "0")}:00`,
      },
    ];
    expect(calcularAberta(horarios)).toBe(true);
  });

  it("retorna false quando estamos antes do horário de abertura", () => {
    const agora = new Date();
    // Define abertura 1 hora no futuro
    const hInicio = agora.getHours() + 1;
    const horarios: HorarioDia[] = [
      {
        diaSemana: agora.getDay(),
        aberto: true,
        abertura: `${String(hInicio).padStart(2, "0")}:00`,
        fechamento: `${String(hInicio + 2).padStart(2, "0")}:00`,
      },
    ];
    expect(calcularAberta(horarios)).toBe(false);
  });

  it("retorna false quando estamos após o horário de fechamento", () => {
    const agora = new Date();
    const hFim = Math.max(0, agora.getHours() - 1);
    const horarios: HorarioDia[] = [
      {
        diaSemana: agora.getDay(),
        aberto: true,
        abertura: "00:00",
        fechamento: `${String(hFim).padStart(2, "0")}:00`,
      },
    ];
    expect(calcularAberta(horarios)).toBe(false);
  });
});

// ─── useSidebarStatus ──────────────────────────────────────────────────────

describe("useSidebarStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fica inativo quando barCodigo é null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSidebarStatus(null, null), {
      wrapper: Wrapper,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.barbeirosAtivos).toBe(0);
    expect(result.current.aberta).toBe(false);
    expect(mockFetchDashboard).not.toHaveBeenCalled();
    expect(mockGetHorarios).not.toHaveBeenCalled();
  });

  it("retorna isLoading true enquanto as queries estão pendentes", () => {
    mockFetchDashboard.mockReturnValue(new Promise(() => {}));
    mockGetHorarios.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSidebarStatus(1, Perfil.DONO), {
      wrapper: Wrapper,
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("retorna barbeirosAtivos e aberta quando ambas as queries resolvem", async () => {
    const agora = new Date();
    const hInicio = agora.getHours() - 1;
    const hFim = agora.getHours() + 1;

    mockFetchDashboard.mockResolvedValueOnce({
      kpis: [],
      liveMetrics: [
        { label: "Barbeiros ativos", value: "3", color: "green" },
      ],
      barbeiros: [],
      faturamento: { semana: [], mes: [] },
      servicos: [],
      atividade: [],
    });

    mockGetHorarios.mockResolvedValueOnce([
      {
        diaSemana: agora.getDay(),
        aberto: true,
        abertura: `${String(hInicio).padStart(2, "0")}:00`,
        fechamento: `${String(hFim).padStart(2, "0")}:00`,
      },
    ]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSidebarStatus(1, Perfil.DONO), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.barbeirosAtivos).toBe(3);
    expect(result.current.aberta).toBe(true);
  });

  it("retorna aberta=false quando a barbearia está fora do horário", async () => {
    mockFetchDashboard.mockResolvedValueOnce({
      kpis: [],
      liveMetrics: [
        { label: "Barbeiros ativos", value: "0", color: "green" },
      ],
      barbeiros: [],
      faturamento: { semana: [], mes: [] },
      servicos: [],
      atividade: [],
    });

    // Define horários no passado
    mockGetHorarios.mockResolvedValueOnce([
      {
        diaSemana: new Date().getDay(),
        aberto: true,
        abertura: "00:00",
        fechamento: "00:01",
      },
    ]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSidebarStatus(1, Perfil.DONO), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.aberta).toBe(false);
  });

  it("retorna barbeirosAtivos=0 quando liveMetrics está vazio", async () => {
    mockFetchDashboard.mockResolvedValueOnce({
      kpis: [],
      liveMetrics: [],
      barbeiros: [],
      faturamento: { semana: [], mes: [] },
      servicos: [],
      atividade: [],
    });
    mockGetHorarios.mockResolvedValueOnce([]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSidebarStatus(1, Perfil.DONO), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.barbeirosAtivos).toBe(0);
  });

  it("chama o dashboard service com o barCodigo correto", async () => {
    mockFetchDashboard.mockResolvedValueOnce({
      kpis: [],
      liveMetrics: [{ label: "Barbeiros ativos", value: "1", color: "green" }],
      barbeiros: [],
      faturamento: { semana: [], mes: [] },
      servicos: [],
      atividade: [],
    });
    mockGetHorarios.mockResolvedValueOnce([]);

    const { Wrapper } = createWrapper();
    renderHook(() => useSidebarStatus(42, Perfil.DONO), { wrapper: Wrapper });

    await waitFor(() => expect(mockFetchDashboard).toHaveBeenCalledWith(42));
    expect(mockGetHorarios).toHaveBeenCalledWith(42);
  });

  it("não chama dashboard quando perfil é barbeiro (endpoint é owner-only)", () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useSidebarStatus(1, Perfil.BARBEIRO), {
      wrapper: Wrapper,
    });
    expect(mockFetchDashboard).not.toHaveBeenCalled();
  });
});
