import { barbeariaApi, tenantApi } from "@/shared/api/api-client";
import type { CreateAgendamentoInput } from "@toqe/contracts";
import type { AgendamentoAPI, BarbeiroAPI } from "../types/agenda.types";

export const agendaService = {
  listAgendamentos(barCodigo: number, data: string): Promise<AgendamentoAPI[]> {
    return tenantApi(barCodigo).get<AgendamentoAPI[]>(
      `/agendamentos?data=${data}`,
    );
  },

  listBarbeiros(barCodigo: number): Promise<BarbeiroAPI[]> {
    return barbeariaApi(barCodigo).get<BarbeiroAPI[]>("/barbeiros");
  },

  patchStatus(
    codigo: number,
    status: string,
    barCodigo: number,
  ): Promise<void> {
    return tenantApi(barCodigo).patch<void>(`/agendamentos/${codigo}/status`, {
      status,
    });
  },

  criar(
    barCodigo: number,
    data: CreateAgendamentoInput,
  ): Promise<AgendamentoAPI> {
    return tenantApi(barCodigo).post<AgendamentoAPI>("/agendamentos", data);
  },

  listarDisponibilidade(
    barCodigo: number,
    barbeiroId: number,
    data: string,
    duracao: number,
  ): Promise<string[]> {
    return tenantApi(barCodigo).get<string[]>(
      `/agenda/disponibilidade/${barbeiroId}?data=${data}&duracao=${duracao}`,
    );
  },
};
