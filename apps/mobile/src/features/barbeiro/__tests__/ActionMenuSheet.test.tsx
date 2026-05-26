jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { ActionMenuSheet } from "../ActionMenuSheet";

describe("ActionMenuSheet", () => {
  it("não renderiza botões quando visible=false", () => {
    render(
      <ActionMenuSheet
        visible={false}
        onClose={jest.fn()}
        onWalkin={jest.fn()}
        onBloqueio={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("menu-walkin")).toBeNull();
    expect(screen.queryByTestId("menu-bloqueio")).toBeNull();
  });

  it("renderiza botões walk-in e bloqueio quando visible=true", () => {
    render(
      <ActionMenuSheet
        visible
        onClose={jest.fn()}
        onWalkin={jest.fn()}
        onBloqueio={jest.fn()}
      />,
    );
    expect(screen.getByTestId("menu-walkin")).toBeTruthy();
    expect(screen.getByTestId("menu-bloqueio")).toBeTruthy();
  });

  it("chama onClose e onWalkin ao pressionar walk-in", () => {
    const onClose = jest.fn();
    const onWalkin = jest.fn();
    render(
      <ActionMenuSheet
        visible
        onClose={onClose}
        onWalkin={onWalkin}
        onBloqueio={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("menu-walkin"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onWalkin).toHaveBeenCalledTimes(1);
  });

  it("chama onClose e onBloqueio ao pressionar bloquear horário", () => {
    const onClose = jest.fn();
    const onBloqueio = jest.fn();
    render(
      <ActionMenuSheet
        visible
        onClose={onClose}
        onWalkin={jest.fn()}
        onBloqueio={onBloqueio}
      />,
    );
    fireEvent.press(screen.getByTestId("menu-bloqueio"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBloqueio).toHaveBeenCalledTimes(1);
  });

  it("exibe texto 'Adicionar' como título", () => {
    render(
      <ActionMenuSheet
        visible
        onClose={jest.fn()}
        onWalkin={jest.fn()}
        onBloqueio={jest.fn()}
      />,
    );
    expect(screen.getByText("Adicionar")).toBeTruthy();
  });

  it("exibe subtítulos descritivos dos botões", () => {
    render(
      <ActionMenuSheet
        visible
        onClose={jest.fn()}
        onWalkin={jest.fn()}
        onBloqueio={jest.fn()}
      />,
    );
    expect(screen.getByText("Encaixe")).toBeTruthy();
    expect(screen.getByText("Bloquear horário")).toBeTruthy();
  });
});
