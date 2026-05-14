"use client";

import React, { useEffect, useState } from "react";

export function ClientOnlyChart({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? <>{children}</> : null;
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
}

export function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
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
          style={{ color: p.color ?? "var(--text-primary)", fontWeight: 600 }}
        >
          {prefix}
          {typeof p.value === "number"
            ? p.value.toLocaleString("pt-BR")
            : p.value}
          {suffix}
        </div>
      ))}
    </div>
  );
}
