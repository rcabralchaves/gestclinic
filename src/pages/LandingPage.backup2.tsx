import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GestCliniLogo } from "@/components/GestCliniLogo";
import {
  ArrowRight, CalendarDays, ChevronRight, ChevronDown,
  DollarSign, TrendingUp, TrendingDown, Users, Activity,
  CheckCircle2, Clock, Package,
} from "lucide-react";

/* ─── HOOK: aparecer ao scrollar ────────────────────────────────────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({
  children, delay = 0, y = 18, className = "",
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── CONTADOR ANIMADO ──────────────────────────────────────────────────────── */

function CountUp({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
  const { ref, inView } = useInView(0.5);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{count.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ─── MOCKUP: DASHBOARD ─────────────────────────────────────────────────────── */

function DashboardMockup() {
  const retornos = [
    { nome: "Maria Silva",    data: "22/07", diff:  2 },
    { nome: "João Costa",     data: "23/07", diff:  3 },
    { nome: "Ana Ferreira",   data: "18/07", diff: -2 },
  ];
  const meses = [
    { m: "Mar", rec: 32, desp: 18 }, { m: "Abr", rec: 41, desp: 22 },
    { m: "Mai", rec: 36, desp: 20 }, { m: "Jun", rec: 48, desp: 25 },
    { m: "Jul", rec: 39, desp: 14 },
  ];
  const maxBar = 48;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-gray-400">gestclini.com.br — Dashboard</span>
      </div>

      {/* App layout */}
      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-28 bg-slate-900 py-3 shrink-0 hidden sm:block">
          <div className="px-3 mb-4">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">G</span>
            </div>
          </div>
          {[
            { label: "Dashboard", active: true },
            { label: "Agenda",    active: false },
            { label: "Pacientes", active: false },
            { label: "Receitas",  active: false },
            { label: "Estoque",   active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`mx-1.5 px-2 py-1.5 rounded-md mb-0.5 text-[10px] font-medium ${
                item.active
                  ? "bg-white/10 text-white"
                  : "text-slate-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3 min-w-0">
          <div>
            <p className="text-sm font-bold text-gray-800">Dashboard</p>
            <p className="text-[10px] text-gray-400">Terça-feira, 22 de julho</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Faturamento",  value: "R$ 38.700", icon: DollarSign,  c: "text-blue-600",  bg: "bg-blue-50"  },
              { label: "Lucro Líquido", value: "R$ 24.600", icon: TrendingUp,  c: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Despesas",     value: "R$ 14.100", icon: TrendingDown, c: "text-amber-600", bg: "bg-amber-50"  },
              { label: "Pacientes",    value: "128",       icon: Users,        c: "text-violet-600", bg: "bg-violet-50" },
            ].map((k) => (
              <div key={k.label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <div className={`w-6 h-6 rounded-lg ${k.bg} flex items-center justify-center mb-1.5`}>
                  <k.icon className={`h-3 w-3 ${k.c}`} />
                </div>
                <p className="text-[8px] text-gray-400 leading-tight mb-0.5">{k.label}</p>
                <p className={`text-[11px] font-extrabold ${k.c} leading-none`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Retorno */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              <p className="text-[10px] font-bold text-blue-700">Pacientes para Retorno</p>
            </div>
            <div className="space-y-1">
              {retornos.map((r) => (
                <div key={r.nome} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                  <span className="text-[9px] font-semibold text-gray-700">{r.nome}</span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: r.diff < 0 ? "#fee2e2" : "#dbeafe",
                      color: r.diff < 0 ? "#dc2626" : "#1d4ed8",
                    }}
                  >
                    {r.diff < 0 ? `${Math.abs(r.diff)}d atrasado` : `em ${r.diff}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-600 mb-3">Receitas vs Despesas</p>
            <div className="flex items-end gap-2 h-12">
              {meses.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="flex items-end gap-0.5 w-full">
                    <div className="flex-1 rounded-sm bg-blue-500" style={{ height: `${(m.rec / maxBar) * 44}px` }} />
                    <div className="flex-1 rounded-sm bg-amber-300" style={{ height: `${(m.desp / maxBar) * 44}px` }} />
                  </div>
                  <span className="text-[8px] text-gray-400">{m.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MOCKUP: AGENDA ────────────────────────────────────────────────────────── */

function AgendaMockup() {
  const appts = [
    { day: 0, slot: 0, name: "Maria Silva",    type: "Consulta",   color: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
    { day: 0, slot: 2, name: "Carlos Lima",    type: "Extração",   color: "#F0FDF4", border: "#16A34A", text: "#15803D" },
    { day: 1, slot: 1, name: "Ana Ferreira",   type: "Retorno",    color: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
    { day: 1, slot: 3, name: "Pedro Santos",   type: "Avaliação",  color: "#FFF7ED", border: "#D97706", text: "#92400E" },
    { day: 2, slot: 0, name: "Beatriz Ramos",  type: "Ortodontia", color: "#FDF4FF", border: "#9333EA", text: "#6B21A8" },
    { day: 2, slot: 2, name: "Ricardo Nunes",  type: "Consulta",   color: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
    { day: 3, slot: 1, name: "Fernanda Costa", type: "Limpeza",    color: "#F0FDF4", border: "#16A34A", text: "#15803D" },
    { day: 4, slot: 0, name: "Lucas Martins",  type: "Endodontia", color: "#FFF1F2", border: "#E11D48", text: "#9F1239" },
    { day: 4, slot: 3, name: "Juliana Pires",  type: "Retorno",    color: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
  ];
  const days  = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const dates = ["21",  "22",  "23",  "24",  "25" ];
  const times = ["08h", "09h", "10h", "11h"];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-gray-400">gestclini.com.br — Agenda</span>
      </div>

      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-24 bg-slate-900 py-3 shrink-0 hidden sm:block">
          {[
            { label: "Dashboard" }, { label: "Agenda", active: true },
            { label: "Pacientes" }, { label: "Receitas" },
          ].map((item) => (
            <div
              key={item.label}
              className={`mx-1.5 px-2 py-1.5 rounded-md mb-0.5 text-[10px] font-medium ${"active" in item ? "bg-white/10 text-white" : "text-slate-400"}`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex-1 p-3 min-w-0">
          {/* Week header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-800">Semana de 21 a 25 de julho</p>
            <div className="flex gap-1">
              <button className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                <ChevronRight className="h-3 w-3 text-gray-400 rotate-180" />
              </button>
              <button className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Time labels */}
            <div className="w-8 shrink-0 pt-6">
              {times.map((t) => (
                <div key={t} className="text-[8px] text-gray-400 leading-none mb-5">{t}</div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, di) => {
              const dayAppts = appts.filter((a) => a.day === di);
              return (
                <div key={day} className="flex-1 min-w-0">
                  {/* Day header */}
                  <div className={`text-center mb-1 py-1 rounded-lg ${di === 1 ? "bg-blue-600" : ""}`}>
                    <p className={`text-[8px] font-semibold ${di === 1 ? "text-blue-100" : "text-gray-400"}`}>{day}</p>
                    <p className={`text-[10px] font-bold ${di === 1 ? "text-white" : "text-gray-700"}`}>{dates[di]}</p>
                  </div>
                  {/* Slots */}
                  <div className="space-y-1">
                    {times.map((_, si) => {
                      const appt = dayAppts.find((a) => a.slot === si);
                      return appt ? (
                        <div
                          key={si}
                          className="h-8 rounded-md px-1.5 py-1 border"
                          style={{ background: appt.color, borderColor: appt.border }}
                        >
                          <p className="text-[8px] font-semibold leading-tight truncate" style={{ color: appt.text }}>{appt.name}</p>
                          <p className="text-[7px] leading-tight" style={{ color: appt.text, opacity: 0.7 }}>{appt.type}</p>
                        </div>
                      ) : (
                        <div key={si} className="h-8 rounded-md border border-dashed border-gray-100" />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MOCKUP: PRONTUÁRIO ────────────────────────────────────────────────────── */

function ProntuarioMockup() {
  const patients = [
    { name: "Ana Ferreira",   age: 34, tag: "Retorno em 2d",  tagColor: "#dbeafe", tagText: "#1d4ed8" },
    { name: "Carlos Lima",    age: 47, tag: "Consulta hoje",  tagColor: "#dcfce7", tagText: "#15803d" },
    { name: "Beatriz Ramos",  age: 29, tag: "Prontuário OK",  tagColor: "#f0fdf4", tagText: "#15803d" },
    { name: "Pedro Santos",   age: 52, tag: "Pendente",       tagColor: "#fef9c3", tagText: "#a16207" },
  ];
  const notes = [
    { date: "18/07/2025", text: "Restauração dente 16 concluída. Paciente sem dor. Retorno em 3 dias para verificar oclusão." },
    { date: "05/07/2025", text: "Avaliação inicial. Necessita restauração no dente 16 e limpeza periódica. Agendado." },
  ];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-1.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-gray-400">gestclini.com.br — Pacientes</span>
      </div>

      <div className="flex">
        {/* Patient list */}
        <div className="w-36 border-r border-gray-100 p-2 shrink-0">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">Pacientes</p>
          {patients.map((p, i) => (
            <div
              key={p.name}
              className={`rounded-lg px-2 py-1.5 mb-1 cursor-pointer ${i === 0 ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${i === 0 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-semibold truncate ${i === 0 ? "text-blue-700" : "text-gray-700"}`}>{p.name}</p>
                  <span
                    className="text-[7px] px-1 py-0.5 rounded font-medium"
                    style={{ background: p.tagColor, color: p.tagText }}
                  >
                    {p.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Patient detail */}
        <div className="flex-1 p-3 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-bold text-gray-900">Ana Ferreira</p>
              <p className="text-[9px] text-gray-400">34 anos · (48) 99812-3456</p>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Retorno em 2d
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Consultas", value: "8", icon: CalendarDays },
              { label: "Próx. retorno", value: "22/07", icon: Clock },
              { label: "Pendências", value: "0", icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <s.icon className="h-3 w-3 text-blue-500 mb-1" />
                <p className="text-[11px] font-bold text-gray-800">{s.value}</p>
                <p className="text-[8px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Prontuário</p>
          <div className="space-y-1.5">
            {notes.map((n) => (
              <div key={n.date} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <p className="text-[8px] text-gray-400 mb-0.5">{n.date}</p>
                <p className="text-[9px] text-gray-700 leading-snug">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA ─────────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: "Básico",
    price: "59,90",
    desc: "Para dentistas que querem organizar agenda e prontuários sem complicação.",
    highlight: false,
    features: [
      "Agenda completa",
      "Prontuário eletrônico",
      "Cadastro de pacientes",
      "Documentos e atestados",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Completo",
    price: "89,90",
    desc: "Para clínicas que querem controle total — do atendimento ao financeiro.",
    highlight: true,
    badge: "Mais popular",
    features: [
      "Tudo do plano Básico",
      "Financeiro completo",
      "Controle de estoque",
      "Relatórios avançados",
      "Parcelamento inteligente",
      "Suporte prioritário",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: "Gastei semanas tentando montar uma planilha de controle financeiro. O GestClini fez isso em minutos — e ainda me mostra exatamente para onde o dinheiro vai.",
    name: "Dr. André Melo",
    role: "Ortodontia · São Paulo/SP",
  },
  {
    quote: "Em dois dias já tinha a clínica toda organizada. Agenda, pacientes, prontuários. O que mais me surpreendeu foi como é simples — sem precisar de manual.",
    name: "Dra. Camila Freitas",
    role: "Clínica Geral · Florianópolis/SC",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const faqs = [
    { q: "Preciso de conhecimento técnico para começar?", a: "Não. O GestClini foi desenhado para que qualquer dentista consiga usar desde o primeiro dia, sem treinamento. A maioria dos nossos clientes está operando em menos de uma hora." },
    { q: "Meus dados ficam seguros?", a: "Sim. Todos os dados são armazenados com criptografia em servidores seguros. Você pode exportar suas informações quando quiser — sem fidelidade forçada." },
    { q: "Posso usar no celular ou tablet?", a: "Sim. O sistema funciona em qualquer dispositivo com navegador — computador, notebook, tablet ou celular." },
    { q: "E se eu precisar cancelar?", a: "Sem burocracia. Cancele quando quiser, sem multa e sem contrato de fidelidade. Seus dados ficam disponíveis por 30 dias após o cancelamento." },
  ];

  return (
    <>
      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        html { scroll-behavior: smooth; }
        .btn-glow:hover {
          box-shadow: 0 6px 20px -4px rgba(29, 78, 216, 0.45);
          transform: translateY(-1px);
        }
        .btn-glow { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .plan-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .plan-card:hover { transform: translateY(-4px); }
        .testimonial-card { transition: transform 0.2s ease; }
        .testimonial-card:hover { transform: translateY(-3px); }
        .faq-item { transition: background 0.15s ease; }
      `}</style>

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>

        {/* ─── NAV ─────────────────────────────────────────────────────── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <GestCliniLogo size="md" variant="light" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Como funciona</a>
              <a href="#planos" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Planos</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 hidden sm:block">
                Entrar
              </Link>
              <Link to="/cadastro">
                <button className="btn-glow text-sm font-semibold text-white bg-blue-700 px-5 py-2 rounded-lg">
                  Começar grátis
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ─── HERO ────────────────────────────────────────────────────── */}
        <section className="pt-32 pb-0 px-6 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto">
            {/* Copy */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p
                className="text-sm font-semibold text-blue-700 mb-5 tracking-wide"
                style={{ letterSpacing: "0.05em" }}
              >
                Sistema de gestão odontológica
              </p>

              <h1
                className="font-extrabold text-slate-950 mb-6 leading-none"
                style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.04em", textWrap: "balance" }}
              >
                A clínica que você construiu.<br />
                A gestão que ela precisa.
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-10" style={{ textWrap: "balance" }}>
                GestClini organiza agenda, prontuários e financeiro em um único sistema —
                para que você gaste menos tempo com papelada e mais tempo com quem importa.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/cadastro">
                  <button className="btn-glow inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-lg text-[15px]">
                    Começar gratuitamente
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <a href="#como-funciona">
                  <button className="inline-flex items-center gap-2 text-slate-600 font-medium px-6 py-3.5 rounded-lg text-[15px] border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-colors">
                    Ver como funciona
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </a>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div
              className="relative mx-auto"
              style={{
                maxWidth: 860,
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              }}
            >
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ─── O QUE MUDA ──────────────────────────────────────────────── */}
        <section id="como-funciona" className="py-28 px-6 bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-400 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                O que muda na prática
              </p>
              <h2
                className="font-extrabold text-white leading-tight"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", textWrap: "balance" }}
              >
                Menos horas de administração.<br />Mais resultado para a clínica.
              </h2>
            </FadeIn>

            <div className="grid sm:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
              {[
                {
                  stat: 200, suffix: "+",
                  label: "dentistas",
                  desc: "que já saíram das planilhas e assumiram o controle da clínica.",
                },
                {
                  stat: 3, prefix: "", suffix: "h",
                  label: "economizadas por dia",
                  desc: "em média, em tarefas administrativas que antes consumiam o seu tempo.",
                },
                {
                  stat: 1, suffix: "º dia",
                  label: "para estar operacional",
                  desc: "A maioria das clínicas está com agenda e pacientes organizados no primeiro dia.",
                },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 100} className="bg-slate-900 p-8 sm:p-10">
                  <p
                    className="font-extrabold text-white mb-1"
                    style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.04em", lineHeight: 1 }}
                  >
                    <CountUp end={item.stat} prefix={item.prefix ?? ""} suffix={item.suffix} />
                  </p>
                  <p className="text-blue-400 font-semibold text-sm mb-3">{item.label}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURE 1: AGENDA ───────────────────────────────────────── */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Copy */}
              <FadeIn className="order-2 lg:order-1">
                <p className="text-sm font-semibold text-blue-700 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                  Agenda
                </p>
                <h2
                  className="font-extrabold text-slate-950 mb-5 leading-tight"
                  style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.03em", textWrap: "balance" }}
                >
                  Nunca mais perca um horário, um retorno ou uma consulta.
                </h2>
                <p className="text-slate-500 text-base leading-relaxed mb-8">
                  Sua agenda sempre organizada, sem conflitos e sem ligações desnecessárias.
                  Veja a semana inteira de um relance e saiba exatamente o que acontece em cada hora do dia.
                </p>
                <ul className="space-y-3">
                  {[
                    "Visão semanal e diária em um clique",
                    "Alertas automáticos de retorno e aniversário",
                    "Histórico completo de cada atendimento",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
              {/* Mockup */}
              <FadeIn delay={100} className="order-1 lg:order-2">
                <AgendaMockup />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ─── FEATURE 2: PRONTUÁRIO ───────────────────────────────────── */}
        <section className="py-28 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Mockup */}
              <FadeIn className="order-1">
                <ProntuarioMockup />
              </FadeIn>
              {/* Copy */}
              <FadeIn delay={100} className="order-2">
                <p className="text-sm font-semibold text-blue-700 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                  Pacientes e Prontuário
                </p>
                <h2
                  className="font-extrabold text-slate-950 mb-5 leading-tight"
                  style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.03em", textWrap: "balance" }}
                >
                  O histórico de cada paciente, sempre ao seu alcance.
                </h2>
                <p className="text-slate-500 text-base leading-relaxed mb-8">
                  Chega de procurar fichas físicas ou lembrar de cabeça o que foi feito.
                  Em segundos você acessa tudo: tratamentos, anotações, documentos e o próximo retorno.
                </p>
                <ul className="space-y-3">
                  {[
                    "Prontuário clínico completo e sempre atualizado",
                    "Documentos e atestados gerados em um clique",
                    "Controle de retornos e pendências por paciente",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ─── FEATURE 3: FINANCEIRO ───────────────────────────────────── */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Copy */}
              <FadeIn className="order-2 lg:order-1">
                <p className="text-sm font-semibold text-blue-700 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                  Financeiro
                </p>
                <h2
                  className="font-extrabold text-slate-950 mb-5 leading-tight"
                  style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.03em", textWrap: "balance" }}
                >
                  No fim do mês, você vai saber exatamente quanto a clínica lucrou.
                </h2>
                <p className="text-slate-500 text-base leading-relaxed mb-8">
                  Receitas, despesas e lucro atualizados em tempo real. Sem planilha, sem dúvida, sem susto no fim do mês.
                  Tome decisões com base em números reais, não em estimativas.
                </p>
                <ul className="space-y-3">
                  {[
                    "Visão clara de receitas, despesas e lucro líquido",
                    "Gráficos mensais para acompanhar o crescimento",
                    "Controle de taxas de cartão e parcelamentos",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
              {/* Mockup — reusa dashboard em versão compacta */}
              <FadeIn delay={100} className="order-1 lg:order-2">
                <DashboardMockup />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ─── DEPOIMENTOS ─────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-700 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                O que dizem os dentistas
              </p>
              <h2
                className="font-extrabold text-slate-950"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.03em", textWrap: "balance" }}
              >
                A diferença que você sente no dia a dia.
              </h2>
            </FadeIn>

            <div className="grid sm:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div
                    className="testimonial-card bg-white rounded-2xl p-8 border border-slate-100 h-full"
                    style={{ boxShadow: "0 4px 20px -6px rgba(0,0,0,0.07)" }}
                  >
                    <p className="text-slate-700 text-[15px] leading-relaxed mb-6 italic">
                      "{t.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PLANOS ──────────────────────────────────────────────────── */}
        <section id="planos" className="py-28 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-700 mb-4 tracking-wide" style={{ letterSpacing: "0.05em" }}>
                Planos
              </p>
              <h2
                className="font-extrabold text-slate-950 mb-3"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.03em" }}
              >
                Sem surpresas. Sem contratos.
              </h2>
              <p className="text-slate-500 text-base">Cancele quando quiser. Seus dados sempre disponíveis.</p>
            </FadeIn>

            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {PLANS.map((p) => (
                <FadeIn key={p.name}>
                  <div
                    className="plan-card relative rounded-2xl p-8 h-full border"
                    style={
                      p.highlight
                        ? { borderColor: "#1d4ed8", background: "#f8faff", boxShadow: "0 12px 40px -12px rgba(29, 78, 216, 0.18)" }
                        : { borderColor: "#e2e8f0", background: "#ffffff", boxShadow: "0 4px 16px -6px rgba(0,0,0,0.06)" }
                    }
                  >
                    {p.highlight && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                          Mais popular
                        </span>
                      </div>
                    )}

                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">{p.name}</p>

                    <div className="mb-1">
                      <span
                        className="font-extrabold text-slate-950"
                        style={{ fontSize: "2.75rem", letterSpacing: "-0.04em", lineHeight: 1 }}
                      >
                        R${p.price}
                      </span>
                      <span className="text-sm text-slate-400 ml-1.5">/mês</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-7 leading-relaxed">{p.desc}</p>

                    <ul className="space-y-2.5 mb-8">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-blue-600" : "text-slate-400"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link to="/cadastro" className="block">
                      <button
                        className="btn-glow w-full py-3 rounded-lg font-semibold text-sm transition-colors"
                        style={
                          p.highlight
                            ? { background: "#1d4ed8", color: "#ffffff" }
                            : { background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }
                        }
                      >
                        Começar com {p.name}
                      </button>
                    </Link>
                  </div>
                </FadeIn>
              ))}
            </div>

            <p className="text-center text-sm text-slate-400">
              Dúvidas? Fale com a gente em{" "}
              <a href="mailto:gestclin@gmail.com" className="text-blue-700 hover:underline font-medium">
                gestclin@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2
                className="font-extrabold text-slate-950"
                style={{ fontSize: "clamp(22px, 3vw, 36px)", letterSpacing: "-0.03em" }}
              >
                Perguntas frequentes
              </h2>
            </FadeIn>

            <div className="space-y-2">
              {faqs.map((item, i) => (
                <FadeIn key={i} delay={i * 40}>
                  <div
                    className="faq-item rounded-xl border border-slate-100 bg-white overflow-hidden"
                    style={{ boxShadow: "0 2px 8px -4px rgba(0,0,0,0.05)" }}
                  >
                    <button
                      className="w-full flex items-center justify-between px-6 py-4 text-left"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="font-medium text-slate-900 text-[15px] pr-4">{item.q}</span>
                      <ChevronDown
                        className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === i ? "rotate(180deg)" : "none" }}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5">
                        <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA FINAL ───────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-white">
          <FadeIn className="max-w-2xl mx-auto text-center">
            <h2
              className="font-extrabold text-slate-950 mb-5 leading-tight"
              style={{ fontSize: "clamp(30px, 4.5vw, 54px)", letterSpacing: "-0.04em", textWrap: "balance" }}
            >
              Sua clínica mais organizada começa hoje.
            </h2>
            <p className="text-slate-500 text-base mb-10 leading-relaxed">
              Comece agora e veja a diferença em menos de 24 horas.
              Sem cartão de crédito, sem burocracia.
            </p>
            <Link to="/cadastro">
              <button className="btn-glow inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-base">
                Criar conta gratuitamente
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </FadeIn>
        </section>

        {/* ─── FOOTER ──────────────────────────────────────────────────── */}
        <footer className="bg-slate-950 py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-10">
              <div>
                <GestCliniLogo size="md" variant="dark" />
                <p className="text-slate-400 text-sm mt-3 max-w-xs leading-relaxed">
                  Sistema de gestão odontológica para dentistas que levam a clínica a sério.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">Produto</p>
                  <ul className="space-y-2.5">
                    {["Recursos", "Planos", "Segurança"].map((l) => (
                      <li key={l}><a href="#planos" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">Conta</p>
                  <ul className="space-y-2.5">
                    <li><Link to="/cadastro" className="text-slate-400 text-sm hover:text-white transition-colors">Criar conta</Link></li>
                    <li><Link to="/login"    className="text-slate-400 text-sm hover:text-white transition-colors">Entrar</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">Suporte</p>
                  <ul className="space-y-2.5">
                    <li>
                      <a href="mailto:gestclin@gmail.com" className="text-slate-400 text-sm hover:text-white transition-colors">
                        gestclin@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-slate-500 text-sm">© {new Date().getFullYear()} GestClini. Todos os direitos reservados.</p>
              <p className="text-slate-600 text-xs">Feito para dentistas brasileiros.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
