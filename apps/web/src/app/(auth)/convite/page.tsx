import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Scissors } from "lucide-react";
import { ROUTES } from "@/shared/config/routes";
import { AuthBrandingPanel } from "@/features/auth/components/AuthBrandingPanel";
import { ConviteClientPage } from "./convite-client";

interface ConvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Página pública de aceite de convite de barbeiro.
 *
 * É o destino do link enviado por e-mail (`FRONTEND_URL/convite?token=...`).
 * Server component: extrai o `token` dos searchParams; sem token, redireciona
 * para o login. A jornada interativa (landing → form → welcome) vive no client
 * component `ConviteClientPage`.
 */
export default async function ConvitePage({
  searchParams,
}: ConvitePageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <AuthBrandingPanel />

      {/* Painel direito — jornada do convite */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full" style={{ maxWidth: 420 }}>
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

          <Suspense fallback={null}>
            <ConviteClientPage token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
