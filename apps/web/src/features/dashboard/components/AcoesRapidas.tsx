"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Scissors,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES, type Route } from "@/shared/config/routes";

interface Acao {
  label: string;
  icon: LucideIcon;
  href: Route;
  color: string;
}

const ACOES: readonly Acao[] = [
  {
    label: "Novo agendamento",
    icon: Calendar,
    href: ROUTES.AGENDA,
    color: "var(--primary)",
  },
  {
    label: "Cadastrar cliente",
    icon: Users,
    href: ROUTES.CLIENTES,
    color: "var(--status-info)",
  },
  {
    label: "Ver relatório",
    icon: BarChart3,
    href: ROUTES.RELATORIOS,
    color: "var(--status-success)",
  },
  {
    label: "Configurações",
    icon: Scissors,
    href: ROUTES.CONFIGURACOES,
    color: "var(--text-secondary)",
  },
] as const;

/** Grid de 4 botões de acesso rápido (atalhos de navegação). */
export function AcoesRapidas(): React.JSX.Element {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.58, duration: 0.22 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {ACOES.map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(action.href)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              transition: "border-color 160ms, box-shadow 160ms",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "var(--shadow-sm)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-lg"
              style={{
                width: 32,
                height: 32,
                background: `${action.color}15`,
                color: action.color,
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
            </div>
            <span
              className="text-[12px] font-medium"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {action.label}
            </span>
            <ArrowUpRight
              size={12}
              className="ml-auto flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
