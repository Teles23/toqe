"use client";

import { Search, Filter } from "lucide-react";
import type { Barbeiro } from "../types/agenda.types";

interface AgendaFiltersProps {
  barbeiros: Barbeiro[];
  filterBarbeiro: string;
  filterStatus: string;
  searchQuery: string;
  onBarbeiro: (name: string) => void;
  onStatus: (status: string) => void;
  onSearch: (q: string) => void;
}

const STATUS_OPTIONS = [
  { key: "Todos", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "confirmed", label: "Confirmados" },
  { key: "pending", label: "Pendentes" },
  { key: "available", label: "Livres" },
];

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded text-[11px] font-medium transition-all flex-shrink-0 whitespace-nowrap"
      style={{
        background: active ? "var(--bg-hover)" : "transparent",
        border: `1px solid ${active ? "var(--border-strong)" : "transparent"}`,
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

export function AgendaFilters({
  barbeiros,
  filterBarbeiro,
  filterStatus,
  searchQuery,
  onBarbeiro,
  onStatus,
  onSearch,
}: AgendaFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex items-center w-full sm:w-auto sm:flex-shrink-0">
        <Search
          size={13}
          className="absolute left-2.5"
          style={{ color: "var(--text-muted)", pointerEvents: "none" }}
        />
        <input
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar cliente..."
          style={{
            paddingLeft: 28,
            height: 30,
            fontSize: 12,
            width: "100%",
            minWidth: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            color: "var(--text-primary)",
            outline: "none",
            fontFamily: "var(--font-body)",
          }}
        />
      </div>

      <div
        className="flex items-center gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <Filter
          size={13}
          className="flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        />

        <div className="flex gap-1">
          {["Todos", ...barbeiros.map((b) => b.nome)].map((name) => (
            <FilterBtn
              key={name}
              active={filterBarbeiro === name}
              onClick={() => onBarbeiro(name)}
            >
              {name}
            </FilterBtn>
          ))}
        </div>

        <div
          className="self-stretch flex-shrink-0"
          style={{ width: 1, background: "var(--border-subtle)" }}
        />

        <div className="flex gap-1">
          {STATUS_OPTIONS.map((f) => (
            <FilterBtn
              key={f.key}
              active={filterStatus === f.key}
              onClick={() => onStatus(f.key)}
            >
              {f.label}
            </FilterBtn>
          ))}
        </div>
      </div>
    </div>
  );
}
