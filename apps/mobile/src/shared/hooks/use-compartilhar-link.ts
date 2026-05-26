import { useCallback } from "react";
import { Share } from "react-native";

import { useToast } from "@/src/shared/hooks/use-toast";

/**
 * Compartilha o link público do barbeiro via folha nativa de compartilhar
 * (`Share`) — ideal para colar na bio do Instagram, mandar no WhatsApp, etc.
 *
 * Usa a API embutida do React Native (sem dependência nativa extra). Para
 * cópia silenciosa + toast "Link copiado", trocar por `expo-clipboard` quando
 * o pacote estiver instalado.
 */
export function useCompartilharLink() {
  const { showToast } = useToast();

  return useCallback(
    async (link: string) => {
      if (!link) return;
      try {
        await Share.share({ message: link });
      } catch {
        showToast("Não foi possível compartilhar o link.", "error");
      }
    },
    [showToast],
  );
}
