"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  type LucideIcon,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle, ChevronDown,
  Menu,
  Scissors,
  Shield,
  Smartphone,
  Star,
  Users,
  X,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* -- Contador animado -- */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
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
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

function FeatureCard({ icon: Icon, title, desc, color, delay }: { icon: LucideIcon; title: string; desc: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} whileHover={{ y: -4 }}
      className="relative rounded-2xl p-6"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", transition: "border-color 200ms, box-shadow 200ms" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${color}12`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div className="absolute top-0 left-6 right-6 rounded-b" style={{ height: 2, background: color, opacity: 0.45 }} />
      <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: `${color}12`, color }}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <h3 className="font-bold text-[15px] mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
    </motion.div>
  );
}

function PlanCard({ nome, preco, features, destaque, delay }: { nome: string; preco: number; features: string[]; destaque?: boolean; delay: number }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} whileHover={{ y: -4 }}
      className="relative rounded-2xl p-6"
      style={{ background: destaque ? "rgba(244,180,0,0.04)" : "var(--bg-card)", border: `1px solid ${destaque ? "rgba(244,180,0,0.3)" : "var(--border-default)"}`, boxShadow: destaque ? "0 0 40px rgba(244,180,0,0.08)" : "none", transition: "all 200ms" }}
    >
      {destaque && <div className="absolute top-0 left-6 right-6 rounded-b" style={{ height: 2, background: "var(--primary)", opacity: 0.7 }} />}
      {destaque && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4" style={{ background: "rgba(244,180,0,0.15)", color: "var(--primary)" }}><Zap size={9} /> Mais popular</span>}
      <span className="block font-bold text-[13px] mb-1 uppercase tracking-wider" style={{ color: destaque ? "var(--primary)" : "var(--text-secondary)" }}>{nome}</span>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="font-bold" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", letterSpacing: "-0.04em", color: "var(--text-primary)" }}>R${preco}</span>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>/m�s</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: destaque ? "var(--primary)" : "var(--status-success)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{f}</span>
          </li>
        ))}
      </ul>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/onboarding")}
        className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
        style={{ background: destaque ? "var(--primary)" : "transparent", color: destaque ? "#0D0D0D" : "var(--text-primary)", border: destaque ? "none" : "1px solid var(--border-strong)" }}>
        Come�ar gr�tis 14 dias
      </motion.button>
    </motion.div>
  );
}

