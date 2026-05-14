/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface DetailPanelProps {
  title: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailPanel({
  title,
  width = 320,
  onClose,
  children,
  footer,
}: DetailPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{
        width,
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
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
          {title}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>

      {footer && (
        <div
          className="flex gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
}
