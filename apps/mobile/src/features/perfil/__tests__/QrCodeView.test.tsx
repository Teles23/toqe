import { render, screen } from "@testing-library/react-native";
import React from "react";

import { QrCodeView } from "../QrCodeView";

describe("QrCodeView", () => {
  it("renderiza com testID padrão", () => {
    render(
      <QrCodeView
        qrCodeDataUrl="data:image/png;base64,XXX"
        secret="ABCDEF123"
      />,
    );
    expect(screen.getByTestId("qr-code-view")).toBeTruthy();
  });

  it("exibe o secret em texto selecionável", () => {
    render(
      <QrCodeView
        qrCodeDataUrl="data:image/png;base64,XXX"
        secret="MYSECRET"
      />,
    );
    const sec = screen.getByTestId("qr-secret");
    expect(sec.props.children).toBe("MYSECRET");
    expect(sec.props.selectable).toBe(true);
  });

  it("instrui escanear no autenticador", () => {
    render(<QrCodeView qrCodeDataUrl="data:image/png;base64,XXX" secret="X" />);
    expect(screen.getByText(/Authenticator/i)).toBeTruthy();
  });
});
