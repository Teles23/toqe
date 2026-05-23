import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import {
  OrdenarClientesSheet,
  SORT_CLIENTES_OPTIONS,
} from "../OrdenarClientesSheet";

describe("OrdenarClientesSheet", () => {
  it("não renderiza quando visible=false", () => {
    render(
      <OrdenarClientesSheet
        visible={false}
        onClose={jest.fn()}
        value="nomeAsc"
        onSelect={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("ordenar-clientes-sheet")).toBeNull();
  });

  it("lista todas as opções de ordenação", () => {
    render(
      <OrdenarClientesSheet
        visible
        onClose={jest.fn()}
        value="nomeAsc"
        onSelect={jest.fn()}
      />,
    );
    for (const opt of SORT_CLIENTES_OPTIONS) {
      expect(screen.getByTestId(`sort-option-${opt.id}`)).toBeTruthy();
    }
  });

  it("seleciona uma opção e fecha o sheet", () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(
      <OrdenarClientesSheet
        visible
        onClose={onClose}
        value="nomeAsc"
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByTestId("sort-option-totalGasto"));
    expect(onSelect).toHaveBeenCalledWith("totalGasto");
    expect(onClose).toHaveBeenCalled();
  });

  it("marca a opção ativa com accessibilityState checked", () => {
    render(
      <OrdenarClientesSheet
        visible
        onClose={jest.fn()}
        value="ultimaRecente"
        onSelect={jest.fn()}
      />,
    );
    const ativa = screen.getByTestId("sort-option-ultimaRecente");
    expect(ativa.props.accessibilityState).toMatchObject({ checked: true });
    const outra = screen.getByTestId("sort-option-nomeAsc");
    expect(outra.props.accessibilityState).toMatchObject({ checked: false });
  });
});
