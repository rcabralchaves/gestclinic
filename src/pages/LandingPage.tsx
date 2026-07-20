import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GestCliniLogo } from "@/components/GestCliniLogo";
import {
  CalendarDays, Users, DollarSign, BarChart3, ClipboardList, Package,
  ArrowRight, CheckCircle2, ChevronRight
} from "lucide-react";

const features = [
  { icon: CalendarDays, title: "Agenda", desc: "Organize consultas com facilidade" },
  { icon: Users, title: "Pacientes", desc: "Prontuário eletrônico completo" },
  { icon: DollarSign, title: "Financeiro", desc: "Receitas, despesas e lucro em tempo real" },
  { icon: ClipboardList, title: "Anamnese", desc: "Formulários digitais editáveis" },
  { icon: Package, title: "Estoque", desc: "Materiais com alertas automáticos" },
  { icon: BarChart3, title: "Relatórios", desc: "Exportação profissional em PDF" },
];

const plans = [
  {
    name: "Básico",
    price: "37",
    desc: "Para controle financeiro essencial",
    highlight: false,
    features: [
      "Controle financeiro",
      "Relatórios simples",
      "Visualização de pacientes",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Completo",
    price: "67",
    desc: "Gestão completa da sua clínica",
    highlight: true,
    features: [
      "Agenda completa",
      "Prontuário eletrônico",
      "Financeiro completo",
      "Parcelamento inteligente",
      "Controle de estoque",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-body">

      {/* ── NAV ── */}
      <nav className="bg-black sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <GestCliniLogo size="md" variant="dark" />
          <div className="flex items-center gap-4">
            <a href="#planos" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              Planos
            </a>
            <Link to="/login">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-5">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-black text-white pt-24 pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-white/50 tracking-widest uppercase mb-6">
            Sistema de gestão odontológica
          </p>
          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold leading-tight tracking-tight mb-6">
            Sua clínica organizada.<br />
            <span className="text-white/40">Do início ao fim.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            Agenda, prontuário, financeiro e estoque em um só lugar.
            Feito para dentistas que querem focar no que realmente importa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/cadastro">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-8 text-base h-12">
                Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-8 text-base h-12">
                Ver planos <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="bg-black pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="ml-3 text-xs text-white/30">gestclini.com.br</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
              {[
                { label: "Faturamento", value: "R$ 38.700", color: "#22c55e" },
                { label: "Despesas", value: "R$ 14.100", color: "#ef4444" },
                { label: "Lucro líquido", value: "R$ 24.600", color: "#3b82f6" },
                { label: "Pacientes", value: "128", color: "#ffffff" },
              ].map((s) => (
                <div key={s.label} className="p-6 text-center">
                  <p className="text-xs text-white/40 mb-1">{s.label}</p>
                  <p className="text-xl font-heading font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-[#f8f8f8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0a0a0a] tracking-tight">
              Tudo que sua clínica precisa
            </h2>
            <p className="text-[#666] mt-3 text-base">Módulos integrados, prontos para usar</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#ebebeb] hover:border-black/20 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-heading font-bold text-[#0a0a0a] text-base mb-1">{f.title}</h3>
                <p className="text-sm text-[#888]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER STATEMENT ── */}
      <section className="py-20 px-6 bg-black text-white text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-2xl sm:text-3xl font-heading font-bold leading-snug">
            "Menos papelada.<br />
            <span className="text-white/40">Mais tempo para seus pacientes."</span>
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="planos" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0a0a0a] tracking-tight">
              Planos simples
            </h2>
            <p className="text-[#666] mt-3 text-base">Sem contratos. Cancele quando quiser.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 ${
                  p.highlight
                    ? "bg-black text-white border-black"
                    : "bg-white text-[#0a0a0a] border-[#ebebeb]"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${p.highlight ? "text-white/50" : "text-[#999]"}`}>
                  {p.name}
                </p>
                <div className="mb-1">
                  <span className={`text-4xl font-heading font-extrabold ${p.highlight ? "text-white" : "text-[#0a0a0a]"}`}>
                    R$ {p.price}
                  </span>
                  <span className={`text-sm ml-1 ${p.highlight ? "text-white/50" : "text-[#999]"}`}>/mês</span>
                </div>
                <p className={`text-sm mb-8 ${p.highlight ? "text-white/60" : "text-[#888]"}`}>{p.desc}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${p.highlight ? "text-white" : "text-black"}`} />
                      <span className={p.highlight ? "text-white/80" : "text-[#444]"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/cadastro" className="block">
                  <Button
                    className={`w-full rounded-full font-semibold h-11 ${
                      p.highlight
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-black text-white hover:bg-black/80"
                    }`}
                  >
                    Começar agora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <GestCliniLogo size="sm" variant="dark" />
          <p className="text-sm text-white/30">© {new Date().getFullYear()} GestClini. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
