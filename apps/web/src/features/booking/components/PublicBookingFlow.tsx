"use client";

import React, { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Scissors,
  Star,
  Users,
} from "lucide-react";
import { z } from "zod";
import { criarClienteRapidoSchema } from "@toqe/contracts";

// Schema do form do step 4: mesmas regras do schema compartilhado +
// `observacao` opcional (campo extra usado só no fluxo público).
// Não estendemos `criarClienteRapidoSchema` direto porque ele é `.strict()`
// — qualquer campo extra invalidaria. Em vez disso reaproveitamos a *shape*
// e adicionamos a observação.
const clienteFormSchema = z.object({
  nome: criarClienteRapidoSchema.shape.nome,
  email: criarClienteRapidoSchema.shape.email,
  telefone: criarClienteRapidoSchema.shape.telefone,
  observacao: z.string().max(500).optional().or(z.literal("")),
});
type ClienteFormInput = z.infer<typeof clienteFormSchema>;
import { ApiError } from "@/shared/api/api-client";
import {
  useAvaliacoesPublicas,
  useBarbeariaPublica,
  useBarbeirosPublicos,
  useCriarAgendamentoPublico,
  useServicosPublicos,
  useSlotsPublicos,
} from "../hooks/use-booking-queries";
import type { AvaliacaoPublicaItem } from "../services/booking.service";
import type {
  BarbeariaPublica,
  BarbeiroPublico,
  ServicoPublico,
  SlotPublico,
} from "../types";

interface PublicBookingFlowProps {
  slug: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 5;

interface DayPill {
  isoDate: string; // YYYY-MM-DD
  dow: string; // SEG, TER ...
  day: string; // 19
  label?: string; // Hoje | Amanhã
}

function buildDays(count = 7): DayPill[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(today, i);
    return {
      isoDate: format(d, "yyyy-MM-dd"),
      dow: format(d, "EEE", { locale: ptBR }).toUpperCase().replace(".", ""),
      day: format(d, "dd"),
      label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : undefined,
    };
  });
}

function precoNumber(s: ServicoPublico): number {
  if (s.precoBase == null) return 0;
  return typeof s.precoBase === "number"
    ? s.precoBase
    : parseFloat(s.precoBase);
}

function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "Qualquer barbeiro disponível" — barbeiroId=0 (sentinela aceita pela API).
const QUALQUER_BARBEIRO: BarbeiroPublico = {
  codigo: 0,
  nome: "Qualquer disponível",
  avatarUrl: null,
};

// ─── Avaliações públicas ─────────────────────────────────────────────────────

function StarRow({ nota }: { nota: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${nota} estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < nota ? "var(--primary)" : "transparent"}
          style={{
            color: i < nota ? "var(--primary)" : "var(--border-default)",
          }}
        />
      ))}
    </span>
  );
}

