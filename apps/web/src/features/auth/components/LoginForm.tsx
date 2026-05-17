"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks/use-login";
import { TwoFaRequiredError } from "@/features/auth/services/auth.service";
import { AuthErrorBanner } from "./AuthErrorBanner";

interface LoginFormProps {
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  onTwoFaRequired: (tempToken: string) => void;
}

/**
 * Formulário de login. Encapsula:
 *   - validação Zod via react-hook-form;
 *   - mutation de login via `useLogin` (TanStack Query);
 *   - estado local (toggle de visibilidade da senha);
 *   - banner de erro vindo da mutation.
 *
 * Não conhece o painel de branding nem o ForgotPasswordForm — a página
 * raiz orquestra a composição.
 */
export function LoginForm({
  onForgotPassword,
  onCreateAccount,
  onTwoFaRequired,
}: LoginFormProps): React.JSX.Element {
  const [showPass, setShowPass] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const apiError =
    login.error instanceof TwoFaRequiredError
      ? ""
      : login.error instanceof Error
        ? login.error.message
        : "";

  return (
    <motion.form
      key="login"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18 }}
      onSubmit={handleSubmit((data) =>
        login.mutate(data, {
          onError: (err) => {
            if (err instanceof TwoFaRequiredError) {
              onTwoFaRequired(err.tempToken);
            }
          },
        }),
      )}
      className="space-y-4"
    >
      {/* E-mail */}
      <div>
        <label className="tqe-label">E-mail</label>
        <input
          type="email"
          {...register("email")}
          placeholder="seu@email.com"
          className="tqe-input"
          autoComplete="email"
          maxLength={100}
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

      {/* Senha */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="tqe-label" style={{ margin: 0 }}>
            Senha
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px]"
            style={{ color: "var(--status-info)" }}
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            {...register("senha")}
            placeholder="••••••••"
            className="tqe-input pr-10"
            autoComplete="current-password"
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.senha && (
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--status-error)" }}
          >
            {errors.senha.message}
          </p>
        )}
      </div>

      <AuthErrorBanner message={apiError} />

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={login.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
        style={{
          height: 44,
          background: login.isPending
            ? "rgba(244,180,0,0.6)"
            : "var(--primary)",
          color: "#0D0D0D",
          cursor: login.isPending ? "not-allowed" : "pointer",
          boxShadow: login.isPending ? "none" : "0 0 20px rgba(244,180,0,0.2)",
          transition: "all 200ms",
        }}
      >
        {login.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar
            <ArrowRight size={15} strokeWidth={2.5} />
          </>
        )}
      </motion.button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-px"
          style={{ background: "var(--border-subtle)" }}
        />
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          ou
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--border-subtle)" }}
        />
      </div>

      {/* Criar conta */}
      <div className="text-center">
        <span
          className="text-[13px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Não tem conta?{" "}
          <button
            type="button"
            onClick={onCreateAccount}
            className="font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Criar conta grátis
          </button>
        </span>
      </div>
    </motion.form>
  );
}
