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

import { BloqueioSheet } from "../BloqueioSheet";

describe("BloqueioSheet", () => {
  it("não renderiza conteúdo quando visible=false", () => {
    render(
      <BloqueioSheet
        visible={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("confirm-bloqueio")).toBeNull();
  });

  it("renderiza todos os motivos quando visible=true", () => {
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByTestId("motivo-Almoço")).toBeTruthy();
    expect(screen.getByTestId("motivo-Limpeza")).toBeTruthy();
    expect(screen.getByTestId("motivo-Folga pessoal")).toBeTruthy();
    expect(screen.getByTestId("motivo-Outro")).toBeTruthy();
  });

  it("renderiza todos os chips de duração", () => {
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={jest.fn()} />);
    [15, 30, 45, 60, 90, 120].forEach((d) => {
      expect(screen.getByTestId(`duracao-${d}`)).toBeTruthy();
    });
  });

  it("seleção de motivo altera estado ao pressionar chip", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("motivo-Limpeza"));
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: "Limpeza" }),
    );
  });

  it("seleção de duração altera estado ao pressionar chip", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("duracao-90"));
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 90 }),
    );
  });

  it("duração padrão inicial é 60min", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 60 }),
    );
  });

  it("motivo padrão inicial é Almoço", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: "Almoço" }),
    );
  });

  it("toggle recorrente muda de false para true", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent(screen.getByTestId("toggle-recorrente"), "valueChange", true);
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ recorrente: true }),
    );
  });

  it("recorrente padrão é false", () => {
    const onConfirm = jest.fn();
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-bloqueio"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ recorrente: false }),
    );
  });

  it("botão de confirmação exibe duração selecionada", () => {
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={jest.fn()} />);
    // Default 60 min
    expect(screen.getByText("Bloquear próximos 60min")).toBeTruthy();
  });

  it("botão atualiza texto ao mudar duração", () => {
    render(<BloqueioSheet visible onClose={jest.fn()} onConfirm={jest.fn()} />);
    fireEvent.press(screen.getByTestId("duracao-30"));
    expect(screen.getByText("Bloquear próximos 30min")).toBeTruthy();
  });

  it("botão confirm desabilitado quando loading=true", () => {
    render(
      <BloqueioSheet
        visible
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        loading
      />,
    );
    const btn = screen.getByTestId("confirm-bloqueio");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });
});
