import { tenantApi } from "@/shared/api/api-client";
import type {
  FaturamentoItem,
  AgendamentosItem,
  ServicoItem,
  BarbeiroItem,
  HorarioPicoItem,
  Periodo,
} from "../types/relatorio.types";

export const relatorioService = {
  faturamento(barCodigo: number, periodo: Periodo): Promise<FaturamentoItem[]> {
    return tenantApi(barCodigo).get<FaturamentoItem[]>(
      `/barbearia/${barCodigo}/relatorios/faturamento?periodo=${periodo}`,
    );
  },
  agendamentos(
    barCodigo: number,
    periodo: Periodo,
  ): Promise<AgendamentosItem[]> {
    return tenantApi(barCodigo).get<AgendamentosItem[]>(
      `/barbearia/${barCodigo}/relatorios/agendamentos?periodo=${periodo}`,
    );
  },
  servicos(barCodigo: number, periodo: Periodo): Promise<ServicoItem[]> {
    return tenantApi(barCodigo).get<ServicoItem[]>(
      `/barbearia/${barCodigo}/relatorios/servicos?periodo=${periodo}`,
    );
  },
  barbeiros(barCodigo: number, periodo: Periodo): Promise<BarbeiroItem[]> {
    return tenantApi(barCodigo).get<BarbeiroItem[]>(
      `/barbearia/${barCodigo}/relatorios/barbeiros?periodo=${periodo}`,
    );
  },
  horariosPico(
    barCodigo: number,
    periodo: Periodo,
  ): Promise<HorarioPicoItem[]> {
    return tenantApi(barCodigo).get<HorarioPicoItem[]>(
      `/barbearia/${barCodigo}/relatorios/horarios-pico?periodo=${periodo}`,
    );
  },
};
