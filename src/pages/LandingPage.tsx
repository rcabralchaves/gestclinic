import { Link } from "react-router-dom";
import {
  CalendarDays, Users, DollarSign, BarChart3, ClipboardList, Package,
  CheckCircle2, ArrowRight, Shield, Zap, TrendingUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GestCliniLogo } from "@/components/GestCliniLogo";

const features = [
  { icon: DollarSign, title: "Controle Financeiro", desc: "Receitas, despesas e lucro em tempo real" },
  { icon: Users, title: "Gestão de Pacientes", desc: "Prontuário eletrônico completo e organizado" },
  { icon: CalendarDays, title: "Agenda Inteligente", desc: "Agendamento com drag & drop e alertas" },
  { icon: ClipboardList, title: "Anamnese Digital", desc: "Formulários editáveis com histórico" },
  { icon: Package, title: "Controle de Estoque", desc: "Materiais, alertas de mínimo e importação" },
  { icon: BarChart3, title: "Relatórios em PDF", desc: "Exportação profissional com gráficos" },
];

const benefits = [
  { icon: Zap, title: "Economize Tempo", desc: "Fluxo otimizado: agendar → atender → faturar em poucos cliques." },
  { icon: TrendingUp, title: "Aumente seu Lucro", desc: "Visão clara de receitas e despesas para decisões inteligentes." },
  { icon: Shield, title: "Controle Total", desc: "Todos os dados da clínica organizados em um só lugar." },
];

const plans = [
  {
    name: "Básico",
    price: "R$ 37",
    period: "/mês",
    desc: "Para controle financeiro essencial",
    highlight: false,
    features: [
      "Controle financeiro (entradas e despesas)",
      "Relatórios simples",
      "Visualização básica de pacientes",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Completo",
    price: "R$ 67",
    period: "/mês",
    desc: "Gestão completa da clínica",
    highlight: true,
    features: [
      "Agenda completa",
      "Pacientes e prontuário eletrônico",
      "Controle financeiro completo",
      "Parcelamento inteligente",
      "Controle de estoque",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GestCliniLogo size="md" variant="dark" />
          </div>
          <div className="flex items-center gap-3">
            <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Planos
            </a>
            <Link to="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Star className="h-4 w-4" /> Feito para dentistas
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold leading-tight tracking-tight">
              Sistema completo para{" "}
              <span className="text-primary">gestão de clínicas odontológicas</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Controle financeiro, prontuário eletrônico, agenda inteligente e muito mais.
              Tudo que sua clínica precisa para crescer — em uma plataforma rápida e intuitiva.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 text-base">
                  Começar agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#planos">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  Ver planos
                </Button>
              </a>
            </div>
          </div>

          {/* Demo preview */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-muted-foreground">gestclinic.app</span>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Faturamento", value: "R$ 38.700", color: "text-success" },
                  { label: "Despesas", value: "R$ 14.100", color: "text-destructive" },
                  { label: "Lucro", value: "R$ 24.600", color: "text-primary" },
                  { label: "Pacientes", value: "128", color: "text-foreground" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-lg sm:text-xl font-heading font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 border-t bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">Tudo que você precisa</h2>
            <p className="text-muted-foreground mt-2">Módulos integrados para gestão completa da sua clínica</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-20 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">Por que escolher GestClini?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 border-t bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-lg font-heading font-semibold">
            Usado por <span className="text-primary">clínicas odontológicas</span> que valorizam organização e crescimento
          </p>
          <div className="flex justify-center gap-8 mt-6 text-muted-foreground text-sm">
            <div><span className="text-2xl font-bold text-foreground">500+</span><br />Dentistas</div>
            <div><span className="text-2xl font-bold text-foreground">120+</span><br />Clínicas</div>
            <div><span className="text-2xl font-bold text-foreground">98%</span><br />Satisfação</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-16 sm:py-20 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">Planos simples e transparentes</h2>
            <p className="text-muted-foreground mt-2">Escolha o plano ideal para sua realidade</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 sm:p-8 relative ${
                  plan.highlight
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="font-heading font-bold text-xl">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-heading font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block mt-6">
                  <Button className={`w-full ${plan.highlight ? "gradient-primary text-primary-foreground" : ""}`} variant={plan.highlight ? "default" : "outline"}>
                    Começar agora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GestCliniLogo size="sm" variant="light" />
          </div>
          <p>© {new Date().getFullYear()} GestClini. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
