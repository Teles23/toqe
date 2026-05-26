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

describe("OnboardingScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it("renderiza o primeiro slide (step 0) com texto 'Encontre'", () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId("slide-0")).toBeTruthy();
    expect(screen.getByText("Encontre")).toBeTruthy();
  });

  it("botão 'Pular' chama router.replace com '/(auth)/login'", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-pular"));
    });
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("pressionar 'Próximo' no slide 0 exibe o slide 1 ('Agende')", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    expect(screen.getByTestId("slide-1")).toBeTruthy();
    expect(screen.getByText("Agende")).toBeTruthy();
  });

  it("pressionar 'Próximo' no slide 1 exibe o slide 2 ('Sem')", async () => {
    render(<OnboardingScreen />);
    // avança para slide 1
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    // avança para slide 2
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    expect(screen.getByTestId("slide-2")).toBeTruthy();
    expect(screen.getByText("Sem")).toBeTruthy();
  });

  it("no último slide o botão exibe 'Começar'", async () => {
    render(<OnboardingScreen />);
    // avança para slide 1
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    // avança para slide 2 (último)
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    expect(screen.getByText("Começar")).toBeTruthy();
  });

  it("pressionar 'Começar' no slide 2 chama router.replace", async () => {
    render(<OnboardingScreen />);
    // avança para slide 1
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    // avança para slide 2
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    // pressiona "Começar"
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-proximo"));
    });
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("renderiza os 3 dots com testIDs dot-0, dot-1, dot-2", () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId("dot-0")).toBeTruthy();
    expect(screen.getByTestId("dot-1")).toBeTruthy();
    expect(screen.getByTestId("dot-2")).toBeTruthy();
  });
});
