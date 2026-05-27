"use client";

import React from "react";
import {
  type LucideIcon,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  Menu,
  Scissors,
  Smartphone,
  Star,
  Users,
  X,
  Zap,
  Play,
  TrendingUp,
  Network,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

/* ── Contador animado ── */
function CountUp({
  to,
  suffix = "",
}: {
  to: number;
  suffix?: string;
}): React.JSX.Element {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const p = Math.min((Date.now() - start) / 1400, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 3)) * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {count.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

/* ── Live ticking value ── */
function useLiveValue(start: number, increment: number, intervalMs = 3500) {
  const [val, setVal] = useState(start);
  useEffect(() => {
    const id = setInterval(
      () => setVal((prev) => prev + increment),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [increment, intervalMs]);
  return val;
}

/* ── Live Console (hero right panel) ── */
function LiveConsole(): React.JSX.Element {
  const fatHoje = useLiveValue(2840, 35, 3500);
  const chairs = [
    {
      name: "Carlos R.",
      client: "João Silva · Corte degradê",
      start: "09:42",
      status: "active",
      progress: 65,
    },
    {
      name: "Lucas M.",
      client: "Ana Costa · Sobrancelha",
      start: "09:55",
      status: "active",
      progress: 30,
    },
    {
      name: "Felipe B.",
      client: "Próximo: Pedro · 10:30",
      start: "—",
      status: "idle",
      progress: 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[18px] overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(244,180,0,0.04)",
      }}
    >
      {/* Amber accent top line */}
      <div
        className="absolute top-0 left-6 right-6 rounded-b"
        style={{ height: 2, background: "var(--primary)", opacity: 0.6 }}
      />
      {/* Console header */}
      <div
        className="flex items-center gap-3 px-4 h-[44px]"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        <div className="flex gap-1.5">
          {(
            [
              "var(--status-error)",
              "var(--status-warning)",
              "var(--status-success)",
            ] as const
          ).map((c, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{ width: 10, height: 10, background: c, opacity: 0.5 }}
            />
          ))}
        </div>
        <span
          className="ml-3 text-[11px]"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          app.toqe.com/dashboard
        </span>
        <span
          className="ml-auto flex items-center gap-1.5 text-[10px] font-medium"
          style={{
            color: "var(--status-success)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--status-success)",
              animation: "tqe-pulse-green 1.5s ease-in-out infinite",
            }}
          />
          AO VIVO
        </span>
      </div>

      {/* KPI row */}
      <div className="p-4 flex flex-col gap-3.5">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Fat. hoje",
              value: "R$ " + fatHoje.toLocaleString("pt-BR"),
              color: "var(--status-success)",
              delta: "+12% vs ontem",
            },
            {
              label: "Agend.",
              value: "14",
              color: "var(--status-info)",
              delta: "3 confirmados",
            },
            {
              label: "Ticket",
              value: "R$ 63",
              color: "var(--text-primary)",
              delta: "+R$4",
            },
            {
              label: "Avaliação",
              value: "4.8★",
              color: "var(--primary)",
              delta: "32 avaliações",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-2.5 relative overflow-hidden"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1.5"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {kpi.label}
              </div>
              <div
                className="font-bold text-[15px] leading-none"
                style={{
                  color: kpi.color,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.03em",
                }}
              >
                {kpi.value}
              </div>
              <div
                className="mt-1.5 flex items-center gap-1 text-[10px]"
                style={{
                  color: "var(--status-success)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <TrendingUp size={8} strokeWidth={2} />
                {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Chairs */}
        <div className="flex flex-col gap-1.5">
          <div
            className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-0.5"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>Cadeiras · agora</span>
            <span
              className="px-1.5 py-0.5 rounded"
              style={{
                background: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
            >
              2 / 3 ativas
            </span>
          </div>
          {chairs.map((c) => (
            <div
              key={c.name}
              className="rounded-[10px] px-3 py-2 flex items-center gap-2.5 relative overflow-hidden"
              style={{
                background:
                  c.status === "active"
                    ? "rgba(29,185,84,0.03)"
                    : "var(--bg-base)",
                border: `1px solid ${c.status === "active" ? "rgba(29,185,84,0.28)" : "var(--border-default)"}`,
              }}
            >
              {c.status === "active" && (
                <div
                  className="absolute left-0 top-2 bottom-2 rounded-r"
                  style={{
                    width: 2,
                    background: "var(--status-success)",
                    animation: "tqe-sidebar-pulse 2s ease-in-out infinite",
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.1em",
                      background:
                        c.status === "active"
                          ? "rgba(29,185,84,0.12)"
                          : "var(--bg-hover)",
                      color:
                        c.status === "active"
                          ? "var(--status-success)"
                          : "var(--text-muted)",
                    }}
                  >
                    {c.status === "active" ? "OCUPADO" : "LIVRE"}
                  </span>
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.client}
                </div>
                {c.status === "active" && (
                  <div
                    className="mt-1.5 h-[3px] rounded-full overflow-hidden"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.progress}%`,
                        background: "var(--status-success)",
                      }}
                    />
                  </div>
                )}
              </div>
              <div
                className="text-[11px] flex-shrink-0"
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {c.start}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Marquee de eventos ── */
function Marquee(): React.JSX.Element {
  const events = [
    { city: "SSA", text: "Carlos finalizou corte", amount: "R$ 45" },
    { city: "FOR", text: "Novo agendamento confirmado", amount: "+1" },
    { city: "REC", text: "Pedro avaliou Lucas", amount: "5.0★" },
    { city: "SP", text: "Bruna chegou para 14:30", amount: "on-time" },
    { city: "RJ", text: "Marca atingiu meta diária", amount: "R$ 1.200" },
    { city: "BSB", text: "Renan abriu a barbearia", amount: "08:00" },
    { city: "CWB", text: "Fim de turno · Maurício", amount: "17 cortes" },
  ];
  const items = [...events, ...events];

  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
        padding: "14px 0",
      }}
    >
      <div
        className="flex gap-14 whitespace-nowrap"
        style={{
          animation: "tqe-marquee 40s linear infinite",
          width: "max-content",
        }}
      >
        {items.map((e, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              {e.city}
            </span>
            <span
              className="text-[12px]"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {e.text}
            </span>
            <span
              className="text-[12px] font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {e.amount}
            </span>
            <span
              className="rounded-full"
              style={{
                width: 4,
                height: 4,
                background: "var(--border-strong)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  delay,
  num,
  live,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  delay: number;
  num: string;
  live: string;
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl flex flex-col gap-3.5 min-h-[220px]"
      style={{
        padding: "28px 24px 24px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        transition: "border-color 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-strong)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 32px ${color}12`;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Icon + number */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: `${color}14`,
            color,
            border: `1px solid ${color}33`,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <span
          className="text-[10px]"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
          }}
        >
          {num}
        </span>
      </div>

      <h3
        className="font-bold text-[17px] leading-[1.2]"
        style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.025em" }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] leading-[1.6]"
        style={{ color: "var(--text-secondary)" }}
      >
        {desc}
      </p>

      {/* Live stat footer */}
      <div
        className="mt-auto pt-3.5 flex items-center gap-2 text-[11px]"
        style={{
          borderTop: "1px dashed var(--border-default)",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{
            width: 5,
            height: 5,
            background: "var(--status-success)",
            animation: "tqe-pulse-green 1.5s ease-in-out infinite",
          }}
        />
        {live}
      </div>
    </motion.div>
  );
}

/* ── Plan card ── */
function PlanCard({
  nome,
  preco,
  features,
  destaque,
  delay,
  desc,
}: {
  nome: string;
  preco: number;
  features: string[];
  destaque?: boolean;
  delay: number;
  desc: string;
}): React.JSX.Element {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="relative rounded-[18px] flex flex-col gap-5"
      style={{
        padding: "28px 24px",
        background: destaque
          ? "linear-gradient(180deg, rgba(244,180,0,0.04) 0%, var(--bg-card) 50%)"
          : "var(--bg-card)",
        border: `1px solid ${destaque ? "rgba(244,180,0,0.3)" : "var(--border-default)"}`,
        boxShadow: destaque ? "0 0 60px rgba(244,180,0,0.06)" : "none",
      }}
    >
      {destaque && (
        <div
          className="absolute top-[-10px] right-6 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: "var(--primary)",
            color: "var(--primary-on)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
          }}
        >
          MAIS POPULAR
        </div>
      )}

      <div
        className="text-[12px] uppercase tracking-widest"
        style={{
          color: destaque ? "var(--primary)" : "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.18em",
        }}
      >
        {nome}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className="font-bold leading-none"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 44,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
          }}
        >
          R$ {preco}
        </span>
        <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>
          /mês
        </span>
      </div>

      <p
        className="text-[13px] leading-[1.6]"
        style={{ color: "var(--text-secondary)" }}
      >
        {desc}
      </p>

      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              className="flex-shrink-0 rounded-full flex items-center justify-center mt-0.5"
              style={{
                width: 16,
                height: 16,
                background: destaque
                  ? "rgba(244,180,0,0.12)"
                  : "rgba(29,185,84,0.12)",
                color: destaque ? "var(--primary)" : "var(--status-success)",
              }}
            >
              <CheckCircle size={10} strokeWidth={2.8} />
            </span>
            <span
              className="text-[13px]"
              style={{ color: "var(--text-secondary)", lineHeight: 1.55 }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/onboarding")}
        className="h-11 rounded-xl text-[13px] font-semibold"
        style={{
          background: destaque ? "var(--primary)" : "transparent",
          color: destaque ? "#0D0D0D" : "var(--text-primary)",
          border: destaque ? "none" : "1px solid var(--border-strong)",
          boxShadow: destaque ? "0 6px 18px rgba(244,180,0,0.2)" : "none",
        }}
      >
        {destaque ? "Começar 14 dias grátis" : "Selecionar plano"}
      </motion.button>
    </motion.div>
  );
}

/* ── Depoimento ── */
function Depoimento({
  nome,
  barbearia,
  texto,
  avaliacao,
  delay,
}: {
  nome: string;
  barbearia: string;
  texto: string;
  avaliacao: number;
  delay: number;
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl flex flex-col gap-5"
      style={{
        padding: "28px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: avaliacao }).map((_, i) => (
          <Star
            key={i}
            size={13}
            fill="var(--primary)"
            color="var(--primary)"
            strokeWidth={1}
          />
        ))}
      </div>
      <p
        className="font-medium leading-[1.4]"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 17,
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;{texto}&rdquo;
      </p>
      <div className="flex items-center gap-3 mt-auto">
        <div
          className="flex items-center justify-center rounded-full font-bold"
          style={{
            width: 38,
            height: 38,
            background: "rgba(244,180,0,0.1)",
            color: "var(--primary)",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {nome[0]}
        </div>
        <div>
          <span
            className="block text-[13px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {nome}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {barbearia}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing(): React.JSX.Element {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -40]);

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 30)), [scrollY]);

  const FEATURES = [
    {
      icon: Calendar,
      color: "var(--status-info)",
      title: "Agenda viva",
      desc: "Quem chegou, quem ainda vem, quem está atrasado. Conflitos são bloqueados antes de acontecer.",
      num: "02 / 07",
      live: "Próximo: 10:30 · Pedro",
    },
    {
      icon: Zap,
      color: "var(--status-warning)",
      title: "Painel ao vivo",
      desc: "A cadeira do Carlos pisca verde quando está atendendo. Verde apagado quando está livre. Não tem mistério.",
      num: "03 / 07",
      live: "2 / 3 cadeiras ativas",
    },
    {
      icon: Smartphone,
      color: "var(--status-success)",
      title: "App do cliente",
      desc: "Em 20 segundos: serviço, barbeiro, horário, confirmação. Sem WhatsApp, sem ligação, sem ruído.",
      num: "04 / 07",
      live: "94% agendam sem pedir ajuda",
    },
    {
      icon: BarChart3,
      color: "#C084FC",
      title: "Números honestos",
      desc: "Faturamento por serviço, por barbeiro, por dia. Decisões deixam de ser achismo.",
      num: "05 / 07",
      live: "Quinta é o pior dia · ↓18%",
    },
    {
      icon: Users,
      color: "var(--status-error)",
      title: "Equipe organizada",
      desc: "Cada barbeiro com seu histórico, seus horários, sua avaliação. Você gerencia gente, não papel.",
      num: "06 / 07",
      live: "Lucas: 4.9★ · 142 cortes/mês",
    },
    {
      icon: Network,
      color: "var(--status-info)",
      title: "Multi-barbearia",
      desc: "Várias unidades? Uma rede? Cada uma com seus dados isolados, todas no mesmo painel.",
      num: "07 / 07",
      live: "3 unidades · sincronizadas",
    },
  ];

  const PLANOS = [
    {
      nome: "Básico",
      preco: 49,
      desc: "Para quem está começando ou tem uma operação enxuta.",
      features: [
        "1 barbearia",
        "Até 2 barbeiros",
        "50 agendamentos/mês",
        "App para clientes",
        "Suporte por e-mail",
      ],
    },
    {
      nome: "Pro",
      preco: 99,
      destaque: true,
      desc: "O ponto doce — a maioria das barbearias está aqui.",
      features: [
        "1 barbearia",
        "Até 10 barbeiros",
        "Agendamentos ilimitados",
        "Lembretes WhatsApp + SMS",
        "Relatórios completos",
        "Suporte prioritário",
      ],
    },
    {
      nome: "Rede",
      preco: 249,
      desc: "Para quem opera mais de uma unidade ou planeja crescer.",
      features: [
        "Unidades ilimitadas",
        "Equipe ilimitada",
        "Marca própria no app",
        "Gerente dedicado",
        "SLA 99.9%",
      ],
    },
  ];

  const DEPOIMENTOS = [
    {
      nome: "Marcus Almeida",
      barbearia: "Barbearia Urban · Salvador",
      texto:
        "Antes controlava tudo no papel. Hoje vejo em tempo real quantos estão na cadeira, quanto faturei e quem é meu melhor barbeiro.",
      avaliacao: 5,
    },
    {
      nome: "Rafael Mendes",
      barbearia: "Corte Fino · Fortaleza",
      texto:
        "Meus clientes adoraram o app. Agendam sozinhos, recebem lembrete e avaliam. O no-show caiu mais da metade no primeiro mês.",
      avaliacao: 5,
    },
    {
      nome: "Diego Costa",
      barbearia: "Navalha & Estilo · Recife",
      texto:
        "A tela da agenda é outra coisa. Cada barbeiro com seu status, o progresso do atendimento, o próximo cliente. Nunca vi nada igual.",
      avaliacao: 5,
    },
  ];

  const STEPS = [
    {
      n: "STEP 01",
      title: "Crie a sua barbearia",
      p: "Nome, endereço, horário de funcionamento. Importamos sua lista de serviços de um template ou você cria do zero em 2 minutos.",
    },
    {
      n: "STEP 02",
      title: "Adicione sua equipe",
      p: "Cada barbeiro recebe um link mágico. Entra, completa o perfil e já aparece na agenda. Sem instalar nada, sem criar senha.",
    },
    {
      n: "STEP 03",
      title: "Compartilhe o link",
      p: "Um link único para seus clientes agendarem direto no app do Toqe. Cola no Instagram, no Google Maps, no WhatsApp business.",
    },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[64px]"
        style={{
          background: scrolled ? "rgba(10,10,10,0.95)" : "rgba(10,10,10,0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "var(--border-subtle)" : "transparent"}`,
          transition: "background 200ms, border-color 200ms",
        }}
      >
        {/* Logo */}
        <motion.button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 30,
              height: 30,
              background: "var(--primary)",
              boxShadow: "0 0 14px rgba(244,180,0,0.25)",
            }}
          >
            <Scissors size={13} color="#0a0a0a" strokeWidth={2.5} />
          </motion.div>
          <span
            className="font-bold text-[17px]"
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Toqe
          </span>
        </motion.button>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          {[
            { label: "Operação", href: "#operacao" },
            { label: "Como funciona", href: "#funciona" },
            { label: "Planos", href: "#planos" },
            { label: "Depoimentos", href: "#depoimentos" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-hover)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/login")}
            className="hidden sm:block text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Entrar
          </button>
          <motion.button
            whileHover={{
              scale: 1.03,
              boxShadow: "0 6px 24px rgba(244,180,0,0.3)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/onboarding")}
            className="flex items-center gap-1.5 px-4 rounded-lg text-[13px] font-semibold h-[36px]"
            style={{
              background: "var(--primary)",
              color: "#0D0D0D",
              boxShadow: "0 0 14px rgba(244,180,0,0.18)",
            }}
          >
            Começar grátis
            <ArrowRight size={12} strokeWidth={2.5} />
          </motion.button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg ml-1"
            style={{ color: "var(--text-primary)" }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[64px] left-0 right-0 z-40 py-2 px-6"
            style={{
              background: "rgba(10,10,10,0.98)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {["Operação", "Como funciona", "Planos", "Depoimentos"].map(
              (label, i) => (
                <a
                  key={label}
                  href={`#${["operacao", "funciona", "planos", "depoimentos"][i]}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3.5 text-[15px] font-medium"
                  style={{
                    color: "var(--text-primary)",
                    borderBottom:
                      i < 3 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  {label}
                </a>
              ),
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/login");
              }}
              className="block w-full text-left py-3.5 text-[15px]"
              style={{
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              Entrar
            </button>
            <div className="py-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/onboarding");
                }}
                className="w-full h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center"
                style={{ background: "var(--primary)", color: "#0D0D0D" }}
              >
                Começar grátis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero (split) ── */}
      <section
        className="relative flex items-center overflow-hidden min-h-screen pt-[140px] pb-[80px] px-6"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            opacity: 0.35,
            maskImage:
              "radial-gradient(ellipse 80% 70% at 70% 40%, black 30%, transparent 90%)",
          }}
        />
        {/* Amber glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "-10%",
            top: "10%",
            width: "60%",
            height: "60%",
            background:
              "radial-gradient(ellipse, rgba(244,180,0,0.07) 0%, transparent 60%)",
          }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center"
        >
          {/* Left: copy */}
          <div>
            {/* Status pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full mb-7"
              style={{
                background: "rgba(29,185,84,0.06)",
                border: "1px solid rgba(29,185,84,0.18)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--status-success)",
                letterSpacing: "0.04em",
              }}
            >
              <span
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--status-success)",
                  animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                }}
              />
              1.247 BARBEARIAS · 8.342 ATENDIMENTOS HOJE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-bold mb-6"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.6rem, 6.5vw, 4.5rem)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
              }}
            >
              Sua barbearia,
              <br />
              <span style={{ color: "var(--primary)" }}>em tempo real.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-9 max-w-[480px]"
              style={{
                fontSize: 17,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Quem está na cadeira, quanto entrou, qual o próximo. O painel que
              substitui o caderninho, o WhatsApp do gerente e a planilha de fim
              de semana.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <motion.button
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 0 32px rgba(244,180,0,0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/onboarding")}
                className="flex items-center gap-2 px-7 rounded-xl font-bold text-[14px] h-[50px]"
                style={{
                  background: "var(--primary)",
                  color: "#0D0D0D",
                  boxShadow: "0 0 20px rgba(244,180,0,0.2)",
                }}
              >
                Começar grátis — 14 dias
                <ArrowRight size={14} strokeWidth={2.5} />
              </motion.button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-6 rounded-xl font-medium text-[14px] h-[50px]"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                  background: "transparent",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-hover)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                <Play size={13} strokeWidth={2} />
                Ver demonstração
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 mt-7 flex-wrap"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
              }}
            >
              {[
                "Sem cartão",
                "Configura em 5 min",
                "Cancela quando quiser",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                    +
                  </span>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: live console */}
          <LiveConsole />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{
            opacity: { delay: 1.4 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={20} style={{ color: "var(--text-muted)" }} />
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Operação / Features ── */}
      <section
        id="operacao"
        className="py-24 px-6"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-14">
            <div>
              <div
                className="mb-4 flex items-center gap-2.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "var(--primary)" }}>/</span> Operação 01
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-bold leading-[1.05]"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                }}
              >
                A tela que{" "}
                <span style={{ color: "var(--primary)" }}>não fecha</span> o dia
                inteiro.
              </motion.h2>
            </div>
            <p
              className="text-[16px] leading-[1.6] max-w-[460px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Cada cadeira é uma linha. Cada serviço, um cronômetro. Não é um
              sistema de agendamento — é a sala de controle da sua barbearia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona (3 steps) ── */}
      <section
        id="funciona"
        className="py-24 px-6"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-14">
            <div>
              <div
                className="mb-4 flex items-center gap-2.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "var(--primary)" }}>/</span> Como funciona
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-bold leading-[1.05]"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                }}
              >
                Configurou hoje.{" "}
                <span style={{ color: "var(--primary)" }}>Roda amanhã.</span>
              </motion.h2>
            </div>
            <p
              className="text-[16px] leading-[1.6] max-w-[460px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Sem implantação. Sem treinamento de duas semanas. Sem ligar para o
              suporte para perguntar onde clica.
            </p>
          </div>

          {/* 3-column step grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[18px] overflow-hidden"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-card)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="p-8"
                  style={{
                    borderRight:
                      i < 2 ? "1px solid var(--border-subtle)" : "none",
                    borderBottom: "none",
                  }}
                >
                  <div
                    className="mb-4 text-[11px] uppercase tracking-widest"
                    style={{
                      color: "var(--primary)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.18em",
                    }}
                  >
                    {s.n}
                  </div>
                  <h4
                    className="font-bold mb-2.5"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 20,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    className="text-[14px] leading-[1.6]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.p}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-base)",
        }}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { v: 1247, s: "+", l: "Barbearias ativas no Brasil" },
            { v: 48, s: "k", l: "Agendamentos por mês" },
            { v: 98, s: "%", l: "Renovação após teste grátis" },
            { v: 4.9, s: "★", l: "Média na App Store" },
          ].map((stat, i) => (
            <motion.div
              key={stat.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="px-6 py-10"
              style={{
                borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div
                className="font-bold leading-none mb-2.5"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem, 4vw, 2.6rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 2,
                }}
              >
                {stat.v === 4.9 ? "4.9" : <CountUp to={stat.v} />}
                <span
                  style={{ fontSize: "0.55em", color: "var(--text-primary)" }}
                >
                  {stat.s}
                </span>
              </div>
              <span
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {stat.l}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Planos ── */}
      <section
        id="planos"
        className="py-24 px-6"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-14">
            <div>
              <div
                className="mb-4 flex items-center gap-2.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "var(--primary)" }}>/</span> Planos
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-bold leading-[1.05]"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                }}
              >
                Preço claro.{" "}
                <span style={{ color: "var(--primary)" }}>
                  Sem letra miúda.
                </span>
              </motion.h2>
            </div>
            <p
              className="text-[16px] leading-[1.6] max-w-[460px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Tudo o que você precisa em cada plano. Cresce com a sua operação,
              não com o tamanho da fatura.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANOS.map((p, i) => (
              <PlanCard key={p.nome} {...p} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section
        id="depoimentos"
        className="py-24 px-6"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-14">
            <div>
              <div
                className="mb-4 flex items-center gap-2.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "var(--primary)" }}>/</span> Depoimentos
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-bold leading-[1.05]"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                }}
              >
                Donos que{" "}
                <span style={{ color: "var(--primary)" }}>
                  não voltam atrás.
                </span>
              </motion.h2>
            </div>
            <p
              className="text-[16px] leading-[1.6] max-w-[460px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Cada cliente entrevistado faz mais de R$ 30 mil/mês depois de
              migrar. Não medimos satisfação por avaliação — medimos por NPS de
              11 meses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEPOIMENTOS.map((d, i) => (
              <Depoimento key={d.nome} {...d} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(244,180,0,0.08) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-xl mx-auto"
        >
          <motion.h2
            className="font-bold mb-5 leading-[1.05]"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
            }}
          >
            Hoje, na sua barbearia,{" "}
            <span style={{ color: "var(--primary)" }}>
              tudo já está acontecendo.
            </span>
          </motion.h2>
          <p
            className="mb-10 text-[16px] leading-[1.7] max-w-[480px] mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Você está só sem ver. 14 dias grátis para mudar isso. Sem cartão.
            Sem ligação. Sem chato no telefone.
          </p>
          <motion.button
            whileHover={{
              scale: 1.04,
              boxShadow: "0 0 40px rgba(244,180,0,0.3)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/onboarding")}
            className="inline-flex items-center gap-2 px-8 rounded-xl font-bold text-[15px] h-[52px]"
            style={{
              background: "var(--primary)",
              color: "#0D0D0D",
              boxShadow: "0 0 24px rgba(244,180,0,0.2)",
            }}
          >
            Começar agora <ArrowRight size={17} strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="flex items-center justify-between px-8 py-5 flex-wrap gap-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <div
            className="flex items-center justify-center rounded"
            style={{ width: 24, height: 24, background: "var(--primary)" }}
          >
            <Scissors size={11} color="#0a0a0a" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-[14px]"
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Toqe
          </span>
        </button>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          © 2026 Toqe · feito no Brasil, para barbearias do Brasil.
        </span>
      </footer>
    </div>
  );
}
