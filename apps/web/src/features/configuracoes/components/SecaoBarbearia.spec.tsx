import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SecaoBarbearia } from "./SecaoBarbearia";

const mockUpdateMutate = vi.fn();
const mockUploadMutate = vi.fn();

let mockData: Record<string, unknown> | undefined;

vi.mock("../hooks/use-configuracao", () => ({
  useConfiguracaoBarbearia: () => ({
    data: mockData,
    update: { mutate: mockUpdateMutate, isPending: false },
    uploadLogo: { mutate: mockUploadMutate, isPending: false },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("SecaoBarbearia — permissões dos barbeiros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = {
      nome: "Barber Alpha",
      telefone: "11999999999",
      email: "a@x.com",
      endereco: "Rua X",
      barbeiroCriaServico: false,
      barbeiroAlteraPreco: false,
    };
  });

  it("renderiza os dois toggles de permissão", () => {
    render(<SecaoBarbearia barCodigo={1} />);
    expect(screen.getByTestId("toggle-barbeiro-cria-servico")).toBeTruthy();
    expect(screen.getByTestId("toggle-barbeiro-altera-preco")).toBeTruthy();
  });

  it("reflete os valores vindos do servidor (aria-checked)", () => {
    mockData = { ...mockData!, barbeiroAlteraPreco: true };
    render(<SecaoBarbearia barCodigo={1} />);
    expect(
      screen
        .getByTestId("toggle-barbeiro-altera-preco")
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByTestId("toggle-barbeiro-cria-servico")
        .getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("salvar envia as flags de permissão no payload", () => {
    render(<SecaoBarbearia barCodigo={1} />);

    fireEvent.click(screen.getByTestId("toggle-barbeiro-cria-servico"));
    fireEvent.click(screen.getByText("Salvar alterações"));

    expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    const payload = mockUpdateMutate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      barbeiroCriaServico: true,
      barbeiroAlteraPreco: false,
    });
  });
});
