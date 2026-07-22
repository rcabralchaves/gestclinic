import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GestCliniLogo } from "@/components/GestCliniLogo";
import {
  CalendarDays, Users, DollarSign, BarChart3, ClipboardList,
  Package, ArrowRight, CheckCircle2, TrendingUp, TrendingDown,
  ChevronRight, Star, Clock, Activity
} from "lucide-react";

/* ─── DADOS ─────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    desc: "Consultas organizadas com drag-and-drop, alertas e confirmações automáticas.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Prontuário eletrônico",
    desc: "Histórico completo de cada paciente: anamnese, fotos, tratamentos e mais.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: DollarSign,
    title: "Financeiro em tempo real",
    desc: "Receitas, despesas e lucro atualizados automaticamente. Visão clara do negócio.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: ClipboardList,
    title: "Anamnese digital",
    desc: "Formulários personalizáveis, assinados digitalmente e salvos com segurança.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Package,
    title: "Controle de estoque",
    desc: "Alertas de mínimo, validade e movimentação de materiais e medicamentos.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: BarChart3,
    title: "Relatórios em PDF",
    desc: "Exporte relatórios financeiros e clínicos com visual profissional.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
];

const plans = [
  {
    name: "Básico",
    price: "59,90",
    desc: "Para dentistas que querem organizar agenda e pacientes.",
    highlight: false,
    badge: null,
    features: [
      "Agenda completa",
      "Prontuário eletrônico",
      "Visualização de pacientes",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Completo",
    price: "89,90",
    desc: "Gestão total do consultório, do atendimento ao financeiro.",
    highlight: true,
    badge: "Mais popular",
    features: [
      "Tudo do plano Básico",
      "Controle financeiro completo",
      "Parcelamento inteligente",
      "Controle de estoque",
      "Relatórios avançados em PDF",
      "Suporte prioritário",
    ],
  },
];

/* ─── MOCKUP DASHBOARD ───────────────────────────────────────────────────── */

