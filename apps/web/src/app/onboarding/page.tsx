"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import {
  createBarbeariaSchema,
  createServicoSchema,
  convidarMembroSchema,
  registerSchema,
} from "@toqe/contracts";
import { api, tenantApi } from "@/shared/api/api-client";
import { checkEmailExists } from "@/features/auth/services/auth.service";
import { getInitial } from "@/shared/lib/utils";
import { maskTelefone, maskSlug } from "@/shared/utils/masks";

interface AccountData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
}

interface BarbeariaData {
  nome: string;
  slug: string;
  cidade: string;
  telefone: string;
  // true quando o usuário editou o slug manualmente (não regerar automático)
  slugEditado: boolean;
}

interface BrandingData {
  cor: string;
}

interface HorarioData {
  key: string;
  label: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

interface ServicoData {
  nome: string;
  preco: number;
  duracao: number;
}

interface BarbeiroData {
  nome: string;
  email: string;
}

type ServicoPreset = "basic" | "completo" | "custom";

const CORES_DISPONIVEIS = [
  "#F4B400",
  "#FF4D4F",
  "#4DA3FF",
  "#1DB954",
  "#A78BFA",
  "#FF8C42",
  "#F0F0F0",
];

const DIAS_HORARIOS: HorarioData[] = [
  {
    key: "seg",
    label: "Segunda",
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  },
  {
    key: "ter",
    label: "Terça",
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  },
  {
    key: "qua",
    label: "Quarta",
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  },
  {
    key: "qui",
    label: "Quinta",
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  },
  {
    key: "sex",
    label: "Sexta",
    aberto: true,
    abertura: "09:00",
    fechamento: "19:00",
  },
  {
    key: "sab",
    label: "Sábado",
    aberto: true,
    abertura: "08:00",
    fechamento: "18:00",
  },
  {
    key: "dom",
    label: "Domingo",
    aberto: false,
    abertura: "09:00",
    fechamento: "18:00",
  },
];

const PRESETS_SERVICOS: Record<ServicoPreset, ServicoData[]> = {
  basic: [
    { nome: "Corte", preco: 50, duracao: 30 },
    { nome: "Barba", preco: 35, duracao: 25 },
    { nome: "Corte + Barba", preco: 75, duracao: 50 },
  ],
  completo: [
    { nome: "Corte", preco: 50, duracao: 30 },
    { nome: "Barba", preco: 35, duracao: 25 },
    { nome: "Corte + Barba", preco: 75, duracao: 50 },
    { nome: "Sobrancelha", preco: 20, duracao: 15 },
    { nome: "Pigmentação", preco: 90, duracao: 60 },
    { nome: "Hidratação", preco: 45, duracao: 30 },
    { nome: "Platinado", preco: 180, duracao: 120 },
  ],
  custom: [{ nome: "", preco: 0, duracao: 30 }],
};

const STEPS = [
  { num: 1, lbl: "Criar conta", hint: "Nome, e-mail e senha", time: "~ 1 min" },
  {
    num: 2,
    lbl: "Sua barbearia",
    hint: "Nome, slug, contato",
    time: "~ 1 min",
  },
  { num: 3, lbl: "Identidade visual", hint: "Cor de marca", time: "~ 30 seg" },
  {
    num: 4,
    lbl: "Horário de funcionamento",
    hint: "Dias e horas",
    time: "~ 1 min",
  },
  { num: 5, lbl: "Serviços", hint: "Preço e duração", time: "~ 2 min" },
  { num: 6, lbl: "Equipe", hint: "Convide barbeiros", time: "~ 1 min" },
  { num: 7, lbl: "Tudo pronto", hint: "Revisar e publicar", time: "~ 30 seg" },
];

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
      className={`switch ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    />
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Selecionar cor ${color}`}
      className={`color-swatch ${selected ? "sel" : ""}`}
      style={{ background: color }}
      onClick={onClick}
    >
      {selected && <Check size={18} strokeWidth={3} />}
    </button>
  );
}

