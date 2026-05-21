import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface ProximoSlot {
  inicio: string; // ISO
  hora: string; // e.g. "14:30"
  dia: string; // e.g. "Hoje" | "Amanhã" | "Sex"
}

export interface ProximosResponse {
  barbeiroNome: string;
  barbeiroInicial: string; // first letter of name
  servicoNome: string;
  servicoDuracao: number; // minutes
  servicoPreco: number; // cents
  slots: ProximoSlot[];
}

export function useProximosSlots() {
  const { barbearia } = useAuth();

  return useQuery<ProximosResponse | null>({
    queryKey: ["proximos-slots", barbearia?.codigo],
    queryFn: async () => {
      try {
        return await tenantApi(barbearia!.codigo).get<ProximosResponse>(
          "/agenda/proximos?dias=7",
        );
      } catch {
        return null;
      }
    },
    enabled: !!barbearia,
    staleTime: 60_000,
  });
}
