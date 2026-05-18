import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { QuickActionBar } from "../QuickActionBar";

describe("QuickActionBar", () => {
  it("renderiza cada ação com seu label", () => {
    render(
      <QuickActionBar
        actions={[
          {
            key: "iniciar",
            icon: "play",
            label: "Iniciar",
            onPress: jest.fn(),
          },
          {
            key: "concluir",
            icon: "check",
            label: "Concluir",
            onPress: jest.fn(),
          },
        ]}
      />,
    );
    expect(screen.getByText("Iniciar")).toBeTruthy();
    expect(screen.getByText("Concluir")).toBeTruthy();
  });

  it("dispara onPress da ação tocada", () => {
    const iniciar = jest.fn();
    const concluir = jest.fn();
    render(
      <QuickActionBar
        actions={[
          { key: "iniciar", icon: "play", label: "Iniciar", onPress: iniciar },
          {
            key: "concluir",
            icon: "check",
            label: "Concluir",
            onPress: concluir,
          },
        ]}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Iniciar" }));
    expect(iniciar).toHaveBeenCalledTimes(1);
    expect(concluir).not.toHaveBeenCalled();
  });

  it("não dispara onPress quando a ação está disabled", () => {
    const onPress = jest.fn();
    render(
      <QuickActionBar
        actions={[
          {
            key: "iniciar",
            icon: "play",
            label: "Iniciar",
            onPress,
            disabled: true,
          },
        ]}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Iniciar" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
