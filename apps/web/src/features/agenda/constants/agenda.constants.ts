import type { SlotStatus } from "../types/agenda.types";

export const API_STATUS_TO_SLOT: Record<string, SlotStatus> = {
  confirmado: "confirmed",
  concluido: "active",
  cancelado: "blocked",
  no_show: "late",
  pendente: "pending",
} as const;

export const SLOT_TO_API_STATUS: Partial<Record<SlotStatus, string>> = {
  confirmed: "confirmado",
  active: "concluido",
  blocked: "cancelado",
  late: "no_show",
  pending: "pendente",
} as const;

export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
