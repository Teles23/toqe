"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import StatCard from "@/shared/components/stat-card";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  useFaturamento,
  useAgendamentosRelatorio,
  useServicosRelatorio,
  useBarbeirosRelatorio,
  useHorariosPico,
} from "../hooks/use-relatorios";
import { PERIODO_OPTIONS } from "../constants/relatorio.constants";
import type { Periodo } from "../types/relatorio.types";
import { FaturamentoChart } from "./FaturamentoChart";
import { AgendamentosChart } from "./AgendamentosChart";
import { ServicosMixChart } from "./ServicosMixChart";
import { HorariosPicoChart } from "./HorariosPicoChart";
import { BarbeirosRanking } from "./BarbeirosRanking";

export function RelatoriosView() {
  const { barbearia } = useAuth();
  const barCodigo = barbearia?.codigo ?? null;

  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [exporting, setExporting] = useState(false);

  const handleExportar = useCallback(async () => {
    if (!barCodigo || exporting) return;
    setExporting(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
      const token = document.cookie.match(
        /(?:^|;\s*)access_token=([^;]+)/,
      )?.[1];
      const res = await fetch(
        `${apiBase}/barbearias/${barCodigo}/relatorios/faturamento?periodo=${periodo}&formato=csv`,
        {
          headers: {
            Authorization: token ? `Bearer ${decodeURIComponent(token)}` : "",
            "x-tenant-id": String(barCodigo),
          },
        },
      );
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-faturamento-${periodo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [barCodigo, periodo, exporting]);

  const { data: faturamento = [] } = useFaturamento(barCodigo, periodo);
  const { data: agendamentos = [] } = useAgendamentosRelatorio(
    barCodigo,
    periodo,
  );
  const { data: servicos = [] } = useServicosRelatorio(barCodigo, periodo);
  const { data: barbeiros = [] } = useBarbeirosRelatorio(barCodigo, periodo);
  const { data: horariosPico = [] } = useHorariosPico(barCodigo, periodo);

  const totalFat = faturamento.reduce((s, d) => s + d.total, 0);
  const totalAgend = agendamentos.reduce(
    (s, d) => s + d.concluido + d.cancelado + d.no_show,
    0,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header + período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="font-bold text-[18px] leading-tight"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Relatórios
          </h1>
          <span
            className="text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Visão consolidada de performance
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex rounded-lg p-0.5 gap-0.5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {PERIODO_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className="px-3 py-1.5 rounded text-[11px] font-medium transition-all"
                style={{
                  background:
                    periodo === p.value ? "var(--bg-hover)" : "transparent",
                  color:
                    periodo === p.value
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  border: `1px solid ${periodo === p.value ? "var(--border-default)" : "transparent"}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => void handleExportar()}
            disabled={!barCodigo || exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <Download size={13} /> {exporting ? "Exportando…" : "Exportar CSV"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Faturamento total",
            value: totalFat,
            unit: "R$",
            status: "success" as const,
            icon: DollarSign,
          },
          {
            label: "Total agendamentos",
            value: totalAgend,
            status: "info" as const,
            icon: Calendar,
          },
          {
            label: "Serviços distintos",
            value: servicos.length,
            status: "warning" as const,
            icon: Users,
          },
          {
            label: "Barbeiros ativos",
            value: barbeiros.length,
            status: "neutral" as const,
            icon: TrendingUp,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FaturamentoChart data={faturamento} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
        >
          <AgendamentosChart data={agendamentos} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ServicosMixChart data={servicos} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
      >
        <HorariosPicoChart data={horariosPico} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
      >
        <BarbeirosRanking data={barbeiros} />
      </motion.div>
    </div>
  );
}
