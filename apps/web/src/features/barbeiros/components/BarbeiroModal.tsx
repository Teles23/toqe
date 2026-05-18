"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  convidarMembroSchema,
  type ConvidarMembroInput,
} from "@toqe/contracts";
import { useAuth } from "@/shared/hooks/use-auth";
import { useBarbeiroMutations } from "../hooks/use-barbeiros";

const PERFIS = [
  { value: "barbeiro", label: "Barbeiro" },
  { value: "gerente", label: "Gerente" },
  { value: "recepcionista", label: "Recepcionista" },
] as const;

interface BarbeiroModalProps {
  onClose: () => void;
}

export function BarbeiroModal({ onClose }: BarbeiroModalProps) {
  const { barbearia } = useAuth();
  const { convidar } = useBarbeiroMutations(barbearia?.codigo ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConvidarMembroInput>({
    resolver: zodResolver(convidarMembroSchema),
    defaultValues: { email: "", perfil: "barbeiro" },
  });

  function onSubmit(data: ConvidarMembroInput) {
    convidar.mutate(data, { onSuccess: onClose });
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
              Convidar barbeiro
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
                <label className="tqe-label">E-mail</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="barbeiro@email.com"
                  className="tqe-input"
                  maxLength={100}
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
                <label className="tqe-label">Perfil</label>
                <div className="flex gap-2 mt-1">
                  {PERFIS.map((p) => (
                    <label
                      key={p.value}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={p.value}
                        {...register("perfil")}
                        className="accent-[var(--primary)]"
                      />
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.perfil && (
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--status-error)" }}
                  >
                    {errors.perfil.message}
                  </p>
                )}
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
                disabled={convidar.isPending}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "#0D0D0D",
                  opacity: convidar.isPending ? 0.6 : 1,
                }}
              >
                {convidar.isPending ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
