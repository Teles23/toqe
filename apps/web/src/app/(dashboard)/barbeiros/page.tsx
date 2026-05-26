"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { BarbeirosView } from "@/features/barbeiros/components/BarbeirosView";

export default function BarbeirosPage(): React.JSX.Element {
  return (
    <RequireRole roles={[Perfil.DONO, Perfil.GERENTE]}>
      <BarbeirosView />
    </RequireRole>
  );
}
