import { tenantApi } from "@/shared/api/api-client";
import type { BarbeiroAPI } from "../types/barbeiro.types";

export const barbeiroService = {
  list(barCodigo: number): Promise<BarbeiroAPI[]> {
    return tenantApi(barCodigo).get<BarbeiroAPI[]>(
      `/barbearia/${barCodigo}/barbeiros`,
    );
  },
};
