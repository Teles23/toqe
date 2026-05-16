"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { DateSelector } from "./DateSelector";
import { AgendaMetrics } from "./AgendaMetrics";
import { AgendaFilters } from "./AgendaFilters";
import { AgendaSlot, AgendaSlotEmpty } from "./AgendaSlot";
import { BarbeiroPanel } from "./BarbeiroPanel";
import { AgendamentoModal } from "./AgendamentoModal";
import { useAgenda } from "../hooks/use-agenda";

export function AgendaView() {
  const { barbearia } = useAuth();
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [filterBarbeiro, setFilterBarbeiro] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedOffset);

  const { slots, barbeiros, isLoading } = useAgenda(
    barbearia?.codigo ?? null,
    targetDate,
  );

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
      <div className="flex items-center justify-between">
        <DateSelector
          selectedOffset={selectedOffset}
          onChange={setSelectedOffset}
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold"
          style={{ height: 32, background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Plus size={13} strokeWidth={2.5} /> Novo agendamento
        </button>
      </div>

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
              <LoadingSpinner />
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((slot, i) => (
                    <AgendaSlot
                      key={slot.id}
                      slot={slot}
                      index={i}
                      onEncaixar={
                        slot.status === "available"
                          ? () => setModalOpen(true)
                          : undefined
                      }
                    />
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

      <AnimatePresence>
        {modalOpen && (
          <AgendamentoModal
            date={targetDate}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
