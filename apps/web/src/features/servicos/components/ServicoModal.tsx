"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { createServicoSchema, type CreateServicoInput } from "@toqe/contracts";
import { useWatch } from "react-hook-form";
import { useAuth } from "@/shared/hooks/use-auth";
import { useServicoMutations } from "../hooks/use-servicos";
import type { ServicoAPI } from "../types/servico.types";

interface ServicoModalProps {
  servico?: ServicoAPI;
  onClose: () => void;
}

export function ServicoModal({ servico, onClose }: ServicoModalProps) {
  const { barbearia } = useAuth();
  const { create, update } = useServicoMutations(barbearia?.codigo ?? null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateServicoInput>({
    resolver: zodResolver(createServicoSchema),
    defaultValues: {
      nome: servico?.nome ?? "",
      precoBase: Number(servico?.precoBase ?? 30),
      duracaoBase: servico?.duracaoBase ?? 30,
      descricao: "",
    },
  });

  useEffect(() => {
    reset({
      nome: servico?.nome ?? "",
      precoBase: Number(servico?.precoBase ?? 30),
      duracaoBase: servico?.duracaoBase ?? 30,
      descricao: "",
    });
  }, [servico, reset]);

  function onSubmit(data: CreateServicoInput) {
    const duracaoArredondada = Math.round(data.duracaoBase / 5) * 5;
    const payload = { ...data, duracaoBase: duracaoArredondada };
    const onError = () =>
      setError("root", { message: "Erro ao salvar. Tente novamente." });

    if (servico) {
      update.mutate(
        { codigo: servico.codigo, data: payload },
        { onSuccess: onClose, onError },
      );
    } else {
      create.mutate(payload, { onSuccess: onClose, onError });
    }
  }

  const isPending = create.isPending || update.isPending;
  const descricaoValue = useWatch({ control, name: "descricao" }) ?? "";

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
              {servico ? "Editar serviço" : "Novo serviço"}
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
              {errors.root && (
                <p
                  className="text-[12px] px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(255,77,79,0.08)",
                    color: "var(--status-error)",
                    border: "1px solid rgba(255,77,79,0.2)",
                  }}
                >
                  {errors.root.message}
                </p>
              )}
              <div>
                <label className="tqe-label">Nome do serviço</label>
                <input
                  {...register("nome")}
                  placeholder="Ex: Corte Clássico"
                  className="tqe-input"
                  maxLength={100}
                />
                {errors.nome && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.nome.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="tqe-label">Preço (R$)</label>
                  <input
                    type="number"
                    {...register("precoBase", { valueAsNumber: true })}
                    className="tqe-input"
                    min={0}
                    max={9999.99}
                    step={0.01}
                  />
                  {errors.precoBase && (
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--status-error)" }}
                    >
                      {errors.precoBase.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="tqe-label">Duração (min)</label>
                  <input
                    type="number"
                    {...register("duracaoBase", { valueAsNumber: true })}
                    className="tqe-input"
                    min={5}
                    max={480}
                    step={5}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val))
                        setValue(
                          "duracaoBase",
                          Math.max(5, Math.round(val / 5) * 5),
                        );
                    }}
                  />
                  {errors.duracaoBase ? (
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--status-error)" }}
                    >
                      {errors.duracaoBase.message}
                    </p>
                  ) : (
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Em minutos · múltiplo de 5 (ex: 30, 45, 60)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="tqe-label">Descrição</label>
                <textarea
                  {...register("descricao")}
                  placeholder="Descreva o serviço..."
                  rows={3}
                  maxLength={500}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
                <p
                  className="text-[11px] mt-1 text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  {(descricaoValue as string).length}/500
                </p>
              </div>
            </div>

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
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "#0D0D0D",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending
                  ? "Salvando..."
                  : servico
                    ? "Salvar alterações"
                    : "Criar serviço"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
