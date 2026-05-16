import { useSegments } from "expo-router";

/**
 * Detecta qual grupo (barbeiro ou cliente) o usuário está navegando e
 * retorna o basePath correspondente para navegação dentro do perfil.
 *
 * Isso permite que a MESMA tela `PerfilIndex` (definida em
 * `(barbeiro)/perfil/index.tsx`) seja re-exportada por `(cliente)/perfil/index.tsx`
 * e navegue para as sub-rotas corretas em cada contexto.
 *
 * Fallback: `(barbeiro)/perfil` se não detectar.
 */
export function usePerfilBasePath():
  | "/(barbeiro)/perfil"
  | "/(cliente)/perfil" {
  const segments = useSegments();
  // segments retorna ex: ["(cliente)", "perfil"] ou ["(barbeiro)", "perfil"]
  if (segments.includes("(cliente)" as never)) {
    return "/(cliente)/perfil";
  }
  return "/(barbeiro)/perfil";
}
