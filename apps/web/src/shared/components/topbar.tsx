"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/hooks/use-auth";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  liveStatus?: {
    label: string;
    active: boolean;
  };
  actions?: ReactNode;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral da operação" },
  "/agenda": { title: "Agenda", subtitle: "Agendamentos do dia" },
  "/clientes": { title: "Clientes", subtitle: "Base de clientes" },
  "/barbeiros": { title: "Barbeiros", subtitle: "Equipe ativa" },
  "/servicos": { title: "Serviços", subtitle: "Catálogo de serviços" },
  "/relatorios": { title: "Relatórios", subtitle: "Análises e resultados" },
  "/configuracoes": { title: "Configurações", subtitle: "Ajustes do sistema" },
};

export default function Topbar({
  onMenuToggle,
  liveStatus,
  actions,
}: TopbarProps): React.JSX.Element {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const page = PAGE_TITLES[pathname] ?? { title: "Toqe", subtitle: "" };

  return (
    <header
      className="flex items-center gap-4 px-5 flex-shrink-0 relative"
      style={{
        height: 52,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        zIndex: 20,
      }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-lg"
        style={{ color: "var(--text-secondary)" }}
      >
        <Menu size={18} />
      </button>

      {/* Título da página */}
      <div className="flex flex-col leading-none">
        <span
          className="font-bold text-[15px] leading-tight"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          {page.title}
        </span>
        {page.subtitle && (
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {page.subtitle}
          </span>
        )}
      </div>

      {/* Live status */}
      {liveStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
          style={{
            background: liveStatus.active
              ? "rgba(29,185,84,0.06)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${liveStatus.active ? "rgba(29,185,84,0.15)" : "var(--border-default)"}`,
          }}
        >
          <span
            className="rounded-full flex-shrink-0"
            style={{
              width: 5,
              height: 5,
              background: liveStatus.active
                ? "var(--status-success)"
                : "var(--text-muted)",
              animation: liveStatus.active
                ? "tqe-pulse-green 1.5s ease-in-out infinite"
                : "none",
            }}
          />
          <span
            className="text-[11px] font-medium"
            style={{
              color: liveStatus.active
                ? "var(--status-success)"
                : "var(--text-secondary)",
            }}
          >
            {liveStatus.label}
          </span>
        </motion.div>
      )}

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 9,
            color: searchFocused ? "var(--status-info)" : "var(--text-muted)",
            pointerEvents: "none",
            transition: "color 150ms",
          }}
        />
        <input
          placeholder="Buscar..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            paddingLeft: 28,
            paddingRight: 12,
            height: 30,
            width: searchFocused ? 220 : 160,
            background: "var(--bg-card)",
            border: `1px solid ${searchFocused ? "var(--status-info)" : "var(--border-default)"}`,
            boxShadow: searchFocused
              ? "0 0 0 3px rgba(77,163,255,0.08)"
              : "none",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 12,
            fontFamily: "var(--font-body)",
            outline: "none",
            transition: "all 200ms var(--ease-snappy)",
          }}
        />
      </div>

      {/* Notificações */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="p-1.5 rounded-lg transition-colors relative"
          style={{
            color: notifOpen ? "var(--text-primary)" : "var(--text-secondary)",
          }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 rounded-full"
            style={{ width: 5, height: 5, background: "var(--status-error)" }}
          />
        </button>

        <AnimatePresence>
          {notifOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30"
                onClick={() => setNotifOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-40 rounded-xl overflow-hidden"
                style={{
                  width: 280,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Notificações
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: "rgba(255,77,79,0.12)",
                      color: "var(--status-error)",
                    }}
                  >
                    3 novas
                  </span>
                </div>
                {[
                  {
                    title: "Cliente atrasado",
                    desc: "João Silva — 08:30",
                    time: "2min",
                    color: "var(--status-error)",
                  },
                  {
                    title: "Agendamento confirmado",
                    desc: "Pedro Santos — 09:00",
                    time: "15min",
                    color: "var(--status-success)",
                  },
                  {
                    title: "Horário livre encaixado",
                    desc: "Carlos — 13:00",
                    time: "1h",
                    color: "var(--status-info)",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                    style={{
                      borderBottom:
                        i < 2 ? "1px solid var(--border-subtle)" : "none",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      className="flex-shrink-0 rounded-full mt-1"
                      style={{ width: 6, height: 6, background: n.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="block text-[12px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {n.title}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {n.desc}
                      </span>
                    </div>
                    <span
                      className="text-[10px] flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {n.time}
                    </span>
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Actions extras */}
      {actions}

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="p-1.5 rounded-lg"
        style={{ color: "var(--text-secondary)" }}
        title="Sair"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
