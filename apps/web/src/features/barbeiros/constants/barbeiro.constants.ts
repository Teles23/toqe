import type { BarbeiroEstado } from "../types/barbeiro.types";

export const ESTADO_CONFIG: Record<
  BarbeiroEstado,
  { label: string; color: string; bg: string; border: string; glowBox: string }
> = {
  active: {
    label: "Atendendo",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.05)",
    border: "rgba(29,185,84,0.2)",
    glowBox: "0 0 24px rgba(29,185,84,0.1)",
  },
  idle: {
    label: "Disponível",
    color: "var(--status-info)",
    bg: "transparent",
    border: "var(--border-default)",
    glowBox: "none",
  },
  off: {
    label: "Fora",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "var(--border-subtle)",
    glowBox: "none",
  },
};