function Depoimento({ nome, barbearia, texto, avaliacao, delay }: { nome: string; barbearia: string; texto: string; avaliacao: number; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
      <div className="flex gap-1 mb-4">{Array.from({ length: avaliacao }).map((_, i) => <Star key={i} size={13} fill="var(--status-warning)" color="var(--status-warning)" />)}</div>
      <p className="text-[13px] leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>"{texto}"</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full font-bold text-sm" style={{ width: 36, height: 36, background: "rgba(244,180,0,0.1)", color: "var(--primary)", fontFamily: "var(--font-heading)" }}>{nome[0]}</div>
        <div>
          <span className="block text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{nome}</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{barbearia}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -40]);

  useEffect(() => scrollY.on("change", v => setScrolled(v > 30)), [scrollY]);

  const FEATURES = [
    { icon: Calendar,   color: "var(--status-info)",    title: "Agenda em tempo real",    desc: "Veja todos os hor�rios, quem est� atendendo e o que est� livre  tudo atualizado na hora, sem precisar perguntar para ningu�m." },
    { icon: Zap,        color: "var(--status-warning)", title: "Painel ao vivo",           desc: "Equipe ativa, fila de espera e tempo m�dio do dia vis�veis de uma vez. Como ter c�meras em cima de cada cadeira." },
    { icon: Smartphone, color: "var(--status-success)", title: "App para seu cliente",     desc: "O cliente agenda sozinho em menos de 20 segundos. Escolhe hor�rio, barbeiro e servi�o  sem liga��o, sem mensagem no WhatsApp." },
    { icon: BarChart3,  color: "#C084FC",               title: "Relat�rios que importam", desc: "Quanto entrou hoje, qual servi�o mais pediu, qual barbeiro mais faturou. N�meros reais para decis�es reais." },
    { icon: Users,      color: "var(--status-error)",   title: "Sua equipe organizada",   desc: "Cada barbeiro com seu hist�rico, hor�rios e desempenho. Voc� sabe quem est� rendendo e quem precisa de aten��o." },
    { icon: Shield,     color: "var(--status-info)",    title: "Dados sempre seguros",    desc: "Informa��es de cada barbearia completamente isoladas. Seus dados s�o s� seus  ponto." },
  ];

  const PLANOS = [
    { nome: "B�sico", preco: 49,  features: ["1 barbearia", "At� 2 barbeiros", "50 agendamentos/m�s", "App para clientes", "Suporte por e-mail"] },
    { nome: "Pro",    preco: 99,  destaque: true, features: ["1 barbearia", "At� 10 barbeiros", "Agendamentos ilimitados", "Avisos por WhatsApp e SMS", "Relat�rios completos", "Suporte priorit�rio"] },
    { nome: "Rede",   preco: 249, features: ["V�rias unidades", "Equipe ilimitada", "Marca pr�pria no app", "Suporte com gerente dedicado", "Disponibilidade garantida 99,9%"] },
  ];

  const DEPOIMENTOS = [
    { nome: "Marcus Almeida", barbearia: "Barbearia Urban � Salvador", texto: "Antes controlava tudo no papel. Hoje vejo em tempo real quantos est�o na cadeira, quanto faturei e quem � meu melhor barbeiro.", avaliacao: 5 },
    { nome: "Rafael Mendes",  barbearia: "Corte Fino � Fortaleza",     texto: "Meus clientes adoraram o app. Agendam sozinhos, recebem lembrete e ainda avaliam. O no-show caiu mais da metade.", avaliacao: 5 },
    { nome: "Diego Costa",    barbearia: "Navalha & Estilo � Recife",  texto: "A tela da agenda � outra coisa. Cada barbeiro com seu status, o progresso do atendimento, o pr�ximo cliente. Nunca vi nada igual.", avaliacao: 5 },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* -- Navbar -- */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: 60,
          background: scrolled ? "rgba(13,13,13,0.97)" : "rgba(13,13,13,0.5)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "var(--border-subtle)" : "transparent"}`,
          transition: "background 300ms, border-color 300ms",
        }}
      >
        {/* Logo  clica e vai pra home */}
        <motion.button onClick={() => router.push("/")} className="flex items-center gap-2.5" whileTap={{ scale: 0.95 }}>
          <motion.div whileHover={{ scale: 1.08 }} className="flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, background: "var(--primary)", boxShadow: "0 0 14px rgba(244,180,0,0.25)" }}>
            <Scissors size={13} color="#0D0D0D" strokeWidth={2.5} />
          </motion.div>
          <span className="font-bold text-[17px]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Toqe</span>
        </motion.button>

        {/* Links desktop  mais vis�veis */}
        <div className="hidden md:flex items-center gap-1">
          {[{ label: "Como funciona", href: "#funcionalidades" }, { label: "Planos", href: "#planos" }, { label: "Depoimentos", href: "#depoimentos" }].map(link => (
            <a key={link.label} href={link.href}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
              style={{ color: "var(--text-primary)", opacity: 0.7 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/login")}
            className="hidden sm:block text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-primary)", opacity: 0.8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            Entrar
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/onboarding")}
            className="flex items-center gap-1.5 px-4 rounded-lg text-[13px] font-semibold"
            style={{ height: 34, background: "var(--primary)", color: "#0D0D0D", boxShadow: "0 0 14px rgba(244,180,0,0.2)" }}>
            Come�ar gr�tis
          </motion.button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 rounded-lg ml-1" style={{ color: "var(--text-primary)" }}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
            className="fixed top-[60px] left-0 right-0 z-40 py-3 px-4"
            style={{ background: "rgba(13,13,13,0.98)", borderBottom: "1px solid var(--border-subtle)" }}>
            {["Como funciona", "Planos", "Depoimentos"].map((label, i) => (
              <a key={label} href={`#${["funcionalidades", "planos", "depoimentos"][i]}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-[14px]"
                style={{ color: "var(--text-primary)", borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none" }}>
                {label}
              </a>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); router.push("/login"); }}
              className="block w-full text-left py-3 text-[14px]" style={{ color: "var(--text-primary)", opacity: 0.7 }}>
              Entrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Hero -- */}
      <section className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: 100, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px", opacity: 0.3,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        }} />
        <div className="absolute pointer-events-none" style={{ width: 600, height: 400, left: "50%", top: "45%", transform: "translate(-50%, -50%)", background: "radial-gradient(ellipse, rgba(244,180,0,0.06) 0%, transparent 70%)" }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.2)" }}>
            <span className="rounded-full" style={{ width: 6, height: 6, background: "var(--status-success)", animation: "tqe-pulse-green 1.5s ease-in-out infinite" }} />
            <span className="text-[12px] font-medium" style={{ color: "var(--status-success)" }}>
              Mais de 1.200 barbearias j� usam o Toqe
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold mb-6"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.4rem, 6vw, 4rem)", letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text-primary)" }}>
            Sua barbearia,{" "}
            <span style={{ color: "var(--primary)" }}>do jeito que deveria ser.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mb-10"
            style={{ maxWidth: 540, fontSize: "clamp(1rem, 2vw, 1.1rem)", color: "var(--text-secondary)", lineHeight: 1.75 }}>
            Agenda, equipe e faturamento em um lugar s�. Seu cliente agenda sozinho,
            voc� acompanha tudo em tempo real e n�o perde mais nada.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
            className="flex items-center justify-center gap-3 flex-wrap">
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(244,180,0,0.3)" }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/onboarding")}
              className="flex items-center gap-2 px-7 rounded-xl font-bold text-[15px]"
              style={{ height: 50, background: "var(--primary)", color: "#0D0D0D", boxShadow: "0 0 20px rgba(244,180,0,0.2)" }}>
              Come�ar gr�tis por 14 dias
              <ArrowRight size={16} strokeWidth={2.5} />
            </motion.button>
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-6 rounded-xl font-medium text-[14px]"
              style={{ height: 50, background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
              Ver demonstra��o
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {[{ v: "Sem cart�o", l: "para come�ar" }, { v: "14 dias", l: "gratuitos" }, { v: "Cancela", l: "quando quiser" }].map(item => (
              <div key={item.l} className="flex items-center gap-1.5">
                <CheckCircle size={13} style={{ color: "var(--status-success)" }} />
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{item.v}</strong> {item.l}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ opacity: { delay: 1.4 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={20} style={{ color: "var(--text-muted)" }} />
        </motion.div>
      </section>

      {/* -- N�meros -- */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 1200,  suffix: "+",   label: "Barbearias ativas"    },
            { value: 48000, suffix: "+",   label: "Agendamentos por m�s" },
            { value: 98,    suffix: "%",   label: "Clientes satisfeitos" },
            { value: 4,     suffix: ".9", label: "Avalia��o m�dia"      },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <div className="font-bold mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", letterSpacing: "-0.04em", color: "var(--primary)" }}>
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* -- Como funciona -- */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full" style={{ background: "rgba(77,163,255,0.1)", color: "var(--status-info)" }}>
              Como funciona
            </span>
            <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              Tudo o que sua barbearia precisa
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto", fontSize: 15, lineHeight: 1.7 }}>
              Feito do zero para o dia a dia de uma barbearia. N�o � um sistema gen�rico adaptado.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.07} />)}
          </div>
        </div>
      </section>

      {/* -- Preview -- */}
      <section className="py-20 px-6" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              O painel que voc� sempre quis ter
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Veja o que est� acontecendo na sua barbearia agora.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-default)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center gap-3 px-5" style={{ height: 44, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-center rounded" style={{ width: 24, height: 24, background: "var(--primary)" }}><Scissors size={11} color="#0D0D0D" strokeWidth={2.5} /></div>
              <div className="flex gap-1.5 ml-auto">
                {["var(--status-error)", "var(--status-warning)", "var(--status-success)"].map((c, i) => (
                  <div key={i} className="rounded-full" style={{ width: 10, height: 10, background: c, opacity: 0.7 }} />
                ))}
              </div>
            </div>
            <div className="p-5" style={{ background: "var(--bg-base)" }}>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[{ label: "Hoje", value: "R$890", color: "var(--status-success)" }, { label: "Agendamentos", value: "14", color: "var(--status-info)" }, { label: "Ticket m�dio", value: "R$63", color: "var(--status-warning)" }, { label: "Avalia��o", value: "4.8", color: "var(--status-success)" }].map(m => (
                  <div key={m.label} className="rounded-xl px-3 py-2.5 relative overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div className="absolute top-0 left-3 right-3 rounded-b" style={{ height: 2, background: m.color, opacity: 0.5 }} />
                    <span className="block font-bold text-base" style={{ fontFamily: "var(--font-heading)", color: m.color, letterSpacing: "-0.03em" }}>{m.value}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="rounded-full" style={{ width: 6, height: 6, background: "var(--status-success)", animation: "tqe-pulse-green 1.5s ease-in-out infinite" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>Ao vivo agora</span>
                </div>
                <div className="flex divide-x" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {[{ label: "Atendendo", value: "3", color: "var(--status-success)" }, { label: "Pr�ximo", value: "10:30", color: "var(--text-primary)" }, { label: "Esperando", value: "2", color: "var(--status-warning)" }, { label: "Tempo m�dio", value: "38min", color: "var(--status-info)" }].map(s => (
                    <div key={s.label} className="flex-1 px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                      <span className="block font-bold text-sm" style={{ fontFamily: "var(--font-heading)", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[{ n: "Carlos", st: "active", c: "Jo�o � Corte" }, { n: "Lucas", st: "idle", c: null }, { n: "Felipe", st: "active", c: "Ana � Sobrancelha" }].map(b => (
                    <div key={b.n} className="rounded-lg px-3 py-2 relative overflow-hidden"
                      style={{ background: b.st === "active" ? "rgba(29,185,84,0.04)" : "var(--bg-secondary)", border: `1px solid ${b.st === "active" ? "rgba(29,185,84,0.2)" : "var(--border-subtle)"}` }}>
                      {b.st === "active" && <div className="absolute left-0 top-2 bottom-2 rounded-r" style={{ width: 2, background: "var(--status-success)", animation: "tqe-sidebar-pulse 2s ease-in-out infinite" }} />}
                      <span className="block text-[11px] font-semibold pl-1" style={{ color: "var(--text-primary)" }}>{b.n}</span>
                      <span className="block text-[10px] pl-1" style={{ color: b.st === "active" ? "var(--text-secondary)" : "var(--text-muted)" }}>{b.c ?? "Dispon�vel"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* -- Planos -- */}
      <section id="planos" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full" style={{ background: "rgba(244,180,0,0.1)", color: "var(--primary)" }}>Planos</span>
            <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              Simples, transparente, sem surpresas
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>14 dias gratuitos. Sem cart�o de cr�dito para come�ar.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANOS.map((p, i) => <PlanCard key={p.nome} {...p} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* -- Depoimentos -- */}
      <section id="depoimentos" className="py-20 px-6" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full" style={{ background: "rgba(29,185,84,0.1)", color: "var(--status-success)" }}>Depoimentos</span>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              Quem usa n�o volta atr�s
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEPOIMENTOS.map((d, i) => <Depoimento key={d.nome} {...d} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* -- CTA final -- */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(244,180,0,0.05) 0%, transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative max-w-xl mx-auto">
          <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.15 }}>
            Pronto para mudar como sua barbearia funciona?
          </h2>
          <p className="mb-8 text-[15px]" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Configure em menos de 5 minutos e veja a diferen�a no primeiro dia.
          </p>
          <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(244,180,0,0.3)" }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/onboarding")}
            className="inline-flex items-center gap-2 px-8 rounded-xl font-bold text-[15px]"
            style={{ height: 52, background: "var(--primary)", color: "#0D0D0D", boxShadow: "0 0 24px rgba(244,180,0,0.2)" }}>
            Come�ar gr�tis agora <ArrowRight size={17} strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </section>

      {/* -- Footer -- */}
      <footer className="flex items-center justify-between px-8 py-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={() => router.push("/")} className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded" style={{ width: 22, height: 22, background: "var(--primary)" }}>
            <Scissors size={10} color="#0D0D0D" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[14px]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Toqe</span>
        </button>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>� 2026 Toqe. Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
