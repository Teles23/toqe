"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { RelatoriosView } from "@/features/relatorios/components/RelatoriosView";

export default function Relatorios(): React.JSX.Element {
  return (
    <RequireRole roles={[Perfil.DONO, Perfil.GERENTE]}>
      <RelatoriosView />
    </RequireRole>
  );
}
