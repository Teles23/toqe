"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
  Plus,
  CircleDot,
} from "lucide-react";
import type { SlotStatus } from "../types/agenda.types";

export const STATUS_CONFIG: Record<
  SlotStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    icon: React.ReactNode;
    pulse?: boolean;
  }
> = {
  active: {
    label: "Atendendo",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.05)",
    border: "rgba(29,185,84,0.25)",
    glow: "0 0 20px rgba(29,185,84,0.1)",
    icon: <CircleDot size={11} />,
    pulse: true,
  },
  confirmed: {
    label: "Confirmado",
    color: "var(--status-info)",
    bg: "transparent",
    border: "var(--border-default)",
    glow: "none",
    icon: <CheckCircle size={11} />,
  },
  pending: {
    label: "Pendente",
    color: "var(--status-warning)",
    bg: "transparent",
    border: "var(--border-default)",
    glow: "none",
    icon: <Clock size={11} />,
  },
  late: {
    label: "Atrasado",
    color: "var(--status-error)",
    bg: "rgba(255,77,79,0.04)",
    border: "rgba(255,77,79,0.25)",
    glow: "0 0 16px rgba(255,77,79,0.08)",
    icon: <AlertCircle size={11} />,
    pulse: true,
  },
  blocked: {
    label: "Bloqueado",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "var(--border-subtle)",
    glow: "none",
    icon: <Ban size={11} />,
  },
  available: {
    label: "Livre",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "var(--border-subtle)",
    glow: "none",
    icon: <Plus size={11} />,
  },
};

export function StatusBadge({ status }: { status: SlotStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background:
          cfg.bg !== "transparent" ? cfg.bg : "rgba(255,255,255,0.04)",
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          animation: cfg.pulse
            ? "tqe-pulse-green 1.5s ease-in-out infinite"
            : "none",
        }}
      >
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}
