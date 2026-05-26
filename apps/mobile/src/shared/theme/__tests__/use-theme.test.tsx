// Mock minimal de react-native — só o useColorScheme. Evita carregar TurboModule
// (DevMenu) que quebra fora do native runtime.
jest.mock("react-native", () => ({
  useColorScheme: jest.fn(),
}));

import { renderHook } from "@testing-library/react-native";
import { useColorScheme } from "react-native";

import { palette } from "../tokens";
import { useTheme } from "../use-theme";

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

describe("useTheme", () => {
  afterEach(() => {
    mockedUseColorScheme.mockReset();
  });

  it("retorna paleta light quando colorScheme === 'light'", () => {
    mockedUseColorScheme.mockReturnValue("light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.palette).toBe(palette.light);
    expect(result.current.isDark).toBe(false);
  });

  it("retorna paleta dark quando colorScheme === 'dark'", () => {
    mockedUseColorScheme.mockReturnValue("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.palette).toBe(palette.dark);
    expect(result.current.isDark).toBe(true);
  });

  it("default (null) usa light", () => {
    mockedUseColorScheme.mockReturnValue(null);
    const { result } = renderHook(() => useTheme());
    expect(result.current.palette).toBe(palette.light);
    expect(result.current.isDark).toBe(false);
  });

  it("expõe spacing, radius, typography e a11y", () => {
    mockedUseColorScheme.mockReturnValue("light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.spacing.md).toBe(16);
    expect(result.current.radius.md).toBe(12);
    expect(result.current.typography.body.fontSize).toBe(16);
    expect(result.current.typography.body.fontFamily).toBe("Inter_400Regular");
    expect(result.current.typography.monoXL.fontFamily).toBe(
      "JetBrainsMono_700Bold",
    );
    expect(result.current.a11y.minTouch).toBe(44);
  });
});
