"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import PageLayout from "@/shared/components/page-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const { user, barbearia, loading } = useAuth();

  // Usuário autenticado mas sem barbearia → onboarding incompleto
  useEffect(() => {
    if (!loading && user && !barbearia) {
      router.replace("/onboarding");
    }
  }, [loading, user, barbearia, router]);

  if (loading || (user && !barbearia)) {
    return <></>;
  }

  return (
    <PageLayout liveStatus={{ label: "Ao vivo", active: true }}>
      {children}
    </PageLayout>
  );
}
