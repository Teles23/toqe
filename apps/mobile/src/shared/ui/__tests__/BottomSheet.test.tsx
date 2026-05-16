import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { BottomSheet } from "../BottomSheet";

describe("BottomSheet", () => {
  it("não renderiza conteúdo quando visible=false (Modal escondido)", () => {
    render(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <Text>conteúdo</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText("conteúdo")).toBeNull();
  });

  it("renderiza conteúdo quando visible=true", () => {
    render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>conteúdo</Text>
      </BottomSheet>,
    );
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  it("passa onClose para o onRequestClose do Modal (back-button Android)", () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose}>
        <Text>x</Text>
      </BottomSheet>,
    );
    const modal = screen.getByTestId("bottom-sheet");
    expect(typeof modal.props.onRequestClose).toBe("function");
  });
});
