"use client";

import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

type StatusColor = "success" | "warning" | "error" | "info" | "neutral";

type IconComponent = React.ComponentType<{
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}>;

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  status?: StatusColor;
  icon?: IconComponent;
  trend?: { value: number; label: string };
  subtitle?: string;
  animate?: boolean;
  onClick?: () => void;
}

const STATUS_COLORS: Record<StatusColor, string> = {
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  error: "var(--status-error)",
  info: "var(--status-info)",
  neutral: "var(--text-muted)",
};

function AnimatedNumber({ value }: { value: number }): React.JSX.Element {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, count]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

export default function StatCard({
  label,
  value,
  unit,
  status = "neutral",
  icon: Icon,
  trend,
  subtitle,
  animate: shouldAnimate = true,
  onClick,
}: StatCardProps): React.JSX.Element {
  const color = STATUS_COLORS[status];
  const isNumeric = typeof value === "number";

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className="tqe-stat-card relative rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        padding: "1.125rem 1.25rem",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 180ms, box-shadow 180ms",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Linha de acento no topo */}
      <div
        className="absolute top-0 left-4 right-4 rounded-b"
        style={{
          height: 2,
          background: color,
          opacity: status === "neutral" ? 0.2 : 0.5,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <span
            className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </span>

          {/* Valor */}
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-bold leading-none"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.75rem",
                letterSpacing: "-0.04em",
                color,
              }}
            >
              {isNumeric && shouldAnimate ? (
                <AnimatedNumber value={value as number} />
              ) : (
                value
              )}
            </span>
            {unit && (
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {unit}
              </span>
            )}
          </div>

          {/* Subtítulo ou trend */}
          {subtitle && (
            <span
              className="block text-[11px] mt-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {subtitle}
            </span>
          )}

          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className="text-[11px] font-semibold"
                style={{
                  color:
                    trend.value >= 0
                      ? "var(--status-success)"
                      : "var(--status-error)",
                }}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {trend.label}
              </span>
            </div>
          )}
        </div>

        {/* Ícone */}
        {Icon && (
          <div
            className="tqe-stat-icon flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: `${color}12`,
              color,
            }}
          >
            <Icon size={17} strokeWidth={1.8} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
