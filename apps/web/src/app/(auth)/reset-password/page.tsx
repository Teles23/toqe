import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Scissors } from "lucide-react";
import { ROUTES } from "@/shared/config/routes";
import { AuthBrandingPanel } from "@/features/auth/components/AuthBrandingPanel";
import { ResetPasswordClientPage } from "./reset-password-client";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Página de redefinição de senha.
 *
 * Server component: extrai o `token` dos searchParams.
 * Se não houver token, redireciona para o login.
 * O formulário interativo fica em ResetPasswordClientPage (client component).
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      // eslint-disable-next-line no-restricted-syntax
      style={{ background: "var(--bg-base)" }}
    >
      <AuthBrandingPanel />

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {/* eslint-disable-next-line no-restricted-syntax */}
        <div className="w-full" style={{ maxWidth: 400 }}>
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div
              className="flex items-center justify-center rounded-lg"
              // eslint-disable-next-line no-restricted-syntax
              style={{ width: 32, height: 32, background: "var(--primary)" }}
            >
              <Scissors size={14} color="#0D0D0D" strokeWidth={2.5} />
            </div>
            <span
              className="font-bold text-[18px]"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              Toqe
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="font-bold mb-1.5"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.6rem",
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              Redefinir senha
            </h1>
            {/* eslint-disable-next-line no-restricted-syntax */}
            <p
              className="text-[13px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Escolha uma nova senha para sua conta Toqe.
            </p>
          </div>

          {/* Formulário (client component com Suspense) */}
          <Suspense fallback={null}>
            <ResetPasswordClientPage token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
