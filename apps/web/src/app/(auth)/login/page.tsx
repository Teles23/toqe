"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors } from "lucide-react";
import { ROUTES } from "@/shared/config/routes";
import { AuthBrandingPanel } from "@/features/auth/components/AuthBrandingPanel";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { TwoFaVerifyForm } from "@/features/auth/components/TwoFaVerifyForm";

type Mode = "login" | "forgot" | "twofa";

interface ModeCopy {
  eyebrow: string;
  heading: React.ReactNode;
  sub: string;
}

const MODE_COPY: Record<Mode, ModeCopy> = {
  login: {
    eyebrow: "Acessar painel",
    heading: (
      <>
        De volta pra <span className="text-[var(--primary)]">cadeira</span>.
      </>
    ),
    sub: "Entre na sua conta para acessar a agenda e a operação da barbearia.",
  },
  forgot: {
    eyebrow: "Recuperar acesso",
    heading: <>Esqueceu a senha?</>,
    sub: "Enviaremos um link de redefinição no seu e-mail.",
  },
  twofa: {
    eyebrow: "Verificação 2FA",
    heading: <>Confirme sua identidade.</>,
    sub: "Use o código do seu aplicativo autenticador para continuar.",
  },
};

/**
 * Página de login — composição da feature `auth`.
 *
 * Layout em duas colunas:
 *   - Esquerda: formulário (eyebrow + título editorial + form da feature)
 *   - Direita: painel de branding (decorativo, demonstrativo, sem dados reais)
 *
 * Alternância entre modos `login` / `forgot` / `twofa` controlada localmente.
 * Toda a lógica de validação, mutation e estado vive nos componentes da
 * feature `@/features/auth`.
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { eyebrow, heading, sub } = MODE_COPY[mode];

  function handleTwoFaRequired(token: string) {
    setTempToken(token);
    setMode("twofa");
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Painel esquerdo — formulário */}
      <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 lg:py-10 overflow-auto">
        {/* Logo (sempre visível no topo) */}
        <div className="flex items-center gap-2.5 mb-auto">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 32,
              height: 32,
              background: "var(--primary)",
              boxShadow: "0 4px 14px rgba(244,180,0,0.3)",
            }}
          >
            <Scissors size={14} color="#0D0D0D" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[18px] font-heading tracking-[-0.02em] text-[var(--text-primary)]">
            Toqe
          </span>
        </div>

        {/* Centro: cabeçalho + form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mx-auto py-6"
          style={{ maxWidth: 420 }}
        >
          {/* Eyebrow + heading dinâmicos */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-7"
            >
              <div className="inline-flex items-center gap-2 mb-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                <span
                  aria-hidden="true"
                  className="inline-block h-px w-3.5 bg-[var(--primary)]"
                />
                {eyebrow}
              </div>
              <h1
                className="font-heading font-bold mb-2 text-[var(--text-primary)]"
                style={{
                  fontSize: "2.25rem",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                }}
              >
                {heading}
              </h1>
              <p
                className="text-[14px] text-[var(--text-secondary)]"
                style={{ lineHeight: 1.5 }}
              >
                {sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Formulário */}
          <AnimatePresence mode="wait">
            {mode === "forgot" ? (
              <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
            ) : mode === "twofa" && tempToken ? (
              <TwoFaVerifyForm
                tempToken={tempToken}
                onBack={() => setMode("login")}
              />
            ) : (
              <LoginForm
                onForgotPassword={() => setMode("forgot")}
                onCreateAccount={() => router.push(ROUTES.ONBOARDING)}
                onTwoFaRequired={handleTwoFaRequired}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Rodapé inferior — só visível em telas grandes para não atrapalhar mobile */}
        <div className="hidden lg:flex justify-between items-center text-[11px] text-[var(--text-muted)] mt-auto pt-6">
          <span>© {new Date().getFullYear()} Toqe</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[var(--text-secondary)]">
              Privacidade
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)]">
              Termos
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)]">
              Suporte
            </a>
          </div>
        </div>
      </div>

      {/* Painel direito — branding (decorativo, esconde em mobile) */}
      <AuthBrandingPanel />
    </div>
  );
}
