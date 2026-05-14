import { barbeariaApi } from "@/shared/api/api-client";
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
    return barbeariaApi(barCodigo).get<FaturamentoItem[]>(
      `/relatorios/faturamento?periodo=${periodo}`,
    );
  },
  agendamentos(
    barCodigo: number,
    periodo: Periodo,
  ): Promise<AgendamentosItem[]> {
    return barbeariaApi(barCodigo).get<AgendamentosItem[]>(
      `/relatorios/agendamentos?periodo=${periodo}`,
    );
  },
  servicos(barCodigo: number, periodo: Periodo): Promise<ServicoItem[]> {
    return barbeariaApi(barCodigo).get<ServicoItem[]>(
      `/relatorios/servicos?periodo=${periodo}`,
    );
  },
  barbeiros(barCodigo: number, periodo: Periodo): Promise<BarbeiroItem[]> {
    return barbeariaApi(barCodigo).get<BarbeiroItem[]>(
      `/relatorios/barbeiros?periodo=${periodo}`,
    );
  },
  horariosPico(
    barCodigo: number,
    periodo: Periodo,
  ): Promise<HorarioPicoItem[]> {
    return barbeariaApi(barCodigo).get<HorarioPicoItem[]>(
      `/relatorios/horarios-pico?periodo=${periodo}`,
    );
  },
};
