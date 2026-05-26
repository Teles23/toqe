"use client";

interface Metric {
  label: string;
  value: string;
  suffix?: string;
}

interface DetailMetricGridProps {
  metrics: Metric[];
}

export function DetailMetricGrid({ metrics }: DetailMetricGridProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2 px-4 py-4"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {metrics.map((m) => (
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
  );
}
