"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { AuthErrorBanner } from "./AuthErrorBanner";

interface TwoFaVerifyFormProps {
  tempToken: string;
  onBack: () => void;
}

export function TwoFaVerifyForm({
  tempToken,
  onBack,
}: TwoFaVerifyFormProps): React.JSX.Element {
  const { verifyTwoFa } = useAuth();
  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsPending(true);
    setError("");
    try {
      await verifyTwoFa(tempToken, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
      setIsPending(false);
    }
  }

  return (
    <motion.form
      key="twofa"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div
        className="flex items-center justify-center rounded-2xl mx-auto mb-2"
        style={{
          width: 56,
          height: 56,
          background: "rgba(244,180,0,0.1)",
          border: "1px solid rgba(244,180,0,0.2)",
          color: "var(--primary)",
        }}
      >
        <ShieldCheck size={24} />
      </div>

      <div>
        <label className="tqe-label">Código de autenticação</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="tqe-input text-center text-[18px] tracking-[0.4em] font-mono"
          autoComplete="one-time-code"
          autoFocus
        />
        <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
          Abra seu app autenticador e insira o código de 6 dígitos.
        </p>
      </div>

      <AuthErrorBanner message={error} />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isPending || code.length !== 6}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
        style={{
          height: 44,
          background:
            isPending || code.length !== 6
              ? "rgba(244,180,0,0.6)"
              : "var(--primary)",
          color: "#0D0D0D",
          cursor: isPending || code.length !== 6 ? "not-allowed" : "pointer",
          boxShadow:
            isPending || code.length !== 6
              ? "none"
              : "0 0 20px rgba(244,180,0,0.2)",
          transition: "all 200ms",
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verificando...
          </>
        ) : (
          "Verificar"
        )}
      </motion.button>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-[13px]"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={13} />
        Voltar para o login
      </button>
    </motion.form>
  );
}
