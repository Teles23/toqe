import { render, screen } from "@testing-library/react-native";
import React from "react";

import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renderiza label padrão por status", () => {
    render(<StatusBadge status="confirmado" />);
    expect(screen.getByText("Confirmado")).toBeTruthy();
  });

  it("aceita label customizado", () => {
    render(<StatusBadge status="pendente" label="Aguardando barbeiro" />);
    expect(screen.getByText("Aguardando barbeiro")).toBeTruthy();
  });

  it("mostra PulsingDot apenas em confirmado e online", () => {
    const { rerender, queryByTestId } = render(
      <StatusBadge status="confirmado" />,
    );
    expect(queryByTestId("pulsing-dot")).toBeTruthy();

    rerender(<StatusBadge status="online" />);
    expect(queryByTestId("pulsing-dot")).toBeTruthy();

    rerender(<StatusBadge status="cancelado" />);
    expect(queryByTestId("pulsing-dot")).toBeNull();

    rerender(<StatusBadge status="pendente" />);
    expect(queryByTestId("pulsing-dot")).toBeNull();

    rerender(<StatusBadge status="concluido" />);
    expect(queryByTestId("pulsing-dot")).toBeNull();
  });

  it("expõe accessibilityLabel com o texto do status", () => {
    render(<StatusBadge status="cancelado" />);
    const node = screen.getByTestId("status-badge-cancelado");
    expect(node.props.accessibilityLabel).toBe("Cancelado");
  });
});