function Passo1Conta({
  data,
  onChange,
  fieldErrors,
  googleAuthed,
  onGoogleSuccess,
}: {
  data: AccountData;
  onChange: (key: keyof AccountData, value: string) => void;
  fieldErrors: Record<string, string>;
  googleAuthed: boolean;
  onGoogleSuccess: (credential: string) => Promise<void>;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  if (googleAuthed) {
    return (
      <>
        <h1 className="ob-h1">Conta Google conectada.</h1>
        <p className="ob-h1-sub">
          Logado como <strong>{data.nome}</strong> ({data.email}). Continue para
          configurar sua barbearia.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="ob-h1">Primeiro, cria sua conta.</h1>
      <p className="ob-h1-sub">
        É rápido. Em seguida você configura tudo da barbearia.
      </p>

      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="ob-form" style={{ marginBottom: 0 }}>
          <div className="relative">
            <div className={loadingGoogle ? "opacity-0" : "opacity-100"}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setLoadingGoogle(true);
                    try {
                      await onGoogleSuccess(credentialResponse.credential);
                    } finally {
                      setLoadingGoogle(false);
                    }
                  }
                }}
                onError={() => {}}
                theme="filled_black"
                text="continue_with"
                shape="pill"
                type="standard"
                size="large"
                logo_alignment="left"
              />
            </div>
            {loadingGoogle && (
              <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center rounded-full z-10 border border-[var(--border-default)]">
                <span className="text-[var(--text-primary)] text-sm font-medium flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-[var(--status-info)]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l1-2.647z"
                    ></path>
                  </svg>
                  Carregando...
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-muted)]">
              ou cadastre com e-mail
            </span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
        </div>
      )}

      <div className="ob-form">
        <div className="ob-field">
          <label>Seu nome completo</label>
          <input
            type="text"
            value={data.nome}
            onChange={(e) => onChange("nome", e.target.value)}
            placeholder="João Silva"
            autoComplete="name"
            maxLength={100}
            style={
              fieldErrors.nome
                ? { borderColor: "var(--status-error)" }
                : undefined
            }
          />
          {fieldErrors.nome && (
            <p className="text-[11px] mt-1 text-[var(--status-error)]">
              {fieldErrors.nome}
            </p>
          )}
        </div>

        <div className="ob-field">
          <label>E-mail</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="joao@barbearia.com"
            autoComplete="email"
            maxLength={100}
            style={
              fieldErrors.email
                ? { borderColor: "var(--status-error)" }
                : undefined
            }
          />
          {fieldErrors.email && (
            <p className="text-[11px] mt-1 text-[var(--status-error)]">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="ob-row cols-2">
          <div className="ob-field">
            <label>Senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={data.senha}
                onChange={(e) => onChange("senha", e.target.value)}
                placeholder="Mín. 6 caracteres"
                autoComplete="new-password"
                maxLength={128}
                className="pr-9"
                style={
                  fieldErrors.senha
                    ? { borderColor: "var(--status-error)" }
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.senha && (
              <p className="text-[11px] mt-1 text-[var(--status-error)]">
                {fieldErrors.senha}
              </p>
            )}
          </div>

          <div className="ob-field">
            <label>Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={data.confirmarSenha}
                onChange={(e) => onChange("confirmarSenha", e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                maxLength={128}
                className="pr-9"
                style={
                  fieldErrors.confirmarSenha
                    ? { borderColor: "var(--status-error)" }
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.confirmarSenha && (
              <p className="text-[11px] mt-1 text-[var(--status-error)]">
                {fieldErrors.confirmarSenha}
              </p>
            )}
          </div>
        </div>

        <div className="ob-field">
          <label>
            Telefone{" "}
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 400,
                textTransform: "lowercase",
              }}
            >
              (opcional)
            </span>
          </label>
          <input
            type="tel"
            value={data.telefone}
            onChange={(e) => onChange("telefone", maskTelefone(e.target.value))}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </div>

        <div className="help">
          Ao criar sua conta, você concorda com os{" "}
          <a href="#" className="text-[var(--status-info)]">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="text-[var(--status-info)]">
            Política de Privacidade
          </a>
          .
        </div>

        <div className="mt-4 text-center text-sm text-[var(--foreground-muted)]">
          Já tem uma conta?{" "}
          <a
            href="/login"
            className="text-[var(--status-info)] font-medium hover:underline"
          >
            Fazer login
          </a>
        </div>
      </div>
    </>
  );
}

