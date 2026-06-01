// Setup global de testes do app mobile.
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
