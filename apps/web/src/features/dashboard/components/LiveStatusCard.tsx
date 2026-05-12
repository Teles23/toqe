/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import type { BarbeiroStatus, LiveMetric } from "../types/dashboard.types";
import { BarbeiroLive } from "./BarbeiroLive";

interface LiveStatusCardProps {
  liveMetrics: LiveMetric[];
  barbeiros: BarbeiroStatus[];
}

/** Bloco "Status ao vivo": cabeçalho + 4 métricas + grid de barbeiros. */
export function LiveStatusCard({
  liveMetrics,
  barbeiros,
}: LiveStatusCardProps): React.JSX.Element {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.22 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--status-success)",
              animation: "tqe-pulse-green 1.5s ease-in-out infinite",
            }}
          />
          <span
            className="font-semibold text-[13px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Status ao vivo
          </span>
        </div>
        <button
          onClick={() => router.push(ROUTES.AGENDA)}
          className="flex items-center gap-1 text-[12px] transition-colors"
          style={{ color: "var(--status-info)" }}
        >
          Ver agenda <ChevronRight size={13} />
        </button>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 divide-x"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {liveMetrics.map((stat) => (
          <div
            key={stat.label}
            className="px-5 py-3 flex flex-col gap-0.5"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="font-bold text-[18px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: stat.color,
                letterSpacing: "-0.03em",
              }}
            >
              {stat.value}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {barbeiros.map((b) => (
          <BarbeiroLive key={b.nome} b={b} />
        ))}
      </div>
    </motion.div>
  );
}
