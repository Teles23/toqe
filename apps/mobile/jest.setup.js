// Setup global de testes do app mobile.
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
