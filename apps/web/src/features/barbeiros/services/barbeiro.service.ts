import { barbeariaApi } from "@/shared/api/api-client";
import type { ConvidarMembroInput } from "@toqe/contracts";
import type { BarbeiroAPI } from "../types/barbeiro.types";

export const barbeiroService = {
  list(barCodigo: number): Promise<BarbeiroAPI[]> {
    return barbeariaApi(barCodigo).get<BarbeiroAPI[]>("/barbeiros");
  },

  convidar(barCodigo: number, data: ConvidarMembroInput): Promise<void> {
    return barbeariaApi(barCodigo).post<void>("/membros", data);
  },

  remover(barCodigo: number, usrCodigo: number): Promise<void> {
    return barbeariaApi(barCodigo).delete<void>(`/membros/${usrCodigo}`);
  },
};
