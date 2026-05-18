import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { DangerButton } from "../DangerButton";

describe("DangerButton", () => {
  it("renderiza e dispara onPress", () => {
    const onPress = jest.fn();
    render(<DangerButton label="Cancelar" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mostra spinner em loading e bloqueia toque", () => {
    const onPress = jest.fn();
    render(<DangerButton label="Removendo" loading onPress={onPress} />);
    expect(screen.queryByText("Removendo")).toBeNull();
    expect(screen.getByTestId("button-loading")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Removendo" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
