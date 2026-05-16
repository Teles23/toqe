"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { format } from "date-fns";
import {
  createAgendamentoSchema,
  type CreateAgendamentoInput,
} from "@toqe/contracts";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import { useBarbeiros } from "@/features/barbeiros/hooks/use-barbeiros";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import { useServicos } from "@/features/servicos/hooks/use-servicos";
import { useAgendaMutations, useDisponibilidade } from "../hooks/use-agenda";

interface AgendamentoModalProps {
  date: Date;
  onClose: () => void;
}

export function AgendamentoModal({ date, onClose }: AgendamentoModalProps) {
  const { barbearia } = useAuth();
  const barCodigo = barbearia?.codigo ?? null;
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: barbeiros = [] } = useBarbeiros(barCodigo);
  const { data: clientes = [] } = useClientes(barCodigo);
  const { data: servicos = [] } = useServicos(barCodigo);
  const { criar } = useAgendaMutations(barCodigo, dateStr);

  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAgendamentoInput>({
    resolver: zodResolver(createAgendamentoSchema),
    defaultValues: {
      barbeiroId: undefined,
      clienteId: undefined,
      inicio: undefined,
      servicosIds: [],
    },
  });

  const watchedBarbeiroId = watch("barbeiroId");
  const watchedServicosIds = watch("servicosIds");

  // Calcula duração total baseada nos serviços selecionados
  const totalDuracao = (() => {
    const total = servicos
      .filter((s) => watchedServicosIds?.includes(s.codigo))
      .reduce((sum, s) => sum + (s.duracaoBase ?? 30), 0);
    return total > 0 ? total : 30;
  })();

  const barbeiroIdNum =
    watchedBarbeiroId && !Number.isNaN(Number(watchedBarbeiroId))
      ? Number(watchedBarbeiroId)
      : null;

  const { data: slots = [], isFetching: isLoadingSlots } = useDisponibilidade(
    barCodigo,
    barbeiroIdNum,
    dateStr,
    totalDuracao,
  );

  function handleSlotChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedSlot(value);
    if (value) {
      const isoString = new Date(`${dateStr}T${value}:00`).toISOString();
      setValue("inicio", isoString);
    } else {
      setValue("inicio", "");
    }
  }

  function onSubmit(data: CreateAgendamentoInput) {
    criar.mutate(data, {
      onSuccess: () => {
        toast.success("Agendamento criado com sucesso!");
        onClose();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-bold text-[15px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Novo agendamento
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="tqe-label">Barbeiro</label>
                <Controller
                  name="barbeiroId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className="tqe-input"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        // Resetar slot quando barbeiro muda
                        setSelectedSlot("");
                        setValue("inicio", "");
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                    >
                      <option value="">Selecione um barbeiro</option>
                      {barbeiros.map((b) => (
                        <option key={b.codigo} value={b.codigo}>
                          {b.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.barbeiroId && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.barbeiroId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tqe-label">Cliente</label>
                <select
                  {...register("clienteId", { valueAsNumber: true })}
                  className="tqe-input"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {errors.clienteId && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.clienteId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tqe-label">
                  Horário disponível —{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    {format(date, "dd/MM/yyyy")}
                  </span>
                </label>
                <select
                  className="tqe-input"
                  value={selectedSlot}
                  onChange={handleSlotChange}
                  disabled={!barbeiroIdNum || isLoadingSlots}
                >
                  {!barbeiroIdNum ? (
                    <option value="">Selecione um barbeiro primeiro</option>
                  ) : isLoadingSlots ? (
                    <option value="">Carregando horários...</option>
                  ) : slots.length === 0 ? (
                    <option value="">
                      Nenhum horário disponível para esta data
                    </option>
                  ) : (
                    <>
                      <option value="">Selecione um horário</option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.inicio && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.inicio.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tqe-label">Serviços</label>
                <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                  {servicos.map((s) => (
                    <label
                      key={s.codigo}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Controller
                        name="servicosIds"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            className="accent-[var(--primary)]"
                            checked={field.value.includes(s.codigo)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, s.codigo]);
                              } else {
                                field.onChange(
                                  field.value.filter((id) => id !== s.codigo),
                                );
                              }
                            }}
                          />
                        )}
                      />
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {s.nome}
                        {s.precoBase != null &&
                          ` — R$ ${Number(s.precoBase).toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.servicosIds && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.servicosIds.message}
                  </p>
                )}
              </div>
            </div>

            {criar.isError && (
              <p
                className="text-[12px] px-5 pb-2"
                style={{ color: "var(--status-error)" }}
              >
                {criar.error.message}
              </p>
            )}

            <div
              className="flex gap-2 px-5 py-4"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-[13px] font-medium"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={criar.isPending}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "#0D0D0D",
                  opacity: criar.isPending ? 0.6 : 1,
                }}
              >
                {criar.isPending ? "Agendando..." : "Agendar"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
