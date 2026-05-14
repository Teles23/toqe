"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  criarClienteRapidoSchema,
  type CriarClienteRapidoInput,
} from "@toqe/contracts";
import { useAuth } from "@/shared/hooks/use-auth";
import { useClienteMutations } from "../hooks/use-clientes";

interface ClienteModalProps {
  onClose: () => void;
}

export function ClienteModal({ onClose }: ClienteModalProps) {
  const { barbearia } = useAuth();
  const { criar } = useClienteMutations(barbearia?.codigo ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CriarClienteRapidoInput>({
    resolver: zodResolver(criarClienteRapidoSchema),
    defaultValues: { nome: "", email: "", telefone: "" },
  });

  function onSubmit(data: CriarClienteRapidoInput) {
    criar.mutate(data, { onSuccess: onClose });
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
          className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden"
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
              Novo cliente
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
                <label className="tqe-label">Nome</label>
                <input
                  {...register("nome")}
                  placeholder="Nome completo"
                  className="tqe-input"
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

              <div>
                <label className="tqe-label">E-mail</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="cliente@email.com"
                  className="tqe-input"
                />
                {errors.email && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tqe-label">Telefone (opcional)</label>
                <input
                  {...register("telefone")}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="tqe-input"
                />
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
                disabled={criar.isPending}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "#0D0D0D",
                  opacity: criar.isPending ? 0.6 : 1,
                }}
              >
                {criar.isPending ? "Criando..." : "Criar cliente"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
