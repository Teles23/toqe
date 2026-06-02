"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Zap,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
  TwoFaRequiredError,
  requestGoogleLogin,
} from "@/features/auth/services/auth.service";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { api } from "@/shared/api/api-client";
import { useAuth } from "@/shared/hooks/use-auth";
import type { UsuarioMe } from "@toqe/shared";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

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
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const login = useLogin();
  const router = useRouter();
  const { establishSession } = useAuth();

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
      noValidate
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
        <label htmlFor="login-email" className="tqe-label">
          E-mail
        </label>
        <div className="tqe-input-affix">
          <AtSign size={15} className="text-[var(--text-muted)] shrink-0" />
          <input
            id="login-email"
            type="email"
            {...register("email")}
            placeholder="seu@email.com"
            className="tqe-input-bare"
            autoComplete="email"
            autoFocus
            maxLength={100}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] mt-1 text-[var(--status-error)]">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Senha */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-senha" className="tqe-label !m-0">
            Senha
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] text-[var(--status-info)] font-medium"
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="tqe-input-affix">
          <KeyRound size={15} className="text-[var(--text-muted)] shrink-0" />
          <input
            id="login-senha"
            type={showPass ? "text" : "password"}
            {...register("senha")}
            placeholder="••••••••"
            className="tqe-input-bare"
            autoComplete="current-password"
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
            className="ml-1 px-2 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)] border-l border-[var(--border-subtle)] transition-colors"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.senha && (
          <p className="text-[11px] mt-1 text-[var(--status-error)]">
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
          height: 48,
          background: login.isPending
            ? "rgba(244,180,0,0.6)"
            : "var(--primary)",
          color: "#0D0D0D",
          cursor: login.isPending ? "not-allowed" : "pointer",
          boxShadow: login.isPending
            ? "none"
            : "0 8px 24px rgba(244,180,0,0.25)",
          transition: "all 200ms",
          letterSpacing: "-0.01em",
        }}
      >
        {login.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar no painel
            <Kbd className="bg-black/15 text-[#0D0D0D]">
              <ArrowRight size={11} strokeWidth={2.5} />
            </Kbd>
          </>
        )}
      </motion.button>

      {/* Magic link — em breve (desabilitado) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            aria-disabled="true"
            tabIndex={-1}
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 cursor-not-allowed opacity-70"
            style={{
              background: "rgba(77,163,255,0.06)",
              border: "1px solid rgba(77,163,255,0.18)",
            }}
          >
            <span
              className="flex items-center justify-center rounded-md"
              style={{
                width: 28,
                height: 28,
                background: "rgba(77,163,255,0.15)",
                color: "var(--status-info)",
              }}
            >
              <Zap size={14} strokeWidth={2.5} />
            </span>
            <span className="flex-1 text-[12px] leading-snug text-[var(--text-secondary)]">
              <b className="text-[var(--text-primary)] font-semibold">
                Sem senha?
              </b>{" "}
              Receba um link direto no seu WhatsApp.
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-info)] whitespace-nowrap">
              Em breve
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>Em breve</TooltipContent>
      </Tooltip>

      {/* Divisor */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-[10px] tracking-[0.18em] font-semibold text-[var(--text-muted)]">
          OU
        </span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      {/* Social logins */}
      <div className="grid grid-cols-2 gap-2.5">
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <div className="relative">
            <div className={loadingGoogle ? "opacity-0" : "opacity-100"}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) return;
                  setLoadingGoogle(true);
                  try {
                    await requestGoogleLogin(credentialResponse.credential);
                    // Busca dados do usuário e popula o AuthProvider em paralelo.
                    // Sem establishSession(), o contexto fica com user/perfil null
                    // e o RequireRole redireciona em loop até o F5.
                    const [me] = await Promise.all([
                      api.get<UsuarioMe>("/usuarios/me"),
                      establishSession(),
                    ]);
                    if (me.barbearias && me.barbearias.length === 0) {
                      router.push("/onboarding");
                    } else {
                      router.push("/dashboard");
                    }
                  } catch (_err) {
                    setLoadingGoogle(false);
                  }
                }}
                onError={() => {}}
                theme="filled_black"
                text="continue_with"
                shape="rectangular"
                type="standard"
                size="large"
                logo_alignment="center"
              />
            </div>
            {loadingGoogle && (
              <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center rounded-md z-10 border border-[var(--border-default)]">
                <span className="text-[var(--text-primary)] text-sm font-medium flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Carregando...
                </span>
              </div>
            )}
          </div>
        ) : (
          <SocialPlaceholder label="Google" />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-disabled="true"
              disabled
              className="h-[46px] rounded-md flex items-center justify-center gap-2 text-[13px] font-medium cursor-not-allowed opacity-50 transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <AppleGlyph />
              Apple
            </button>
          </TooltipTrigger>
          <TooltipContent>Em breve</TooltipContent>
        </Tooltip>
      </div>

      {/* Criar conta */}
      <div className="text-center pt-1">
        <span className="text-[13px] text-[var(--text-secondary)]">
          Sua barbearia ainda não está aqui?{" "}
          <button
            type="button"
            onClick={onCreateAccount}
            className="font-semibold text-[var(--primary)]"
          >
            Cadastrar agora →
          </button>
        </span>
      </div>
    </motion.form>
  );
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function SocialPlaceholder({ label }: { label: string }): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          disabled
          className="h-[46px] rounded-md flex items-center justify-center gap-2 text-[13px] font-medium cursor-not-allowed opacity-50"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>Em breve</TooltipContent>
    </Tooltip>
  );
}

function AppleGlyph(): React.JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