function DashboardMockup() {
  const retornos = [
    { nome: "Maria Silva", data: "22/07", diff: 2 },
    { nome: "João Costa", data: "23/07", diff: 3 },
    { nome: "Ana Ferreira", data: "18/07", diff: -2 },
  ];
  const aniversariantes = [
    { nome: "Carlos Lima", dia: 20, hoje: true },
    { nome: "Beatriz Ramos", dia: 24, hoje: false },
  ];
  const meses = [
    { m: "Mar", rec: 32, desp: 18 },
    { m: "Abr", rec: 41, desp: 22 },
    { m: "Mai", rec: 36, desp: 20 },
    { m: "Jun", rec: 48, desp: 25 },
    { m: "Jul", rec: 39, desp: 14 },
  ];
  const maxBar = 48;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Floating badge — retorno */}
      <div className="absolute -left-6 top-24 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 z-20 hidden lg:block"
        style={{ animation: "floatY 4s ease-in-out infinite" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Para retorno</p>
            <p className="text-sm font-bold text-gray-900 leading-none">3 pacientes</p>
          </div>
        </div>
      </div>
      {/* Floating badge — lucro */}
      <div className="absolute -right-6 top-28 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 z-20 hidden lg:block"
        style={{ animation: "floatY 4s ease-in-out infinite 2s" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Lucro Jul</p>
            <p className="text-sm font-bold text-emerald-700 leading-none">R$ 24.600</p>
          </div>
        </div>
      </div>

      {/* Main window */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 32px 80px -12px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)" }}>
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <span className="ml-3 text-xs text-gray-400 font-medium">gestclini.com.br — Dashboard</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <p className="text-sm font-bold text-gray-800">Dashboard</p>
            <p className="text-[10px] text-gray-400">Visão geral do seu consultório</p>
          </div>

          {/* 4 StatCards — fiel ao sistema real */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Faturamento Mensal", value: "R$ 38.700", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Lucro Líquido", value: "R$ 24.600", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Total Despesas", value: "R$ 14.100", icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Pacientes", value: "128", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
            ].map((k) => (
              <div key={k.label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <div className={`w-6 h-6 rounded-lg ${k.bg} flex items-center justify-center mb-1.5`}>
                  <k.icon className={`h-3 w-3 ${k.color}`} />
                </div>
                <p className="text-[8px] text-gray-400 leading-tight mb-0.5">{k.label}</p>
                <p className={`text-[11px] font-extrabold ${k.color} leading-none`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Pacientes para retorno */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              <p className="text-[10px] font-bold text-blue-700">Pacientes para Retorno</p>
            </div>
            <div className="space-y-1">
              {retornos.map((r) => (
                <div key={r.nome} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                  <span className="text-[9px] font-semibold text-gray-700">{r.nome}</span>
                  <span className="text-[8px]" style={{
                    background: r.diff < 0 ? "#fee2e2" : "#dbeafe",
                    color: r.diff < 0 ? "#dc2626" : "#2563eb",
                    padding: "2px 6px", borderRadius: 6, fontWeight: 600
                  }}>
                    {r.diff < 0 ? `${Math.abs(r.diff)}d atrasado` : `em ${r.diff}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico Receitas vs Despesas + Aniversariantes */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-600 mb-3">Receitas vs Despesas</p>
              <div className="flex items-end gap-2 h-14">
                {meses.map((m) => (
                  <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-end gap-0.5 w-full">
                      <div className="flex-1 rounded-sm bg-blue-400"
                        style={{ height: `${(m.rec / maxBar) * 48}px` }} />
                      <div className="flex-1 rounded-sm bg-amber-300"
                        style={{ height: `${(m.desp / maxBar) * 48}px` }} />
                    </div>
                    <span className="text-[8px] text-gray-400">{m.m}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-1.5">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-400"/><span className="text-[8px] text-gray-400">Receitas</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-300"/><span className="text-[8px] text-gray-400">Despesas</span></div>
              </div>
            </div>
            <div className="col-span-2 bg-pink-50/60 rounded-xl p-3 border border-pink-100">
              <div className="flex items-center gap-1 mb-2">
                <Activity className="h-3 w-3 text-pink-500" />
                <p className="text-[10px] font-bold text-pink-700">Aniversariantes</p>
              </div>
              {aniversariantes.map((a) => (
                <div key={a.nome} className="flex items-center justify-between bg-white rounded-lg px-2 py-1.5 border border-pink-100 mb-1">
                  <span className="text-[9px] font-semibold text-gray-700 truncate">{a.nome}</span>
                  {a.hoje
                    ? <span className="text-[8px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-bold">🎂 Hoje</span>
                    : <span className="text-[8px] text-gray-400">Dia {a.dia}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA ─────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-up   { animation: fadeUp 0.7s ease both; }
        .animate-fade-up-2 { animation: fadeUp 0.7s ease 0.12s both; }
        .animate-fade-up-3 { animation: fadeUp 0.7s ease 0.24s both; }
        .animate-fade-up-4 { animation: fadeUp 0.7s ease 0.36s both; }
        .animate-fade-in   { animation: fadeIn 1s ease 0.1s both; }
        .btn-primary {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.4);
        }
        .btn-secondary:hover {
          background: #f4f4f5;
        }
        .feature-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1);
          border-color: #e0e7ff;
        }
        .plan-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <GestCliniLogo size="md" variant="light" />
            <div className="hidden sm:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Recursos</a>
              <a href="#planos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Planos</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <button className="btn-secondary text-sm font-semibold text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors">
                  Entrar
                </button>
              </Link>
              <Link to="/cadastro">
                <button className="btn-primary text-sm font-bold text-white px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-600">
                  Começar grátis
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-white pt-20 pb-10 sm:pt-28 sm:pb-16">
          {/* Gradient orbs background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div style={{
              position: "absolute", top: -160, right: -120, width: 600, height: 600,
              background: "radial-gradient(circle, rgba(219,234,254,0.6) 0%, transparent 70%)",
              borderRadius: "50%"
            }} />
            <div style={{
              position: "absolute", top: 80, left: -100, width: 400, height: 400,
              background: "radial-gradient(circle, rgba(209,250,229,0.4) 0%, transparent 70%)",
              borderRadius: "50%"
            }} />
            <div style={{
              position: "absolute", bottom: -80, left: "30%", width: 500, height: 300,
              background: "radial-gradient(circle, rgba(237,233,254,0.35) 0%, transparent 70%)",
              borderRadius: "50%"
            }} />
          </div>

          <div className="relative max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-7">
                <Activity className="h-3.5 w-3.5" />
                Sistema de gestão para dentistas
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up-2 text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-950 tracking-tight leading-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
                Menos burocracia.<br />
                <span style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Mais tempo para atender.
                </span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-up-3 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                Agenda, prontuário eletrônico, financeiro e estoque<br className="hidden sm:block" />
                em uma plataforma pensada para dentistas.
              </p>

              {/* CTAs */}
              <div className="animate-fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/cadastro">
                  <button className="btn-primary inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-7 py-3.5 rounded-full text-base shadow-lg shadow-blue-500/30">
                    Começar grátis
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <a href="#planos">
                  <button className="btn-secondary inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-full text-base">
                    Ver planos
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </a>
              </div>

              {/* Social proof */}
              <p className="animate-fade-in mt-7 text-sm text-gray-400 font-medium">
                <span className="text-gray-600 font-semibold">+200 dentistas</span> já usam o GestClini
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="animate-fade-in">
              <DashboardMockup />
            </div>
          </div>
        </section>


        {/* ── FEATURES ── */}
        <section id="recursos" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Recursos</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-950 tracking-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
                Tudo que você precisa,<br />em um só lugar
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                Módulos integrados que funcionam juntos para simplificar sua rotina clínica.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="feature-card bg-white border border-gray-100 rounded-2xl p-7"
                  style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.06)" }}
                >
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-950 text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATEMENT SECTION ── */}
        <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-semibold text-blue-200 uppercase tracking-widest mb-5">Por que GestClini?</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6" style={{ letterSpacing: "-0.025em" }}>
              Menos burocracia.<br />Mais tempo para seus pacientes.
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto leading-relaxed">
              Dentistas que usam o GestClini economizam em média <strong className="text-white">3 horas por dia</strong> em tarefas administrativas.
            </p>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="planos" className="py-24 px-6 bg-[#FAFAFA]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Planos</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-950 tracking-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
                Simples e transparente
              </h2>
              <p className="text-gray-500 text-lg">
                Sem contratos longos. Cancele quando quiser.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`plan-card relative rounded-3xl p-8 ${
                    p.highlight
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-950"
                  }`}
                  style={
                    p.highlight
                      ? { boxShadow: "0 24px 60px -12px rgba(37, 99, 235, 0.45)" }
                      : { boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)" }
                  }
                >
                  {/* Badge */}
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md border border-blue-100">
                        <Star className="h-3 w-3 fill-blue-600" />
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${p.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {p.name}
                  </p>

                  <div className="mb-2">
                    <span className={`text-5xl font-extrabold ${p.highlight ? "text-white" : "text-gray-950"}`} style={{ letterSpacing: "-0.04em" }}>
                      R${p.price}
                    </span>
                    <span className={`text-sm font-medium ml-1 ${p.highlight ? "text-blue-200" : "text-gray-400"}`}>/mês</span>
                  </div>
                  <p className={`text-sm mb-8 leading-relaxed ${p.highlight ? "text-blue-200" : "text-gray-500"}`}>{p.desc}</p>

                  <ul className="space-y-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${p.highlight ? "text-blue-200" : "text-blue-600"}`} />
                        <span className={p.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/cadastro" className="block">
                    <button
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                        p.highlight
                          ? "bg-white text-blue-600 hover:bg-blue-50"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      style={{ transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                    >
                      Começar com {p.name}
                    </button>
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              Dúvidas? Fale com a gente pelo e-mail{" "}
              <a href="mailto:gestclin@gmail.com" className="text-blue-600 font-medium hover:underline">
                gestclin@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-gray-100 py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <GestCliniLogo size="md" variant="light" />
              <div className="flex items-center gap-8">
                <a href="#recursos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Recursos</a>
                <a href="#planos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Planos</a>
                <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Entrar</Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">© {new Date().getFullYear()} GestClini. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
