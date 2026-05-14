import { barbeariaApi } from "@/shared/api/api-client";
import type { BarbeiroAPI } from "../types/barbeiro.types";

export const barbeiroService = {
  list(barCodigo: number): Promise<BarbeiroAPI[]> {
    return barbeariaApi(barCodigo).get<BarbeiroAPI[]>("/barbeiros");
  },
};
