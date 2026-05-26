"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";

const NAV = [
  { id: "overview", label: "Visão Geral", ico: "◉", href: "/admin/overview" },
  {
    id: "barbearias",
    label: "Barbearias",
    ico: "▦",
    href: "/admin/barbearias",
  },
  { id: "receita", label: "Receita", ico: "◈", href: "/admin/receita" },
  { id: "health", label: "Health", ico: "◐", href: "/admin/health" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="tqe-sa-sidebar">
      {/* Logo */}
      <div className="tqe-sa-logo-block">
        <div className="tqe-sa-logo-row">
          <div className="tqe-sa-logo-icon">T</div>
          <div>
            <div className="tqe-sa-logo-name">Toqe</div>
            <div className="tqe-sa-logo-role">Super Admin</div>
          </div>
        </div>
        <div className="tqe-sa-access-badge">
          <span className="tqe-sa-badge-dot" />
          <span>ACESSO INTERNO</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="tqe-sa-nav">
        <div className="tqe-sa-nav-group-label">PAINEL</div>
        {NAV.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.id}
              href={n.href}
              className={`tqe-sa-nav-item${active ? " tqe-sa-nav-item--active" : ""}`}
            >
              {active && <span className="tqe-sa-nav-indicator" />}
              <span className="tqe-sa-nav-ico">{n.ico}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="tqe-sa-user-footer">
        <div className="tqe-sa-user-avatar">
          {user?.nome?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="tqe-sa-user-info">
          <div className="tqe-sa-user-name">{user?.nome ?? "Super Admin"}</div>
          <button onClick={() => void logout()} className="tqe-sa-logout-btn">
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
