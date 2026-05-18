import { render, screen } from "@testing-library/react-native";
import React from "react";

import { TimeDisplay } from "../TimeDisplay";

describe("TimeDisplay", () => {
  it("renderiza o horário em todos os tamanhos sem crash", () => {
    const sizes: ("sm" | "md" | "lg" | "xl")[] = ["sm", "md", "lg", "xl"];
    for (const size of sizes) {
      const { unmount } = render(<TimeDisplay time="16:30" size={size} />);
      expect(screen.getByText("16:30")).toBeTruthy();
      unmount();
    }
  });

  it("expõe accessibilityLabel com o horário", () => {
    render(<TimeDisplay time="14:00" />);
    expect(screen.getByTestId("time-display").props.accessibilityLabel).toBe(
      "14:00",
    );
  });

  it("aceita string com intervalo de horários", () => {
    render(<TimeDisplay time="14:00 - 14:45" />);
    expect(screen.getByText("14:00 - 14:45")).toBeTruthy();
  });
});
