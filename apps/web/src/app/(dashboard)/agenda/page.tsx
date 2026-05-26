"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { AgendaView } from "@/features/agenda/components/AgendaView";

export default function AgendaPage(): React.JSX.Element {
  return (
    <RequireRole
      roles={[
        Perfil.DONO,
        Perfil.GERENTE,
        Perfil.BARBEIRO,
        Perfil.RECEPCIONISTA,
      ]}
    >
      <AgendaView />
    </RequireRole>
  );
}
