export type SlotStatus =
  | "active"
  | "confirmed"
  | "pending"
  | "late"
  | "blocked"
  | "available";

export interface Slot {
  id: number;
  time: string;
  endTime: string;
  client: string;
  clientInitial: string;
  service: string;
  barbeiro: string;
  barbeiroInitial: string;
  duration: number;
  status: SlotStatus;
  progressPct?: number;
  startedAt?: string;
}

export interface Barbeiro {
  id: number;
  nome: string;
  initial: string;
  state: "active" | "idle" | "late";
  agendamentos: number;
  livres: number;
}

export interface AgendamentoAPI {
  codigo: number;
  inicio: string;
  fim: string;
  status: string;
  cliente: { codigo: number; nome: string; email: string } | null;
  barbeiro: { codigo: number; nome: string } | null;
  itens: { servico: { nome: string }; duracaoMin: number }[];
}

// BarbeiroAPI importado de barbeiros/types — source of truth único
export type { BarbeiroAPI } from "../../barbeiros/types/barbeiro.types";
