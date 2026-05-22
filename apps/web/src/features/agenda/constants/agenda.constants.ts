import type { SlotStatus } from "../types/agenda.types";
import { DIAS_SEMANA_CURTO } from "@/shared/lib/constants";

export const API_STATUS_TO_SLOT: Record<string, SlotStatus> = {
  confirmado: "confirmed",
  // Em atendimento: ocupa o slot como "ativo" (web não tem estado próprio
  // de in-progress; reutiliza "active" como concluído ocupado).
  em_andamento: "active",
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

export const DIAS = DIAS_SEMANA_CURTO;
