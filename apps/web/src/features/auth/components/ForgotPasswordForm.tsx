/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { loginSchema } from "@/features/auth/schemas";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { AuthErrorBanner } from "./AuthErrorBanner";

// Reaproveita o schema do login só para o campo email — evita criar um
// schema novo enquanto o endpoint real não existe.
const forgotPasswordSchema = loginSchema.pick({ email: true });
type ForgotPasswordInput = { email: string };

interface ForgotPasswordFormProps {
  /** Callback para voltar ao formulário de login. */
  onBackToLogin: () => void;
}

/**
 * Formulário de "esqueci minha senha". Atualmente é um stub: ao
 * submeter, espera 1s e mostra tela de sucesso (o endpoint real ainda
 * não existe na API). Toda a UX já está pronta para quando ele existir.
 */
export function ForgotPasswordForm({
  onBackToLogin,
}: ForgotPasswordFormProps): React.JSX.Element {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const apiError =
    forgot.error instanceof Error
      ? forgot.error.message
      : forgot.error
        ? "Erro ao enviar link. Tente novamente."
        : "";

  // ── Tela de sucesso ────────────────────────────────────────────────
  if (forgot.isSuccess) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: "rgba(29,185,84,0.1)",
            color: "var(--status-success)",
          }}
        >
          <CheckCircle size={24} />
        </div>
        <div>
          <span
            className="block font-bold text-[15px] mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            E-mail enviado!
          </span>
          <span
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Verifique sua caixa de entrada e siga as instruções.
          </span>
        </div>
        <button
          onClick={onBackToLogin}
          className="text-[13px] font-medium mt-2"
          style={{ color: "var(--status-info)" }}
        >
          Voltar para o login
        </button>
      </motion.div>
    );
  }

  // ── Formulário ─────────────────────────────────────────────────────
  return (
    <motion.form
      key="forgot"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18 }}
      onSubmit={handleSubmit((data) => forgot.mutate(data))}
      className="space-y-4"
    >
      <div>
        <label className="tqe-label">E-mail</label>
        <input
          type="email"
          {...register("email")}
          placeholder="seu@email.com"
          className="tqe-input"
          autoComplete="email"
        />
        {errors.email && (
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--status-error)" }}
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <AuthErrorBanner message={apiError} />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={forgot.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
        style={{
          height: 44,
          background: forgot.isPending
            ? "rgba(244,180,0,0.6)"
            : "var(--primary)",
          color: "#0D0D0D",
          cursor: forgot.isPending ? "not-allowed" : "pointer",
          boxShadow: forgot.isPending ? "none" : "0 0 20px rgba(244,180,0,0.2)",
          transition: "all 200ms",
        }}
      >
        {forgot.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Enviar link de recuperação
            <ArrowRight size={15} strokeWidth={2.5} />
          </>
        )}
      </motion.button>

      <div className="text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[13px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Voltar para o login
        </button>
      </div>
    </motion.form>
  );
}
