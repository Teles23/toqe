import { render, screen } from "@testing-library/react-native";
import React from "react";

import { ClienteAvatar } from "../ClienteAvatar";

describe("ClienteAvatar", () => {
  it("renderiza as iniciais corretas para nome composto", () => {
    render(<ClienteAvatar nome="Marcos Silva" />);
    expect(screen.getByText("MS")).toBeTruthy();
  });

  it("renderiza 1 inicial para nome único", () => {
    render(<ClienteAvatar nome="Carlos" />);
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("renderiza placeholder '·' quando o nome é string vazia (não crasha)", () => {
    render(<ClienteAvatar nome="" />);
    expect(screen.getByText("·")).toBeTruthy();
  });

  it("respeita size customizado", () => {
    render(<ClienteAvatar nome="Ana" size={80} testID="big-avatar" />);
    const view = screen.getByTestId("big-avatar");
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 80, height: 80, borderRadius: 40 }),
      ]),
    );
  });

  it("expõe accessibilityLabel com o nome", () => {
    render(<ClienteAvatar nome="João" testID="avatar" />);
    expect(screen.getByTestId("avatar").props.accessibilityLabel).toBe(
      "Avatar de João",
    );
  });

  it("expõe accessibilityLabel 'cliente' quando nome vazio", () => {
    render(<ClienteAvatar nome="" testID="avatar" />);
    expect(screen.getByTestId("avatar").props.accessibilityLabel).toBe(
      "Avatar de cliente",
    );
  });
});
