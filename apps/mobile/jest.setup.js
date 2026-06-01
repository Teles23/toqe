// Setup global de testes do app mobile — Expo SDK 56 / React Native 0.85.3.
//
// react-native-gesture-handler: mock nativo oficial para os GestureDetector
// (ex.: arrastar o bottom sheet) renderizarem nos specs sem o módulo nativo.
require("react-native-gesture-handler/jestSetup");

//
// `react-native-safe-area-context`: em produção o provider é fornecido pelo
// expo-router/react-navigation, mas os testes renderizam telas isoladamente
// (sem SafeAreaProvider). `useSafeAreaInsets` lança nesse cenário, então
// devolvemos insets zerados globalmente. `SafeAreaView`/`SafeAreaProvider`
// reais são mantidos (já funcionam standalone nos specs existentes).
jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// expo-router@56 importa toolbar/native.ios.tsx que requer um NativeViewManager
// não disponível em Jest. Mock default para testes que não precisam de roteamento
// real. Testes que precisam de comportamento específico (ex: integração) definem
// seu próprio jest.mock("expo-router", ...) que sobrescreve este.
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue("/"),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useSegments: jest.fn().mockReturnValue([]),
  Redirect: () => null,
  Link: "Link",
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// expo-secure-store@56 requer ExpoSecureStore nativamente no top-level do módulo.
// O mock global evita que testes que usam jest.mock("expo-secure-store") sem
// factory falhem no carregamento (auto-mock avalia o módulo real antes de mockar).
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// expo-glass-effect@56 (dependência interna do expo-router@56) requer native view
// manager e função de feature flag. Mock para evitar crash ao importar expo-router.
jest.mock("expo-glass-effect", () => ({
  GlassView: "GlassView",
  isLiquidGlassAvailable: jest.fn().mockReturnValue(false),
}));

// expo-haptics@56 tenta chamar o módulo nativo diretamente; em Jest não há runtime
// nativo. O mock silencia o feedback tátil sem quebrar os testes.
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// expo-blur@56 usa um módulo nativo (NativeBlurModule) indisponível em Jest.
jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Timeout de utilitários async (findBy*/waitFor): o default de 1000ms é apertado
// quando os ~92 suites rodam em paralelo e a máquina fica sob carga — causava
// flakes intermitentes em telas que carregam dados via React Query. 5000ms dá
// folga sem mascarar travas reais (o timeout do Jest por teste continua maior).
const { configure } = require("@testing-library/react-native");
configure({ asyncUtilTimeout: 5000 });
