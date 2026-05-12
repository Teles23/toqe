"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import StatCard from "@/shared/components/stat-card";
import type { KpiCard } from "../types/dashboard.types";

/** Map de label -> ícone. Mantemos aqui (UI concern) em vez de no service. */
const ICON_BY_LABEL: Record<string, LucideIcon> = {
  "Faturamento hoje": DollarSign,
  Agendamentos: Calendar,
  "Ticket médio": TrendingUp,
  "Avaliação média": Star,
};

interface MetricsGridProps {
  kpis: KpiCard[];
}

/** Grid de 4 KPIs no topo do dashboard. */
export function MetricsGrid({ kpis }: MetricsGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((card, i) => {
        const Icon = ICON_BY_LABEL[card.label] ?? Calendar;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.07,
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <StatCard {...card} icon={Icon} />
          </motion.div>
        );
      })}
    </div>
  );
}
