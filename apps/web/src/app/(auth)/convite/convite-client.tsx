"use client";

import React from "react";
import { ConviteForm } from "@/features/convite/components/ConviteForm";

interface ConviteClientPageProps {
  token: string;
}

export function ConviteClientPage({
  token,
}: ConviteClientPageProps): React.JSX.Element {
  return <ConviteForm token={token} />;
}
