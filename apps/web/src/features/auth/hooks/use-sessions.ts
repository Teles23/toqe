"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessions,
  revokeSession,
  revokeAllSessions,
  type SessaoAtiva,
} from "@/features/auth/services/auth.service";

export function useSessions() {
  const queryClient = useQueryClient();

  const query = useQuery<SessaoAtiva[]>({
    queryKey: ["auth", "sessions"],
    queryFn: fetchSessions,
  });

  const revokeOne = useMutation({
    mutationFn: (codigo: number) => revokeSession(codigo),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });

  const revokeAll = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });

  return { ...query, revokeOne, revokeAll };
}
