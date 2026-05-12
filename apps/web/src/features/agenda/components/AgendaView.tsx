/* eslint-disable no-restricted-syntax */
"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/shared/hooks/use-auth";
import { DateSelector } from "./DateSelector";
import { AgendaMetrics } from "./AgendaMetrics";
import { AgendaFilters } from "./AgendaFilters";
import { AgendaSlot, AgendaSlotEmpty } from "./AgendaSlot";
import { BarbeiroPanel } from "./BarbeiroPanel";
import { useAgenda } from "../hooks/use-agenda";
import { useActiveProgress } from "../hooks/use-active-progress";

export function AgendaView() {
  const { barbearia } = useAuth();
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [filterBarbeiro, setFilterBarbeiro] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedOffset);

  const {
    slots: rawSlots,
    barbeiros,
    isLoading,
  } = useAgenda(barbearia?.codigo ?? null, targetDate);
  const slots = useActiveProgress(rawSlots);

  const filtered = slots.filter((s) => {
    if (filterBarbeiro !== "Todos" && s.barbeiro !== filterBarbeiro)
      return false;
    if (filterStatus !== "Todos" && s.status !== filterStatus.toLowerCase())
      return false;
    if (
      searchQuery &&
      !s.client.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <DateSelector
        selectedOffset={selectedOffset}
        onChange={setSelectedOffset}
      />

      <AgendaMetrics slots={slots} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        <div className="space-y-3">
          <AgendaFilters
            barbeiros={barbeiros}
            filterBarbeiro={filterBarbeiro}
            filterStatus={filterStatus}
            searchQuery={searchQuery}
            onBarbeiro={setFilterBarbeiro}
            onStatus={setFilterStatus}
            onSearch={setSearchQuery}
          />

          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <span
                  className="text-[13px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Carregando...
                </span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((slot, i) => (
                    <AgendaSlot key={slot.id} slot={slot} index={i} />
                  ))
                ) : (
                  <AgendaSlotEmpty />
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        <BarbeiroPanel barbeiros={barbeiros} slots={slots} />
      </div>
    </div>
  );
}
