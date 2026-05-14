import { barbeariaApi } from "@/shared/api/api-client";
import type { ClienteAPI } from "../types/cliente.types";

export const clienteService = {
  list(barCodigo: number): Promise<ClienteAPI[]> {
    return barbeariaApi(barCodigo).get<ClienteAPI[]>("/clientes");
  },
};
