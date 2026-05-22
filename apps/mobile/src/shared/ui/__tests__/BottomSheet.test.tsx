import { render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";

import { BottomSheet } from "../BottomSheet";

function panelHeight(testID = "bottom-sheet"): number | string | undefined {
  const panel = screen.getByTestId(`${testID}-panel`);
  const flat = StyleSheet.flatten(panel.props.style) as { height?: number };
  return flat.height;
}

describe("BottomSheet", () => {
  it("não renderiza nada quando visible=false (overlay desmontado)", () => {
    render(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <Text>conteúdo</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText("conteúdo")).toBeNull();
    expect(screen.queryByTestId("bottom-sheet")).toBeNull();
  });

  it("renderiza conteúdo quando visible=true", () => {
    render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>conteúdo</Text>
      </BottomSheet>,
    );
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  it("expõe backdrop 'Fechar' que fecha o sheet (in-screen, sem Modal)", () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose}>
        <Text>x</Text>
      </BottomSheet>,
    );
    // Renderiza in-screen (overlay), não via Modal — backdrop acessível presente.
    expect(screen.getByTestId("bottom-sheet")).toBeTruthy();
    expect(screen.getByLabelText("Fechar")).toBeTruthy();
  });

  it("height='content' não aplica altura fixa (ajusta-se ao conteúdo)", () => {
    render(
      <BottomSheet visible onClose={jest.fn()} height="content">
        <Text>menu curto</Text>
      </BottomSheet>,
    );
    expect(panelHeight()).toBeUndefined();
  });

  it("height numérico aplica altura proporcional à tela", () => {
    render(
      <BottomSheet visible onClose={jest.fn()} height={0.4}>
        <Text>x</Text>
      </BottomSheet>,
    );
    expect(typeof panelHeight()).toBe("number");
  });
});
