"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Toggle } from "@/shared/components/toggle";
import { ConfigRow } from "@/shared/components/config-row";
import { useAuth } from "@/shared/hooks/use-auth";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { useSessions } from "@/features/auth/hooks/use-sessions";
import { useTwoFaSetup } from "@/features/auth/hooks/use-two-fa";
import { TwoFaModal } from "@/features/auth/components/TwoFaModal";
import { TwoFaDisableModal } from "@/features/auth/components/TwoFaDisableModal";

export function SecaoSeguranca() {
  const { user } = useAuth();
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFaEnabled ?? false);
  const [twoFaData, setTwoFaData] = useState<{ qrCode: string } | null>(null);
  const [showDisable2Fa, setShowDisable2Fa] = useState(false);

  const changePassword = useChangePassword();
  const sessions = useSessions();
  const setup2Fa = useTwoFaSetup();

  const senhaValida =
    senha.nova.length >= 6 &&
    senha.nova === senha.confirma &&
    senha.atual.length > 0;

  function handleChangePassword() {
    changePassword.mutate(
      { senhaAtual: senha.atual, novaSenha: senha.nova },
      {
        onSuccess: () => {
          toast.success("Senha alterada com sucesso!");
          setSenha({ atual: "", nova: "", confirma: "" });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleTwoFaToggle(checked: boolean) {
    if (checked) {
      setup2Fa.mutate(undefined, {
        onSuccess: (data) => setTwoFaData(data),
        onError: (err) => toast.error(err.message),
      });
    } else {
      setShowDisable2Fa(true);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-bold mb-1 font-heading text-[var(--text-primary)]">
          Segurança
        </h2>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Gerencie sua senha e as sessões ativas.
        </p>
      </div>

      {/* Alterar senha */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-default)]">
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Alterar senha
          </span>
        </div>
        <div className="px-4 py-4 space-y-3">
          {[
            { label: "Senha atual", key: "atual" as const },
            { label: "Nova senha", key: "nova" as const },
            { label: "Confirmar nova senha", key: "confirma" as const },
          ].map((f) => (
            <div key={f.key}>
              <label className="tqe-label">{f.label}</label>
              <input
                type="password"
                value={senha[f.key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSenha((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="tqe-input"
                placeholder="••••••••"
                maxLength={128}
              />
            </div>
          ))}
          {senha.nova.length > 0 &&
            senha.confirma.length > 0 &&
            senha.nova !== senha.confirma && (
              <p className="text-[11px] text-[var(--status-error)]">
                As senhas não coincidem
              </p>
            )}
          {changePassword.isError && (
            <p className="text-[11px] text-[var(--status-error)]">
              {changePassword.error.message}
            </p>
          )}
          <button
            onClick={handleChangePassword}
            disabled={!senhaValida || changePassword.isPending}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold mt-1 bg-[var(--primary)] text-[#0D0D0D]"
            style={{
              opacity:
                !senhaValida || changePassword.isPending
                  ? 0.5
                  : 1 /* CSS var dinâmico — não migrar */,
              /* CSS var dinâmico — não migrar */
              cursor:
                !senhaValida || changePassword.isPending
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {changePassword.isPending ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-default)]">
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Autenticação
          </span>
        </div>
        <div className="px-4 py-3">
          <ConfigRow
            label="Autenticação de dois fatores"
            desc={
              twoFaEnabled
                ? "Ativado — via app autenticador"
                : "Adiciona uma camada extra de segurança"
            }
            noBorder
          >
            <Toggle checked={twoFaEnabled} onChange={handleTwoFaToggle} />
          </ConfigRow>
        </div>
      </div>

      {/* Sessões ativas */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-default)]">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Sessões ativas
          </span>
          <button
            className="text-[11px] font-medium text-[var(--status-error)]"
            onClick={() =>
              sessions.revokeAll.mutate(undefined, {
                onSuccess: () => toast.success("Todas as sessões encerradas"),
                onError: (err) => toast.error(err.message),
              })
            }
            disabled={sessions.revokeAll.isPending}
          >
            Encerrar todas
          </button>
        </div>
        {sessions.isLoading && (
          <div className="px-4 py-3">
            <p className="text-[12px] text-[var(--text-muted)]">
              Carregando sessões...
            </p>
          </div>
        )}
        {(sessions.data ?? []).map((s, i) => (
          <div
            key={s.codigo}
            className="flex items-center justify-between px-4 py-3 gap-3"
            style={{
              borderBottom:
                i < (sessions.data?.length ?? 0) - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0 w-8 h-8 bg-[var(--bg-hover)] text-[var(--text-muted)]">
                <Smartphone size={14} />
              </div>
              <div>
                <span className="block text-[12px] font-medium text-[var(--text-primary)]">
                  Sessão iniciada em{" "}
                  {format(new Date(s.criadoEm), "dd/MM HH:mm", {
                    locale: ptBR,
                  })}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Expira em{" "}
                  {format(new Date(s.expiraEm), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
            <button
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[rgba(255,77,79,0.08)] text-[var(--status-error)] border border-[rgba(255,77,79,0.15)]"
              onClick={() =>
                sessions.revokeOne.mutate(s.codigo, {
                  onSuccess: () => toast.success("Sessão encerrada"),
                  onError: (err) => toast.error(err.message),
                })
              }
              disabled={sessions.revokeOne.isPending}
            >
              Encerrar
            </button>
          </div>
        ))}
      </div>

      {twoFaData && (
        <TwoFaModal
          qrCode={twoFaData.qrCode}
          onVerified={() => {
            setTwoFaEnabled(true);
            setTwoFaData(null);
            toast.success("2FA ativado com sucesso!");
          }}
          onClose={() => setTwoFaData(null)}
        />
      )}
      {showDisable2Fa && (
        <TwoFaDisableModal
          onDisabled={() => {
            setTwoFaEnabled(false);
            setShowDisable2Fa(false);
            toast.success("2FA desativado.");
          }}
          onClose={() => setShowDisable2Fa(false)}
        />
      )}
    </div>
  );
}
