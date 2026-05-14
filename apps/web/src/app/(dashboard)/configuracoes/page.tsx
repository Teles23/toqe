"use client";

import { useAuth } from "@/shared/hooks/use-auth";
import { ConfiguracoesView } from "@/features/configuracoes/components/ConfiguracoesView";

export default function Configuracoes() {
  const { barbearia } = useAuth();
  return <ConfiguracoesView barCodigo={barbearia?.codigo ?? null} />;
}
