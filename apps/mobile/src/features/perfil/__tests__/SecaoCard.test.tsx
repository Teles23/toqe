import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { SecaoCard } from "../SecaoCard";

describe("SecaoCard", () => {
  it("renderiza children", () => {
    render(
      <SecaoCard>
        <Text testID="child">conteudo</Text>
      </SecaoCard>,
    );
    expect(screen.getByTestId("child")).toBeTruthy();
  });

  it("renderiza título em uppercase quando fornecido", () => {
    render(
      <SecaoCard title="Conta">
        <Text>x</Text>
      </SecaoCard>,
    );
    expect(screen.getByText("Conta")).toBeTruthy();
  });

  it("não renderiza título quando ausente", () => {
    render(
      <SecaoCard>
        <Text>x</Text>
      </SecaoCard>,
    );
    expect(screen.queryByText(/conta/i)).toBeNull();
  });
});
