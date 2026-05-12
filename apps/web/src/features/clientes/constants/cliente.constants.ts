import type { ClienteStatus } from "../types/cliente.types";

export const STATUS_CONFIG: Record<
  ClienteStatus,
  { label: string; color: string; bg: string }
> = {
  ativo: {
    label: "Ativo",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.1)",
  },
  inativo: {
    label: "Inativo",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
  },
  novo: {
    label: "Novo",
    color: "var(--status-info)",
    bg: "rgba(77,163,255,0.1)",
  },
};

export const SORT_OPTIONS = [
  { value: "visitas", label: "Mais visitas" },
  { value: "gasto", label: "Maior gasto" },
  { value: "nome", label: "Nome A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
