import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { Button } from "../Button";

describe("Button", () => {
  it("renderiza o label", () => {
    render(<Button label="Entrar" onPress={jest.fn()} />);
    expect(screen.getByText("Entrar")).toBeTruthy();
  });

  it("chama onPress no toque", () => {
    const onPress = jest.fn();
    render(<Button label="Confirmar" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mostra ActivityIndicator quando loading=true e esconde o label", () => {
    render(<Button label="Salvar" onPress={jest.fn()} loading />);
    expect(screen.queryByText("Salvar")).toBeNull();
    expect(screen.getByTestId("button-loading")).toBeTruthy();
  });

  it("não dispara onPress quando loading=true", () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} loading />);
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("não dispara onPress quando disabled=true", () => {
    const onPress = jest.fn();
    render(<Button label="Bloqueado" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole("button", { name: "Bloqueado" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("expõe accessibilityState.busy=true quando loading", () => {
    render(<Button label="Salvando" onPress={jest.fn()} loading />);
    const btn = screen.getByRole("button", { name: "Salvando" });
    expect(btn.props.accessibilityState.busy).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});
