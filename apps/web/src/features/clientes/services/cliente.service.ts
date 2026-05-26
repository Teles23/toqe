import { barbeariaApi } from "@/shared/api/api-client";
import type { CriarClienteRapidoInput } from "@toqe/contracts";
import type { ClienteAPI } from "../types/cliente.types";

export const clienteService = {
  list(barCodigo: number): Promise<ClienteAPI[]> {
    return barbeariaApi(barCodigo).get<ClienteAPI[]>("/clientes");
  },

  criar(barCodigo: number, data: CriarClienteRapidoInput): Promise<ClienteAPI> {
    return barbeariaApi(barCodigo).post<ClienteAPI>("/clientes", data);
  },
};
