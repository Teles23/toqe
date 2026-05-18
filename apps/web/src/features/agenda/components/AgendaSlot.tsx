"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Ban } from "lucide-react";
import { StatusBadge, STATUS_CONFIG } from "./StatusBadge";
import { useCountdown } from "../hooks/use-countdown";
import type { Slot } from "../types/agenda.types";

function CalendarEmpty({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function AgendaSlotEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      <div className="flex items-center justify-center rounded-xl w-12 h-12 bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-muted)]">
        <CalendarEmpty size={20} />
      </div>
      <span className="text-[13px] text-[var(--text-muted)]">
        Nenhum agendamento encontrado
      </span>
    </motion.div>
  );
}

export function AgendaSlot({
  slot,
  index,
  onEncaixar,
}: {
  slot: Slot;
  index: number;
  onEncaixar?: () => void;
}) {
  const cfg = STATUS_CONFIG[slot.status];
  const countdown = useCountdown(slot.startedAt, slot.duration);
  const isAvailable = slot.status === "available";
  const isBlocked = slot.status === "blocked";
  const isActive = slot.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={!isBlocked ? { y: -1 } : {}}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: cfg.bg !== "transparent" ? cfg.bg : "var(--bg-card)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${isAvailable || isBlocked ? "var(--border-default)" : cfg.color}`,
        borderLeftStyle: isAvailable ? "dashed" : "solid",
        boxShadow: cfg.glow !== "none" ? cfg.glow : undefined,
        opacity: isBlocked ? 0.45 : 1,
        transition: "border-color 160ms, box-shadow 160ms, transform 160ms",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex-shrink-0 flex flex-col items-center"
          style={{ minWidth: 44 }}
        >
          <span
            className="font-semibold leading-none"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 13,
              color: isActive ? cfg.color : "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {slot.time}
          </span>
          <span className="text-[10px] mt-0.5 text-[var(--text-muted)]">
            {slot.endTime}
          </span>
        </div>

        <div className="self-stretch flex-shrink-0 rounded-full w-px bg-[var(--border-subtle)]" />

        {!isBlocked && !isAvailable && (
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-xs"
            style={{
              width: 30,
              height: 30,
              background: `${cfg.color}18`,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
              fontFamily: "var(--font-heading)",
            }}
          >
            {slot.clientInitial}
          </div>
        )}

        {(isBlocked || isAvailable) && (
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]"
            style={{ width: 30, height: 30 }}
          >
            {isAvailable ? <Plus size={13} /> : <Ban size={13} />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-medium truncate text-[13px]"
              style={{
                color:
                  isAvailable || isBlocked
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {isAvailable ? "Horário disponível" : slot.client}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] truncate text-[var(--text-secondary)]">
              {slot.service}
            </span>
            <span className="text-[var(--border-default)]">·</span>
            <span className="text-[11px] truncate text-[var(--text-secondary)]">
              {slot.duration}min
            </span>
          </div>

          {isActive && slot.progressPct !== undefined && (
            <div className="mt-2 max-w-[160px]">
              <div className="h-0.5 rounded-sm bg-[var(--border-default)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--status-success)]"
                  style={{
                    width: `${slot.progressPct}%` /* CSS var dinâmico — não migrar */,
                  }}
                  animate={{ width: `${slot.progressPct}%` }}
                  transition={{ duration: 0.8, ease: "linear" }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <StatusBadge status={slot.status} />

          {!isBlocked && (
            <div className="flex items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full text-[9px] font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] font-heading border border-[var(--border-default)]"
                style={{ width: 16, height: 16 }}
              >
                {slot.barbeiroInitial}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                {slot.barbeiro}
              </span>
            </div>
          )}

          {isActive && countdown && (
            <span className="text-[11px] font-mono font-medium tabular-nums text-[var(--status-success)] tracking-[0.04em]">
              {countdown}
            </span>
          )}

          {isAvailable && onEncaixar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEncaixar();
              }}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100 bg-[rgba(29,185,84,0.1)] text-[var(--status-success)] border border-[rgba(29,185,84,0.2)]"
            >
              Encaixar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
