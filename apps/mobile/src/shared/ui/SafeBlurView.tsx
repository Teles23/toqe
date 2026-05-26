import { BlurView, type BlurViewProps } from "expo-blur";
import { NativeModules, View } from "react-native";

/**
 * Wrapper de `BlurView` que detecta se o módulo nativo está disponível.
 *
 * Em dev clients antigos (APK buildado antes de `expo-blur` ter sido
 * adicionado) o componente do JS existe mas o native view manager não
 * está exportado, fazendo o RN emitir o warning:
 *
 *   "The native view manager for module(ExpoBlurView) from
 *    NativeViewManagerAdapter isn't exported by expo-modules-core."
 *
 * Esse cenário aparece também no Expo Go web e em testes Jest. Nesses
 * casos renderizamos um `View` simples — o backdrop semitransparente
 * por cima já garante contraste suficiente; o blur é só refinement
 * visual.
 *
 * O usuário pode rebuildar o dev client (EAS) para habilitar o blur de
 * verdade — daí esse wrapper passa a delegar para o BlurView real.
 */
const blurNativeAvailable: boolean =
  // expo-blur registra `ExpoBlurView` em NativeModules quando linkado
  Boolean((NativeModules as Record<string, unknown> | undefined)?.ExpoBlurView);

export function SafeBlurView(props: BlurViewProps) {
  if (!blurNativeAvailable) {
    return <View style={props.style} />;
  }
  return <BlurView {...props} />;
}
