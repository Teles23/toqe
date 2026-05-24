"use client";

import { useState, useEffect } from "react";
import { Calendar, MessageCircle, Phone, Scissors } from "lucide-react";
import { DetailPanel } from "@/shared/components/detail-panel";
import { DetailMetricGrid } from "@/shared/components/detail-metric-grid";
import type { Cliente } from "../types/cliente.types";
import { STATUS_CONFIG } from "../constants/cliente.constants";
import { formatBRL } from "@/shared/lib/utils";
import { useClienteNota } from "../hooks/use-cliente-nota";

interface ClienteDetalheProps {
  cliente: Cliente;
  barCodigo: number;
  onClose: () => void;
}

function ClienteNotaEditor({
  barCodigo,
  clienteCodigo,
}: {
  barCodigo: number;
  clienteCodigo: number;
}) {
  const { nota, salvar, isSalvando } = useClienteNota(barCodigo, clienteCodigo);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nota);

  useEffect(() => {
    if (!editando) setTexto(nota);
  }, [nota, editando]);

  if (editando) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          className="w-full text-[12px] text-[var(--text-primary)] bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-md px-2 py-1.5 resize-none"
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          data-testid="input-nota"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              salvar(texto);
              setEditando(false);
            }}
            disabled={isSalvando}
            className="text-[11px] font-semibold px-3 py-1 rounded bg-[var(--primary)] text-[#0D0D0D]"
            data-testid="btn-salvar-nota"
          >
            {isSalvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={() => {
              setTexto(nota);
              setEditando(false);
            }}
            className="text-[11px] px-3 py-1 rounded border border-[var(--border-strong)] text-[var(--text-secondary)]"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <p
        className="text-[12px] text-[var(--text-secondary)] flex-1 whitespace-pre-wrap"
        data-testid="nota-conteudo"
      >
        {nota || "Nenhuma nota registrada."}
      </p>
      <button
        onClick={() => setEditando(true)}
        className="shrink-0 text-[11px] font-semibold text-[var(--primary)] hover:underline"
        data-testid="btn-editar-nota"
      >
        Editar
      </button>
    </div>
  );
}

export function ClienteDetalhe({
  cliente,
  barCodigo,
  onClose,
}: ClienteDetalheProps) {
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
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="block text-[10px] uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            Última visita
          </span>
          <span className="text-[13px] text-[var(--text-primary)]">
            {new Date(cliente.ultimaVisita).toLocaleDateString("pt-BR")}
          </span>
        </div>
      )}

      {/* Nota privada */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="block text-[10px] uppercase tracking-wider mb-2 text-[var(--text-muted)]">
          Nota privada
        </span>
        <ClienteNotaEditor
          barCodigo={barCodigo}
          clienteCodigo={cliente.codigo}
        />
      </div>
    </DetailPanel>
  );
}
