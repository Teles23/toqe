import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useTheme } from "@/src/shared/theme";

/**
 * usePullToRefresh — fonte única do comportamento e da aparência do
 * "puxar para atualizar" em todo o app (DRY).
 *
 * Resolve dois problemas que existiam por falta de reuso:
 *  1. **Cor inconsistente** — cada tela montava o `RefreshControl` à mão (umas
 *     com `palette.text` preto, perfil com âmbar, agendamentos sem cor). Aqui o
 *     spinner é sempre âmbar (`palette.primary`), em iOS e Android.
 *  2. **Atualização só da aba atual** — antes era preciso puxar aba por aba.
 *     Ao puxar, além do `refetch` da query principal da tela, invalidamos
 *     **todas** as queries: a aba atual recarrega na hora; as inativas ficam
 *     marcadas como stale e recarregam **ao serem abertas** (lazy) — um único
 *     gesto cobre o app inteiro sem disparar N requisições de uma vez.
 *
 * Uso:
 * ```tsx
 * const refresh = usePullToRefresh(refetch, isRefetching);
 * <RefreshControl {...refresh} />
 * ```
 *
 * @param refetch refetch da query principal da tela (opcional)
 * @param isRefetching estado de refetch dessa query (para o spinner)
 * @param progressViewOffset desloca o spinner para baixo (px). Usado em telas
 *   cujo header rola junto com a lista (ex.: agenda) para o spinner aparecer
 *   abaixo da status bar — alinhado com as telas de header fixo.
 */
export function usePullToRefresh(
  refetch?: () => unknown | Promise<unknown>,
  isRefetching = false,
  progressViewOffset?: number,
) {
  const { palette } = useTheme();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const onRefresh = useCallback(async () => {
    setBusy(true);
    try {
      await Promise.all([
        Promise.resolve(refetch?.()),
        queryClient.invalidateQueries(),
      ]);
    } finally {
      setBusy(false);
    }
  }, [refetch, queryClient]);

  return {
    refreshing: isRefetching || busy,
    onRefresh,
    tintColor: palette.primary,
    colors: [palette.primary],
    progressViewOffset,
  };
}
