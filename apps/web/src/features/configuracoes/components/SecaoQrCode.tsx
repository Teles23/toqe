"use client";

import React, { useState } from "react";
import { Link, Printer, Check, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Props {
  slug: string;
}

export function SecaoQrCode({ slug }: Props) {
  const domain = process.env.NEXT_PUBLIC_BOOKING_DOMAIN ?? 'app.toqe-barber.com.br';
  const url = `https://${domain}/b/${slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&margin=10&color=0D0D0D&bgcolor=ffffff`;
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  function imprimir() {
    window.print();
  }

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
          QR Code de agendamento
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Imprima e afixe na barbearia para clientes agendarem pelo celular.
        </p>
      </div>

      {/* QR Code card — imprimível */}
      <div
        id="qr-print-area"
        className="flex flex-col items-center gap-4 p-6 rounded-2xl border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={`QR Code de agendamento — ${slug}`}
          width={200}
          height={200}
          className="rounded-xl"
          style={{ imageRendering: "pixelated" }}
          data-testid="qr-image"
        />

        <div className="text-center">
          <div
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            <QrCode size={12} />
            AGENDE PELO CELULAR
          </div>
          <p
            className="text-[12px] font-mono break-all"
            style={{ color: "var(--text-secondary)" }}
            data-testid="qr-url"
          >
            {url}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={imprimir}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px]"
          style={{
            background: "var(--primary)",
            color: "#0D0D0D",
          }}
          data-testid="btn-imprimir"
        >
          <Printer size={14} />
          Imprimir
        </button>

        <button
          onClick={() => void copiarLink()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px] border transition-colors"
          style={{
            background: "transparent",
            borderColor: "var(--border-strong)",
            color: copiado ? "var(--status-success)" : "var(--text-secondary)",
          }}
          data-testid="btn-copiar"
        >
          {copiado ? <Check size={14} /> : <Link size={14} />}
          {copiado ? "Copiado!" : "Copiar link"}
        </button>
      </div>

      {/* Print-only styles (inline para funcionar sem CSS file extra) */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-print-area {
            display: flex !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: none !important;
            background: #fff !important;
          }
          #qr-print-area * { color: #000 !important; }
        }
      `}</style>
    </div>
  );
}