function AvaliacoesPublicas({
  media,
  total,
  items,
}: {
  media: number;
  total: number;
  items: AvaliacaoPublicaItem[];
}) {
  return (
    <div
      className="w-full max-w-[440px] mt-4 rounded-3xl border overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-default)",
      }}
      data-testid="avaliacoes-section"
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Star
          size={16}
          fill="var(--primary)"
          style={{ color: "var(--primary)" }}
        />
        <span
          className="font-heading font-bold text-[17px]"
          style={{ color: "var(--text-primary)" }}
          data-testid="media-label"
        >
          {media.toFixed(1)}
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          · {total} avaliação{total !== 1 ? "ões" : ""}
        </span>
      </div>

      {/* Reviews list */}
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {items.map((item, idx) => (
          <div key={idx} className="px-5 py-3.5">
            <div className="flex items-center gap-2 mb-1">
              <StarRow nota={item.nota} />
              <span
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {new Date(item.criadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {item.comentario && (
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.comentario}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function PublicBookingFlow({
  slug,
}: PublicBookingFlowProps): React.JSX.Element {
  const barbearia = useBarbeariaPublica(slug);

  if (barbearia.isLoading) {
    return <FullPageLoader />;
  }
  if (barbearia.isError || !barbearia.data) {
    return <BarbeariaNaoEncontrada />;
  }

  return <PublicBookingFlowInner slug={slug} barbearia={barbearia.data} />;
}

function PublicBookingFlowInner({
  slug,
  barbearia,
}: {
  slug: string;
  barbearia: BarbeariaPublica;
}) {
  const [step, setStep] = useState<Step>(1);
  const [servicosIds, setServicosIds] = useState<number[]>([]);
  const [barbeiroId, setBarbeiroId] = useState<number | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    () => buildDays(1)[0]!.isoDate,
  );
  const [slotEscolhido, setSlotEscolhido] = useState<SlotPublico | null>(null);

  const servicosQ = useServicosPublicos(slug);
  const barbeirosQ = useBarbeirosPublicos(slug);
  const avaliacoesQ = useAvaliacoesPublicas(slug);

  const servicos: ServicoPublico[] = servicosQ.data ?? [];
  const barbeiros: BarbeiroPublico[] = useMemo(
    () => [QUALQUER_BARBEIRO, ...(barbeirosQ.data ?? [])],
    [barbeirosQ.data],
  );

  const selecionados = servicos.filter((s) => servicosIds.includes(s.codigo));
  const barbeiroSelecionado =
    barbeiros.find((b) => b.codigo === barbeiroId) ?? null;
  const totalPreco = selecionados.reduce((a, s) => a + precoNumber(s), 0);
  const totalDuracao =
    selecionados.reduce((a, s) => a + (s.duracaoBase ?? 30), 0) || 30;

  const days = useMemo(() => buildDays(7), []);

  const slotsQ = useSlotsPublicos({
    slug,
    barbeiroId: barbeiroId ?? 0,
    data: dataSelecionada,
    duracao: totalDuracao,
    enabled: step === 3 && barbeiroId !== null,
  });

  function toggleServico(codigo: number) {
    setServicosIds((ids) =>
      ids.includes(codigo) ? ids.filter((x) => x !== codigo) : [...ids, codigo],
    );
    setSlotEscolhido(null);
  }

  function reset() {
    setStep(1);
    setServicosIds([]);
    setBarbeiroId(null);
    setSlotEscolhido(null);
    setDataSelecionada(buildDays(1)[0]!.isoDate);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10 gap-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-[440px] rounded-3xl overflow-hidden border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <BookingHero
          barbearia={barbearia}
          servicos={servicos}
          barbeirosCount={barbeirosQ.data?.length ?? 0}
          step={step}
          totalSteps={TOTAL_STEPS}
        />

        <div className="px-5 sm:px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepServicos
                key="s1"
                servicos={servicos}
                loading={servicosQ.isLoading}
                selecionados={servicosIds}
                onToggle={toggleServico}
                totalPreco={totalPreco}
                onContinue={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepBarbeiro
                key="s2"
                barbeiros={barbeiros}
                loading={barbeirosQ.isLoading}
                selecionado={barbeiroId}
                onSelect={setBarbeiroId}
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <StepDataHora
                key="s3"
                days={days}
                dataSelecionada={dataSelecionada}
                onPickDia={(d) => {
                  setDataSelecionada(d);
                  setSlotEscolhido(null);
                }}
                slots={slotsQ.data ?? []}
                loadingSlots={slotsQ.isLoading}
                slotEscolhido={slotEscolhido}
                onPickSlot={setSlotEscolhido}
                onBack={() => setStep(2)}
                onContinue={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <StepCliente
                key="s4"
                onBack={() => setStep(3)}
                onContinue={() => setStep(5)}
                getDefaults={() => clientFormDefaults}
                onSubmit={(data) => {
                  clientFormDefaults = data;
                  setStep(5);
                }}
              />
            )}
            {step === 5 && barbeiroSelecionado && slotEscolhido && (
              <StepConfirmacao
                key="s5"
                barbearia={barbearia}
                slug={slug}
                servicos={selecionados}
                barbeiro={barbeiroSelecionado}
                dataSelecionada={dataSelecionada}
                slot={slotEscolhido}
                cliente={clientFormDefaults}
                totalPreco={totalPreco}
                totalDuracao={totalDuracao}
                onBack={() => setStep(4)}
                onSuccess={() => setStep(6)}
              />
            )}
            {step === 6 && barbeiroSelecionado && slotEscolhido && (
              <StepSucesso
                key="s6"
                barbearia={barbearia}
                cliente={clientFormDefaults}
                servicos={selecionados}
                barbeiro={barbeiroSelecionado}
                dataSelecionada={dataSelecionada}
                slot={slotEscolhido}
                onReset={reset}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          className="px-6 py-3 text-center text-[11px] border-t"
          style={{
            color: "var(--text-muted)",
            borderColor: "var(--border-subtle)",
          }}
        >
          Agendamento via{" "}
          <span className="font-semibold" style={{ color: "var(--primary)" }}>
            Toqe
          </span>
        </div>
      </div>

      {/* Seção de avaliações — exibida abaixo do card de booking */}
      {avaliacoesQ.data && avaliacoesQ.data.total > 0 && (
        <AvaliacoesPublicas
          media={avaliacoesQ.data.media}
          total={avaliacoesQ.data.total}
          items={avaliacoesQ.data.items}
        />
      )}
    </div>
  );
}

// Form de cliente é mantido fora do React tree principal (state lifted no
// componente pai) para que voltar de step 5 → 4 preserve os campos.
// Como o submit do step 4 grava em `clientFormDefaults`, basta usar como
// `defaultValues` do RHF na próxima renderização.
let clientFormDefaults: ClienteFormInput = {
  nome: "",
  email: "",
  telefone: "",
  observacao: "",
};

// ─── HERO ────────────────────────────────────────────────────────────────────

function BookingHero({
  barbearia,
  servicos,
  barbeirosCount,
  step,
  totalSteps,
}: {
  barbearia: BarbeariaPublica;
  servicos: ServicoPublico[];
  barbeirosCount: number;
  step: Step;
  totalSteps: number;
}) {
  const initial = barbearia.nome[0]?.toUpperCase() ?? "T";

  return (
    <div
      className="p-5 sm:p-6 border-b"
      style={{
        background:
          "linear-gradient(160deg, var(--bg-card) 0%, var(--bg-base) 100%)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {barbearia.tema?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={barbearia.tema.logoUrl}
            alt={`Logo ${barbearia.nome}`}
            className="rounded-xl object-cover flex-shrink-0"
            style={{ width: 52, height: 52 }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl font-heading font-bold flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              background:
                "linear-gradient(135deg, var(--primary) 0%, #e8a500 100%)",
              color: "#0D0D0D",
              fontSize: 22,
              boxShadow: "0 4px 16px rgba(244,180,0,0.3)",
            }}
          >
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <h1
            className="font-heading font-bold text-[18px] sm:text-[20px] truncate text-[var(--text-primary)]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {barbearia.nome}
          </h1>
          <div className="flex flex-wrap gap-x-3 text-[11px] text-[var(--text-muted)] mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Users size={11} /> {barbeirosCount} barbeiro
              {barbeirosCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Scissors size={11} /> {servicos.length} serviço
              {servicos.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {step <= TOTAL_STEPS && (
        <div
          className="flex gap-1.5 mt-4"
          aria-label="Progresso do agendamento"
        >
          {Array.from({ length: totalSteps }, (_, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div
                key={idx}
                className="flex-1 h-[3px] rounded-full"
                style={{
                  background:
                    done || active ? "var(--primary)" : "var(--border-default)",
                  transition: "background 200ms",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── STEP 1 — Serviços ───────────────────────────────────────────────────────

function StepServicos({
  servicos,
  loading,
  selecionados,
  onToggle,
  totalPreco,
  onContinue,
}: {
  servicos: ServicoPublico[];
  loading: boolean;
  selecionados: number[];
  onToggle: (codigo: number) => void;
  totalPreco: number;
  onContinue: () => void;
}) {
  return (
    <StepShell
      title="Que serviço você quer?"
      hint="Pode escolher mais de um."
      passo={1}
    >
      {loading ? (
        <StepLoader />
      ) : servicos.length === 0 ? (
        <EmptyState text="Nenhum serviço disponível no momento." />
      ) : (
        <div className="space-y-2">
          {servicos.map((s) => {
            const sel = selecionados.includes(s.codigo);
            return (
              <button
                type="button"
                key={s.codigo}
                onClick={() => onToggle(s.codigo)}
                aria-pressed={sel}
                className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-colors"
                style={{
                  background: sel ? "rgba(244,180,0,0.07)" : "var(--bg-card)",
                  borderColor: sel
                    ? "rgba(244,180,0,0.4)"
                    : "var(--border-default)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    background: sel
                      ? "rgba(244,180,0,0.1)"
                      : "var(--bg-secondary)",
                    border: `1px solid ${sel ? "rgba(244,180,0,0.3)" : "var(--border-default)"}`,
                    color: sel ? "var(--primary)" : "var(--text-secondary)",
                  }}
                >
                  <Scissors size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                    {s.nome}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {s.duracaoBase ?? 30} min
                  </div>
                </div>
                <div
                  className="font-heading font-bold text-[15px] flex-shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  {fmtBRL(precoNumber(s))}
                </div>
                {sel && (
                  <span aria-hidden="true" className="absolute -mt-7 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <PrimaryButton
        disabled={selecionados.length === 0}
        onClick={onContinue}
        className="mt-5"
      >
        {selecionados.length === 0
          ? "Selecione ao menos 1 serviço"
          : `Continuar · ${fmtBRL(totalPreco)}`}
        {selecionados.length > 0 && <ArrowRight size={15} />}
      </PrimaryButton>
    </StepShell>
  );
}

// ─── STEP 2 — Barbeiro ───────────────────────────────────────────────────────

function StepBarbeiro({
  barbeiros,
  loading,
  selecionado,
  onSelect,
  onBack,
  onContinue,
}: {
  barbeiros: BarbeiroPublico[];
  loading: boolean;
  selecionado: number | null;
  onSelect: (id: number) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      title="Com qual barbeiro?"
      hint="Escolha um favorito ou deixe a gente alocar."
      passo={2}
    >
      {loading ? (
        <StepLoader />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {barbeiros.map((b) => {
            const sel = selecionado === b.codigo;
            const isAny = b.codigo === 0;
            return (
              <button
                type="button"
                key={b.codigo}
                onClick={() => onSelect(b.codigo)}
                aria-pressed={sel}
                className="relative text-center p-3.5 rounded-xl border transition-colors"
                style={{
                  background: sel ? "rgba(244,180,0,0.07)" : "var(--bg-card)",
                  borderColor: sel
                    ? "rgba(244,180,0,0.4)"
                    : "var(--border-default)",
                }}
              >
                {sel && (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                    style={{
                      width: 18,
                      height: 18,
                      background: "var(--primary)",
                      color: "#0D0D0D",
                    }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <Avatar nome={b.nome} avatarUrl={b.avatarUrl} highlight={sel} />
                <div className="text-[13px] font-semibold mt-2 text-[var(--text-primary)]">
                  {b.nome}
                </div>
                {isAny && (
                  <div className="text-[10px] mt-1 text-[var(--text-muted)]">
                    Atende mais rápido
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-5">
        <PrimaryButton disabled={selecionado === null} onClick={onContinue}>
          Continuar
          {selecionado !== null && <ArrowRight size={15} />}
        </PrimaryButton>
        <BackButton onClick={onBack} />
      </div>
    </StepShell>
  );
}

function Avatar({
  nome,
  avatarUrl,
  highlight,
}: {
  nome: string;
  avatarUrl: string | null;
  highlight: boolean;
}) {
  const initial = nome[0]?.toUpperCase() ?? "?";
  const corBase = "var(--status-info)";
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={nome}
      className="mx-auto rounded-full object-cover"
      style={{
        width: 44,
        height: 44,
        boxShadow: highlight ? "0 0 0 2px var(--primary)" : "none",
      }}
    />
  ) : (
    <div
      className="mx-auto rounded-full flex items-center justify-center font-heading font-bold text-[17px]"
      style={{
        width: 44,
        height: 44,
        background: "rgba(77,163,255,0.15)",
        color: corBase,
        boxShadow: highlight ? "0 0 0 2px var(--primary)" : "none",
      }}
    >
      {initial}
    </div>
  );
}

// ─── STEP 3 — Data / Hora ────────────────────────────────────────────────────

function StepDataHora({
  days,
  dataSelecionada,
  onPickDia,
  slots,
  loadingSlots,
  slotEscolhido,
  onPickSlot,
  onBack,
  onContinue,
}: {
  days: DayPill[];
  dataSelecionada: string;
  onPickDia: (iso: string) => void;
  slots: SlotPublico[];
  loadingSlots: boolean;
  slotEscolhido: SlotPublico | null;
  onPickSlot: (s: SlotPublico) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const manha = slots.filter((s) => parseInt(s.horario) < 12);
  const tarde = slots.filter((s) => parseInt(s.horario) >= 12);

  return (
    <StepShell
      title="Quando fica bom?"
      hint="Escolha o dia e o horário."
      passo={3}
    >
      <div
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((d) => {
          const sel = d.isoDate === dataSelecionada;
          return (
            <button
              type="button"
              key={d.isoDate}
              onClick={() => onPickDia(d.isoDate)}
              aria-pressed={sel}
              className="flex-shrink-0 text-center rounded-xl border transition-colors"
              style={{
                minWidth: 64,
                padding: "10px 12px",
                background: sel ? "rgba(244,180,0,0.08)" : "var(--bg-card)",
                borderColor: sel
                  ? "rgba(244,180,0,0.4)"
                  : "var(--border-default)",
              }}
            >
              <div
                className="text-[9px] tracking-[0.1em] font-semibold"
                style={{
                  color: sel ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                {d.dow}
              </div>
              <div className="font-heading font-bold text-[17px] mt-0.5 text-[var(--text-primary)]">
                {d.day}
              </div>
              {d.label && (
                <div
                  className="text-[9px] mt-0.5"
                  style={{
                    color: sel ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {d.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {loadingSlots ? (
          <StepLoader />
        ) : slots.length === 0 ? (
          <EmptyState text="Nenhum horário disponível neste dia. Tente outra data." />
        ) : (
          <>
            {manha.length > 0 && (
              <SlotsGroup
                label="Manhã"
                slots={manha}
                escolhido={slotEscolhido}
                onPick={onPickSlot}
              />
            )}
            {tarde.length > 0 && (
              <SlotsGroup
                label="Tarde"
                slots={tarde}
                escolhido={slotEscolhido}
                onPick={onPickSlot}
              />
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <PrimaryButton disabled={!slotEscolhido} onClick={onContinue}>
          {slotEscolhido
            ? `Continuar · ${slotEscolhido.horario}`
            : "Selecione um horário"}
          {slotEscolhido && <ArrowRight size={15} />}
        </PrimaryButton>
        <BackButton onClick={onBack} />
      </div>
    </StepShell>
  );
}

function SlotsGroup({
  label,
  slots,
  escolhido,
  onPick,
}: {
  label: string;
  slots: SlotPublico[];
  escolhido: SlotPublico | null;
  onPick: (s: SlotPublico) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-[10px] tracking-[0.15em] font-semibold uppercase mb-2 text-[var(--text-muted)]">
        {label}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {slots.map((s) => {
          const sel = escolhido?.horario === s.horario;
          return (
            <button
              type="button"
              key={`${s.horario}-${s.barbeiroId}`}
              onClick={() => onPick(s)}
              aria-pressed={sel}
              className="rounded-lg border text-center font-mono text-[12px] py-2 transition-colors"
              style={{
                background: sel ? "rgba(244,180,0,0.1)" : "var(--bg-card)",
                borderColor: sel
                  ? "rgba(244,180,0,0.45)"
                  : "var(--border-default)",
                color: sel ? "var(--primary)" : "var(--text-primary)",
                fontWeight: sel ? 700 : 500,
              }}
            >
              {s.horario}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP 4 — Cliente ────────────────────────────────────────────────────────

function StepCliente({
  onBack,
  onSubmit,
  getDefaults,
}: {
  onBack: () => void;
  onContinue: () => void;
  getDefaults: () => ClienteFormInput;
  onSubmit: (data: ClienteFormInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteFormInput>({
    defaultValues: getDefaults(),
    resolver: zodResolver(clienteFormSchema),
    mode: "onBlur",
  });

  return (
    <StepShell
      title="Seus dados"
      hint="Primeira vez? Criamos sua conta automaticamente."
      passo={4}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-3.5"
      >
        <FieldText
          label="Nome completo *"
          placeholder="João Silva"
          autoComplete="name"
          {...register("nome")}
          error={errors.nome?.message}
          maxLength={100}
        />
        <FieldText
          label="E-mail *"
          type="email"
          placeholder="joao@email.com"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
          maxLength={100}
        />
        <FieldText
          label="WhatsApp (opcional)"
          type="tel"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          {...register("telefone")}
          error={errors.telefone?.message}
          maxLength={20}
        />
        <div>
          <label className="block text-[10px] tracking-[0.15em] font-semibold uppercase mb-1.5 text-[var(--text-muted)]">
            Observação (opcional)
          </label>
          <textarea
            {...register("observacao")}
            placeholder="Ex: prefiro máquina 2, alérgico a perfume..."
            maxLength={500}
            rows={3}
            className="tqe-input-bare w-full rounded-lg px-3 py-3"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              resize: "none",
              height: "auto",
            }}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <PrimaryButton type="submit">
            Revisar agendamento
            <ArrowRight size={15} />
          </PrimaryButton>
          <BackButton onClick={onBack} />
        </div>
      </form>
    </StepShell>
  );
}

interface FieldTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FieldText = React.forwardRef<HTMLInputElement, FieldTextProps>(
  function FieldText({ label, error, ...rest }, ref) {
    return (
      <div>
        <label className="block text-[10px] tracking-[0.15em] font-semibold uppercase mb-1.5 text-[var(--text-muted)]">
          {label}
        </label>
        <input
          ref={ref}
          {...rest}
          className="tqe-input-bare w-full rounded-lg h-[46px] px-3"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${error ? "var(--status-error)" : "var(--border-default)"}`,
            color: "var(--text-primary)",
          }}
        />
        {error && (
          <p className="text-[11px] mt-1 text-[var(--status-error)]">{error}</p>
        )}
      </div>
    );
  },
);

// ─── STEP 5 — Confirmação ────────────────────────────────────────────────────

function StepConfirmacao({
  barbearia,
  slug,
  servicos,
  barbeiro,
  dataSelecionada,
  slot,
  cliente,
  totalPreco,
  totalDuracao,
  onBack,
  onSuccess,
}: {
  barbearia: BarbeariaPublica;
  slug: string;
  servicos: ServicoPublico[];
  barbeiro: BarbeiroPublico;
  dataSelecionada: string;
  slot: SlotPublico;
  cliente: ClienteFormInput;
  totalPreco: number;
  totalDuracao: number;
  onBack: () => void;
  onSuccess: () => void;
}) {
  void barbearia;
  const mutation = useCriarAgendamentoPublico(slug);
  const inicioISO = `${dataSelecionada}T${slot.horario}:00.000Z`;
  const dataLegivel = format(
    new Date(`${dataSelecionada}T12:00:00`),
    "EEEE, dd 'de' MMMM",
    {
      locale: ptBR,
    },
  );

  const apiError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Não foi possível concluir o agendamento."
        : null;

  function handleConfirm() {
    mutation.mutate(
      {
        barbeiroId: slot.barbeiroId,
        inicio: inicioISO,
        servicosIds: servicos.map((s) => s.codigo),
        cliente: {
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone || undefined,
        },
        observacao: cliente.observacao || undefined,
      },
      { onSuccess },
    );
  }

  return (
    <StepShell
      title="Confirme seu agendamento"
      hint="Revise os detalhes antes de confirmar."
      passo={5}
    >
      <div
        className="rounded-2xl border p-4 space-y-2.5"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <SummaryRow k="Serviços" v={servicos.map((s) => s.nome).join(" + ")} />
        <SummaryRow k="Barbeiro" v={barbeiro.nome} />
        <SummaryRow k="Data" v={dataLegivel} />
        <SummaryRow k="Hora" v={slot.horario} />
        <SummaryRow k="Cliente" v={cliente.nome} />
        <SummaryRow k="E-mail" v={cliente.email} />
        {cliente.telefone && <SummaryRow k="WhatsApp" v={cliente.telefone} />}
        {cliente.observacao && (
          <SummaryRow k="Observação" v={cliente.observacao} />
        )}
      </div>

      <div
        className="flex items-center justify-between mt-4 pt-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          Total · {totalDuracao} min
        </span>
        <span
          className="font-heading text-[22px] font-bold"
          style={{ color: "var(--primary)" }}
        >
          {fmtBRL(totalPreco)}
        </span>
      </div>

      {apiError && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: "rgba(255,77,79,0.08)",
            border: "1px solid rgba(255,77,79,0.25)",
            color: "var(--status-error)",
          }}
          role="alert"
        >
          {apiError}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-5">
        <PrimaryButton onClick={handleConfirm} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Confirmando…
            </>
          ) : (
            <>
              Confirmar agendamento
              <Check size={15} />
            </>
          )}
        </PrimaryButton>
        <BackButton onClick={onBack} />
      </div>
    </StepShell>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[12px]">
      <span className="text-[var(--text-muted)] flex-shrink-0">{k}</span>
      <span
        className="text-[var(--text-primary)] text-right break-words"
        style={{ maxWidth: 220 }}
      >
        {v}
      </span>
    </div>
  );
}

// ─── STEP 6 — Sucesso ────────────────────────────────────────────────────────

function StepSucesso({
  barbearia,
  cliente,
  servicos,
  barbeiro,
  dataSelecionada,
  slot,
  onReset,
}: {
  barbearia: BarbeariaPublica;
  cliente: ClienteFormInput;
  servicos: ServicoPublico[];
  barbeiro: BarbeiroPublico;
  dataSelecionada: string;
  slot: SlotPublico;
  onReset: () => void;
}) {
  const dataLegivel = format(
    new Date(`${dataSelecionada}T12:00:00`),
    "EEEE, dd 'de' MMMM",
    { locale: ptBR },
  );
  const primeiroNome = cliente.nome.trim().split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-center py-6"
    >
      <div
        className="mx-auto flex items-center justify-center rounded-full mb-4"
        style={{
          width: 72,
          height: 72,
          background: "rgba(29,185,84,0.12)",
          border: "1px solid rgba(29,185,84,0.3)",
          color: "var(--status-success)",
        }}
      >
        <Check size={32} strokeWidth={2.5} />
      </div>
      <h2 className="font-heading font-bold text-[22px] text-[var(--text-primary)] mb-2">
        Agendamento confirmado!
      </h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-5 leading-relaxed">
        {primeiroNome}, você está confirmado para{" "}
        <strong>{slot.horario}</strong> de {dataLegivel}, com{" "}
        <strong>{barbeiro.nome}</strong> na <strong>{barbearia.nome}</strong>.
      </p>

      <div
        className="rounded-xl px-4 py-3 text-left mb-4 text-[12px]"
        style={{
          background: "rgba(77,163,255,0.06)",
          border: "1px solid rgba(77,163,255,0.18)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="font-semibold mb-1 text-[var(--text-primary)]">
          {servicos.map((s) => s.nome).join(" + ")}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} /> {barbearia.nome}
        </div>
      </div>

      <p className="text-[12px] text-[var(--text-muted)] mb-5 leading-relaxed">
        Você receberá um e-mail de confirmação em{" "}
        <strong className="text-[var(--text-secondary)]">
          {cliente.email}
        </strong>
        .
      </p>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-xl py-3 text-[13px] font-medium border transition-colors"
        style={{
          background: "transparent",
          borderColor: "var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        Fazer novo agendamento
      </button>
    </motion.div>
  );
}

// ─── Helpers compartilhados ──────────────────────────────────────────────────

function StepShell({
  passo,
  title,
  hint,
  children,
}: {
  passo: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <div className="text-[9px] tracking-[0.2em] font-semibold uppercase mb-1.5 text-[var(--text-muted)]">
        Passo {passo} de {TOTAL_STEPS}
      </div>
      <h2 className="font-heading font-bold text-[18px] text-[var(--text-primary)] mb-1">
        {title}
      </h2>
      {hint && (
        <p className="text-[12px] text-[var(--text-secondary)] mb-4 leading-relaxed">
          {hint}
        </p>
      )}
      {children}
    </motion.div>
  );
}

function PrimaryButton({
  children,
  className = "",
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...rest}
      className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] py-3.5 transition-all ${className}`}
      style={{
        background: rest.disabled ? "var(--bg-card)" : "var(--primary)",
        color: rest.disabled ? "var(--text-muted)" : "#0D0D0D",
        boxShadow: rest.disabled ? "none" : "0 4px 16px rgba(244,180,0,0.3)",
        cursor: rest.disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] border transition-colors"
      style={{
        background: "transparent",
        borderColor: "var(--border-default)",
        color: "var(--text-secondary)",
      }}
    >
      <ArrowLeft size={14} /> Voltar
    </button>
  );
}

function StepLoader() {
  return (
    <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-[12px] text-[var(--text-muted)]">
      {text}
    </div>
  );
}

function FullPageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      <Loader2
        size={28}
        className="animate-spin"
        style={{ color: "var(--primary)" }}
      />
    </div>
  );
}

function BarbeariaNaoEncontrada() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="text-center max-w-[360px]">
        <div
          className="mx-auto flex items-center justify-center rounded-full mb-4"
          style={{
            width: 56,
            height: 56,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          <Star size={22} />
        </div>
        <h1 className="font-heading font-bold text-[20px] text-[var(--text-primary)] mb-2">
          Barbearia não encontrada
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          O link parece estar errado ou esta barbearia não está mais ativa.
        </p>
      </div>
    </div>
  );
}
