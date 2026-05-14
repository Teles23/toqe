import { barbeariaApi } from "@/shared/api/api-client";
import type {
  BarbeariaConfig,
  HorarioDia,
  NotificacaoConfig,
} from "../types/configuracao.types";

export const configuracaoService = {
  getBarbearia(barCodigo: number): Promise<BarbeariaConfig> {
    return barbeariaApi(barCodigo).get<BarbeariaConfig>("");
  },

  updateBarbearia(
    barCodigo: number,
    data: Partial<BarbeariaConfig>,
  ): Promise<BarbeariaConfig> {
    return barbeariaApi(barCodigo).patch<BarbeariaConfig>("", data);
  },

  getHorarios(barCodigo: number): Promise<HorarioDia[]> {
    return barbeariaApi(barCodigo).get<HorarioDia[]>("/horarios");
  },

  updateHorarios(barCodigo: number, data: HorarioDia[]): Promise<HorarioDia[]> {
    return barbeariaApi(barCodigo).put<HorarioDia[]>("/horarios", data);
  },

  getNotificacoes(barCodigo: number): Promise<NotificacaoConfig> {
    return barbeariaApi(barCodigo).get<NotificacaoConfig>("/notificacoes");
  },

  updateNotificacoes(
    barCodigo: number,
    data: Partial<NotificacaoConfig>,
  ): Promise<NotificacaoConfig> {
    return barbeariaApi(barCodigo).patch<NotificacaoConfig>(
      "/notificacoes",
      data,
    );
  },
};
