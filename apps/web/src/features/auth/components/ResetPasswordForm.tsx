"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import { AuthErrorBanner } from "./AuthErrorBanner";

const resetSchema = z
  .object({
    novaSenha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmarSenha: z.string().min(6, "Confirme sua senha"),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type ResetPasswordFormData = z.infer<typeof resetSchema>;

interface ResetPasswordFormProps {
  token: string;
  onBackToLogin: () => void;
}

/**
 * Formulário de redefinição de senha. Recebe o token da URL e envia
 * junto com a nova senha para o BFF → NestJS.
 */
export function ResetPasswordForm({
  token,
  onBackToLogin,
}: ResetPasswordFormProps): React.JSX.Element {
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
  });

  const apiError =
    reset.error instanceof Error
      ? reset.error.message
      : reset.error
        ? "Erro ao redefinir senha. Tente novamente."
        : "";

  // ── Tela de sucesso ────────────────────────────────────────────────
  if (reset.isSuccess) {
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
            Senha redefinida!
          </span>
          <span
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Sua senha foi atualizada com sucesso. Faça login com a nova senha.
          </span>
        </div>
        <button
          onClick={onBackToLogin}
          className="text-[13px] font-medium mt-2"
          style={{ color: "var(--status-info)" }}
        >
          Ir para o login
        </button>
      </motion.div>
    );
  }

  // ── Formulário ─────────────────────────────────────────────────────
  return (
    <motion.form
      key="reset"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18 }}
      onSubmit={handleSubmit((data) =>
        reset.mutate({ token, novaSenha: data.novaSenha }),
      )}
      className="space-y-4"
    >
      <div>
        <label className="tqe-label">Nova senha</label>
        <input
          type="password"
          {...register("novaSenha")}
          placeholder="Mínimo 6 caracteres"
          className="tqe-input"
          autoComplete="new-password"
        />
        {errors.novaSenha && (
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--status-error)" }}
          >
            {errors.novaSenha.message}
          </p>
        )}
      </div>

      <div>
        <label className="tqe-label">Confirmar senha</label>
        <input
          type="password"
          {...register("confirmarSenha")}
          placeholder="Repita a nova senha"
          className="tqe-input"
          autoComplete="new-password"
        />
        {errors.confirmarSenha && (
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--status-error)" }}
          >
            {errors.confirmarSenha.message}
          </p>
        )}
      </div>

      <AuthErrorBanner message={apiError} />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={reset.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
        style={{
          height: 44,
          background: reset.isPending
            ? "rgba(244,180,0,0.6)"
            : "var(--primary)",
          color: "#0D0D0D",
          cursor: reset.isPending ? "not-allowed" : "pointer",
          boxShadow: reset.isPending ? "none" : "0 0 20px rgba(244,180,0,0.2)",
          transition: "all 200ms",
        }}
      >
        {reset.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Redefinindo...
          </>
        ) : (
          <>
            Redefinir senha
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
