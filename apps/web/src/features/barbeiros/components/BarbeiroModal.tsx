"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Zap, X } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useBarbeiroMutations } from "../hooks/use-barbeiros";
import { useServicos } from "@/features/servicos/hooks/use-servicos";
import { getInitial } from "@/shared/lib/utils";
import { maskTelefone } from "@/shared/utils/masks";

/* ── types ──────────────────────────────────────────────────────────────── */

type CommissionModel = "percent" | "fixed_per" | "salary";
type Perfil = "barbeiro" | "gerente" | "recepcionista";
type DrawerStep = "form" | "success";

interface DiaHorario {
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

interface DrawerForm {
  nome: string;
  apelido: string;
  telefone: string;
  email: string;
  perfil: Perfil;
  servicosSelecionados: Set<number>;
  herdarHorario: boolean;
  horarioCustom: Record<string, DiaHorario>;
  commissionModel: CommissionModel;
  commissionPct: string;
  commissionFixed: string;
  avatarColor: string;
}

/* ── constants ──────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  "#F4B400",
  "#1DB954",
  "#4DA3FF",
  "#FF4D4F",
  "#A78BFA",
  "#FF8C42",
];

const DIAS_KEYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
type DiaKey = (typeof DIAS_KEYS)[number];

const DEFAULT_HORARIO: Record<DiaKey, DiaHorario> = {
  Seg: { aberto: true, abertura: "09:00", fechamento: "19:00" },
  Ter: { aberto: true, abertura: "09:00", fechamento: "19:00" },
  Qua: { aberto: true, abertura: "09:00", fechamento: "19:00" },
  Qui: { aberto: true, abertura: "09:00", fechamento: "19:00" },
  Sex: { aberto: true, abertura: "09:00", fechamento: "19:00" },
  Sáb: { aberto: true, abertura: "08:00", fechamento: "18:00" },
  Dom: { aberto: false, abertura: "09:00", fechamento: "18:00" },
};

const INITIAL_FORM: DrawerForm = {
  nome: "",
  apelido: "",
  telefone: "",
  email: "",
  perfil: "barbeiro",
  servicosSelecionados: new Set<number>(),
  herdarHorario: true,
  horarioCustom: { ...DEFAULT_HORARIO },
  commissionModel: "percent",
  commissionPct: "40",
  commissionFixed: "25",
  avatarColor: "#F4B400",
};

const COMMISSION_OPTIONS: Array<{
  id: CommissionModel;
  label: string;
  desc: string;
}> = [
  { id: "percent", label: "% por serviço", desc: "ex: 40% de R$60 = R$24" },
  {
    id: "fixed_per",
    label: "Valor por corte",
    desc: "valor fixo por atendimento",
  },
  {
    id: "salary",
    label: "Salário fixo",
    desc: "mensal, independente de cortes",
  },
];

const PERFIS: Array<{ value: Perfil; label: string }> = [
  { value: "barbeiro", label: "Barbeiro" },
  { value: "gerente", label: "Gerente" },
  { value: "recepcionista", label: "Recepcionista" },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Inline CSS var-based toggle switch */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="tqe-ab-toggle"
      data-on={checked ? "true" : undefined}
    />
  );
}

/** Section separator with amber eyebrow */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="tqe-ab-section-title">
      <span>{children}</span>
      <div className="tqe-ab-section-line" />
    </div>
  );
}

/** Generic field wrapper */
function Field({
  label,
  help,
  children,
}: {
  label?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tqe-ab-field">
      {label && <label className="tqe-ab-label">{label}</label>}
      {children}
      {help && <p className="tqe-ab-help">{help}</p>}
    </div>
  );
}

