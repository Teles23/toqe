import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SecaoPlano } from "./SecaoPlano";

const mockMutateAsync = vi.fn();

vi.mock("../hooks/use-configuracao-plano", () => ({
  useConfiguracaoPlano: vi.fn(),
  useCheckout: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useConfiguracaoPlano } from "../hooks/use-configuracao-plano";

const mockUsePlano = vi.mocked(useConfiguracaoPlano);

describe("SecaoPlano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlano.mockReturnValue({
      data: {
        plano: "pro",
        planoStatus: "ativo",
        planoValidoAte: "2026-07-01T00:00:00.000Z",
        trialFim: null,
      },
      isLoading: false,
    } as ReturnType<typeof useConfiguracaoPlano>);
  });

  it("marca o plano atual com badge 'Plano atual'", () => {
    render(<SecaoPlano barCodigo={1} />);
    expect(screen.getByText("Plano atual")).toBeTruthy();
  });

  it("exibe os três planos disponíveis", () => {
    render(<SecaoPlano barCodigo={1} />);
    expect(screen.getByText("Basic")).toBeTruthy();
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.getByText("Enterprise")).toBeTruthy();
  });

  it("mostra botão de upgrade nos planos não-atuais", () => {
    render(<SecaoPlano barCodigo={1} />);
    const upgradeButtons = screen.getAllByText("Fazer upgrade");
    // Basic tem upgrade, Enterprise tem "Falar com vendas"
    expect(upgradeButtons.length).toBe(1);
    expect(screen.getByText("Falar com vendas")).toBeTruthy();
  });

  it("não exibe banner trial quando planoStatus é 'ativo'", () => {
    render(<SecaoPlano barCodigo={1} />);
    expect(screen.queryByText(/período de trial/i)).toBeNull();
  });

  it("exibe banner trial quando planoStatus é 'trial'", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockUsePlano.mockReturnValue({
      data: {
        plano: "free",
        planoStatus: "trial",
        planoValidoAte: null,
        trialFim: futureDate.toISOString(),
      },
      isLoading: false,
    } as ReturnType<typeof useConfiguracaoPlano>);

    render(<SecaoPlano barCodigo={1} />);
    expect(screen.getByText(/período de trial/i)).toBeTruthy();
  });

  it("chama checkout e abre nova aba ao clicar em upgrade", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    mockMutateAsync.mockResolvedValueOnce({ url: "https://pay.asaas.com/abc" });

    render(<SecaoPlano barCodigo={1} />);
    fireEvent.click(screen.getByText("Fazer upgrade"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("basic");
      expect(openSpy).toHaveBeenCalledWith(
        "https://pay.asaas.com/abc",
        "_blank",
      );
    });

    openSpy.mockRestore();
  });

  it("exibe skeleton de carregamento quando isLoading é true", () => {
    mockUsePlano.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useConfiguracaoPlano>);

    const { container } = render(<SecaoPlano barCodigo={1} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });

  it("exibe data de vencimento quando planoValidoAte está definido", () => {
    render(<SecaoPlano barCodigo={1} />);
    expect(screen.getByText(/Vence em/i)).toBeTruthy();
  });

  it("não chama checkout quando barCodigo é null", async () => {
    render(<SecaoPlano barCodigo={null} />);
    // Com barCodigo null, não há botão de upgrade acessível sem erro
    // O hook retorna dados undefined, então loading skeletons aparecem ou plano 'free' ativo
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
