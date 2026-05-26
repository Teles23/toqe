import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/src/shared/api/api-client";

export interface ConviteData {
  token: string;
  barbeariaNome: string;
  barbeariaSlug: string;
  email: string;
  perfil: string; // 'barbeiro'
  expiresAt: string; // ISO
  isNew: boolean; // true if email not yet registered
}

export function useConvite(token: string | undefined) {
  return useQuery<ConviteData | null>({
    queryKey: ["convite", token],
    queryFn: async () => {
      try {
        return await api.get<ConviteData>(`/convite/${token}`, {
          skipRefresh: true,
        });
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 401)
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
