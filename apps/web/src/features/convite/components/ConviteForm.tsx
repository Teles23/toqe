"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Scissors,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useConvite } from "@/features/convite/hooks/use-convite";
import { useAceitarConvite } from "@/features/convite/hooks/use-aceitar-convite";
import { useRejeitarConvite } from "@/features/convite/hooks/use-rejeitar-convite";
import { ConviteServiceError } from "@/features/convite/services/convite.service";
import { AuthErrorBanner } from "@/features/auth/components/AuthErrorBanner";

// ─── View state (espelha o mobile) ─────────────────────────────────────────────
type ConviteView =
  | "loading"
  | "expired"
  | "landing"
  | "form"
  | "accepting"
  | "welcome";

interface ConviteFormProps {
  token: string;
}

/**
 * Jornada pública de aceite de convite de barbeiro no web.
 *
 * Espelha os estados do mobile: loading → landing → form → accepting →
 * welcome, com `expired` para convite inválido. O aceite é um auto-login:
 * o BFF seta os cookies e `useAceitarConvite` chama `establishSession()`.
 */
export function ConviteForm({ token }: ConviteFormProps): React.JSX.Element {
  const router = useRouter();

  const { data, isLoading, isError } = useConvite(token);
  const aceitar = useAceitarConvite();
  const rejeitar = useRejeitarConvite();

  const [view, setView] = useState<ConviteView | null>(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [welcomeNome, setWelcomeNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // ── Deriva o estado atual ────────────────────────────────────────────────
  const resolvedView: ConviteView = (() => {
    if (view === "form" || view === "accepting" || view === "welcome") {
      return view;
    }
    if (isLoading) return "loading";
    if (isError || !data) return "expired";
    return "landing";
  })();

  function handleAccept() {
    setErro(null);
    setView("accepting");
    aceitar.mutate(
      { token, nome: nome || undefined, senha: senha || undefined },
      {
        onSuccess: (result) => {
          setWelcomeNome(result.user.nome);
          setView("welcome");
        },
        onError: (e) => {
          const status = e instanceof ConviteServiceError ? e.status : 0;
          const msg =
            status === 409
              ? "Convite já utilizado."
              : status === 404
                ? "Convite expirado ou não encontrado."
                : status === 401
                  ? "Senha incorreta."
                  : status === 400
                    ? "Senha de ao menos 8 caracteres."
                    : (e.message ??
                      "Erro ao aceitar convite. Tente novamente.");
          setErro(msg);
          setView("form");
        },
      },
    );
  }

  function handleReject() {
    // Remove o token no backend (não cria conta/vínculo) e volta ao login.
    rejeitar.mutate(token);
    router.push("/login");
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (resolvedView === "loading") {
    return (
      <div
        data-testid="convite-loading"
        className="flex items-center justify-center py-16"
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--primary)" }}
        />
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────
  if (resolvedView === "expired") {
    return (
      <motion.div
        data-testid="convite-expirado"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: "rgba(255,77,79,0.1)",
            color: "var(--status-error)",
          }}
        >
          <XCircle size={24} />
        </div>
        <div>
          <span
            className="block font-bold text-[15px] mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Link inválido
          </span>
          <span
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Este convite expirou ou já foi utilizado.
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-[13px] font-medium mt-2"
          style={{ color: "var(--status-info)" }}
        >
          Ir para o login
        </button>
      </motion.div>
    );
  }

  // ── Welcome (boas-vindas após auto-login) ──────────────────────────────────
  if (resolvedView === "welcome") {
    const primeiroNome = welcomeNome.trim().split(/\s+/)[0] || "barbeiro";
    return (
      <motion.div
        data-testid="convite-success"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            background: "rgba(244,180,0,0.12)",
            color: "var(--primary)",
          }}
        >
          <Scissors size={26} />
        </div>
        <div>
          <span
            className="block font-bold text-[18px] mb-1"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Bem-vindo, {primeiroNome}.
          </span>
          <span
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Você agora faz parte da {data?.barbeariaNome ?? "equipe"}. Vamos
            configurar sua agenda?
          </span>
        </div>
        <button
          data-testid="btn-ver-agenda"
          onClick={() => router.push("/agenda")}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
          style={{
            height: 44,
            background: "var(--primary)",
            color: "#0D0D0D",
            boxShadow: "0 0 20px rgba(244,180,0,0.2)",
            marginTop: 8,
          }}
        >
          Ver minha agenda
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </motion.div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  if (resolvedView === "form") {
    const isNew = data?.isNew ?? false;
    return (
      <motion.form
        key="convite-form"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleAccept();
        }}
        className="space-y-4"
      >
        <div className="mb-1">
          <h2
            className="font-bold text-[18px]"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {isNew ? "Criar sua conta" : "Confirmar acesso"}
          </h2>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {isNew
              ? "Você é novo por aqui. Informe nome e crie uma senha — o e-mail já vem do convite."
              : `Confirme sua senha para entrar na ${data?.barbeariaNome ?? "equipe"}.`}
          </p>
        </div>

        {isNew ? (
          <div>
            <label htmlFor="convite-nome" className="tqe-label">
              Nome completo
            </label>
            <div className="tqe-input-affix">
              <User size={15} className="text-[var(--text-muted)] shrink-0" />
              <input
                id="convite-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="tqe-input-bare"
                autoComplete="name"
                maxLength={100}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="convite-email" className="tqe-label">
            E-mail · do convite
          </label>
          <div className="tqe-input-affix">
            <Mail size={15} className="text-[var(--text-muted)] shrink-0" />
            <input
              id="convite-email"
              type="email"
              value={data?.email ?? ""}
              readOnly
              disabled
              className="tqe-input-bare"
            />
          </div>
        </div>

        <div>
          <label htmlFor="convite-senha" className="tqe-label">
            {isNew ? "Criar senha" : "Senha"}{" "}
            <span style={{ color: "var(--text-muted)" }}>· mín. 8 chars</span>
          </label>
          <div className="tqe-input-affix">
            <ShieldCheck
              size={15}
              className="text-[var(--text-muted)] shrink-0"
            />
            <input
              id="convite-senha"
              type={showSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="tqe-input-bare"
              autoComplete={isNew ? "new-password" : "current-password"}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              className="ml-1 px-2 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)] border-l border-[var(--border-subtle)] transition-colors"
            >
              {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <AuthErrorBanner message={erro ?? ""} />

        <button
          data-testid="btn-aceitar"
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
          style={{
            height: 44,
            background: "var(--primary)",
            color: "#0D0D0D",
            boxShadow: "0 0 20px rgba(244,180,0,0.2)",
          }}
        >
          {isNew ? "Criar conta e aceitar" : "Confirmar acesso"}
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setErro(null);
              setView("landing");
            }}
            className="text-[13px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Voltar
          </button>
        </div>
      </motion.form>
    );
  }

  // ── Accepting ──────────────────────────────────────────────────────────────
  if (resolvedView === "accepting") {
    return (
      <div
        data-testid="convite-accepting"
        className="flex flex-col items-center justify-center gap-3 py-16"
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--primary)" }}
        />
        <span
          className="text-[13px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Vinculando à barbearia…
        </span>
      </div>
    );
  }

  // ── Landing ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      data-testid="convite-landing"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: 46,
          height: 46,
          background: "rgba(244,180,0,0.12)",
          border: "1px solid rgba(244,180,0,0.3)",
          color: "var(--primary)",
        }}
      >
        <Mail size={20} />
      </div>

      <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
        <span
          aria-hidden="true"
          className="inline-block h-px w-3.5 bg-[var(--primary)]"
        />
        Convite · barbeiro
      </div>

      <h1
        className="font-bold"
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-heading)",
          fontSize: "1.9rem",
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
        }}
      >
        {data!.barbeariaNome} quer você na equipe.
      </h1>

      <p
        className="text-[14px]"
        style={{ color: "var(--text-secondary)", lineHeight: 1.55 }}
      >
        O dono enviou um convite para{" "}
        <span style={{ color: "var(--text-primary)" }}>{data!.email}</span>{" "}
        integrar a equipe como{" "}
        <span style={{ color: "var(--text-primary)" }}>barbeiro</span>.
      </p>

      <div className="space-y-2.5 pt-1">
        <button
          data-testid="btn-aceitar-convite"
          onClick={() => setView("form")}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px]"
          style={{
            height: 44,
            background: "var(--primary)",
            color: "#0D0D0D",
            boxShadow: "0 0 20px rgba(244,180,0,0.2)",
          }}
        >
          Aceitar convite
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>

        <button
          data-testid="btn-rejeitar"
          onClick={handleReject}
          className="w-full flex items-center justify-center rounded-xl font-medium text-[14px]"
          style={{
            height: 44,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Rejeitar
        </button>
      </div>
    </motion.div>
  );
}
