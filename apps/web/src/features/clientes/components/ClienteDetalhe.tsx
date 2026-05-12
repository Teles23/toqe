/* eslint-disable no-restricted-syntax */
"use client";

import { motion } from "framer-motion";
import { Calendar, MessageCircle, Phone, Scissors, X } from "lucide-react";
import type { Cliente } from "../types/cliente.types";
import { STATUS_CONFIG } from "../constants/cliente.constants";

interface ClienteDetalheProps {
  cliente: Cliente;
  onClose: () => void;
}

export function ClienteDetalhe({ cliente, onClose }: ClienteDetalheProps) {
  const statusCfg = STATUS_CONFIG[cliente.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
        width: 320,
        flexShrink: 0,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          Perfil do cliente
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + nome */}
        <div
          className="px-4 py-5 text-center"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="mx-auto flex items-center justify-center rounded-full font-bold text-xl mb-3"
            style={{
              width: 56,
              height: 56,
              background: "rgba(77,163,255,0.1)",
              color: "var(--status-info)",
              border: "1px solid rgba(77,163,255,0.2)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {cliente.initial}
          </div>
          <span
            className="block font-bold text-[15px] mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {cliente.nome}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Métricas */}
        <div
          className="grid grid-cols-2 gap-2 px-4 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {[
            { label: "Visitas", value: `${cliente.totalVisitas}`, suffix: "x" },
            {
              label: "Total gasto",
              value: `R$${cliente.totalGasto}`,
              suffix: "",
            },
            {
              label: "Ticket médio",
              value: `R$${cliente.ticketMedio}`,
              suffix: "",
            },
            {
              label: "Perfil",
              value: cliente.perfil,
              suffix: "",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg px-3 py-2.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="block text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </span>
              <span
                className="font-bold text-[15px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                {m.value}
                {m.suffix && (
                  <span
                    className="text-[11px] ml-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {m.suffix}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Serviço favorito */}
        {cliente.servicoFav && (
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="block text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Serviço favorito
            </span>
            <div className="flex items-center gap-2">
              <Scissors size={13} style={{ color: "var(--status-warning)" }} />
              <span
                className="text-[13px]"
                style={{ color: "var(--text-primary)" }}
              >
                {cliente.servicoFav}
              </span>
            </div>
          </div>
        )}

        {/* Contato */}
        {cliente.telefone && (
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="block text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Contato
            </span>
            <div className="flex items-center gap-2">
              <Phone size={13} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-[13px]"
                style={{ color: "var(--text-primary)" }}
              >
                {cliente.telefone}
              </span>
            </div>
          </div>
        )}

        {/* Última visita */}
        {cliente.ultimaVisita && (
          <div className="px-4 py-3">
            <span
              className="block text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Última visita
            </span>
            <span
              className="text-[13px]"
              style={{ color: "var(--text-primary)" }}
            >
              {new Date(cliente.ultimaVisita).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Calendar size={13} /> Agendar
        </button>
        <button
          className="flex items-center justify-center gap-1.5 px-3 rounded-lg py-2 text-[12px]"
          style={{
            background: "transparent",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          <MessageCircle size={13} />
        </button>
      </div>
    </motion.div>
  );
}
