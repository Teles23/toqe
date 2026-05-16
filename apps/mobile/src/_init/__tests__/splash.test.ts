jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as SplashScreen from "expo-splash-screen";
import { __resetForTests, hideSplash } from "../splash";

const mockPreventAutoHide =
  SplashScreen.preventAutoHideAsync as jest.MockedFunction<
    typeof SplashScreen.preventAutoHideAsync
  >;
const mockHide = SplashScreen.hideAsync as jest.MockedFunction<
  typeof SplashScreen.hideAsync
>;

describe("splash init", () => {
  beforeEach(() => {
    mockHide.mockClear();
    mockHide.mockResolvedValue(undefined as unknown as boolean);
    __resetForTests();
  });

  it("chama preventAutoHideAsync no import do módulo", () => {
    // O import já aconteceu no topo deste arquivo — basta validar que foi invocado
    expect(mockPreventAutoHide).toHaveBeenCalled();
  });

  it("hideSplash chama SplashScreen.hideAsync", async () => {
    await hideSplash();
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it("hideSplash é idempotente — chamadas duplicadas não duplicam hideAsync", async () => {
    await hideSplash();
    await hideSplash();
    await hideSplash();
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it("hideSplash não propaga erro se hideAsync rejeita", async () => {
    mockHide.mockRejectedValueOnce(new Error("já escondido"));
    await expect(hideSplash()).resolves.toBeUndefined();
  });
});
