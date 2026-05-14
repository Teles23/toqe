import { tenantApi } from "@/shared/api/api-client";
import type { CreateServicoInput, UpdateServicoInput } from "@toqe/contracts";
import type { ServicoAPI } from "../types/servico.types";

export const servicoService = {
  list(barCodigo: number): Promise<ServicoAPI[]> {
    return tenantApi(barCodigo).get<ServicoAPI[]>("/servicos");
  },

  create(barCodigo: number, data: CreateServicoInput): Promise<ServicoAPI> {
    return tenantApi(barCodigo).post<ServicoAPI>("/servicos", data);
  },

  update(
    barCodigo: number,
    codigo: number,
    data: UpdateServicoInput,
  ): Promise<ServicoAPI> {
    return tenantApi(barCodigo).put<ServicoAPI>(`/servicos/${codigo}`, data);
  },

  remove(barCodigo: number, codigo: number): Promise<void> {
    return tenantApi(barCodigo).delete<void>(`/servicos/${codigo}`);
  },
};