/** Pick button (role/commission/schedule option) */
function PickBtn({
  selected,
  onClick,
  children,
  accent,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  const color = accent ?? "var(--primary)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="tqe-ab-pick"
      data-sel={selected ? "true" : undefined}
      style={
        selected
          ? ({
              "--ab-pick-color": color,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </button>
  );
}

/* ── sub-components ──────────────────────────────────────────────────────── */

function AvatarPicker({
  name,
  color,
  onColorChange,
}: {
  name: string;
  color: string;
  onColorChange: (c: string) => void;
}) {
  const initial = getInitial(name) || "?";
  return (
    <div className="tqe-ab-avatar-row">
      <div
        className="tqe-ab-avatar"
        style={{
          background: `${color}20`,
          border: `1.5px solid ${color}50`,
          color,
          boxShadow: `0 8px 24px ${color}25`,
        }}
      >
        {initial}
      </div>
      <div>
        <p className="tqe-ab-label" style={{ marginBottom: 8 }}>
          Cor do avatar
        </p>
        <div className="tqe-ab-color-row">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => onColorChange(c)}
              className="tqe-ab-color-dot"
              data-sel={c === color ? "true" : undefined}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleTable({
  custom,
  onChange,
}: {
  custom: Record<string, DiaHorario>;
  onChange: (
    dia: string,
    key: keyof DiaHorario,
    value: string | boolean,
  ) => void;
}) {
  return (
    <div className="tqe-ab-hours-table">
      {DIAS_KEYS.map((dia) => {
        const row = custom[dia] ?? DEFAULT_HORARIO[dia];
        return (
          <div
            key={dia}
            className={`tqe-ab-hour-row${row.aberto ? "" : " off"}`}
          >
            <span className="tqe-ab-day">{dia}</span>
            <input
              className="tqe-ab-time"
              type="time"
              value={row.abertura}
              disabled={!row.aberto}
              onChange={(e) => onChange(dia, "abertura", e.target.value)}
            />
            <input
              className="tqe-ab-time"
              type="time"
              value={row.fechamento}
              disabled={!row.aberto}
              onChange={(e) => onChange(dia, "fechamento", e.target.value)}
            />
            <Toggle
              checked={row.aberto}
              onChange={(v) => onChange(dia, "aberto", v)}
            />
          </div>
        );
      })}
    </div>
  );
}

function CommissionSection({
  model,
  pct,
  fixed,
  onModel,
  onPct,
  onFixed,
}: {
  model: CommissionModel;
  pct: string;
  fixed: string;
  onModel: (m: CommissionModel) => void;
  onPct: (v: string) => void;
  onFixed: (v: string) => void;
}) {
  const example =
    model === "percent" ? Math.round(60 * ((+pct || 0) / 100)) : null;

  return (
    <div className="space-y-3">
      <div className="tqe-ab-pick-grid-3">
        {COMMISSION_OPTIONS.map((opt) => (
          <PickBtn
            key={opt.id}
            selected={model === opt.id}
            onClick={() => onModel(opt.id)}
          >
            <span className="tqe-ab-pick-title">{opt.label}</span>
            <span className="tqe-ab-pick-desc">{opt.desc}</span>
          </PickBtn>
        ))}
      </div>

      {model === "percent" && (
        <div className="tqe-ab-commission-row">
          <div className="tqe-ab-input-wrap" style={{ maxWidth: 120 }}>
            <span className="tqe-ab-prefix">%</span>
            <input
              className="tqe-ab-input"
              type="number"
              value={pct}
              onChange={(e) => onPct(e.target.value)}
              placeholder="40"
              min={0}
              max={100}
            />
          </div>
          <div className="tqe-ab-commission-preview">
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              Em R$60 de serviço:
            </span>
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--primary)", fontSize: 13 }}
            >
              R${example}
            </span>
          </div>
        </div>
      )}

      {model === "fixed_per" && (
        <div className="tqe-ab-input-wrap" style={{ maxWidth: 160 }}>
          <span className="tqe-ab-prefix">R$</span>
          <input
            className="tqe-ab-input"
            type="number"
            value={fixed}
            onChange={(e) => onFixed(e.target.value)}
            placeholder="25"
            min={0}
          />
        </div>
      )}

      {model === "salary" && (
        <div className="tqe-ab-input-wrap" style={{ maxWidth: 200 }}>
          <span className="tqe-ab-prefix">R$/mês</span>
          <input
            className="tqe-ab-input"
            type="number"
            value={fixed}
            onChange={(e) => onFixed(e.target.value)}
            placeholder="2500"
            min={0}
          />
        </div>
      )}

      <div
        className="tqe-ab-info-box"
        style={{
          borderColor: "rgba(77,163,255,0.18)",
          background: "rgba(77,163,255,0.05)",
        }}
      >
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          O acerto de comissão aparece no relatório financeiro semanal. Você
          aprova antes de pagar.
        </span>
      </div>
    </div>
  );
}

/* ── progress bar ────────────────────────────────────────────────────────── */

const PROGRESS_STEPS = ["Dados", "Serviços", "Agenda", "Comissão"];

function ProgressBar({ form }: { form: DrawerForm }) {
  const done = [
    form.nome.trim().length > 1,
    form.servicosSelecionados.size > 0,
    true, // agenda always has defaults
    true, // commission always has defaults
  ];
  return (
    <div className="tqe-ab-progress">
      {PROGRESS_STEPS.map((lbl, i) => (
        <div key={lbl} className="tqe-ab-progress-item">
          <div
            className="tqe-ab-progress-bar"
            data-done={done[i] ? "true" : undefined}
          />
          <span
            className="tqe-ab-progress-lbl"
            data-done={done[i] ? "true" : undefined}
          >
            {lbl}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── success screen ──────────────────────────────────────────────────────── */

function SuccessScreen({
  form,
  onClose,
  onAddAnother,
}: {
  form: DrawerForm;
  onClose: () => void;
  onAddAnother: () => void;
}) {
  const displayName = form.apelido || form.nome.split(" ")[0] || "Barbeiro";
  const initial = getInitial(form.nome) || "?";

  return (
    <div className="tqe-ab-success">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="tqe-ab-success-check"
      >
        <Check size={28} strokeWidth={3} />
      </motion.div>

      <h2 className="tqe-ab-success-title">{displayName} adicionado!</h2>
      <p className="tqe-ab-success-desc">
        Convite enviado para{" "}
        <strong style={{ color: "var(--text-primary)" }}>{form.email}</strong>.
        Ele aparece na agenda assim que aceitar.
      </p>

      {/* preview card */}
      <div className="tqe-ab-success-card">
        <div className="tqe-ab-success-card-top" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="tqe-ab-avatar"
            style={{
              background: `${form.avatarColor}20`,
              border: `1.5px solid ${form.avatarColor}50`,
              color: form.avatarColor,
              width: 48,
              height: 48,
              fontSize: 18,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="font-heading font-bold"
              style={{ fontSize: 15, letterSpacing: "-0.02em" }}
            >
              {form.nome || "Novo barbeiro"}
            </p>
            <p
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {form.perfil === "gerente" ? "Gerente" : "Barbeiro"} ·{" "}
              {form.servicosSelecionados.size} serviços ·{" "}
              {form.commissionModel === "percent"
                ? `${form.commissionPct}% comissão`
                : form.commissionModel === "fixed_per"
                  ? `R$${form.commissionFixed}/corte`
                  : `R$${form.commissionFixed}/mês`}
            </p>
          </div>
          <span className="tqe-ab-badge-pending">PENDENTE</span>
        </div>
      </div>

      <div className="tqe-ab-success-actions">
        <button
          type="button"
          onClick={onClose}
          className="tqe-ab-btn-secondary"
        >
          Voltar à equipe
        </button>
        <button
          type="button"
          onClick={onAddAnother}
          className="tqe-ab-btn-accent"
        >
          + Adicionar outro
        </button>
      </div>
    </div>
  );
}

/* ── main drawer ─────────────────────────────────────────────────────────── */

interface BarbeiroModalProps {
  onClose: () => void;
}

export function BarbeiroModal({ onClose }: BarbeiroModalProps) {
  const { barbearia } = useAuth();
  const barCodigo = barbearia?.codigo ?? null;
  const { convidar } = useBarbeiroMutations(barCodigo);
  const { data: servicos = [] } = useServicos(barCodigo);

  const [step, setStep] = useState<DrawerStep>("form");
  const [form, setForm] = useState<DrawerForm>(INITIAL_FORM);
  const [emailError, setEmailError] = useState("");

  const set = <K extends keyof DrawerForm>(key: K, value: DrawerForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function toggleServico(codigo: number) {
    setForm((prev) => {
      const next = new Set(prev.servicosSelecionados);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return { ...prev, servicosSelecionados: next };
    });
  }

  function updateHorario(
    dia: string,
    key: keyof DiaHorario,
    value: string | boolean,
  ) {
    setForm((prev) => ({
      ...prev,
      horarioCustom: {
        ...prev.horarioCustom,
        [dia]: {
          ...(prev.horarioCustom[dia] ?? DEFAULT_HORARIO[dia as DiaKey]),
          [key]: value,
        },
      },
    }));
  }

  const canSubmit = form.nome.trim().length > 1 && form.email.includes("@");

  function handleSubmit() {
    setEmailError("");
    if (!form.email.includes("@")) {
      setEmailError("Informe um e-mail válido");
      return;
    }
    convidar.mutate(
      { email: form.email, perfil: form.perfil },
      { onSuccess: () => setStep("success") },
    );
  }

  function handleAddAnother() {
    setForm(INITIAL_FORM);
    setEmailError("");
    setStep("form");
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="tqe-add-barbeiro fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "min(520px, 100vw)",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "success" ? (
          <SuccessScreen
            form={form}
            onClose={onClose}
            onAddAnother={handleAddAnother}
          />
        ) : (
          <>
            {/* Header */}
            <div className="tqe-ab-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="tqe-ab-close-btn"
                    aria-label="Fechar"
                  >
                    <X size={15} />
                  </button>
                  <div>
                    <h2 className="tqe-ab-drawer-title">Adicionar barbeiro</h2>
                    <p className="tqe-ab-drawer-sub font-mono">
                      {form.nome || "preencha o nome para começar"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canSubmit || convidar.isPending}
                  onClick={handleSubmit}
                  className="tqe-ab-cta-btn"
                  data-active={
                    canSubmit && !convidar.isPending ? "true" : undefined
                  }
                >
                  {convidar.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    "Convidar →"
                  )}
                </button>
              </div>

              <ProgressBar form={form} />
            </div>

            {/* Body */}
            <div className="tqe-ab-body">
              {/* 01 — Quem é ele */}
              <SectionTitle>01 · Quem é ele</SectionTitle>

              <Field>
                <AvatarPicker
                  name={form.nome}
                  color={form.avatarColor}
                  onColorChange={(c) => set("avatarColor", c)}
                />
              </Field>

              <Field label="Nome completo">
                <div className="tqe-ab-input-wrap">
                  <input
                    className="tqe-ab-input"
                    type="text"
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    placeholder="Ex: Carlos Eduardo Lima"
                    maxLength={100}
                    autoFocus
                  />
                </div>
              </Field>

              <div className="tqe-ab-grid-2">
                <Field
                  label="Apelido (na agenda)"
                  help="Como aparece pra clientes"
                >
                  <div className="tqe-ab-input-wrap">
                    <input
                      className="tqe-ab-input"
                      type="text"
                      value={form.apelido}
                      onChange={(e) => set("apelido", e.target.value)}
                      placeholder="Carlos"
                      maxLength={40}
                    />
                  </div>
                </Field>

                <Field label="Função">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PERFIS.map((p) => (
                      <PickBtn
                        key={p.value}
                        selected={form.perfil === p.value}
                        onClick={() => set("perfil", p.value)}
                      >
                        <span style={{ fontSize: 12 }}>{p.label}</span>
                      </PickBtn>
                    ))}
                  </div>
                </Field>
              </div>

              {/* 02 — Contato e acesso */}
              <SectionTitle>02 · Contato e acesso</SectionTitle>

              <div className="tqe-ab-grid-2">
                <Field label="WhatsApp" help="Opcional — para contato interno">
                  <div className="tqe-ab-input-wrap">
                    <input
                      className="tqe-ab-input"
                      type="tel"
                      value={form.telefone}
                      onChange={(e) =>
                        set("telefone", maskTelefone(e.target.value))
                      }
                      placeholder="(11) 99999-9999"
                      maxLength={20}
                    />
                  </div>
                </Field>

                <Field label="E-mail *" help="Usado para enviar o convite">
                  <div
                    className="tqe-ab-input-wrap"
                    data-error={emailError ? "true" : undefined}
                  >
                    <input
                      className="tqe-ab-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        set("email", e.target.value);
                        setEmailError("");
                      }}
                      placeholder="carlos@email.com"
                      maxLength={100}
                    />
                  </div>
                  {emailError && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--status-error)",
                        marginTop: 4,
                      }}
                    >
                      {emailError}
                    </p>
                  )}
                </Field>
              </div>

              {/* Invite method */}
              <Field
                label="Como enviar o convite"
                help="O barbeiro recebe um link de acesso — sem precisar criar senha de imediato."
              >
                <div className="tqe-ab-grid-2">
                  {/* Magic link — em breve */}
                  <div
                    className="tqe-ab-pick tqe-ab-pick-disabled"
                    title="Em breve"
                  >
                    <Zap
                      size={13}
                      style={{ color: "var(--status-success)", flexShrink: 0 }}
                    />
                    <div>
                      <span className="tqe-ab-pick-title">
                        ⚡ Magic link WhatsApp
                      </span>
                      <span className="tqe-ab-pick-desc">
                        Sem senha · em breve
                      </span>
                    </div>
                    <span className="tqe-ab-badge-soon">EM BREVE</span>
                  </div>

                  {/* Email invite — active */}
                  <PickBtn selected onClick={() => {}}>
                    <span className="tqe-ab-pick-title">
                      @ Convite por e-mail
                    </span>
                    <span className="tqe-ab-pick-desc">Link expira em 48h</span>
                  </PickBtn>
                </div>
              </Field>

              {/* 03 — Serviços */}
              <SectionTitle>03 · Serviços que faz</SectionTitle>

              <Field help="Desmarque o que ele não oferece. Preço customizado por barbeiro você define no perfil dele depois.">
                {servicos.length > 0 ? (
                  <>
                    <div className="tqe-ab-svc-grid">
                      {servicos.map((s) => {
                        const sel = form.servicosSelecionados.has(s.codigo);
                        return (
                          <button
                            key={s.codigo}
                            type="button"
                            onClick={() => toggleServico(s.codigo)}
                            className={`tqe-ab-svc-btn${sel ? " sel" : ""}`}
                          >
                            <div
                              className={`tqe-ab-svc-check${sel ? " sel" : ""}`}
                            >
                              {sel && <Check size={9} strokeWidth={3} />}
                            </div>
                            {s.nome}
                          </button>
                        );
                      })}
                    </div>
                    <div className="tqe-ab-info-box" style={{ marginTop: 10 }}>
                      <span
                        style={{ color: "var(--primary)", fontWeight: 600 }}
                      >
                        {form.servicosSelecionados.size} serviço
                        {form.servicosSelecionados.size !== 1 ? "s" : ""}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {" "}
                        selecionado
                        {form.servicosSelecionados.size !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="tqe-ab-help" style={{ fontStyle: "italic" }}>
                    Nenhum serviço cadastrado ainda — adicione na aba Serviços
                    primeiro.
                  </p>
                )}
              </Field>

              {/* 04 — Quando trabalha */}
              <SectionTitle>04 · Quando trabalha</SectionTitle>

              <Field>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <PickBtn
                    selected={form.herdarHorario}
                    onClick={() => set("herdarHorario", true)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 12 }}>◆</span>
                      <div>
                        <span className="tqe-ab-pick-title">
                          Herdar horário da barbearia
                        </span>
                        <span className="tqe-ab-pick-desc">
                          Seg–Sex 09–19 · Sáb 08–18 · Dom fechado
                        </span>
                      </div>
                    </div>
                  </PickBtn>

                  <PickBtn
                    selected={!form.herdarHorario}
                    onClick={() => set("herdarHorario", false)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 12 }}>◇</span>
                      <div>
                        <span className="tqe-ab-pick-title">
                          Horário próprio
                        </span>
                        <span className="tqe-ab-pick-desc">
                          Define quando ele trabalha
                        </span>
                      </div>
                    </div>
                  </PickBtn>
                </div>

                <AnimatePresence>
                  {!form.herdarHorario && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", marginTop: 10 }}
                    >
                      <ScheduleTable
                        custom={form.horarioCustom}
                        onChange={updateHorario}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Field>

              {/* 05 — Comissão */}
              <SectionTitle>05 · Comissão</SectionTitle>

              <CommissionSection
                model={form.commissionModel}
                pct={form.commissionPct}
                fixed={form.commissionFixed}
                onModel={(m) => set("commissionModel", m)}
                onPct={(v) => set("commissionPct", v)}
                onFixed={(v) => set("commissionFixed", v)}
              />
            </div>

            {/* Sticky footer */}
            <div className="tqe-ab-footer">
              <span className="tqe-ab-footer-status">
                {canSubmit ? (
                  <span style={{ color: "var(--status-success)" }}>
                    ● pronto pra convidar
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>
                    preencha nome e e-mail
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={!canSubmit || convidar.isPending}
                onClick={handleSubmit}
                className="tqe-ab-cta-btn tqe-ab-cta-btn-lg"
                data-active={
                  canSubmit && !convidar.isPending ? "true" : undefined
                }
              >
                {convidar.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enviando convite…
                  </>
                ) : (
                  "Convidar barbeiro →"
                )}
              </button>
            </div>
          </>
        )}
      </motion.aside>
    </>
  );
}
