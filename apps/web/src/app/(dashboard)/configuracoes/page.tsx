"use client";

import React from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { ConfiguracoesView } from "@/features/configuracoes/components/ConfiguracoesView";

export default function Configuracoes(): React.JSX.Element {
  const { barbearia } = useAuth();
  return (
    <RequireRole roles={[Perfil.DONO]}>
      <ConfiguracoesView
        barCodigo={barbearia?.codigo ?? null}
        slug={barbearia?.slug ?? null}
      />
    </RequireRole>
  );
}
