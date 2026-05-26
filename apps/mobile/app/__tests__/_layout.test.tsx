jest.mock("@/src/_init/splash", () => ({
  hideSplash: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/_init/google-signin", () => ({}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: { configure: jest.fn(), signIn: jest.fn() },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-router", () => {
  // Fragment-only stub para Stack — não precisa de React.createElement aqui
  function Stack({ children }: { children?: React.ReactNode }) {
    return children as React.ReactElement;
  }
  function StackScreen() {
    return null;
  }
  Stack.Screen = StackScreen;
  return { Stack, router: { replace: jest.fn() } };
});

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-status-bar", () => {
  function StatusBar() {
    return null;
  }
  return { StatusBar };
});

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/src/shared/providers/auth-provider", () => {
  function AuthProvider({ children }: { children: React.ReactNode }) {
    return children as React.ReactElement;
  }
  return { AuthProvider };
});

import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import { hideSplash } from "@/src/_init/splash";
import { useAuth } from "@/src/shared/hooks/use-auth";
import RootLayout from "../_layout";

const mockHideSplash = hideSplash as jest.MockedFunction<typeof hideSplash>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("RootLayout — splash control", () => {
  beforeEach(() => {
    mockHideSplash.mockClear();
    mockUseAuth.mockReset();
  });

  it("não chama hideSplash enquanto loading=true", () => {
    mockUseAuth.mockReturnValue({
      loading: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(<RootLayout />);

    expect(mockHideSplash).not.toHaveBeenCalled();
  });

  it("chama hideSplash quando loading vira false", async () => {
    mockUseAuth.mockReturnValue({
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<RootLayout />);

    await waitFor(() => {
      expect(mockHideSplash).toHaveBeenCalledTimes(1);
    });
  });
});
