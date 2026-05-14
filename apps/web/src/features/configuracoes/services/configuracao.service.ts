import { tenantApi } from "@/shared/api/api-client";
import type {
  BarbeariaConfig,
  HorarioDia,
  NotificacaoConfig,
} from "../types/configuracao.types";

export const configuracaoService = {
  getBarbearia(barCodigo: number): Promise<BarbeariaConfig> {
    return tenantApi(barCodigo).get<BarbeariaConfig>(`/barbearia/${barCodigo}`);
  },

  updateBarbearia(
    barCodigo: number,
    data: Partial<BarbeariaConfig>,
  ): Promise<BarbeariaConfig> {
    return tenantApi(barCodigo).patch<BarbeariaConfig>(
      `/barbearia/${barCodigo}`,
      data,
    );
  },

  getHorarios(barCodigo: number): Promise<HorarioDia[]> {
    return tenantApi(barCodigo).get<HorarioDia[]>(
      `/barbearia/${barCodigo}/horarios`,
    );
  },

  updateHorarios(barCodigo: number, data: HorarioDia[]): Promise<HorarioDia[]> {
    return tenantApi(barCodigo).put<HorarioDia[]>(
      `/barbearia/${barCodigo}/horarios`,
      data,
    );
  },

  getNotificacoes(barCodigo: number): Promise<NotificacaoConfig> {
    return tenantApi(barCodigo).get<NotificacaoConfig>(
      `/barbearia/${barCodigo}/notificacoes`,
    );
  },

  updateNotificacoes(
    barCodigo: number,
    data: Partial<NotificacaoConfig>,
  ): Promise<NotificacaoConfig> {
    return tenantApi(barCodigo).patch<NotificacaoConfig>(
      `/barbearia/${barCodigo}/notificacoes`,
      data,
    );
  },
};
