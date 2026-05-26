import type { BarbeiroAPI } from "@toqe/contracts";

export type { BarbeiroAPI } from "@toqe/contracts";

export type BarbeiroEstado = "active" | "idle" | "off";

export interface Barbeiro extends BarbeiroAPI {
  initial: string;
  estado: BarbeiroEstado;
  especialidade: string;
  avaliacao: number;
  horarioEntrada: string;
  diasSemana: string[];
  clienteAtual?: string;
  servicoAtual?: string;
  progressoAtual?: number;
}
