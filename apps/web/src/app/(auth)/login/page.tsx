"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/shared/hooks/use-auth";
import { loginSchema } from "@toqe/contracts";
import type { LoginInput, RegisterInput } from "@toqe/contracts";
import {
  Scissors,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

type Mode = "login" | "forgot";

export default function Login(): React.JSX.Element {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── react-hook-form com validação Zod (@toqe/contracts) ──────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // Form separado para recuperação de senha (só precisa de email)
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm<Pick<RegisterInput, "email">>({
    resolver: zodResolver(loginSchema.pick({ email: true })),
    mode: "onBlur",
  });

  async function onLoginSubmit(data: LoginInput) {
    setApiError("");
    setLoading(true);
    try {
      await login(data.email, data.senha);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao entrar. Tente novamente.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onForgotSubmit(_data: Pick<RegisterInput, "email">) {
    setApiError("");
    setLoading(true);
    try {
      // TODO: conectar endpoint de recuperação de senha quando disponível na API
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setApiError("");
    setSuccess(false);
    reset();
  }

  const TITLES: Record<Mode, { heading: string; sub: string }> = {
    login: { heading: "Bem-vindo de volta", sub: "Entre na sua conta Toqe" },
    forgot: {
      heading: "Recuperar senha",
      sub: "Enviaremos um link no seu e-mail",
    },
  };

  const { heading, sub } = TITLES[mode];

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Painel esquerdo — branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          width: "45%",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Grade decorativa */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.4,
            maskImage:
              "radial-gradient(ellipse 80% 80% at 30% 50%, black 40%, transparent 100%)",
          }}
        />

        {/* Glow âmbar */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400,
            height: 400,
            left: "-10%",
            top: "30%",
            background:
              "radial-gradient(ellipse, rgba(244,180,0,0.07) 0%, transparent 65%)",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 38,
              height: 38,
              background: "var(--primary)",
              boxShadow: "0 0 20px rgba(244,180,0,0.3)",
            }}
          >
            <Scissors size={17} color="#0D0D0D" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-[20px]"
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Toqe
          </span>
        </motion.div>

        {/* Conteúdo central */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <blockquote
            className="font-bold mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.25,
              color: "var(--text-primary)",
            }}
          >
            "A operação da barbearia em tempo real, no seu controle."
          </blockquote>

          {/* Live status mockado */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-lg)",
              maxWidth: 360,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--status-success)",
                    animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Status ao vivo
                </span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-semibold"
                style={{
                  background: "rgba(29,185,84,0.1)",
                  color: "var(--status-success)",
                }}
              >
                Aberta
              </span>
            </div>

            {/* Métricas */}
            <div
              className="grid grid-cols-2 divide-x"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              {[
                {
                  label: "Barbeiros ativos",
                  value: "3",
                  color: "var(--status-success)",
                },
                {
                  label: "Próximo horário",
                  value: "10:30",
                  color: "var(--text-primary)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-4 py-3"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span
                    className="block font-bold text-[16px]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: s.color,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Barbeiros */}
            <div className="p-3 space-y-2">
              {[
                {
                  n: "Carlos",
                  estado: "active" as const,
                  cliente: "João · Corte",
                  pct: 68,
                },
                { n: "Lucas", estado: "idle" as const, cliente: null, pct: 0 },
                {
                  n: "Felipe",
                  estado: "active" as const,
                  cliente: "Ana · Sobrancelha",
                  pct: 40,
                },
              ].map((b) => {
                const color =
                  b.estado === "active"
                    ? "var(--status-success)"
                    : "var(--text-muted)";
                return (
                  <div
                    key={b.n}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg relative overflow-hidden"
                    style={{
                      background:
                        b.estado === "active"
                          ? "rgba(29,185,84,0.04)"
                          : "var(--bg-secondary)",
                      border: `1px solid ${b.estado === "active" ? "rgba(29,185,84,0.15)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {b.estado === "active" && (
                      <div
                        className="absolute left-0 top-1.5 bottom-1.5 rounded-r"
                        style={{
                          width: 2,
                          background: color,
                          animation:
                            "tqe-sidebar-pulse 2s ease-in-out infinite",
                        }}
                      />
                    )}
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[10px]"
                      style={{
                        width: 24,
                        height: 24,
                        background: `${color}18`,
                        color,
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {b.n[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="block text-[11px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {b.n}
                      </span>
                      {b.cliente ? (
                        <>
                          <span
                            className="block text-[10px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {b.cliente}
                          </span>
                          <div
                            className="mt-1 rounded-full overflow-hidden"
                            style={{
                              height: 2,
                              background: "var(--border-default)",
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${b.pct}%`, background: color }}
                            />
                          </div>
                        </>
                      ) : (
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Disponível
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Rodapé do painel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex items-center gap-2"
        >
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            © 2025 Toqe · Urban Flow System
          </span>
        </motion.div>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{ maxWidth: 400 }}
        >
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: "var(--primary)" }}
            >
              <Scissors size={14} color="#0D0D0D" strokeWidth={2.5} />
            </div>
            <span
              className="font-bold text-[18px]"
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              Toqe
            </span>
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="mb-8"
            >
              <h1
                className="font-bold mb-1.5"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.6rem",
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                {heading}
              </h1>
              <p
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Formulário */}
          <AnimatePresence mode="wait">
            {success && mode === "forgot" ? (
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
                  onClick={() => switchMode("login")}
                  className="text-[13px] font-medium mt-2"
                  style={{ color: "var(--status-info)" }}
                >
                  Voltar para o login
                </button>
              </motion.div>
            ) : mode === "forgot" ? (
              /* ── Formulário recuperação de senha ── */
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmitForgot(onForgotSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="tqe-label">E-mail</label>
                  <input
                    type="email"
                    {...registerForgot("email")}
                    placeholder="seu@email.com"
                    className="tqe-input"
                    autoComplete="email"
                  />
                  {forgotErrors.email && (
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--status-error)" }}
                    >
                      {forgotErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Erro de API */}
                <AnimatePresence>
                  {apiError && (
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
                        {apiError}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
                  style={{
                    height: 44,
                    background: loading
                      ? "rgba(244,180,0,0.6)"
                      : "var(--primary)",
                    color: "#0D0D0D",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading
                      ? "none"
                      : "0 0 20px rgba(244,180,0,0.2)",
                    transition: "all 200ms",
                  }}
                >
                  {loading ? (
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
                    onClick={() => switchMode("login")}
                    className="text-[13px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ← Voltar para o login
                  </button>
                </div>
              </motion.form>
            ) : (
              /* ── Formulário de login ── */
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit(onLoginSubmit)}
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
                      onClick={() => switchMode("forgot")}
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

                {/* Erro de API */}
                <AnimatePresence>
                  {apiError && (
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
                        {apiError}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
                  style={{
                    height: 44,
                    background: loading
                      ? "rgba(244,180,0,0.6)"
                      : "var(--primary)",
                    color: "#0D0D0D",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading
                      ? "none"
                      : "0 0 20px rgba(244,180,0,0.2)",
                    transition: "all 200ms",
                  }}
                >
                  {loading ? (
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
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
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
                      onClick={() => {
                        window.location.href = "/onboarding";
                      }}
                      className="font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      Criar conta grátis
                    </button>
                  </span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
