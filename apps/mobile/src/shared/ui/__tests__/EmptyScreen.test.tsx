import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { AmberButton } from "../AmberButton";
import { EmptyScreen } from "../EmptyScreen";

describe("EmptyScreen", () => {
  it("renderiza título", () => {
    render(<EmptyScreen title="Sem dados" />);
    expect(screen.getByText("Sem dados")).toBeTruthy();
  });

  it("renderiza ícone quando fornecido", () => {
    render(<EmptyScreen icon="📅" title="X" />);
    expect(screen.getByText("📅")).toBeTruthy();
  });

  it("renderiza description quando fornecida", () => {
    render(<EmptyScreen title="X" description="explicação detalhada" />);
    expect(screen.getByText("explicação detalhada")).toBeTruthy();
  });

  it("renderiza ação opcional", () => {
    const onPress = jest.fn();
    render(
      <EmptyScreen
        title="X"
        action={<AmberButton label="Tentar de novo" onPress={onPress} />}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onPress).toHaveBeenCalled();
  });

  it("aplica testID padrão", () => {
    render(<EmptyScreen title="X" />);
    expect(screen.getByTestId("empty-screen")).toBeTruthy();
  });
});
