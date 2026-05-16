"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { ROUTES } from "@/shared/config/routes";

interface ResetPasswordClientPageProps {
  token: string;
}

export function ResetPasswordClientPage({
  token,
}: ResetPasswordClientPageProps): React.JSX.Element {
  const router = useRouter();

  return (
    <ResetPasswordForm
      token={token}
      onBackToLogin={() => router.push(ROUTES.LOGIN)}
    />
  );
}
