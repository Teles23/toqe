/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface AuthErrorBannerProps {
  /** Mensagem de erro a exibir. Vazio/undefined = banner não renderiza. */
  message?: string;
}

/** Banner de erro consistente entre todos os formulários de auth. */
export function AuthErrorBanner({
  message,
}: AuthErrorBannerProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
          style={{
            background: "rgba(255,77,79,0.08)",
            border: "1px solid rgba(255,77,79,0.2)",
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "var(--status-error)", flexShrink: 0 }}
          />
          <span
            className="text-[12px]"
            style={{ color: "var(--status-error)" }}
          >
            {message}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
