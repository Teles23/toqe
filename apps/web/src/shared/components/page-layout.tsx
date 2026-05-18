"use client";

import React from "react";
import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/shared/components/sidebar";
import Topbar from "@/shared/components/topbar";

interface PageLayoutProps {
  children: ReactNode;
  liveStatus?: { label: string; active: boolean };
  topbarActions?: ReactNode;
  noPadding?: boolean;
}

export default function PageLayout({
  children,
  liveStatus,
  topbarActions,
  noPadding = false,
}: PageLayoutProps): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          liveStatus={liveStatus}
          actions={topbarActions}
        />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden min-w-0"
          style={noPadding ? undefined : { padding: "20px 24px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
