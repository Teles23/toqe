import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { BaseButton } from "../BaseButton";

describe("BaseButton", () => {
  it("renderiza o label e dispara onPress", () => {
    const onPress = jest.fn();
    render(
      <BaseButton
        label="Confirmar"
        onPress={onPress}
        bg="#f4b400"
        fg="#000000"
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mostra ActivityIndicator quando loading=true e bloqueia onPress", () => {
    const onPress = jest.fn();
    render(
      <BaseButton
        label="Salvar"
        loading
        onPress={onPress}
        bg="#f4b400"
        fg="#000000"
      />,
    );
    expect(screen.queryByText("Salvar")).toBeNull();
    expect(screen.getByTestId("button-loading")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("bloqueia onPress quando disabled=true", () => {
    const onPress = jest.fn();
    render(
      <BaseButton
        label="Bloqueado"
        disabled
        onPress={onPress}
        bg="#f4b400"
        fg="#000000"
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Bloqueado" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("expõe accessibilityState.busy=true quando loading", () => {
    render(<BaseButton label="Salvando" loading bg="#f4b400" fg="#000000" />);
    const btn = screen.getByRole("button", { name: "Salvando" });
    expect(btn.props.accessibilityState.busy).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it("usa accessibilityLabel customizado quando passado", () => {
    render(
      <BaseButton
        label="OK"
        accessibilityLabel="Confirmar pagamento"
        bg="#f4b400"
        fg="#000000"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Confirmar pagamento" }),
    ).toBeTruthy();
  });
});
