import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { SearchInput } from "../SearchInput";

describe("SearchInput", () => {
  it("renderiza placeholder e ícone de busca", () => {
    render(
      <SearchInput value="" onChangeText={jest.fn()} placeholder="Buscar..." />,
    );
    expect(screen.getByText("🔍")).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar...").props.placeholder).toBe(
      "Buscar...",
    );
  });

  it("não mostra botão clear quando value vazio", () => {
    render(<SearchInput value="" onChangeText={jest.fn()} testID="s" />);
    expect(screen.queryByTestId("s-clear")).toBeNull();
  });

  it("mostra botão clear quando value não-vazio", () => {
    render(<SearchInput value="abc" onChangeText={jest.fn()} testID="s" />);
    expect(screen.getByTestId("s-clear")).toBeTruthy();
  });

  it("chama onChangeText('') ao clicar no clear", () => {
    const onChange = jest.fn();
    render(<SearchInput value="abc" onChangeText={onChange} testID="s" />);
    fireEvent.press(screen.getByTestId("s-clear"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("dispara onChangeText ao digitar", () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChangeText={onChange} testID="s" />);
    fireEvent.changeText(screen.getByTestId("s"), "novo texto");
    expect(onChange).toHaveBeenCalledWith("novo texto");
  });
});
