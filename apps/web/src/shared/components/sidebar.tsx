"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  User,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "main",
  },
  { href: "/agenda", label: "Agenda", icon: Calendar, group: "main" },
  { href: "/servicos", label: "Serviços", icon: Briefcase, group: "main" },
  { href: "/barbeiros", label: "Barbeiros", icon: Users, group: "main" },
  { href: "/clientes", label: "Clientes", icon: User, group: "main" },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    group: "insights",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    group: "system",
  },
];

const groupLabels: Record<string, string> = {
  main: "Principal",
  insights: "Insights",
  system: "Sistema",
};

export default function Sidebar({
  isOpen,
  onToggle,
}: SidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  // Agrupa itens
  const groups = navItems.reduce<Record<string, typeof navItems>>(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group]!.push(item);
      return acc;
    },
    {},
  );

  return (
    <>
      {/* -- Sidebar -- */}
      <motion.aside
        animate={{ width: isOpen ? 220 : 56 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ willChange: "width" }}
        className="relative flex flex-col h-screen overflow-hidden flex-shrink-0"
        aria-label="Navegação principal"
      >
        {/* Fundo com borda direita */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-subtle)",
          }}
        />

        {/* -- Logo / Header -- */}
        <div
          className="relative z-10 flex items-center h-14 px-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Ícone da marca */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center flex-shrink-0 rounded-lg cursor-pointer"
            style={{
              width: 32,
              height: 32,
              background: "var(--primary)",
              boxShadow: "0 0 16px rgba(244,180,0,0.3)",
            }}
            onClick={() => router.push("/dashboard")}
          >
            <Scissors size={15} color="#0D0D0D" strokeWidth={2.5} />
          </motion.div>

          {/* Wordmark — some ao colapsar */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="ml-3 flex flex-col leading-none overflow-hidden"
              >
                <span
                  className="font-bold tracking-tight text-sm"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--text-primary)",
                  }}
                >
                  Toqe
                </span>
                <span
                  className="text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Portal
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* -- Live Status chip -- */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 px-3 pt-3 pb-1 overflow-hidden"
            >
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(29,185,84,0.06)",
                  border: "1px solid rgba(29,185,84,0.15)",
                }}
              >
                {/* Dot pulsante */}
                <span
                  className="flex-shrink-0 rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--status-success)",
                    boxShadow: "0 0 6px var(--status-success)",
                    animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                  }}
                />
                <div className="flex flex-col leading-tight min-w-0">
                  <span
                    className="text-[11px] font-semibold truncate"
                    style={{ color: "var(--status-success)" }}
                  >
                    Barbearia aberta
                  </span>
                  <span
                    className="text-[10px] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    3 barbeiros ativos
                  </span>
                </div>
                <Zap
                  size={11}
                  color="var(--status-success)"
                  className="ml-auto flex-shrink-0"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dot quando colapsado */}
        <AnimatePresence initial={false}>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 flex justify-center py-3"
            >
              <span
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--status-success)",
                  boxShadow: "0 0 8px var(--status-success)",
                  animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Nav -- */}
        <nav className="relative z-10 flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden space-y-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              {/* Label do grupo — só quando aberto */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-2 mb-1"
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {groupLabels[group]}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <ul className="space-y-0.5">
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <motion.button
                        onClick={() => router.push(item.href)}
                        title={!isOpen ? item.label : undefined}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "tqe-animate-in w-full flex items-center gap-3 rounded-lg relative overflow-hidden",
                          "transition-colors duration-150",
                          isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center",
                        )}
                        style={{
                          animationDelay: `${idx * 30}ms`,
                          background: active ? "var(--bg-card)" : "transparent",
                          border: `1px solid ${active ? "var(--border-default)" : "transparent"}`,
                          color: active
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background =
                              "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                          }
                        }}
                      >
                        {/* Barra de acento âmbar no item ativo */}
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-bar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                            style={{
                              width: 2,
                              height: 16,
                              background: "var(--primary)",
                              boxShadow: "0 0 8px var(--primary)",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}

                        {/* Ícone */}
                        <span className="flex-shrink-0">
                          <Icon
                            size={16}
                            strokeWidth={active ? 2.2 : 1.8}
                            color={
                              active ? "var(--text-primary)" : "currentColor"
                            }
                          />
                        </span>

                        {/* Label */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.18 }}
                              className="text-[13px] font-medium truncate overflow-hidden whitespace-nowrap"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* -- Footer / Toggle -- */}
        <div
          className="relative z-10 p-2 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-full flex items-center rounded-lg py-2 transition-colors duration-150",
              isOpen ? "px-3 gap-3" : "justify-center px-0",
            )}
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
            title={isOpen ? "Recolher sidebar" : "Expandir sidebar"}
          >
            <motion.span
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-shrink-0"
            >
              <ChevronLeft size={15} />
            </motion.span>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[12px] truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Recolher
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* -- Mobile overlay -- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 lg:hidden z-40"
            style={{
              background: "rgba(0,0,0,0.55)",
            }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
