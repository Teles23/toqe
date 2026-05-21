"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { ServicosView } from "@/features/servicos/components/ServicosView";

export default function ServicosPage(): React.JSX.Element {
  return (
    <RequireRole roles={[Perfil.DONO, Perfil.GERENTE]}>
      <ServicosView />
    </RequireRole>
  );
}
