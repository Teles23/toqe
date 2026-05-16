import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ScreenHeader } from "../ScreenHeader";

describe("ScreenHeader", () => {
  it("renderiza o título", () => {
    render(<ScreenHeader title="Agenda" />);
    expect(screen.getByText("Agenda")).toBeTruthy();
  });

  it("não renderiza subheader se não fornecido", () => {
    render(<ScreenHeader title="X" testID="hdr" />);
    expect(screen.queryByTestId("sub")).toBeNull();
  });

  it("renderiza subheader quando fornecido", () => {
    render(
      <ScreenHeader
        title="X"
        subheader={<Text testID="sub">sub-conteudo</Text>}
      />,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("renderiza right slot quando fornecido", () => {
    render(<ScreenHeader title="X" right={<Text testID="right">→</Text>} />);
    expect(screen.getByTestId("right")).toBeTruthy();
  });

  it("aplica testID customizado", () => {
    render(<ScreenHeader title="X" testID="my-header" />);
    expect(screen.getByTestId("my-header")).toBeTruthy();
  });
});
