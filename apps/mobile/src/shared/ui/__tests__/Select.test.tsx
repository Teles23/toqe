import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { Select } from "../Select";

describe("Select", () => {
  const options = [
    { value: 1, label: "Opção A" },
    { value: 2, label: "Opção B" },
    { value: 3, label: "Opção C" },
  ];

  it("exibe o placeholder quando não há valor", () => {
    render(
      <Select
        label="Escolha"
        value={null}
        options={options}
        onChange={jest.fn()}
        placeholder="Pick one"
      />,
    );
    expect(screen.getByText("Pick one")).toBeTruthy();
  });

  it("exibe o label da opção selecionada", () => {
    render(
      <Select
        label="Escolha"
        value={2}
        options={options}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("Opção B")).toBeTruthy();
  });

  it("abre o modal ao tocar e chama onChange ao selecionar opção", () => {
    const onChange = jest.fn();
    render(
      <Select
        label="Escolha"
        value={null}
        options={options}
        onChange={onChange}
        testID="my-select"
      />,
    );

    fireEvent.press(screen.getByTestId("my-select"));
    fireEvent.press(screen.getByTestId("my-select-option-2"));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("expõe accessibilityRole='combobox' e expanded state", () => {
    render(
      <Select
        label="Escolha"
        value={null}
        options={options}
        onChange={jest.fn()}
        testID="my-select"
      />,
    );
    const trigger = screen.getByTestId("my-select");
    expect(trigger.props.accessibilityRole).toBe("combobox");
    expect(trigger.props.accessibilityState.expanded).toBe(false);
  });

  it("exibe mensagem de erro com role=alert", () => {
    render(
      <Select
        label="Escolha"
        value={null}
        options={options}
        onChange={jest.fn()}
        error="Campo obrigatório"
      />,
    );
    expect(screen.getByRole("alert").props.children).toBe("Campo obrigatório");
  });
});
