"use client";

import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Scissors, Eye, EyeOff, ArrowRight,
  AlertCircle, Loader2, CheckCircle,
} from "lucide-react";

type Mode = "login" | "forgot";

export default function Login(): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 1200));

    if (mode === "forgot") {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (email && senha) {
      setLoading(false);
      router.push("/dashboard");
    } else {
      setError("Preencha todos os campos.");
      setLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess(false);
  }

  const TITLES: Record<Mode, { heading: string; sub: string }> = {
    login:  { heading: "Bem-vindo de volta",  sub: "Entre na sua conta Toqe"          },
    forgot: { heading: "Recuperar senha",      sub: "Enviaremos um link no seu e-mail" },
  };

  const { heading, sub } = TITLES[mode];

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* -- Painel esquerdo  branding -- */}
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
            backgroundImage: "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.4,
            maskImage: "radial-gradient(ellipse 80% 80% at 30% 50%, black 40%, transparent 100%)",
          }}
        />

        {/* Glow �mbar */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400, height: 400,
            left: "-10%", top: "30%",
            background: "radial-gradient(ellipse, rgba(244,180,0,0.07) 0%, transparent 65%)",
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
              width: 38, height: 38,
              background: "var(--primary)",
              boxShadow: "0 0 20px rgba(244,180,0,0.3)",
            }}
          >
            <Scissors size={17} color="#0D0D0D" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-[20px]"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.03em", color: "var(--text-primary)" }}
          >
            Toqe
          </span>
        </motion.div>

        {/* Conte�do central */}
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
            "A opera��o da barbearia em tempo real, no seu controle."
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
                  style={{ width: 6, height: 6, background: "var(--status-success)", animation: "tqe-pulse-green 1.5s ease-in-out infinite" }}
                />
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Status ao vivo
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                style={{ background: "rgba(29,185,84,0.1)", color: "var(--status-success)" }}>
                Aberta
              </span>
            </div>

            {/* M�tricas */}
            <div className="grid grid-cols-2 divide-x" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {[
                { label: "Barbeiros ativos", value: "3",     color: "var(--status-success)" },
                { label: "Pr�ximo hor�rio",  value: "10:30", color: "var(--text-primary)"   },
              ].map(s => (
                <div key={s.label} className="px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="block font-bold text-[16px]" style={{ fontFamily: "var(--font-heading)", color: s.color, letterSpacing: "-0.03em" }}>
                    {s.value}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Barbeiros */}
            <div className="p-3 space-y-2">
              {[
                { n: "Carlos", estado: "active" as const, cliente: "Jo�o � Corte", pct: 68 },
                { n: "Lucas",  estado: "idle"   as const, cliente: null,            pct: 0  },
                { n: "Felipe", estado: "active" as const, cliente: "Ana � Sobranc.", pct: 40 },
              ].map(b => {
                const color = b.estado === "active" ? "var(--status-success)" : "var(--text-muted)";
                return (
                  <div
                    key={b.n}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg relative overflow-hidden"
                    style={{
                      background: b.estado === "active" ? "rgba(29,185,84,0.04)" : "var(--bg-secondary)",
                      border: `1px solid ${b.estado === "active" ? "rgba(29,185,84,0.15)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {b.estado === "active" && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 rounded-r" style={{ width: 2, background: color, animation: "tqe-sidebar-pulse 2s ease-in-out infinite" }} />
                    )}
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[10px]"
                      style={{ width: 24, height: 24, background: `${color}18`, color, fontFamily: "var(--font-heading)" }}
                    >
                      {b.n[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{b.n}</span>
                      {b.cliente ? (
                        <>
                          <span className="block text-[10px]" style={{ color: "var(--text-secondary)" }}>{b.cliente}</span>
                          <div className="mt-1 rounded-full overflow-hidden" style={{ height: 2, background: "var(--border-default)" }}>
                            <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: color }} />
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Dispon�vel</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Rodap� do painel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex items-center gap-2"
        >
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            � 2025 Toqe � Urban Flow System
          </span>
        </motion.div>
      </div>

      {/* -- Painel direito  formul�rio -- */}
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
            <span className="font-bold text-[18px]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
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
                style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", letterSpacing: "-0.03em", color: "var(--text-primary)" }}
              >
                {heading}
              </h1>
              <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Formul�rio */}
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
                  style={{ width: 56, height: 56, background: "rgba(29,185,84,0.1)", color: "var(--status-success)" }}
                >
                  <CheckCircle size={24} />
                </div>
                <div>
                  <span className="block font-bold text-[15px] mb-1" style={{ color: "var(--text-primary)" }}>
                    E-mail enviado!
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Verifique sua caixa de entrada e siga as instru��es.
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
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* E-mail */}
                <div>
                  <label className="tqe-label">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="tqe-input"
                    required
                  />
                </div>

                {/* Senha  s� no login */}
                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="tqe-label" style={{ margin: 0 }}>Senha</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-[11px]"
                          style={{ color: "var(--status-info)" }}
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={senha}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="tqe-input pr-10"
                        required
                        minLength={8}
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
                  </div>
                )}

                {/* Erro */}
                <AnimatePresence>
                  {error && (
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
                      <AlertCircle size={14} style={{ color: "var(--status-error)", flexShrink: 0 }} />
                      <span className="text-[12px]" style={{ color: "var(--status-error)" }}>{error}</span>
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
                    background: loading ? "rgba(244,180,0,0.6)" : "var(--primary)",
                    color: "#0D0D0D",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 0 20px rgba(244,180,0,0.2)",
                    transition: "all 200ms",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {mode === "forgot" ? "Enviando..." : "Entrando..."}
                    </>
                  ) : (
                    <>
                      {mode === "forgot" ? "Enviar link de recupera��o" : "Entrar"}
                      {!loading && <ArrowRight size={15} strokeWidth={2.5} />}
                    </>
                  )}
                </motion.button>

                {/* Divisor */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>ou</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                </div>

                {/* Switch de modo */}
                <div className="text-center">
                  {mode === "login" ? (
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      N�o tem conta?{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/onboarding")}
                        className="font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        Criar conta gr�tis
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      � Voltar para o login
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
