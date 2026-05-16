"use client";

import React from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { ConfiguracoesView } from "@/features/configuracoes/components/ConfiguracoesView";

export default function Configuracoes(): React.JSX.Element {
  const { barbearia } = useAuth();
  return <ConfiguracoesView barCodigo={barbearia?.codigo ?? null} />;
}
