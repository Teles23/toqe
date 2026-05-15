"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Wrapper que só renderiza o chart depois que o container tem dimensões
 * positivas (>0). Evita o warning do recharts:
 *   "The width(-1) and height(-1) of chart should be greater than 0"
 *
 * Causa: o `ResponsiveContainer` mede o pai via ResizeObserver. Em layouts
 * com `grid 1fr`, `motion.div` (framer-motion com opacity 0 inicial), ou
 * carregados via Suspense, o pai pode ter `clientWidth/Height = 0` na
 * primeira measurement — recharts subtrai 1 do tamanho e dispara o warning.
 *
 * Solução: monitora o próprio wrapper com ResizeObserver e só monta os
 * filhos quando width > 0 AND height > 0. O wrapper carrega `width:100%`
 * e `height:100%` para herdar o tamanho do pai natural do consumer.
 */
export function ClientOnlyChart({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check inicial síncrono — evita 1 frame de delay quando o pai já está medido.
    const rect0 = el.getBoundingClientRect();
    if (rect0.width > 0 && rect0.height > 0) {
      setReady(true);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {ready ? children : null}
    </div>
  );
}

interface TooltipPayloadItem {
  color?: string;
  value: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  prefix?: string;
  suffix?: string;
  /** Override formatter for the value (e.g. formatBRL for currency charts) */
  formatter?: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-md)",
        fontSize: 12,
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{ color: p.color ?? "var(--status-success)", fontWeight: 600 }}
        >
          {formatter && typeof p.value === "number"
            ? formatter(p.value)
            : `${prefix}${typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}${suffix}`}
        </div>
      ))}
    </div>
  );
}
