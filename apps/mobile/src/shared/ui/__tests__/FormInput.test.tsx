import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { FormInput } from "../FormInput";

describe("FormInput", () => {
  it("renderiza o label", () => {
    render(<FormInput label="E-mail" value="" onChangeText={jest.fn()} />);
    expect(screen.getByText("E-mail")).toBeTruthy();
  });

  it("renderiza hint ao lado do label", () => {
    render(
      <FormInput
        label="Telefone"
        hint="(opcional)"
        value=""
        onChangeText={jest.fn()}
      />,
    );
    expect(screen.getByText(/Telefone/)).toBeTruthy();
    expect(screen.getByText(/opcional/)).toBeTruthy();
  });

  it("chama onChangeText ao digitar", () => {
    const onChangeText = jest.fn();
    render(<FormInput label="Nome" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText("Nome"), "Carlos");
    expect(onChangeText).toHaveBeenCalledWith("Carlos");
  });

  it("exibe mensagem de erro com role=alert", () => {
    render(
      <FormInput
        label="E-mail"
        value=""
        onChangeText={jest.fn()}
        error="E-mail inválido"
      />,
    );
    const err = screen.getByRole("alert");
    expect(err.props.children).toBe("E-mail inválido");
  });

  it("não renderiza container de erro quando error é undefined", () => {
    render(<FormInput label="E-mail" value="" onChangeText={jest.fn()} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("usa accessibilityLabel customizado quando fornecido", () => {
    render(
      <FormInput
        label="Senha"
        accessibilityLabel="Campo de senha"
        value=""
        onChangeText={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Campo de senha")).toBeTruthy();
  });

  it("repassa secureTextEntry para o TextInput", () => {
    render(
      <FormInput
        label="Senha"
        secureTextEntry
        value=""
        onChangeText={jest.fn()}
      />,
    );
    const input = screen.getByLabelText("Senha");
    expect(input.props.secureTextEntry).toBe(true);
  });
});
