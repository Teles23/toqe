"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useTwoFaDisable } from "@/features/auth/hooks/use-two-fa";

interface TwoFaDisableModalProps {
  onDisabled: () => void;
  onClose: () => void;
}

export function TwoFaDisableModal({
  onDisabled,
  onClose,
}: TwoFaDisableModalProps) {
  const [code, setCode] = useState("");
  const disable = useTwoFaDisable();

  function handleDisable() {
    disable.mutate(
      { code },
      {
        onSuccess: onDisabled,
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
            Desativar 2FA
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
          Insira o código do seu app autenticador para confirmar a desativação.
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
        {disable.isError && (
          <p className="text-[11px]" style={{ color: "var(--status-error)" }}>
            {disable.error.message}
          </p>
        )}
        <button
          onClick={handleDisable}
          disabled={code.length !== 6 || disable.isPending}
          className="w-full py-2 rounded-lg text-[13px] font-semibold"
          style={{
            background: "var(--status-error)",
            color: "#fff",
            opacity: code.length !== 6 || disable.isPending ? 0.5 : 1,
          }}
        >
          {disable.isPending ? "Desativando..." : "Desativar 2FA"}
        </button>
      </div>
    </div>
  );
}
