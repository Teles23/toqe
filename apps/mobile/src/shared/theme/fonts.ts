/**
 * Mapa de fontes a carregar via `useFonts` no root layout.
 *
 * Mantido em arquivo separado para que:
 * 1. O `_layout.tsx` continue minimalista.
 * 2. Os mocks de teste possam stubbar este módulo sem replicar a lista.
 *
 * As famílias precisam bater 1:1 com os `fontFamily` declarados em
 * `tokens.ts > typography`. Se renomear lá, atualize aqui.
 */
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";

export const FONT_MAP = {
  Sora_600SemiBold,
  Sora_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} as const;
