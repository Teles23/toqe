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
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBarbeariaSchema,
  createServicoSchema,
  convidarMembroSchema,
  registerSchema,
} from "@toqe/contracts";
import { api, tenantApi } from "@/shared/api/api-client";
import { getInitial } from "@/shared/lib/utils";

interface AccountData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

interface BarbeariaData {
  nome: string;
  slug: string;
  cidade: string;
  telefone: string;
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
}: {
  data: AccountData;
  onChange: (key: keyof AccountData, value: string) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <h1 className="ob-h1">Primeiro, cria sua conta.</h1>
      <p className="ob-h1-sub">
        É rápido. Em seguida você configura tudo da barbearia.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Seu nome completo</label>
          <input
            type="text"
            value={data.nome}
            onChange={(e) => onChange("nome", e.target.value)}
            placeholder="João Silva"
            autoComplete="name"
          />
        </div>

        <div className="ob-field">
          <label>E-mail</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="joao@barbearia.com"
            autoComplete="email"
          />
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
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
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
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="help">
          Ao criar sua conta, você concorda com os{" "}
          <a href="#" style={{ color: "var(--status-info)" }}>
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" style={{ color: "var(--status-info)" }}>
            Política de Privacidade
          </a>
          .
        </div>
      </div>
    </>
  );
}

