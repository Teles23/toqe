import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { TipoContaToggle } from "../TipoContaToggle";

describe("TipoContaToggle", () => {
  it("renderiza ambas as opções", () => {
    render(<TipoContaToggle value="cliente" onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Cliente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Barbeiro" })).toBeTruthy();
  });

  it("expõe accessibilityState.selected na opção ativa", () => {
    render(<TipoContaToggle value="barbeiro" onChange={jest.fn()} />);
    const barbeiro = screen.getByRole("button", { name: "Barbeiro" });
    const cliente = screen.getByRole("button", { name: "Cliente" });
    expect(barbeiro.props.accessibilityState.selected).toBe(true);
    expect(cliente.props.accessibilityState.selected).toBe(false);
  });

  it("chama onChange ao tocar em opção diferente", () => {
    const onChange = jest.fn();
    render(<TipoContaToggle value="cliente" onChange={onChange} />);
    fireEvent.press(screen.getByRole("button", { name: "Barbeiro" }));
    expect(onChange).toHaveBeenCalledWith("barbeiro");
  });

  it("chama onChange mesmo ao tocar na opção já ativa (idempotente)", () => {
    const onChange = jest.fn();
    render(<TipoContaToggle value="cliente" onChange={onChange} />);
    fireEvent.press(screen.getByRole("button", { name: "Cliente" }));
    expect(onChange).toHaveBeenCalledWith("cliente");
  });

  it("usa role=radiogroup no container", () => {
    render(
      <TipoContaToggle
        value="cliente"
        onChange={jest.fn()}
        testID="my-toggle"
      />,
    );
    expect(screen.getByTestId("my-toggle").props.accessibilityRole).toBe(
      "radiogroup",
    );
  });
});
