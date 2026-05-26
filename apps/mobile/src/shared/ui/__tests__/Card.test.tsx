import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { Card } from "../Card";

describe("Card", () => {
  it("renderiza children como View estático quando não há handlers", () => {
    render(
      <Card testID="card-static">
        <Text>conteúdo</Text>
      </Card>,
    );
    expect(screen.getByText("conteúdo")).toBeTruthy();
    const node = screen.getByTestId("card-static");
    expect(node.props.accessibilityRole).toBeUndefined();
  });

  it("renderiza como Pressable e chama onPress quando handler é fornecido", () => {
    const onPress = jest.fn();
    render(
      <Card testID="card-press" onPress={onPress} accessibilityLabel="card">
        <Text>x</Text>
      </Card>,
    );
    fireEvent.press(screen.getByTestId("card-press"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("chama onLongPress no long-press", () => {
    const onLongPress = jest.fn();
    render(
      <Card
        testID="card-long"
        onLongPress={onLongPress}
        accessibilityLabel="long"
      >
        <Text>x</Text>
      </Card>,
    );
    fireEvent(screen.getByTestId("card-long"), "longPress");
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
