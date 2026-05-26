"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useTwoFaEnable } from "@/features/auth/hooks/use-two-fa";

interface TwoFaModalProps {
  qrCode: string;
  secret: string;
  onVerified: () => void;
  onClose: () => void;
}

export function TwoFaModal({
  qrCode,
  secret,
  onVerified,
  onClose,
}: TwoFaModalProps) {
  const [code, setCode] = useState("");
  const enable = useTwoFaEnable();

  function handleEnable() {
    enable.mutate(
      { code },
      {
        onSuccess: onVerified,
        onError: () => void 0,
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-bold text-[15px]"
            style={{ color: "var(--text-primary)" }}
          >
            Configurar 2FA
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Escaneie o QR code com seu app autenticador (Google Authenticator,
          Authy, etc.) e insira o código gerado para confirmar.
        </p>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
        </div>
        <p
          className="text-[11px] text-center break-all font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {secret}
        </p>
        <div>
          <label className="tqe-label">Código de verificação</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="tqe-input text-center tracking-widest"
          />
        </div>
        {enable.isError && (
          <p className="text-[11px]" style={{ color: "var(--status-error)" }}>
            {enable.error.message}
          </p>
        )}
        <button
          onClick={handleEnable}
          disabled={code.length !== 6 || enable.isPending}
          className="w-full py-2 rounded-lg text-[13px] font-semibold"
          style={{
            background: "var(--primary)",
            color: "#0D0D0D",
            opacity: code.length !== 6 || enable.isPending ? 0.5 : 1,
          }}
        >
          {enable.isPending ? "Verificando..." : "Ativar 2FA"}
        </button>
      </div>
    </div>
  );
}
