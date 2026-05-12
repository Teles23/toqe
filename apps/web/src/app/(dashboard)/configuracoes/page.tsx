"use client";

import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Check,
  Zap,
  Phone,
  Mail,
  MapPin,
  Camera,
  Smartphone,
} from "lucide-react";

/* ── Seções do menu lateral ── */
const SECOES = [
  { id: "barbearia", label: "Barbearia", icon: Store },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "plano", label: "Plano & Fatura", icon: CreditCard },
  { id: "seguranca", label: "Segurança", icon: Shield },
];

/* ── Toggle switch ── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-all duration-200"
      style={{
        width: 36,
        height: 20,
        background: checked ? "var(--status-success)" : "var(--border-strong)",
      }}
    >
      <motion.span
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 rounded-full"
        style={{ width: 16, height: 16, background: "#fff", left: 0 }}
      />
    </button>
  );
}

/* ── Row de configuração ── */
function ConfigRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="block text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
        {desc && (
          <span
            className="block text-[11px] mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {desc}
          </span>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ── Seção: Barbearia ── */
function SecaoBarbearia(): React.JSX.Element {
  const [nome, setNome] = useState("Barbearia Urban");
  const [tel, setTel] = useState("(71) 99999-0000");
  const [email, setEmail] = useState("contato@urbanbarbearia.com");
  const [end, setEnd] = useState("Rua das Flores, 123 - Salvador, BA");
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
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
          Informações da barbearia
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Dados públicos exibidos para os clientes no app.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="relative flex items-center justify-center rounded-2xl font-bold text-2xl flex-shrink-0"
          style={{
            width: 72,
            height: 72,
            background: "rgba(244,180,0,0.1)",
            color: "var(--primary)",
            border: "1px solid rgba(244,180,0,0.2)",
            fontFamily: "var(--font-heading)",
          }}
        >
          UB
          <button
            className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
            style={{
              width: 22,
              height: 22,
              background: "var(--primary)",
              color: "#0D0D0D",
              transform: "translate(4px, 4px)",
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
          >
            Alterar foto
          </button>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        {[
          {
            label: "Nome da barbearia",
            icon: Store,
            value: nome,
            set: setNome,
          },
          { label: "Telefone", icon: Phone, value: tel, set: setTel },
          { label: "E-mail", icon: Mail, value: email, set: setEmail },
          { label: "Endereço", icon: MapPin, value: end, set: setEnd },
        ].map(({ label, icon: Icon, value, set }) => (
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
                  set(e.target.value)
                }
                className="tqe-input"
                style={{ paddingLeft: 30 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Salvar */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={salvar}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px]"
        style={{ background: "var(--primary)", color: "#0D0D0D" }}
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
              Salvar alterações
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

/* ── Seção: Horários ── */
function SecaoHorarios(): React.JSX.Element {
  const DIAS = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
  ];
  const [horarios, setHorarios] = useState(
    DIAS.map((d, i) => ({
      dia: d,
      aberto: i < 6,
      abertura: i < 5 ? "08:00" : "09:00",
      fechamento: i < 6 ? "18:00" : "16:00",
    })),
  );

  function toggle(idx: number) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, aberto: !h.aberto } : h)),
    );
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
          Horários de funcionamento
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Configure os dias e horários que a barbearia funciona.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        {horarios.map((h, i) => (
          <div
            key={h.dia}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              borderBottom:
                i < horarios.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
              background: h.aberto ? "transparent" : "rgba(255,255,255,0.01)",
              opacity: h.aberto ? 1 : 0.5,
              transition: "opacity 200ms",
            }}
          >
            <Toggle checked={h.aberto} onChange={() => toggle(i)} />

            <span
              className="text-[13px] font-medium flex-shrink-0"
              style={{ width: 80, color: "var(--text-primary)" }}
            >
              {h.dia}
            </span>

            {h.aberto ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={h.abertura}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHorarios((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, abertura: e.target.value } : x,
                      ),
                    )
                  }
                  style={{
                    height: 30,
                    padding: "0 8px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  até
                </span>
                <input
                  type="time"
                  value={h.fechamento}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHorarios((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, fechamento: e.target.value } : x,
                      ),
                    )
                  }
                  style={{
                    height: 30,
                    padding: "0 8px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
              </div>
            ) : (
              <span
                className="text-[12px] flex-1"
                style={{ color: "var(--text-muted)" }}
              >
                Fechado
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px]"
        style={{ background: "var(--primary)", color: "#0D0D0D" }}
      >
        Salvar horários
      </button>
    </div>
  );
}

/* ── Seção: Notificações ── */
function SecaoNotificacoes(): React.JSX.Element {
  const [configs, setConfigs] = useState({
    novoAgendamento: true,
    cancelamento: true,
    lembreteCliente: true,
    lembreteInternos: false,
    relatorioDiario: true,
    clienteNovo: true,
    avaliacaoRecebida: false,
    pagamentoRecebido: true,
  });

  const toggle = (key: keyof typeof configs) =>
    setConfigs((prev) => ({ ...prev, [key]: !prev[key] }));

  const grupos = [
    {
      titulo: "Agendamentos",
      items: [
        {
          key: "novoAgendamento" as const,
          label: "Novo agendamento",
          desc: "Quando um cliente agenda pelo app",
        },
        {
          key: "cancelamento" as const,
          label: "Cancelamento",
          desc: "Quando um agendamento é cancelado",
        },
        {
          key: "lembreteCliente" as const,
          label: "Lembrete para cliente",
          desc: "30min antes do horário agendado",
        },
        {
          key: "lembreteInternos" as const,
          label: "Lembrete interno",
          desc: "Notifica a equipe antes do expediente",
        },
      ],
    },
    {
      titulo: "Operação",
      items: [
        {
          key: "relatorioDiario" as const,
          label: "Relatório diário",
          desc: "Resumo do dia enviado à noite",
        },
        {
          key: "clienteNovo" as const,
          label: "Cliente novo",
          desc: "Primeiro agendamento de um cliente",
        },
        {
          key: "avaliacaoRecebida" as const,
          label: "Avaliação recebida",
          desc: "Quando um cliente avalia o serviço",
        },
        {
          key: "pagamentoRecebido" as const,
          label: "Pagamento confirmado",
          desc: "Confirmação de pagamento via app",
        },
      ],
    },
  ];

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
          Notificações
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Controle quais eventos geram alertas para você e sua equipe.
        </p>
      </div>

      {grupos.map((grupo) => (
        <div
          key={grupo.titulo}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <div
            className="px-4 py-2.5"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {grupo.titulo}
            </span>
          </div>
          {grupo.items.map((item, i) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-4 py-3.5 gap-4"
              style={{
                borderBottom:
                  i < grupo.items.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              <div>
                <span
                  className="block text-[13px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </span>
              </div>
              <Toggle
                checked={configs[item.key]}
                onChange={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Seção: Plano ── */
function SecaoPlano(): React.JSX.Element {
  const planos = [
    {
      id: "basic",
      nome: "Basic",
      preco: 49,
      atual: false,
      features: [
        "1 barbearia",
        "Até 2 barbeiros",
        "50 agend./mês",
        "Suporte por e-mail",
      ],
    },
    {
      id: "pro",
      nome: "Pro",
      preco: 99,
      atual: true,
      features: [
        "1 barbearia",
        "Até 10 barbeiros",
        "Agendamentos ilimitados",
        "WhatsApp + SMS",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
    },
    {
      id: "enterprise",
      nome: "Enterprise",
      preco: 249,
      atual: false,
      features: [
        "Múltiplas unidades",
        "Barbeiros ilimitados",
        "White-label",
        "API pública",
        "Gerente de conta dedicado",
      ],
    },
  ];

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
          Plano & Faturamento
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Gerencie sua assinatura e dados de pagamento.
        </p>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {planos.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -2 }}
            className="rounded-xl p-4 relative overflow-hidden cursor-pointer"
            style={{
              background: p.atual
                ? "rgba(244,180,0,0.04)"
                : "var(--bg-secondary)",
              border: `1px solid ${p.atual ? "rgba(244,180,0,0.3)" : "var(--border-default)"}`,
              boxShadow: p.atual ? "0 0 20px rgba(244,180,0,0.08)" : "none",
              transition: "all 180ms",
            }}
          >
            {/* Acento no topo */}
            <div
              className="absolute top-0 left-3 right-3 rounded-b"
              style={{
                height: 2,
                background: p.atual
                  ? "var(--primary)"
                  : "var(--border-default)",
                opacity: p.atual ? 0.8 : 0.3,
              }}
            />

            {p.atual && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3"
                style={{
                  background: "rgba(244,180,0,0.15)",
                  color: "var(--primary)",
                }}
              >
                <Zap size={9} /> Plano atual
              </span>
            )}

            <span
              className="block font-bold text-[16px] mb-0.5"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              {p.nome}
            </span>
            <div className="flex items-baseline gap-1 mb-4">
              <span
                className="font-bold text-[22px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: p.atual ? "var(--primary)" : "var(--text-primary)",
                  letterSpacing: "-0.04em",
                }}
              >
                R${p.preco}
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                /mês
              </span>
            </div>

            <ul className="space-y-1.5 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check
                    size={11}
                    style={{
                      color: p.atual
                        ? "var(--primary)"
                        : "var(--status-success)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {!p.atual && (
              <button
                className="w-full py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                {p.preco > 99 ? "Falar com vendas" : "Fazer upgrade"}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Próxima fatura */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div>
          <span
            className="block text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Próxima fatura
          </span>
          <span
            className="text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            R$ 99,00 em 01/06/2025 · Cartão ···· 4242
          </span>
        </div>
        <button
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
          style={{
            background: "transparent",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          Gerenciar
        </button>
      </div>
    </div>
  );
}

/* ── Seção: Segurança ── */
function SecaoSeguranca(): React.JSX.Element {
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  const [twoFa, setTwoFa] = useState(false);
  const [sessoes] = useState([
    { dispositivo: "Chrome · Salvador, BA", ultimo: "Agora", atual: true },
    { dispositivo: "Safari · iPhone 15", ultimo: "1h atrás", atual: false },
    { dispositivo: "Firefox · São Paulo, SP", ultimo: "3 dias", atual: false },
  ]);

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
          Segurança
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Gerencie sua senha e as sessões ativas.
        </p>
      </div>

      {/* Alterar senha */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-4 py-2.5"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
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
              />
            </div>
          ))}
          <button
            className="px-4 py-2 rounded-lg text-[12px] font-semibold mt-1"
            style={{ background: "var(--primary)", color: "#0D0D0D" }}
          >
            Alterar senha
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-4 py-2.5"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Autenticação
          </span>
        </div>
        <div className="px-4 py-3">
          <ConfigRow
            label="Autenticação de dois fatores"
            desc={
              twoFa
                ? "Ativado — via app autenticador"
                : "Adiciona uma camada extra de segurança"
            }
          >
            <Toggle checked={twoFa} onChange={setTwoFa} />
          </ConfigRow>
        </div>
      </div>

      {/* Sessões */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Sessões ativas
          </span>
          <button
            className="text-[11px] font-medium"
            style={{ color: "var(--status-error)" }}
          >
            Encerrar todas
          </button>
        </div>
        {sessoes.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 gap-3"
            style={{
              borderBottom:
                i < sessoes.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  background: s.atual
                    ? "rgba(29,185,84,0.1)"
                    : "var(--bg-hover)",
                  color: s.atual
                    ? "var(--status-success)"
                    : "var(--text-muted)",
                }}
              >
                <Smartphone size={14} />
              </div>
              <div>
                <span
                  className="block text-[12px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.dispositivo}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.atual ? "Esta sessão" : s.ultimo}
                </span>
              </div>
            </div>
            {!s.atual && (
              <button
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background: "rgba(255,77,79,0.08)",
                  color: "var(--status-error)",
                  border: "1px solid rgba(255,77,79,0.15)",
                }}
              >
                Encerrar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function Configuracoes(): React.JSX.Element {
  const [secaoAtiva, setSecaoAtiva] = useState("barbearia");

  const CONTEUDO: Record<string, React.ReactNode> = {
    barbearia: <SecaoBarbearia />,
    horarios: <SecaoHorarios />,
    notificacoes: <SecaoNotificacoes />,
    plano: <SecaoPlano />,
    seguranca: <SecaoSeguranca />,
  };

  return (
    <div
      className="max-w-5xl mx-auto flex rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border-default)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Menu lateral */}
      <div
        className="flex-shrink-0 py-4"
        style={{
          width: 200,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="block px-4 pb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Configurações
        </span>

        {SECOES.map((s) => {
          const Icon = s.icon;
          const ativa = secaoAtiva === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(s.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 relative"
              style={{
                background: ativa ? "var(--bg-card)" : "transparent",
                borderLeft: `2px solid ${ativa ? "var(--primary)" : "transparent"}`,
                color: ativa ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "all 150ms",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!ativa)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-hover)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!ativa)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <Icon size={15} strokeWidth={ativa ? 2.2 : 1.8} />
              <span className="text-[13px] font-medium">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--bg-card)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={secaoAtiva}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="p-6"
          >
            {CONTEUDO[secaoAtiva]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
