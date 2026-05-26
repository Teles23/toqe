import { act, render, screen } from "@testing-library/react-native";
import React from "react";

import { CountdownTimer } from "../CountdownTimer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-16T12:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renderiza label '2h 15min' para target a 2h15min de distância", () => {
    const target = new Date("2026-05-16T14:15:00Z");
    render(<CountdownTimer target={target} />);
    expect(screen.getByText("2h 15min")).toBeTruthy();
  });

  it("renderiza 'Agora!' para target no passado", () => {
    const target = new Date("2026-05-16T11:00:00Z");
    render(<CountdownTimer target={target} />);
    expect(screen.getByText("Agora!")).toBeTruthy();
  });

  it("atualiza o label conforme o tempo passa", () => {
    const target = new Date("2026-05-16T12:30:00Z");
    render(<CountdownTimer target={target} updateIntervalMs={60_000} />);
    expect(screen.getByText("Em 30min")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(15 * 60_000);
    });
    expect(screen.getByText("Em 15min")).toBeTruthy();
  });

  it("aceita ISO string como target", () => {
    render(<CountdownTimer target="2026-05-16T13:00:00Z" />);
    expect(screen.getByText("1h")).toBeTruthy();
  });
});
