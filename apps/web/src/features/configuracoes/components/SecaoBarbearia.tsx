"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Phone, Mail, MapPin, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import { useConfiguracaoBarbearia } from "../hooks/use-configuracao";
import { maskTelefone } from "@/shared/utils/masks";

interface Props {
  barCodigo: number | null;
}

export function SecaoBarbearia({ barCodigo }: Props) {
  const { data, update, uploadLogo } = useConfiguracaoBarbearia(barCodigo);
  const [nome, setNome] = useState(data?.nome ?? "");
  const [tel, setTel] = useState(data?.telefone ?? "");
  const [email, setEmail] = useState(data?.email ?? "");
  const [end, setEnd] = useState(data?.endereco ?? "");
  const [salvo, setSalvo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setNome(data.nome);
      setTel(data.telefone);
      setEmail(data.email);
      setEnd(data.endereco);
    }
  }, [data]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success("Logo atualizada com sucesso!"),
      onError: (err) => toast.error(err.message),
    });
    e.target.value = "";
  }

  function salvar() {
    update.mutate(
      { nome, telefone: tel, email, endereco: end },
      {
        onSuccess: () => {
          setSalvo(true);
          setTimeout(() => setSalvo(false), 2000);
        },
      },
    );
  }

  const initials =
    nome
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "??";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-[15px] font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Informações da barbearia
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Dados públicos exibidos para os clientes no app.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleLogoChange}
      />
      <div className="flex items-center gap-4">
        <div
          className="relative flex items-center justify-center rounded-2xl font-bold text-2xl flex-shrink-0 overflow-hidden"
          style={{
            width: 72,
            height: 72,
            background: "rgba(244,180,0,0.1)",
            color: "var(--primary)",
            border: "1px solid rgba(244,180,0,0.2)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {data?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLogo.isPending}
            className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
            style={{
              width: 22,
              height: 22,
              background: "var(--primary)",
              color: "#0D0D0D",
              transform: "translate(4px, 4px)",
              opacity: uploadLogo.isPending ? 0.6 : 1,
            }}
          >
            <Camera size={11} />
          </button>
        </div>
        <div>
          <span
            className="block text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Logo da barbearia
          </span>
          <span
            className="block text-[11px] mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            PNG ou JPG até 2MB
          </span>
          <button
            className="mt-1.5 text-[11px] font-medium"
            style={{ color: "var(--status-info)" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLogo.isPending}
          >
            {uploadLogo.isPending ? "Enviando…" : "Alterar foto"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {[
          {
            label: "Nome da barbearia",
            icon: Store,
            value: nome,
            set: setNome,
            maxLength: 100,
          },
          {
            label: "Telefone",
            icon: Phone,
            value: tel,
            set: setTel,
            maxLength: 20,
            transform: maskTelefone,
          },
          {
            label: "E-mail",
            icon: Mail,
            value: email,
            set: setEmail,
            maxLength: 100,
          },
          {
            label: "Endereço",
            icon: MapPin,
            value: end,
            set: setEnd,
            maxLength: 200,
          },
        ].map(({ label, icon: Icon, value, set, maxLength, transform }) => (
          <div key={label}>
            <label className="tqe-label">{label}</label>
            <div className="relative">
              <Icon
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  set(transform ? transform(e.target.value) : e.target.value)
                }
                className="tqe-input"
                style={{ paddingLeft: 30 }}
                maxLength={maxLength}
              />
            </div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={salvar}
        disabled={update.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px]"
        style={{
          background: "var(--primary)",
          color: "#0D0D0D",
          opacity: update.isPending ? 0.7 : 1,
        }}
      >
        <AnimatePresence mode="wait">
          {salvo ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Check size={14} /> Salvo!
            </motion.span>
          ) : (
            <motion.span key="save" className="flex items-center gap-2">
              {update.isPending ? "Salvando…" : "Salvar alterações"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