function Passo1({
  data,
  onChange,
}: {
  data: BarbeariaData;
  onChange: (key: keyof BarbeariaData, value: string) => void;
}) {
  const slugDisponivel = data.slug.length > 2;

  function normalizeSlug(value: string) {
    onChange(
      "slug",
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 28),
    );
  }

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
            onChange={(event) => onChange("nome", event.target.value)}
            placeholder="Ex: Barba do Zé"
          />
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
              onChange={(event) => onChange("telefone", event.target.value)}
              placeholder="(00) 00000-0000"
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
            />
          </div>
          <div className="help">
            <span
              style={{ color: slugDisponivel ? "var(--green)" : "var(--red)" }}
            >
              ●
            </span>{" "}
            {slugDisponivel ? "Disponível" : "Escolha um slug maior"} · seus
            clientes vão ver{" "}
            <span
              style={{ color: "var(--accent)", fontFamily: "JetBrains Mono" }}
            >
              toqe.app/{data.slug || "sua-barbearia"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function Passo2({
  barbearia,
  data,
  onChange,
}: {
  barbearia: BarbeariaData;
  data: BrandingData;
  onChange: (key: keyof BrandingData, value: string) => void;
}) {
  const initial = getInitial(barbearia.nome, "B");

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
          <button type="button" className="logo-dropzone">
            <span className="logo-dropzone-icon">
              <Camera size={22} />
            </span>
            <strong>Arraste seu logo aqui ou clique para escolher</strong>
            <small>PNG ou SVG · até 2MB · ideal: quadrado 512x512</small>
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
              }}
            >
              {initial}
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
          <div className="svc-list">
            {servicos.map((servico, index) => (
              <div key={index} className="svc-row">
                <input
                  value={servico.nome}
                  onChange={(event) =>
                    onUpdateServico(index, "nome", event.target.value)
                  }
                  placeholder="Nome do serviço"
                />
                <input
                  value={servico.preco}
                  onChange={(event) =>
                    onUpdateServico(index, "preco", Number(event.target.value))
                  }
                  placeholder="0"
                  type="number"
                  aria-label="Preço"
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

function Passo5({
  barbeiros,
  onAddBarbeiro,
  onUpdateBarbeiro,
  onRemoveBarbeiro,
}: {
  barbeiros: BarbeiroData[];
  onAddBarbeiro: () => void;
  onUpdateBarbeiro: (
    index: number,
    key: keyof BarbeiroData,
    value: string,
  ) => void;
  onRemoveBarbeiro: (index: number) => void;
}) {
  const [isBarbeiro, setIsBarbeiro] = useState(true);

  return (
    <>
      <h1 className="ob-h1">Quem mais corta com você?</h1>
      <p className="ob-h1-sub">
        Convide os barbeiros pelo e-mail. Eles recebem um link mágico, sem
        precisar de senha pra começar.
      </p>

      <div className="ob-form">
        <div className="ob-field">
          <label>Você mesmo é barbeiro?</label>
          <div className="pick-grid pick-grid-2">
            <button
              type="button"
              className={`pick ${isBarbeiro ? "sel" : ""}`}
              onClick={() => setIsBarbeiro(true)}
            >
              <div className="pick-icon">●</div>
              <div className="pick-body">
                <div className="pick-title">Sim, atendo na cadeira</div>
                <div className="pick-desc">
                  Você aparece na agenda como barbeiro
                </div>
              </div>
              {isBarbeiro && (
                <span className="pick-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
            <button
              type="button"
              className={`pick ${!isBarbeiro ? "sel" : ""}`}
              onClick={() => setIsBarbeiro(false)}
            >
              <div className="pick-icon">○</div>
              <div className="pick-body">
                <div className="pick-title">Não, só administro</div>
                <div className="pick-desc">Só vê o painel, não atende</div>
              </div>
              {!isBarbeiro && (
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
                <div className="barber-avatar">{getInitial(barbeiro.nome)}</div>
                <input
                  value={barbeiro.nome}
                  onChange={(event) =>
                    onUpdateBarbeiro(index, "nome", event.target.value)
                  }
                  placeholder="Nome do barbeiro"
                />
                <input
                  value={barbeiro.email}
                  onChange={(event) =>
                    onUpdateBarbeiro(index, "email", event.target.value)
                  }
                  placeholder="email@dominio.com"
                  type="email"
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
      </div>
    </>
  );
}

function Passo6({
  barbearia,
  branding,
  horarios,
  servicos,
  barbeiros,
  onGo,
}: {
  barbearia: BarbeariaData;
  branding: BrandingData;
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
            Barbearia{" "}
            <button type="button" className="edit" onClick={() => onGo(1)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Nome</span>
            <span className="v">{barbearia.nome || "-"}</span>
          </div>
          <div className="summary-line">
            <span className="k">Cidade</span>
            <span className="v">{barbearia.cidade || "-"}</span>
          </div>
          <div className="summary-line">
            <span className="k">Link</span>
            <span className="v">toqe.app/{barbearia.slug || "-"}</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>
            Identidade{" "}
            <button type="button" className="edit" onClick={() => onGo(2)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Cor de marca</span>
            <span className="v color-summary">
              <span style={{ background: branding.cor }} />
              {branding.cor}
            </span>
          </div>
          <div className="summary-line">
            <span className="k">Logotipo</span>
            <span className="v muted">não enviado · usaremos inicial</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>
            Funcionamento{" "}
            <button type="button" className="edit" onClick={() => onGo(3)}>
              editar
            </button>
          </h4>
          {diasAbertos.slice(0, 3).map((horario) => (
            <div key={horario.key} className="summary-line">
              <span className="k">{horario.label}</span>
              <span className="v">
                {horario.abertura} - {horario.fechamento}
              </span>
            </div>
          ))}
        </div>

        <div className="summary-card">
          <h4>
            Serviços e equipe{" "}
            <button type="button" className="edit" onClick={() => onGo(4)}>
              editar
            </button>
          </h4>
          <div className="summary-line">
            <span className="k">Serviços</span>
            <span className="v">{servicos.length} cadastrados</span>
          </div>
          <div className="summary-line">
            <span className="k">Barbeiros</span>
            <span className="v">{barbeiros.length} convidados</span>
          </div>
          <div className="summary-line">
            <span className="k">Plano</span>
            <span className="v accent">Free · 30 dias do Basic grátis</span>
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
            <span>toqe.app/{barbearia.slug || "urban"}</span> fica acessível e
            seus clientes já podem agendar.
          </p>
        </div>
      </div>
    </>
  );
}

export default function Onboarding(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [account, setAccount] = useState<AccountData>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [barbearia, setBarbearia] = useState<BarbeariaData>({
    nome: "Barbearia Urban",
    slug: "urban",
    cidade: "Salvador, BA",
    telefone: "(71) 99999-0000",
  });
  const [branding, setBranding] = useState<BrandingData>({ cor: "#F4B400" });
  const [horarios, setHorarios] = useState<HorarioData[]>(DIAS_HORARIOS);
  const [servicosPreset, setServicosPreset] = useState<ServicoPreset>("basic");
  const [servicos, setServicos] = useState<ServicoData[]>(
    PRESETS_SERVICOS.basic,
  );
  const [barbeiros, setBarbeiros] = useState<BarbeiroData[]>([
    { nome: "Carlos Lima", email: "carlos@urban.com.br" },
    { nome: "Felipe Souza", email: "felipe@urban.com.br" },
  ]);

  function go(nextStep: number) {
    if (nextStep >= 1 && nextStep <= STEPS.length) {
      setStep(nextStep);
      document.querySelector(".ob-main")?.scrollIntoView({ block: "start" });
    }
  }

  function updateBarbearia(key: keyof BarbeariaData, value: string) {
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
    setStepErrors([]);
    setPublishError("");

    // ── Validação por step ──────────────────────────────────────────────────

    // Step 1 — Criar conta
    if (step === 1) {
      const result = registerSchema.safeParse({
        nome: account.nome,
        email: account.email,
        senha: account.senha,
      });
      if (!result.success) {
        setStepErrors(result.error.issues.map((i) => i.message));
        return;
      }
      if (account.senha !== account.confirmarSenha) {
        setStepErrors(["As senhas não conferem"]);
        return;
      }
    }

    // Step 2 — Barbearia
    if (step === 2) {
      const result = createBarbeariaSchema.safeParse({
        nome: barbearia.nome,
        slug: barbearia.slug,
      });
      if (!result.success) {
        setStepErrors(result.error.issues.map((i) => i.message));
        return;
      }
    }

    // Step 5 — Serviços
    if (step === 5) {
      const erros: string[] = [];
      servicos.forEach((s, idx) => {
        const r = createServicoSchema.safeParse({
          nome: s.nome,
          precoBase: s.preco,
          duracaoBase: s.duracao,
        });
        if (!r.success)
          r.error.issues.forEach((i) =>
            erros.push(`Serviço ${idx + 1}: ${i.message}`),
          );
      });
      if (erros.length > 0) {
        setStepErrors(erros);
        return;
      }
    }

    // Step 6 — Equipe
    if (step === 6) {
      const erros: string[] = [];
      barbeiros.forEach((b, idx) => {
        if (!b.email) return;
        const r = convidarMembroSchema.safeParse({
          email: b.email,
          perfil: "barbeiro",
        });
        if (!r.success)
          r.error.issues.forEach((i) =>
            erros.push(`Barbeiro ${idx + 1}: ${i.message}`),
          );
      });
      if (erros.length > 0) {
        setStepErrors(erros);
        return;
      }
    }

    // Avança para o próximo step
    if (step < STEPS.length) {
      go(step + 1);
      return;
    }

    // ── Step 7 — Publicar ──────────────────────────────────────────────────
    setPublishing(true);
    try {
      // 1. Criar conta na API
      await api.post(
        "/auth/register",
        {
          nome: account.nome,
          email: account.email,
          senha: account.senha,
        },
        { auth: false },
      );

      // 2. Login via BFF → seta cookies httpOnly
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

      // Aguarda o cookie ser setado antes da próxima requisição
      await new Promise((r) => setTimeout(r, 80));

      // 3. Criar barbearia
      const bar = await api.post<{ codigo: number }>("/barbearias", {
        nome: barbearia.nome,
        slug: barbearia.slug,
      });

      const t = tenantApi(bar.codigo);

      // 4. Branding — cor de marca
      await api.put(`/barbearias/${bar.codigo}/tema`, {
        corPrimaria: branding.cor,
      });

      // 5. Serviços (em paralelo)
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

      // 6. Convites de equipe (opcional — erros individuais não bloqueiam)
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
              />
            )}
            {step === 2 && (
              <Passo1 data={barbearia} onChange={updateBarbearia} />
            )}
            {step === 3 && (
              <Passo2
                barbearia={barbearia}
                data={branding}
                onChange={updateBranding}
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
                onAddBarbeiro={() =>
                  setBarbeiros((prev) => [...prev, { nome: "", email: "" }])
                }
                onUpdateBarbeiro={updateBarbeiro}
                onRemoveBarbeiro={(index) =>
                  setBarbeiros((prev) =>
                    prev.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            )}
            {step === 7 && (
              <Passo6
                barbearia={barbearia}
                branding={branding}
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
              <div
                style={{
                  color: "var(--status-error)",
                  fontSize: 12,
                  maxWidth: 300,
                  textAlign: "right",
                }}
              >
                {publishError}
              </div>
            )}
            {/* Erros de validação Zod do step atual */}
            {stepErrors.length > 0 && (
              <div
                style={{
                  color: "var(--status-error)",
                  fontSize: 12,
                  maxWidth: 300,
                  textAlign: "right",
                }}
              >
                {stepErrors.map((e, i) => (
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
