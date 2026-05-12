import type { Categoria } from "../types/servico.types";

export const CATEGORIA_CONFIG: Record<
  Categoria,
  { label: string; color: string; bg: string }
> = {
  corte: {
    label: "Corte",
    color: "var(--status-info)",
    bg: "rgba(77,163,255,0.1)",
  },
  barba: {
    label: "Barba",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.1)",
  },
  combo: {
    label: "Combo",
    color: "var(--status-warning)",
    bg: "rgba(244,180,0,0.1)",
  },
  estetica: {
    label: "Estética",
    color: "#C084FC",
    bg: "rgba(192,132,252,0.1)",
  },
  tratamento: {
    label: "Tratamento",
    color: "var(--status-error)",
    bg: "rgba(255,77,79,0.1)",
  },
};
