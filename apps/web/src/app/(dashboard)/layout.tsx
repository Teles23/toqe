import React from "react";
import PageLayout from "@/shared/components/page-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <PageLayout liveStatus={{ label: "Ao vivo", active: true }}>
      {children}
    </PageLayout>
  );
}
