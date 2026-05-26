export type { AgendamentoAPI, BarbeiroAPI } from "@toqe/contracts";

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
