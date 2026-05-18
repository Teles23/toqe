"use client";

import { Calendar, MessageCircle, Phone, Scissors } from "lucide-react";
import { DetailPanel } from "@/shared/components/detail-panel";
import { DetailMetricGrid } from "@/shared/components/detail-metric-grid";
import type { Cliente } from "../types/cliente.types";
import { STATUS_CONFIG } from "../constants/cliente.constants";
import { formatBRL } from "@/shared/lib/utils";

interface ClienteDetalheProps {
  cliente: Cliente;
  onClose: () => void;
}

export function ClienteDetalhe({ cliente, onClose }: ClienteDetalheProps) {
  const statusCfg = STATUS_CONFIG[cliente.status];

  const metrics = [
    { label: "Visitas", value: `${cliente.totalVisitas}`, suffix: "x" },
    { label: "Total gasto", value: formatBRL(cliente.totalGasto) },
    { label: "Ticket médio", value: formatBRL(cliente.ticketMedio) },
    { label: "Perfil", value: cliente.perfil },
  ];

  const footer = (
    <>
      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold bg-[var(--primary)] text-[#0D0D0D]">
        <Calendar size={13} /> Agendar
      </button>
      <button className="flex items-center justify-center gap-1.5 px-3 rounded-lg py-2 text-[12px] border border-[var(--border-strong)] text-[var(--text-secondary)]">
        <MessageCircle size={13} />
      </button>
    </>
  );

  return (
    <DetailPanel title="Perfil do cliente" onClose={onClose} footer={footer}>
      {/* Avatar + nome */}
      <div className="px-4 py-5 text-center border-b border-[var(--border-subtle)]">
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
        <span className="block font-bold text-[15px] mb-2 font-heading text-[var(--text-primary)]">
          {cliente.nome}
        </span>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
      </div>

      <DetailMetricGrid metrics={metrics} />

      {/* Serviço favorito */}
      {cliente.servicoFav && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="block text-[10px] uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            Serviço favorito
          </span>
          <div className="flex items-center gap-2">
            <Scissors size={13} className="text-[var(--status-warning)]" />
            <span className="text-[13px] text-[var(--text-primary)]">
              {cliente.servicoFav}
            </span>
          </div>
        </div>
      )}

      {/* Contato */}
      {cliente.telefone && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="block text-[10px] uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            Contato
          </span>
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-[var(--text-muted)]" />
            <span className="text-[13px] text-[var(--text-primary)]">
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
    </DetailPanel>
  );
}
