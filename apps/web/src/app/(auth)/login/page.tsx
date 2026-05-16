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

const TITLES: Record<Mode, { heading: string; sub: string }> = {
  login: { heading: "Bem-vindo de volta", sub: "Entre na sua conta Toqe" },
  forgot: {
    heading: "Recuperar senha",
    sub: "Enviaremos um link no seu e-mail",
  },
  twofa: {
    heading: "Verificação em duas etapas",
    sub: "Confirme sua identidade com o app autenticador",
  },
};

/**
 * Página de login — composição da feature `auth`.
 *
 * Responsabilidades:
 *   - Layout em duas colunas (branding à esquerda, formulário à direita)
 *   - Alternância entre modos (login / forgot password)
 *   - Heading dinâmico por modo
 *
 * Toda a lógica de form, validação, chamadas HTTP e estado de loading/erro
 * vive nos componentes/hooks de `@/features/auth`.
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { heading, sub } = TITLES[mode];

  function handleTwoFaRequired(token: string) {
    setTempToken(token);
    setMode("twofa");
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <AuthBrandingPanel />

      {/* Painel direito — formulário */}
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

          {/* Heading dinâmico */}
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
      </div>
    </div>
  );
}
