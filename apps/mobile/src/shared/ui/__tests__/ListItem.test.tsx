import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ListItem } from "../ListItem";

describe("ListItem", () => {
  it("renderiza label", () => {
    render(<ListItem label="Editar perfil" />);
    expect(screen.getByText("Editar perfil")).toBeTruthy();
  });

  it("renderiza subtitle quando fornecido", () => {
    render(<ListItem label="Sessões" subtitle="3 ativas" />);
    expect(screen.getByText("Sessões")).toBeTruthy();
    expect(screen.getByText("3 ativas")).toBeTruthy();
  });

  it("renderiza leading slot", () => {
    render(<ListItem label="X" leading={<Text testID="lead">L</Text>} />);
    expect(screen.getByTestId("lead")).toBeTruthy();
  });

  it("renderiza trailing arrow", () => {
    render(<ListItem label="X" trailing={{ kind: "arrow" }} />);
    expect(screen.getByText("›")).toBeTruthy();
  });

  it("renderiza trailing switch e dispara onValueChange", () => {
    const onChange = jest.fn();
    render(
      <ListItem
        label="Email"
        trailing={{ kind: "switch", value: false, onValueChange: onChange }}
      />,
    );
    const sw = screen.getByRole("switch");
    fireEvent(sw, "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renderiza trailing radio selected", () => {
    render(
      <ListItem
        label="Op A"
        trailing={{ kind: "radio", selected: true }}
        testID="li"
      />,
    );
    expect(screen.getByTestId("li")).toBeTruthy();
  });

  it("renderiza trailing node custom", () => {
    render(
      <ListItem
        label="X"
        trailing={{ kind: "node", node: <Text testID="tn">custom</Text> }}
      />,
    );
    expect(screen.getByTestId("tn")).toBeTruthy();
  });

  it("é Pressable quando onPress é fornecido", () => {
    const onPress = jest.fn();
    render(<ListItem label="X" onPress={onPress} testID="li" />);
    fireEvent.press(screen.getByTestId("li"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("é View estático quando onPress ausente", () => {
    render(<ListItem label="X" testID="li" />);
    const node = screen.getByTestId("li");
    // View não tem accessibilityRole="button"
    expect(node.props.accessibilityRole).toBeUndefined();
  });

  it("variante danger funciona (renderiza sem erro)", () => {
    render(<ListItem label="Excluir" danger onPress={jest.fn()} testID="li" />);
    expect(screen.getByText("Excluir")).toBeTruthy();
  });
});
