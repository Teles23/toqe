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

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { router } from "expo-router";

import OnboardingScreen from "../onboarding";

const mockReplace = router.replace as jest.MockedFunction<
  typeof router.replace
>;

describe("OnboardingScreen (minimal)", () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it("renderiza a tela minimal com a promessa '1 toque'", () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId("onboarding-minimal")).toBeTruthy();
    expect(screen.getByText("1 toque")).toBeTruthy();
  });

  it("exibe a value prop completa do cliente", () => {
    render(<OnboardingScreen />);
    expect(
      screen.getByText(
        "Encontre, agende e seja lembrado. Sem ligar, sem WhatsApp, sem complicação.",
      ),
    ).toBeTruthy();
  });

  it("expõe os dois CTAs: 'Começar' e 'Já tenho conta · entrar'", () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId("btn-comecar")).toBeTruthy();
    expect(screen.getByTestId("btn-ja-tenho-conta")).toBeTruthy();
    expect(screen.getByText("Já tenho conta · entrar")).toBeTruthy();
  });

  it("pressionar 'Começar' chama router.replace com '/(auth)/login'", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-comecar"));
    });
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("pressionar 'Já tenho conta · entrar' chama router.replace com '/(auth)/login'", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-ja-tenho-conta"));
    });
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });
});
