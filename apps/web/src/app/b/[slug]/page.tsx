import React from "react";
import type { Metadata } from "next";
import { PublicBookingFlow } from "@/features/booking/components/PublicBookingFlow";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Agendar — ${slug}`,
    description: "Agende seu corte ou serviço em poucos toques.",
  };
}

/**
 * Página pública de agendamento (`/b/:slug`).
 *
 * Renderiza apenas o fluxo de booking — sem chrome de dashboard, sem header
 * autenticado. A própria feature `booking` lida com loading, erro de slug
 * inexistente e o wizard de 6 passos.
 */
export default async function PublicBookingPage({
  params,
}: Params): Promise<React.JSX.Element> {
  const { slug } = await params;
  return <PublicBookingFlow slug={slug} />;
}
