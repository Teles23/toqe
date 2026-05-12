import { tenantApi } from "@/shared/api/api-client";
import type { ClienteAPI } from "../types/cliente.types";

export const clienteService = {
  list(barCodigo: number): Promise<ClienteAPI[]> {
    return tenantApi(barCodigo).get<ClienteAPI[]>(
      `/barbearia/${barCodigo}/clientes`,
    );
  },
};
