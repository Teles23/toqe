"use client";

import { useState } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useApiKeys,
  useCriarApiKey,
  useRevogarApiKey,
} from "../hooks/use-api-keys";
import type { ApiKey } from "../types/configuracao.types";

interface Props {
  barCodigo: number | null;
}

interface ModalCriarProps {
  barCodigo: number | null;
  onClose: () => void;
}

function ModalCriarApiKey({ barCodigo, onClose }: ModalCriarProps) {
  const [nome, setNome] = useState("");
  const [keyGerada, setKeyGerada] = useState<string | null>(null);
  const [keyVisivel, setKeyVisivel] = useState(false);
  const criar = useCriarApiKey(barCodigo);

  async function handleCriar() {
    if (!nome.trim()) return;
    try {
      const result = await criar.mutateAsync(nome.trim());
      setKeyGerada(result.key);
    } catch {
      toast.error("Erro ao criar ApiKey. Tente novamente.");
    }
  }

  function handleCopiar() {
    if (!keyGerada) return;
    void navigator.clipboard.writeText(keyGerada);
    toast.success("Chave copiada para a área de transferência!");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md mx-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h3
          className="text-[15px] font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {keyGerada ? "Chave criada com sucesso!" : "Criar nova ApiKey"}
        </h3>

        {keyGerada ? (
          <div className="space-y-4">
            <div
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{
                background: "rgba(244,180,0,0.08)",
                border: "1px solid rgba(244,180,0,0.3)",
              }}
            >
              <AlertCircle
                size={15}
                style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }}
              />
              <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>
                Copie a chave agora. Por segurança, ela{" "}
                <strong>não será exibida novamente</strong>.
              </p>
            </div>

            <div className="relative">
              <code
                className="block w-full p-3 rounded-lg text-[11px] font-mono break-all pr-10"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                {keyVisivel ? keyGerada : "•".repeat(keyGerada.length)}
              </code>
              <button
                onClick={() => setKeyVisivel((v) => !v)}
                className="absolute right-3 top-3"
                style={{ color: "var(--text-muted)" }}
              >
                {keyVisivel ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopiar}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "var(--bg-card)",
                }}
              >
                Copiar chave
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold border"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Nome da integração
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sistema de agendamento online"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCriar();
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => void handleCriar()}
                disabled={!nome.trim() || criar.isPending}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-60"
                style={{
                  background: "var(--primary)",
                  color: "var(--bg-card)",
                }}
              >
                {criar.isPending ? "Criando..." : "Criar chave"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold border"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  onRevogar,
  revogarPending,
}: {
  apiKey: ApiKey;
  onRevogar: () => void;
  revogarPending: boolean;
}) {
  const ultimoUso = apiKey.ultimoUsoEm
    ? new Date(apiKey.ultimoUsoEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca usado";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        opacity: apiKey.ativo ? 1 : 0.5,
      }}
    >
      <Key size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {apiKey.nome}
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          <code className="font-mono">{apiKey.keyPrefix}…</code> · {ultimoUso}
        </p>
      </div>

      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded"
        style={{
          background: apiKey.ativo
            ? "rgba(34,197,94,0.1)"
            : "rgba(239,68,68,0.1)",
          color: apiKey.ativo ? "var(--status-success)" : "var(--status-error)",
        }}
      >
        {apiKey.ativo ? "Ativa" : "Revogada"}
      </span>

      {apiKey.ativo && (
        <button
          onClick={onRevogar}
          disabled={revogarPending}
          title="Revogar chave"
          className="p-1.5 rounded-lg disabled:opacity-50"
          style={{ color: "var(--status-error)" }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export function SecaoApiKeys({ barCodigo }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const { data: apiKeys, isLoading } = useApiKeys(barCodigo);
  const revogar = useRevogarApiKey(barCodigo);

  async function handleRevogar(codigo: number) {
    try {
      await revogar.mutateAsync(codigo);
      toast.success("ApiKey revogada com sucesso.");
    } catch {
      toast.error("Erro ao revogar a chave. Tente novamente.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-[15px] font-bold mb-1 font-heading"
            style={{ color: "var(--text-primary)" }}
          >
            ApiKeys
          </h2>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            Gerencie as chaves de acesso à API pública da barbearia.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
          style={{
            background: "var(--primary)",
            color: "var(--bg-card)",
          }}
        >
          <Plus size={13} />
          Nova chave
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
              }}
            />
          ))}
        </div>
      ) : !apiKeys || apiKeys.length === 0 ? (
        <div
          className="text-center py-8 rounded-xl"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Key
            size={24}
            className="mx-auto mb-2"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Nenhuma ApiKey criada ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((ak) => (
            <ApiKeyRow
              key={ak.codigo}
              apiKey={ak}
              onRevogar={() => void handleRevogar(ak.codigo)}
              revogarPending={revogar.isPending}
            />
          ))}
        </div>
      )}

      <div
        className="p-4 rounded-xl text-[12px] space-y-1"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          color: "var(--text-muted)",
        }}
      >
        <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
          Como usar
        </p>
        <p>
          Envie o header{" "}
          <code className="font-mono text-[11px]">x-api-key: toqe_…</code> nas
          requisições para a API pública.
        </p>
        <p>
          Endpoints disponíveis:{" "}
          <code className="font-mono text-[11px]">GET /v1/agendamentos</code>,{" "}
          <code className="font-mono text-[11px]">POST /v1/agendamentos</code>,{" "}
          <code className="font-mono text-[11px]">GET /v1/servicos</code>,{" "}
          <code className="font-mono text-[11px]">GET /v1/barbeiros</code>.
        </p>
      </div>

      {modalAberto && (
        <ModalCriarApiKey
          barCodigo={barCodigo}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