function Passo1({
  data,
  onChange,
  fieldErrors,
}: {
  data: BarbeariaData;
  onChange: (key: keyof BarbeariaData, value: string | boolean) => void;
  fieldErrors: Record<string, string>;
}) {
  const slugDisponivel = data.slug.length > 2;

  function normalizeSlug(value: string) {
    onChange("slug", maskSlug(value).slice(0, 60));
    onChange("slugEditado", true);
  }

  function handleNomeChange(value: string) {
    onChange("nome", value);
    // Auto-gera slug apenas enquanto o usuário não editou manualmente
    if (!data.slugEditado) {
      onChange("slug", maskSlug(value).slice(0, 40));
    }
  }

  const onChangeRef = useRef(onChange);
  const cidadeRef = useRef(data.cidade);
  useEffect(() => {
    onChangeRef.current = onChange;
    cidadeRef.current = data.cidade;
  });

  useEffect(() => {
    if (cidadeRef.current) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=pt-BR`,
          );
          const geo = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              municipality?: string;
              county?: string;
              state_code?: string;
              state?: string;
            };
          };
          const addr = geo.address;
          const city =
            addr?.city ?? addr?.town ?? addr?.municipality ?? addr?.county;
          const state = addr?.state_code ?? addr?.state;
          if (city)
            onChangeRef.current(
              "cidade",
              `${city}${state ? `, ${state}` : ""}`,
            );
        } catch (err) {
          console.error("Erro ao buscar localização no Nominatim:", err);
          // silencioso — campo fica em branco para o usuário preencher
        }
      },
      () => {},
      { timeout: 5000 },
    );
  }, []);

  return (
    <>
      <h1 className="ob-h1">Como sua barbearia se chama?</h1>
      <p className="ob-h1-sub">
        Esse nome aparece pra seus clientes no link de agendamento e nas
        mensagens automáticas.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Nome da barbearia</label>
          <input
            type="text"
            value={data.nome}
            onChange={(event) => handleNomeChange(event.target.value)}
            placeholder="Ex: Barba do Zé"
            maxLength={100}
            style={
              fieldErrors.nomeBarbearia
                ? { borderColor: "var(--status-error)" }
                : undefined
            }
          />
          {fieldErrors.nomeBarbearia && (
            <p className="text-[11px] mt-1 text-[var(--status-error)]">
              {fieldErrors.nomeBarbearia}
            </p>
          )}
        </div>

        <div className="ob-row cols-2">
          <div className="ob-field">
            <label>Cidade</label>
            <input
              type="text"
              value={data.cidade}
              onChange={(event) => onChange("cidade", event.target.value)}
              placeholder="Ex: São Paulo, SP"
            />
          </div>
          <div className="ob-field">
            <label>Telefone (WhatsApp)</label>
            <input
              type="tel"
              value={data.telefone}
              onChange={(event) =>
                onChange("telefone", maskTelefone(event.target.value))
              }
              placeholder="(11) 99999-9999"
              maxLength={20}
            />
          </div>
        </div>

        <div className="ob-field">
          <label>Seu link de agendamento</label>
          <div className="with-prefix">
            <span className="prefix">toqe.app/</span>
            <input
              type="text"
              value={data.slug}
              onChange={(event) => normalizeSlug(event.target.value)}
              maxLength={60}
              style={
                fieldErrors.slug
                  ? { borderColor: "var(--status-error)" }
                  : undefined
              }
            />
          </div>
          {fieldErrors.slug ? (
            <p className="text-[11px] mt-1 text-[var(--status-error)]">
              {fieldErrors.slug}
            </p>
          ) : (
            <div className="help">
              <span
                style={{
                  color: slugDisponivel ? "var(--green)" : "var(--red)",
                }}
              >
                ●
              </span>{" "}
              {slugDisponivel ? "Disponível" : "Escolha um slug maior"} · seus
              clientes vão ver{" "}
              <span
                className="text-[var(--accent)]"
                style={{ fontFamily: "JetBrains Mono" }}
              >
                toqe.app/{data.slug || "sua-barbearia"}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Passo2({
  barbearia,
  data,
  onChange,
  logoPreview,
  onLogoChange,
}: {
  barbearia: BarbeariaData;
  data: BrandingData;
  onChange: (key: keyof BrandingData, value: string) => void;
  logoPreview: string | null;
  onLogoChange: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = getInitial(barbearia.nome, "B");

  function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) return;
    if (!file.type.startsWith("image/")) return;
    onLogoChange(file);
  }

  return (
    <>
      <h1 className="ob-h1">Qual a cara da sua marca?</h1>
      <p className="ob-h1-sub">
        Escolha a cor principal. Ela vai pintar o painel, os botões e o link
        público dos seus clientes.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Cor de marca</label>
          <div className="color-grid">
            {CORES_DISPONIVEIS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={data.cor === color}
                onClick={() => onChange("cor", color)}
              />
            ))}
          </div>
          <div className="help">Você muda quando quiser nas configurações.</div>
        </div>

        <div className="ob-field">
          <label>Logotipo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            className="logo-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={200}
                height={80}
                unoptimized
                style={{ maxHeight: 80, maxWidth: 200, objectFit: "contain" }}
              />
            ) : (
              <>
                <span className="logo-dropzone-icon">
                  <Camera size={22} />
                </span>
                <strong>Arraste seu logo aqui ou clique para escolher</strong>
                <small>
                  PNG, SVG ou JPEG · até 2MB · ideal: quadrado 512×512
                </small>
              </>
            )}
          </button>
          <div className="help">
            Opcional. Se não tiver, usamos a inicial do nome com sua cor.
          </div>
        </div>

        <div className="ob-field">
          <label>Pré-visualização</label>
          <div className="brand-preview">
            <div
              className="brand-preview-mark"
              style={{
                background: `linear-gradient(135deg, ${data.cor}, ${data.cor}dd)`,
                boxShadow: `0 4px 16px ${data.cor}40`,
                overflow: "hidden",
              }}
            >
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo"
                  width={64}
                  height={64}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initial
              )}
            </div>
            <div>
              <div className="brand-preview-name">
                {barbearia.nome || "Sua Barbearia"}
              </div>
              <div className="brand-preview-slug">
                toqe.app/<span>{barbearia.slug || "sua-barbearia"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Passo3({
  horarios,
  onChange,
}: {
  horarios: HorarioData[];
  onChange: (
    index: number,
    key: keyof HorarioData,
    value: string | boolean,
  ) => void;
}) {
  return (
    <>
      <h1 className="ob-h1">Quando vocês abrem?</h1>
      <p className="ob-h1-sub">
        Define a janela em que os clientes podem agendar. Cada barbeiro pode ter
        horário próprio depois.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Horário de funcionamento</label>
          <div className="hours-table">
            {horarios.map((horario, index) => (
              <div
                key={horario.key}
                className={`hour-row ${horario.aberto ? "" : "off"}`}
              >
                <div className="day">{horario.label}</div>
                <input
                  className="time-input"
                  type="time"
                  value={horario.abertura}
                  disabled={!horario.aberto}
                  onChange={(event) =>
                    onChange(index, "abertura", event.target.value)
                  }
                />
                <input
                  className="time-input"
                  type="time"
                  value={horario.fechamento}
                  disabled={!horario.aberto}
                  onChange={(event) =>
                    onChange(index, "fechamento", event.target.value)
                  }
                />
                <Toggle
                  checked={horario.aberto}
                  onChange={(checked) => onChange(index, "aberto", checked)}
                />
              </div>
            ))}
          </div>
          <div className="help">
            Bloqueio de almoço e folgas individuais por barbeiro você configura
            depois, na agenda.
          </div>
        </div>
      </div>
    </>
  );
}

function Passo4({
  servicos,
  preset,
  onChangePreset,
  onAddServico,
  onUpdateServico,
  onRemoveServico,
}: {
  servicos: ServicoData[];
  preset: ServicoPreset;
  onChangePreset: (p: ServicoPreset) => void;
  onAddServico: () => void;
  onUpdateServico: (
    index: number,
    key: keyof ServicoData,
    value: string | number,
  ) => void;
  onRemoveServico: (index: number) => void;
}) {
  const presets: Array<{
    id: ServicoPreset;
    label: string;
    desc: string;
    icon: string;
  }> = [
    { id: "basic", label: "Básico", desc: "3 serviços", icon: "B" },
    { id: "completo", label: "Completo", desc: "7 serviços", icon: "C" },
    { id: "custom", label: "Em branco", desc: "criar do zero", icon: "+" },
  ];

  return (
    <>
      <h1 className="ob-h1">O que vocês fazem?</h1>
      <p className="ob-h1-sub">
        Cadastre os serviços com preço e duração padrão. Cada barbeiro pode ter
        preço/duração próprios depois.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Use um preset pra começar mais rápido</label>
          <div className="pick-grid pick-grid-3">
            {presets.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`pick ${preset === item.id ? "sel" : ""}`}
                onClick={() => onChangePreset(item.id)}
              >
                <div className="pick-icon">{item.icon}</div>
                <div className="pick-body">
                  <div className="pick-title">{item.label}</div>
                  <div className="pick-desc">{item.desc}</div>
                </div>
                {preset === item.id && (
                  <span className="pick-check">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="ob-field">
          <label>Serviços</label>
          <div className="svc-header">
            <span>Nome do serviço</span>
            <span>Preço (R$)</span>
            <span>Duração (min)</span>
            <span />
          </div>
          <div className="svc-list">
            {servicos.map((servico, index) => (
              <div key={index} className="svc-row">
                <input
                  value={servico.nome}
                  onChange={(event) =>
                    onUpdateServico(index, "nome", event.target.value)
                  }
                  placeholder="Nome do serviço"
                  maxLength={100}
                />
                <input
                  value={servico.preco}
                  onChange={(event) =>
                    onUpdateServico(index, "preco", Number(event.target.value))
                  }
                  placeholder="0"
                  type="number"
                  aria-label="Preço"
                  min={0}
                  max={9999.99}
                />
                <input
                  value={servico.duracao}
                  onChange={(event) =>
                    onUpdateServico(
                      index,
                      "duracao",
                      Number(event.target.value),
                    )
                  }
                  placeholder="30"
                  type="number"
                  aria-label="Duração"
                  min={5}
                  max={480}
                />
                <button
                  type="button"
                  className="del"
                  aria-label="Remover serviço"
                  onClick={() => onRemoveServico(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-row" onClick={onAddServico}>
            + Adicionar serviço
          </button>
        </div>
      </div>
    </>
  );
}

function AcceptancePreview({
  barNome,
  accentColor,
  barbeiroNome,
}: {
  barNome: string;
  accentColor: string;
  barbeiroNome: string;
}) {
  const [aceiteStep, setAceiteStep] = useState<0 | 1 | 2>(0);
  const initial = getInitial(barNome, "B");

  return (
    <div className="ob-acceptance-mini">
      <div className="ob-acceptance-browser-bar">
        <div className="ob-browser-dots">
          <span style={{ background: "#ff6b6b" }} />
          <span style={{ background: "#ffd43b" }} />
          <span style={{ background: "#51cf66" }} />
        </div>
        <span className="ob-browser-url">toqe.app/convite?token=abc123</span>
        <span
          className="ob-badge ob-badge-current"
          style={{ marginLeft: "auto" }}
        >
          TELA DO BARBEIRO
        </span>
      </div>

      {aceiteStep === 0 && (
        <div className="ob-acceptance-step">
          <div
            className="ob-acceptance-mark"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              boxShadow: `0 4px 16px ${accentColor}40`,
            }}
          >
            {initial}
          </div>
          <h3 className="ob-acceptance-title">{barNome}</h3>
          <div className="ob-acceptance-badge">✦ Convite de barbeiro</div>
          <p className="ob-acceptance-desc">
            <strong>{barNome}</strong> convidou você para integrar a equipe como{" "}
            <strong style={{ color: accentColor }}>barbeiro</strong>.
          </p>
          <div className="ob-acceptance-actions">
            <button
              type="button"
              className="ob-acceptance-confirm"
              style={{
                background: accentColor,
                boxShadow: `0 4px 14px ${accentColor}35`,
              }}
              onClick={() => setAceiteStep(1)}
            >
              Aceitar convite →
            </button>
            <button type="button" className="ob-acceptance-reject">
              Rejeitar
            </button>
          </div>
        </div>
      )}

      {aceiteStep === 1 && (
        <div className="ob-acceptance-step">
          <p className="ob-acceptance-form-title">Criar sua conta</p>
          <input
            className="c-input"
            placeholder="Seu nome completo"
            defaultValue={barbeiroNome}
            readOnly
          />
          <input
            className="c-input"
            type="email"
            placeholder="seu@email.com"
            readOnly
          />
          <input
            className="c-input"
            type="password"
            placeholder="Criar senha (mín. 6 chars)"
            readOnly
          />
          <button
            type="button"
            className="ob-acceptance-confirm"
            style={{ background: "var(--status-info)" }}
            onClick={() => setAceiteStep(2)}
          >
            Criar conta e aceitar →
          </button>
          <div className="ob-acceptance-login-link">
            Já tem conta?{" "}
            <span style={{ color: "var(--status-info)", cursor: "pointer" }}>
              Entrar
            </span>
          </div>
        </div>
      )}

      {aceiteStep === 2 && (
        <div className="ob-acceptance-step ob-acceptance-done">
          <div className="ob-acceptance-check">
            <Check size={22} strokeWidth={3} />
          </div>
          <h3 className="ob-acceptance-title">Acesso liberado!</h3>
          <p className="ob-acceptance-desc">
            Você agora faz parte da equipe da <strong>{barNome}</strong>. Baixe
            o app para começar a receber agendamentos.
          </p>
          <div className="ob-acceptance-stores">
            {["App Store", "Google Play"].map((s) => (
              <div key={s} className="ob-acceptance-store-btn">
                {s}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="ob-acceptance-restart"
            onClick={() => setAceiteStep(0)}
          >
            ← Recomeçar preview
          </button>
        </div>
      )}
    </div>
  );
}

function Passo5({
  barbeiros,
  euSouBarbeiro,
  onSetEuSouBarbeiro,
  onAddBarbeiro,
  onUpdateBarbeiro,
  onRemoveBarbeiro,
  barbeariaNome,
  accentColor,
}: {
  barbeiros: BarbeiroData[];
  euSouBarbeiro: boolean;
  onSetEuSouBarbeiro: (v: boolean) => void;
  onAddBarbeiro: () => void;
  onUpdateBarbeiro: (
    index: number,
    key: keyof BarbeiroData,
    value: string,
  ) => void;
  onRemoveBarbeiro: (index: number) => void;
  barbeariaNome: string;
  accentColor: string;
}) {
  const [showAcceptance, setShowAcceptance] = useState(false);
  const previewBarbeiro = barbeiros.find((b) => b.nome) ?? {
    nome: "Carlos Lima",
    email: "carlos@email.com",
  };

  const barNome = barbeariaNome || "Barbearia Urban";

  return (
    <>
      <h1 className="ob-h1">Quem mais corta com você?</h1>
      <p className="ob-h1-sub">
        Convide os barbeiros pelo e-mail. Eles recebem um link de acesso, sem
        precisar de senha pra começar.
      </p>

      <div className="ob-form" style={{ maxWidth: 640 }}>
        <div className="ob-field">
          <label>Você mesmo é barbeiro?</label>
          <div className="pick-grid pick-grid-2">
            <button
              type="button"
              className={`pick ${euSouBarbeiro ? "sel" : ""}`}
              onClick={() => onSetEuSouBarbeiro(true)}
            >
              <div className="pick-icon">●</div>
              <div className="pick-body">
                <div className="pick-title">Sim, atendo na cadeira</div>
                <div className="pick-desc">
                  Você aparece na agenda como barbeiro
                </div>
              </div>
              {euSouBarbeiro && (
                <span className="pick-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
            <button
              type="button"
              className={`pick ${!euSouBarbeiro ? "sel" : ""}`}
              onClick={() => onSetEuSouBarbeiro(false)}
            >
              <div className="pick-icon">○</div>
              <div className="pick-body">
                <div className="pick-title">Não, só administro</div>
                <div className="pick-desc">Só vê o painel, não atende</div>
              </div>
              {!euSouBarbeiro && (
                <span className="pick-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="ob-field">
          <label>Convide os outros barbeiros</label>
          <div className="barber-list">
            {barbeiros.map((barbeiro, index) => (
              <div key={index} className="barber-row">
                <div
                  className="barber-avatar"
                  style={{
                    background: `${accentColor}18`,
                    borderColor: `${accentColor}35`,
                    color: accentColor,
                  }}
                >
                  {getInitial(barbeiro.nome)}
                </div>
                <input
                  value={barbeiro.nome}
                  onChange={(event) =>
                    onUpdateBarbeiro(index, "nome", event.target.value)
                  }
                  placeholder="Nome do barbeiro"
                  maxLength={100}
                />
                <input
                  value={barbeiro.email}
                  onChange={(event) =>
                    onUpdateBarbeiro(index, "email", event.target.value)
                  }
                  placeholder="email@dominio.com"
                  type="email"
                  maxLength={100}
                />
                <button
                  type="button"
                  className="del"
                  aria-label="Remover barbeiro"
                  onClick={() => onRemoveBarbeiro(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-row" onClick={onAddBarbeiro}>
            + Convidar mais um
          </button>
          <div className="help">
            Eles podem aceitar o convite depois. Você consegue avançar mesmo sem
            confirmação deles.
          </div>
        </div>

        {/* Invite preview section */}
        <div className="ob-invite-preview">
          <div className="ob-invite-header">
            <span className="ob-invite-label">
              Como o convite chega para o barbeiro
            </span>
            <span className="ob-badge ob-badge-planned">
              MAGIC LINK · EM BREVE
            </span>
            <span className="ob-badge ob-badge-current">ATUAL: POR E-MAIL</span>
          </div>

          <div className="ob-invite-cards">
            {/* WhatsApp preview */}
            <div className="ob-invite-card">
              <div className="ob-invite-card-label">Via WhatsApp</div>
              <div className="ob-wapp-bubble">
                <div className="ob-wapp-sender">
                  Toqe · Convite de barbearia
                </div>
                <div>Olá {previewBarbeiro.nome}! 👋</div>
                <div className="ob-wapp-body">
                  Você foi convidado para integrar a equipe da{" "}
                  <strong>{barNome}</strong> como barbeiro no Toqe.
                </div>
                <div className="ob-wapp-cta">
                  Clique para aceitar e configurar seu acesso:
                </div>
                <span className="ob-wapp-link">
                  → toqe.app/convite?token=abc123
                </span>
                <div className="ob-wapp-meta">Toqe · agora ✓✓</div>
              </div>
            </div>

            {/* Email preview */}
            <div className="ob-invite-card">
              <div className="ob-invite-card-label">Via E-mail</div>
              <div className="ob-email-preview">
                <div className="ob-email-meta">
                  De: noreply@toqe.app · Para: {previewBarbeiro.email}
                </div>
                <div className="ob-email-subject">
                  Você foi convidado para a equipe
                </div>
                <div className="ob-email-body">
                  Olá {previewBarbeiro.nome}!{" "}
                  <strong style={{ color: accentColor }}>{barNome}</strong>{" "}
                  convidou você como <strong>barbeiro</strong>.
                </div>
                <div className="ob-email-cta-wrap">
                  <span
                    className="ob-email-cta"
                    style={{ background: accentColor }}
                  >
                    Aceitar convite →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle acceptance preview */}
          <button
            type="button"
            className="ob-acceptance-toggle"
            onClick={() => setShowAcceptance((v) => !v)}
          >
            {showAcceptance
              ? "▲ Ocultar"
              : "▼ Ver o que o barbeiro vê ao clicar no link"}
          </button>

          {showAcceptance && (
            <AcceptancePreview
              barNome={barNome}
              accentColor={accentColor}
              barbeiroNome={previewBarbeiro.nome}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Passo6({
  account,
  barbearia,
  horarios,
  servicos,
  barbeiros,
  onGo,
}: {
  account: AccountData;
  barbearia: BarbeariaData;
  horarios: HorarioData[];
  servicos: ServicoData[];
  barbeiros: BarbeiroData[];
  onGo: (step: number) => void;
}) {
  const diasAbertos = horarios.filter((horario) => horario.aberto);

  return (
    <>
      <h1 className="ob-h1">Tudo certo. Confere e publica.</h1>
      <p className="ob-h1-sub">
        Revisa os dados. Você pode editar tudo depois, esse é só o ponto de
        partida.
      </p>

      <div className="summary-grid">
        <div className="summary-card">
          <h4>
            Conta{" "}
            <button type="button" className="edit" onClick={() => onGo(1)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Nome</span>
            <span className="v">{account.nome || "—"}</span>
          </div>
          <div className="summary-line">
            <span className="k">E-mail</span>
            <span className="v">{account.email || "—"}</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>
            Barbearia{" "}
            <button type="button" className="edit" onClick={() => onGo(2)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Nome</span>
            <span className="v">{barbearia.nome || "—"}</span>
          </div>
          <div className="summary-line">
            <span className="k">Cidade</span>
            <span className="v">{barbearia.cidade || "—"}</span>
          </div>
          <div className="summary-line">
            <span className="k">Link</span>
            <span className="v">toqe.app/{barbearia.slug || "—"}</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>
            Funcionamento{" "}
            <button type="button" className="edit" onClick={() => onGo(4)}>
              editar
            </button>
          </h4>
          {diasAbertos.slice(0, 3).map((horario) => (
            <div key={horario.key} className="summary-line">
              <span className="k">{horario.label}</span>
              <span className="v">
                {horario.abertura}–{horario.fechamento}
              </span>
            </div>
          ))}
          {diasAbertos.length > 3 && (
            <div
              style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}
            >
              +{diasAbertos.length - 3} dias
            </div>
          )}
        </div>

        <div className="summary-card">
          <h4>
            Equipe{" "}
            <button type="button" className="edit" onClick={() => onGo(6)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Serviços</span>
            <span className="v">
              {servicos.filter((s) => s.nome).length} cadastrados
            </span>
          </div>
          <div className="summary-line">
            <span className="k">Barbeiros</span>
            <span className="v">{barbeiros.length} convidados</span>
          </div>
          <div className="summary-line">
            <span className="k">Plano</span>
            <span className="v accent">Free · 30 dias Basic grátis</span>
          </div>
        </div>
      </div>

      <div className="ready-banner">
        <div className="ico">
          <Check size={22} strokeWidth={3} />
        </div>
        <div>
          <h4>Tudo certo pra ir ao ar</h4>
          <p>
            Ao publicar, seu link{" "}
            <span>toqe.app/{barbearia.slug || "sua-barbearia"}</span> fica
            acessível e seus clientes já podem agendar.
          </p>
        </div>
      </div>
    </>
  );
}

export default function Onboarding(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleAuthed, setGoogleAuthed] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [euSouBarbeiro, setEuSouBarbeiro] = useState(true);
  const [account, setAccount] = useState<AccountData>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
  });
  const [barbearia, setBarbearia] = useState<BarbeariaData>({
    nome: "",
    slug: "",
    cidade: "",
    telefone: "",
    slugEditado: false,
  });
  const [branding, setBranding] = useState<BrandingData>({ cor: "#F4B400" });
  const [horarios, setHorarios] = useState<HorarioData[]>(DIAS_HORARIOS);
  const [servicosPreset, setServicosPreset] = useState<ServicoPreset>("basic");
  const [servicos, setServicos] = useState<ServicoData[]>(
    PRESETS_SERVICOS.basic,
  );
  const [barbeiros, setBarbeiros] = useState<BarbeiroData[]>([]);

  function go(nextStep: number) {
    if (nextStep >= 1 && nextStep <= STEPS.length) {
      setStep(nextStep);
      const el = document.querySelector(".ob-main");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "start" });
      }
    }
  }

  async function handleGoogleSuccess(credential: string) {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
      if (!res.ok) return;
      // Decodifica payload do JWT para preencher nome/email na UI
      const payload = JSON.parse(
        atob(credential.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { name?: string; email?: string };
      setAccount((prev) => ({
        ...prev,
        nome: payload.name ?? prev.nome,
        email: payload.email ?? prev.email,
      }));
      setGoogleAuthed(true);
      go(2);
    } catch {
      // silencioso — usuário pode continuar com email/senha
    }
  }

  function updateBarbearia(key: keyof BarbeariaData, value: string | boolean) {
    setBarbearia((prev) => ({ ...prev, [key]: value }));
  }

  function updateBranding(key: keyof BrandingData, value: string) {
    setBranding((prev) => ({ ...prev, [key]: value }));
  }

  function updateHorario(
    index: number,
    key: keyof HorarioData,
    value: string | boolean,
  ) {
    setHorarios((prev) =>
      prev.map((horario, itemIndex) =>
        itemIndex === index ? { ...horario, [key]: value } : horario,
      ),
    );
  }

  function changeServicosPreset(preset: ServicoPreset) {
    setServicosPreset(preset);
    setServicos(PRESETS_SERVICOS[preset].map((servico) => ({ ...servico })));
  }

  function updateServico(
    index: number,
    key: keyof ServicoData,
    value: string | number,
  ) {
    setServicos((prev) =>
      prev.map((servico, itemIndex) =>
        itemIndex === index ? { ...servico, [key]: value } : servico,
      ),
    );
  }

  function updateBarbeiro(
    index: number,
    key: keyof BarbeiroData,
    value: string,
  ) {
    setBarbeiros((prev) =>
      prev.map((barbeiro, itemIndex) =>
        itemIndex === index ? { ...barbeiro, [key]: value } : barbeiro,
      ),
    );
  }

  async function handleNext() {
    setFieldErrors({});
    setPublishError("");

    if (step === 1) {
      if (googleAuthed) {
        go(step + 1);
        return;
      }
      const result = registerSchema.safeParse({
        nome: account.nome,
        email: account.email,
        senha: account.senha,
      });
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        setFieldErrors({
          nome: flat.nome?.[0] ?? "",
          email: flat.email?.[0] ?? "",
          senha: flat.senha?.[0] ?? "",
        });
        return;
      }
      if (account.senha !== account.confirmarSenha) {
        setFieldErrors({ confirmarSenha: "As senhas não conferem" });
        return;
      }

      // Checa se o e-mail já existe
      const emailExists = await checkEmailExists(account.email);
      if (emailExists) {
        setFieldErrors({ email: "Este e-mail já está em uso" });
        return;
      }
    }

    if (step === 2) {
      const result = createBarbeariaSchema.safeParse({
        nome: barbearia.nome,
        slug: barbearia.slug,
      });
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        setFieldErrors({
          nomeBarbearia: flat.nome?.[0] ?? "",
          slug: flat.slug?.[0] ?? "",
        });
        return;
      }
    }

    if (step === 5) {
      const erros: Record<string, string> = {};
      servicos.forEach((s, idx) => {
        const r = createServicoSchema.safeParse({
          nome: s.nome,
          precoBase: s.preco,
          duracaoBase: s.duracao,
        });
        if (!r.success)
          r.error.issues.forEach((i) => {
            erros[`servico_${idx}_${i.path[0] as string}`] =
              `Serviço ${idx + 1}: ${i.message}`;
          });
      });
      if (Object.keys(erros).length > 0) {
        setFieldErrors(erros);
        return;
      }
    }

    if (step === 6) {
      const erros: Record<string, string> = {};
      barbeiros.forEach((b, idx) => {
        if (!b.email) return;
        const r = convidarMembroSchema.safeParse({
          email: b.email,
          perfil: "barbeiro",
        });
        if (!r.success)
          r.error.issues.forEach((i) => {
            erros[`barbeiro_${idx}_email`] =
              `Barbeiro ${idx + 1}: ${i.message}`;
          });
      });
      if (Object.keys(erros).length > 0) {
        setFieldErrors(erros);
        return;
      }
    }

    if (step < STEPS.length) {
      go(step + 1);
      return;
    }

    // Step 7 — Publicar
    setPublishing(true);
    try {
      if (!googleAuthed) {
        await api.post(
          "/auth/register",
          {
            nome: account.nome,
            email: account.email,
            senha: account.senha,
            ...(account.telefone ? { telefone: account.telefone } : {}),
          },
          { auth: false },
        );
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: account.email, senha: account.senha }),
        });
        if (!loginRes.ok) {
          const e = await loginRes.json().catch(() => ({}));
          throw new Error(
            (e as { message?: string }).message ?? "Erro ao autenticar",
          );
        }
        await new Promise((r) => setTimeout(r, 80));
      }

      const bar = await api.post<{ codigo: number }>("/barbearias", {
        nome: barbearia.nome,
        slug: barbearia.slug,
      });

      const t = tenantApi(bar.codigo);

      await api.put(`/barbearias/${bar.codigo}/tema`, {
        corPrimaria: branding.cor,
      });

      // Salva horários de funcionamento
      const DIA_MAP: Record<string, number> = {
        seg: 1,
        ter: 2,
        qua: 3,
        qui: 4,
        sex: 5,
        sab: 6,
        dom: 0,
      };
      await api.put(
        `/barbearias/${bar.codigo}/horarios`,
        horarios.map((h) => ({
          diaSemana: DIA_MAP[h.key] ?? 1,
          aberto: h.aberto,
          abertura: h.abertura,
          fechamento: h.fechamento,
        })),
      );

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const accessToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("access_token="))
          ?.split("=")[1];
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
        await fetch(`${apiUrl}/barbearias/${bar.codigo}/logo`, {
          method: "POST",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            "x-barbearia-codigo": String(bar.codigo),
          },
          body: formData,
        }).catch(() => {});
      }

      await Promise.all(
        servicos
          .filter((s) => s.nome.trim().length > 0)
          .map((s) =>
            t.post("/servicos", {
              nome: s.nome,
              precoBase: s.preco,
              duracaoBase: s.duracao,
            }),
          ),
      );

      await Promise.allSettled(
        barbeiros
          .filter((b) => b.email.trim().length > 0)
          .map((b) =>
            api.post(`/barbearias/${bar.codigo}/membros`, {
              email: b.email,
              perfil: "barbeiro",
            }),
          ),
      );

      router.push("/dashboard");
    } catch (err) {
      setPublishError(
        err instanceof Error
          ? err.message
          : "Erro ao publicar. Tente novamente.",
      );
    } finally {
      setPublishing(false);
    }
  }

  const currentStep = STEPS[step - 1] ?? {
    num: 1,
    lbl: "Sua barbearia",
    hint: "Nome, slug, contato",
    time: "~ 1 min",
  };

  return (
    <div className="tqe-onboarding ob-shell" data-screen-label="01 Onboarding">
      <aside className="ob-side">
        <button
          type="button"
          className="ob-logo"
          onClick={() => router.push("/")}
        >
          <div className="ob-logo-mark">
            <Scissors size={14} strokeWidth={2.5} />
          </div>
          <span>Toqe</span>
        </button>

        <div>
          <h2 className="ob-side-title">
            Vamos botar sua barbearia
            <br />
            no ar.
          </h2>
          <p className="ob-side-sub">
            6 passos rápidos. Você pode pular o que quiser e configurar depois.
          </p>
        </div>

        <div className="ob-progress">
          {STEPS.map((item) => (
            <button
              key={item.num}
              type="button"
              className={`ob-step ${step > item.num ? "done" : step === item.num ? "active" : "upcoming"}`}
              disabled={item.num > step}
              onClick={() => go(item.num)}
            >
              <div className="num">
                {step > item.num ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span>{item.num}</span>
                )}
              </div>
              <div className="info">
                <div className="lbl">{item.lbl}</div>
                <div className="hint">{item.hint}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="ob-footer-help">
          <h4>Precisa de ajuda?</h4>
          <p>
            Time de migração disponível das 8h às 22h. Trazemos seus clientes do
            caderno pra cá em até 24h.
          </p>
          <a href="https://wa.me/" target="_blank" rel="noreferrer">
            Falar no WhatsApp <ChevronRight size={12} />
          </a>
        </div>
      </aside>

      <main className="ob-main">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            className="step-pane active"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ob-step-meta">
              <span className="tqe-ob-pill">
                {step === STEPS.length
                  ? "FINAL"
                  : `PASSO ${step} DE ${STEPS.length}`}
              </span>
              <span className="tqe-ob-time">{currentStep.time}</span>
            </div>

            {step === 1 && (
              <Passo1Conta
                data={account}
                onChange={(k, v) => setAccount((prev) => ({ ...prev, [k]: v }))}
                fieldErrors={fieldErrors}
                googleAuthed={googleAuthed}
                onGoogleSuccess={handleGoogleSuccess}
              />
            )}
            {step === 2 && (
              <Passo1
                data={barbearia}
                onChange={updateBarbearia}
                fieldErrors={fieldErrors}
              />
            )}
            {step === 3 && (
              <Passo2
                barbearia={barbearia}
                data={branding}
                onChange={updateBranding}
                logoPreview={logoPreview}
                onLogoChange={(file) => {
                  setLogoFile(file);
                  setLogoPreview(URL.createObjectURL(file));
                }}
              />
            )}
            {step === 4 && (
              <Passo3 horarios={horarios} onChange={updateHorario} />
            )}
            {step === 5 && (
              <Passo4
                servicos={servicos}
                preset={servicosPreset}
                onChangePreset={changeServicosPreset}
                onAddServico={() =>
                  setServicos((prev) => [
                    ...prev,
                    { nome: "", preco: 0, duracao: 30 },
                  ])
                }
                onUpdateServico={updateServico}
                onRemoveServico={(index) =>
                  setServicos((prev) =>
                    prev.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            )}
            {step === 6 && (
              <Passo5
                barbeiros={barbeiros}
                euSouBarbeiro={euSouBarbeiro}
                onSetEuSouBarbeiro={setEuSouBarbeiro}
                onAddBarbeiro={() =>
                  setBarbeiros((prev) => [...prev, { nome: "", email: "" }])
                }
                onUpdateBarbeiro={updateBarbeiro}
                onRemoveBarbeiro={(index) =>
                  setBarbeiros((prev) =>
                    prev.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                barbeariaNome={barbearia.nome}
                accentColor={branding.cor}
              />
            )}
            {step === 7 && (
              <Passo6
                account={account}
                barbearia={barbearia}
                horarios={horarios}
                servicos={servicos}
                barbeiros={barbeiros}
                onGo={go}
              />
            )}
          </motion.section>
        </AnimatePresence>

        <div className="ob-nav">
          <button
            type="button"
            className="tqe-ob-btn"
            disabled={step === 1}
            onClick={() => go(step - 1)}
          >
            ← Voltar
          </button>
          <div className="ob-nav-right">
            {/* Erro de publicação */}
            {publishError && (
              <div className="text-[var(--status-error)] text-[12px] max-w-[300px] text-right">
                {publishError}
              </div>
            )}
            {/* Erros genéricos por campo (serviços/barbeiros) */}
            {Object.values(fieldErrors).some(Boolean) && step >= 5 && (
              <div className="text-[var(--status-error)] text-[12px] max-w-[300px] text-right">
                {Object.values(fieldErrors)
                  .filter(Boolean)
                  .map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
              </div>
            )}
            {step !== STEPS.length && (
              <span className="tqe-ob-check-row">
                <span>●</span> Salvo automaticamente
              </span>
            )}
            <button
              type="button"
              className="tqe-ob-btn tqe-ob-btn-primary"
              onClick={handleNext}
              disabled={publishing}
              style={{
                opacity: publishing ? 0.7 : 1,
                cursor: publishing ? "not-allowed" : "pointer",
              }}
            >
              {publishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Publicando...
                </>
              ) : step === STEPS.length ? (
                "Publicar barbearia"
              ) : (
                "Continuar →"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
