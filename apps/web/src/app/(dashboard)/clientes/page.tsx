"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { ClientesView } from "@/features/clientes/components/ClientesView";

export default function Clientes(): React.JSX.Element {
  return (
    <RequireRole roles={[Perfil.DONO, Perfil.GERENTE, Perfil.RECEPCIONISTA]}>
      <ClientesView />
    </RequireRole>
  );
}
