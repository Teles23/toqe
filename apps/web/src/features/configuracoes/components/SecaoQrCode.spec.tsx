import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SecaoQrCode } from "./SecaoQrCode";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockWriteText = vi.fn();

describe("SecaoQrCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  it("exibe QR code com a URL correta baseada no slug", () => {
    render(<SecaoQrCode slug="minha-barber" />);
    const img = screen.getByTestId("qr-image");
    expect(img.getAttribute("src")).toContain(
      encodeURIComponent("https://app.toqe-barber.com.br/b/minha-barber"),
    );
  });

  it("mostra a URL legível abaixo do QR code", () => {
    render(<SecaoQrCode slug="minha-barber" />);
    expect(screen.getByTestId("qr-url")).toHaveTextContent(
      "https://app.toqe-barber.com.br/b/minha-barber",
    );
  });

  it("exibe botão de imprimir", () => {
    render(<SecaoQrCode slug="urban" />);
    expect(screen.getByTestId("btn-imprimir")).toBeInTheDocument();
  });

  it("botão Copiar link chama clipboard.writeText com a URL correta", async () => {
    render(<SecaoQrCode slug="urban" />);
    const btn = screen.getByTestId("btn-copiar");
    fireEvent.click(btn);
    await vi.waitFor(() =>
      expect(mockWriteText).toHaveBeenCalledWith(
        "https://app.toqe-barber.com.br/b/urban",
      ),
    );
  });

  it("botão Imprimir chama window.print()", () => {
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);
    render(<SecaoQrCode slug="urban" />);
    fireEvent.click(screen.getByTestId("btn-imprimir"));
    expect(printMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
