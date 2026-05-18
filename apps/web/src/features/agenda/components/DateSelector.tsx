"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS } from "../constants/agenda.constants";

interface DateSelectorProps {
  selectedOffset: number;
  onChange: (offset: number) => void;
}

const today = new Date();

export function DateSelector({ selectedOffset, onChange }: DateSelectorProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return { date: d, offset: i - 3 };
  });

  return (
    <div className="flex items-center gap-3 min-w-0">
      <button
        className="p-1.5 rounded-lg transition-colors"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}
        onClick={() => onChange(selectedOffset - 1)}
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex gap-1.5 flex-1 overflow-x-auto">
        {days.map(({ date, offset }) => {
          const isToday = offset === 0;
          const isSelected = offset === selectedOffset;
          return (
            <motion.button
              key={offset}
              onClick={() => onChange(offset)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center px-3 py-2 rounded-lg flex-shrink-0 transition-all"
              style={{
                background: isSelected
                  ? "var(--primary)"
                  : isToday
                    ? "var(--bg-hover)"
                    : "var(--bg-card)",
                border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-default)"}`,
                color: isSelected
                  ? "#0D0D0D"
                  : isToday
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                boxShadow: isSelected ? "0 0 14px rgba(244,180,0,0.2)" : "none",
                minWidth: 52,
              }}
            >
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ opacity: isSelected ? 0.7 : 0.6 }}
              >
                {DIAS[date.getDay()]}
              </span>
              <span
                className="text-[15px] font-bold leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {date.getDate()}
              </span>
            </motion.button>
          );
        })}
      </div>

      <button
        className="p-1.5 rounded-lg transition-colors"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}
        onClick={() => onChange(selectedOffset + 1)}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
