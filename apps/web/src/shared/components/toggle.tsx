"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-all duration-200"
      style={{
        width: 36,
        height: 20,
        background: checked ? "var(--status-success)" : "var(--border-strong)",
      }}
    >
      <motion.span
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 rounded-full"
        style={{ width: 16, height: 16, background: "#fff", left: 0 }}
      />
    </button>
  );
}
