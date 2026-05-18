import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { AmberButton } from "../AmberButton";

describe("AmberButton", () => {
  it("renderiza e dispara onPress", () => {
    const onPress = jest.fn();
    render(<AmberButton label="Agendar" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: "Agendar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mostra spinner em loading e bloqueia toque", () => {
    const onPress = jest.fn();
    render(<AmberButton label="Salvar" loading onPress={onPress} />);
    expect(screen.queryByText("Salvar")).toBeNull();
    expect(screen.getByTestId("button-loading")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
