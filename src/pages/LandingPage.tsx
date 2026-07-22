import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GestCliniLogo } from "@/components/GestCliniLogo";
import {
  ArrowRight, ChevronRight, ChevronDown,
  DollarSign, TrendingUp, TrendingDown, Users,
  CheckCircle2, Clock, CalendarDays,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── SMOOTH SCROLL (native CSS) ────────────────────────────────────────────── */
// Lenis removed: it conflicts with GSAP ScrollTrigger position tracking.
// Native scroll with `scroll-behavior: smooth` is used instead.

/* ─── SCROLL REVEALS via IntersectionObserver ───────────────────────────────── */

function useScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fade-up reveals
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "none";
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll<HTMLElement>(".gs-reveal").forEach((el) => {
      if (!reduced) {
        el.style.opacity = "0";
        el.style.transform = "translateY(36px)";
        el.style.transition = "opacity 0.75s ease, transform 0.75s ease";
      }
      obs.observe(el);
    });

    // Stagger children
    const obsS = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          Array.from(e.target.children).forEach((child, i) => {
            const el = child as HTMLElement;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "none";
            }, i * 110);
          });
          obsS.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll<HTMLElement>(".gs-stagger").forEach((parent) => {
      Array.from(parent.children).forEach((child) => {
        const el = child as HTMLElement;
        if (!reduced) {
          el.style.opacity = "0";
          el.style.transform = "translateY(28px)";
          el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
        }
      });
      obsS.observe(parent);
    });

    // Counting numbers
    const obsC = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const end    = Number(el.dataset.end ?? 0);
        const suffix = el.dataset.suffix ?? "";
        const dur = 1600;
        const t0  = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - t0) / dur, 1);
          el.textContent = `${Math.round((1 - Math.pow(1 - p, 3)) * end).toLocaleString("pt-BR")}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obsC.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll<HTMLElement>(".gs-count").forEach((el) => obsC.observe(el));

    // Hero parallax (GSAP only for scrub effect, no opacity manipulation)
    if (!reduced) {
      const ctx = gsap.context(() => {
        gsap.to(".hero-img", {
          yPercent: 18, ease: "none",
          scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
        });
      });
      return () => {
        obs.disconnect(); obsS.disconnect(); obsC.disconnect();
        ctx.revert();
      };
    }

    return () => { obs.disconnect(); obsS.disconnect(); obsC.disconnect(); };
  }, []);
}

/* ─── MOCKUP: DASHBOARD ──────────────────────────────────────────────────────── */

function DashboardMockup() {
  const retornos = [
    { nome: "Maria Silva",  diff:  2 },
    { nome: "João Costa",   diff:  3 },
    { nome: "Ana Ferreira", diff: -2 },
  ];
  const meses = [
    { m: "Mar", rec: 32, desp: 18 }, { m: "Abr", rec: 41, desp: 22 },
    { m: "Mai", rec: 36, desp: 20 }, { m: "Jun", rec: 48, desp: 25 },
    { m: "Jul", rec: 39, desp: 14 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.14),0 0 0 1px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-1.5 px-5 py-3 bg-stone-50 border-b border-stone-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-stone-400">gestclini.com.br — Dashboard</span>
      </div>
      <div className="flex">
        <div className="w-28 bg-slate-900 py-3 shrink-0 hidden sm:block">
          <div className="px-3 mb-4">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">G</span>
            </div>
          </div>
          {["Dashboard", "Agenda", "Pacientes", "Receitas", "Estoque"].map((label, i) => (
            <div key={label} className={`mx-1.5 px-2 py-1.5 rounded-md mb-0.5 text-[10px] font-medium ${i === 0 ? "bg-white/10 text-white" : "text-slate-400"}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 space-y-3 min-w-0">
          <div>
            <p className="text-sm font-bold text-stone-800">Dashboard</p>
            <p className="text-[10px] text-stone-400">Terça-feira, 22 de julho</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Faturamento",   value: "R$ 38.700", icon: DollarSign,  c: "text-blue-600",    bg: "bg-blue-50"    },
              { label: "Lucro Líquido", value: "R$ 24.600", icon: TrendingUp,  c: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Despesas",      value: "R$ 14.100", icon: TrendingDown, c: "text-amber-600",  bg: "bg-amber-50"   },
              { label: "Pacientes",     value: "128",        icon: Users,       c: "text-violet-600",  bg: "bg-violet-50"  },
            ].map((k) => (
              <div key={k.label} className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                <div className={`w-6 h-6 rounded-lg ${k.bg} flex items-center justify-center mb-1.5`}>
                  <k.icon className={`h-3 w-3 ${k.c}`} />
                </div>
                <p className="text-[8px] text-stone-400 leading-tight mb-0.5">{k.label}</p>
                <p className={`text-[11px] font-extrabold ${k.c} leading-none`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              <p className="text-[10px] font-bold text-blue-700">Pacientes para Retorno</p>
            </div>
            <div className="space-y-1">
              {retornos.map((r) => (
                <div key={r.nome} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-stone-100">
                  <span className="text-[9px] font-semibold text-stone-700">{r.nome}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: r.diff < 0 ? "#fee2e2" : "#dbeafe", color: r.diff < 0 ? "#dc2626" : "#1d4ed8" }}>
                    {r.diff < 0 ? `${Math.abs(r.diff)}d atrasado` : `em ${r.diff}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-stone-500 mb-3">Receitas vs Despesas</p>
            <div className="flex items-end gap-2 h-12">
              {meses.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="flex items-end gap-0.5 w-full">
                    <div className="flex-1 rounded-sm bg-blue-500" style={{ height: `${(m.rec / 48) * 44}px` }} />
                    <div className="flex-1 rounded-sm bg-amber-300" style={{ height: `${(m.desp / 48) * 44}px` }} />
                  </div>
                  <span className="text-[8px] text-stone-400">{m.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MOCKUP: AGENDA ─────────────────────────────────────────────────────────── */

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
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-1.5 px-5 py-3 bg-stone-50 border-b border-stone-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-stone-400">gestclini.com.br — Agenda</span>
      </div>
      <div className="flex">
        <div className="w-24 bg-slate-900 py-3 shrink-0 hidden sm:block">
          {[{ label: "Dashboard" }, { label: "Agenda", a: true }, { label: "Pacientes" }, { label: "Receitas" }].map((item) => (
            <div key={item.label} className={`mx-1.5 px-2 py-1.5 rounded-md mb-0.5 text-[10px] font-medium ${item.a ? "bg-white/10 text-white" : "text-slate-400"}`}>
              {item.label}
            </div>
          ))}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-stone-800">Semana de 21 a 25 de julho</p>
          </div>
          <div className="flex gap-1">
            <div className="w-8 shrink-0 pt-6">
              {times.map((t) => (
                <div key={t} className="text-[8px] text-stone-400 leading-none mb-5">{t}</div>
              ))}
            </div>
            {days.map((day, di) => {
              const dayAppts = appts.filter((a) => a.day === di);
              return (
                <div key={day} className="flex-1 min-w-0">
                  <div className={`text-center mb-1 py-1 rounded-lg ${di === 1 ? "bg-blue-600" : ""}`}>
                    <p className={`text-[8px] font-semibold ${di === 1 ? "text-blue-100" : "text-stone-400"}`}>{day}</p>
                    <p className={`text-[10px] font-bold ${di === 1 ? "text-white" : "text-stone-700"}`}>{dates[di]}</p>
                  </div>
                  <div className="space-y-1">
                    {times.map((_, si) => {
                      const appt = dayAppts.find((a) => a.slot === si);
                      return appt ? (
                        <div key={si} className="h-8 rounded-md px-1.5 py-1 border"
                          style={{ background: appt.color, borderColor: appt.border }}>
                          <p className="text-[8px] font-semibold leading-tight truncate" style={{ color: appt.text }}>{appt.name}</p>
                          <p className="text-[7px] leading-tight" style={{ color: appt.text, opacity: 0.7 }}>{appt.type}</p>
                        </div>
                      ) : (
                        <div key={si} className="h-8 rounded-md border border-dashed border-stone-100" />
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

/* ─── MOCKUP: PRONTUÁRIO ─────────────────────────────────────────────────────── */

function ProntuarioMockup() {
  const patients = [
    { name: "Ana Ferreira",  tag: "Retorno em 2d", tagColor: "#dbeafe", tagText: "#1d4ed8" },
    { name: "Carlos Lima",   tag: "Consulta hoje", tagColor: "#dcfce7", tagText: "#15803d" },
    { name: "Beatriz Ramos", tag: "Prontuário OK", tagColor: "#f0fdf4", tagText: "#15803d" },
    { name: "Pedro Santos",  tag: "Pendente",      tagColor: "#fef9c3", tagText: "#a16207" },
  ];
  const notes = [
    { date: "18/07/2025", text: "Restauração dente 16 concluída. Paciente sem dor. Retorno em 3 dias para verificar oclusão." },
    { date: "05/07/2025", text: "Avaliação inicial. Necessita restauração no dente 16 e limpeza periódica. Agendado." },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden w-full"
      style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-1.5 px-5 py-3 bg-stone-50 border-b border-stone-100">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-amber-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-stone-400">gestclini.com.br — Pacientes</span>
      </div>
      <div className="flex">
        <div className="w-36 border-r border-stone-100 p-2 shrink-0">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide px-1 mb-2">Pacientes</p>
          {patients.map((p, i) => (
            <div key={p.name} className={`rounded-lg px-2 py-1.5 mb-1 ${i === 0 ? "bg-blue-50 border border-blue-100" : ""}`}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${i === 0 ? "bg-blue-600 text-white" : "bg-stone-200 text-stone-600"}`}>
                  {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-semibold truncate ${i === 0 ? "text-blue-700" : "text-stone-700"}`}>{p.name}</p>
                  <span className="text-[7px] px-1 py-0.5 rounded font-medium" style={{ background: p.tagColor, color: p.tagText }}>{p.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-bold text-stone-900">Ana Ferreira</p>
              <p className="text-[9px] text-stone-400">34 anos · (48) 99812-3456</p>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">Retorno em 2d</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Consultas", value: "8", icon: CalendarDays },
              { label: "Próx. retorno", value: "22/07", icon: Clock },
              { label: "Pendências", value: "0", icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                <s.icon className="h-3 w-3 text-blue-500 mb-1" />
                <p className="text-[11px] font-bold text-stone-800">{s.value}</p>
                <p className="text-[8px] text-stone-400">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">Prontuário</p>
          <div className="space-y-1.5">
            {notes.map((n) => (
              <div key={n.date} className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                <p className="text-[8px] text-stone-400 mb-0.5">{n.date}</p>
                <p className="text-[9px] text-stone-700 leading-snug">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────────────────────────────── */

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden" style={{ background: "#f9f8f7" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left gap-3"
        style={{ padding: "20px 24px", background: "none", border: "none", cursor: "pointer" }}
      >
        <span className="font-semibold text-[15px]" style={{ color: "#1a1917" }}>{q}</span>
        <ChevronDown
          size={18}
          color="#78716c"
          style={{ flexShrink: 0, transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      <div style={{
        maxHeight: open ? 200 : 0,
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
      }}>
        <p style={{ padding: "0 24px 20px", fontSize: 14, color: "#78716c", lineHeight: 1.75 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── DADOS ──────────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: "Básico", price: "59,90",
    desc: "Para dentistas que querem organizar agenda e prontuários sem complicação.",
    highlight: false,
    features: ["Agenda completa", "Prontuário eletrônico", "Cadastro de pacientes", "Documentos e atestados", "Suporte por e-mail"],
  },
  {
    name: "Completo", price: "89,90",
    desc: "Para clínicas que querem controle total — do atendimento ao financeiro.",
    highlight: true, badge: "Mais popular",
    features: ["Tudo do plano Básico", "Financeiro completo", "Controle de estoque", "Relatórios avançados", "Parcelamento inteligente", "Suporte prioritário"],
  },
];

const TESTIMONIALS = [
  { quote: "Gastei semanas tentando montar uma planilha de controle financeiro. O GestClini fez isso em minutos — e ainda me mostra exatamente para onde o dinheiro vai.", name: "Dr. André Melo", role: "Ortodontia · São Paulo/SP" },
  { quote: "Em dois dias já tinha a clínica toda organizada. Agenda, pacientes, prontuários. O que mais me surpreendeu foi como é simples — sem precisar de manual.", name: "Dra. Camila Freitas", role: "Clínica Geral · Florianópolis/SC" },
];

const FAQS = [
  { q: "Preciso de conhecimento técnico para começar?", a: "Não. O GestClini foi desenhado para que qualquer dentista consiga usar desde o primeiro dia, sem treinamento. A maioria dos nossos clientes está operando em menos de uma hora." },
  { q: "Meus dados ficam seguros?", a: "Sim. Todos os dados são armazenados com criptografia em servidores seguros. Você pode exportar suas informações quando quiser — sem fidelidade forçada." },
  { q: "Posso usar no celular ou tablet?", a: "Sim. O sistema funciona em qualquer dispositivo com navegador — computador, notebook, tablet ou celular." },
  { q: "E se eu precisar cancelar?", a: "Sem burocracia. Cancele quando quiser, sem multa e sem contrato de fidelidade. Seus dados ficam disponíveis por 30 dias após o cancelamento." },
];

/* ─── REUTILIZÁVEL: FeatureSection ───────────────────────────────────────────── */

function FeatureSection({
  tag, title, body, bullets, mockup, reverse = false, bg = "#F5F4F0",
}: {
  tag: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode;
  reverse?: boolean; bg?: string;
}) {
  return (
    <section style={{ padding: "112px 24px", background: bg }}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center`}>
          <div className={`gs-reveal ${reverse ? "lg:order-2" : ""}`}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1d4ed8", marginBottom: 16 }}>{tag}</p>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, color: "#1a1917", letterSpacing: "-0.035em", lineHeight: 1.15, textWrap: "balance", marginBottom: 20 }}>
              {title}
            </h2>
            <p style={{ fontSize: 16, color: "#78716c", lineHeight: 1.7, marginBottom: 32 }}>{body}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {bullets.map((b) => (
                <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: "#44403c" }}>
                  <CheckCircle2 size={18} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className={`gs-reveal ${reverse ? "lg:order-1" : ""}`}>{mockup}</div>
        </div>
      </div>
    </section>
  );
}

/* ─── PÁGINA ─────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useScrollReveal();

  // Nav: transparent over hero, off-white when scrolled
  useEffect(() => {
    const fn = () => {
      const scrolled = window.scrollY > 24;
      const el = navRef.current;
      if (!el) return;
      el.style.background   = scrolled ? "rgba(245,244,240,0.9)" : "transparent";
      el.style.backdropFilter = scrolled ? "blur(20px)" : "none";
      el.style.borderBottom = scrolled ? "1px solid rgba(0,0,0,0.06)" : "none";
      el.style.boxShadow    = scrolled ? "0 1px 24px -4px rgba(0,0,0,0.07)" : "none";
      // Nav link colour
      el.querySelectorAll<HTMLElement>(".nav-link").forEach((a) => {
        a.style.color = scrolled ? "#374151" : "rgba(255,255,255,0.7)";
      });
      el.querySelectorAll<HTMLElement>(".nav-enter").forEach((a) => {
        a.style.color = scrolled ? "#374151" : "rgba(255,255,255,0.7)";
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Hero entrance handled by CSS keyframes (see style block below)

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{background:#F5F4F0;margin:0}
        .lp{font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#1a1917;background:#F5F4F0}
        @keyframes heroFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .hero-badge   {animation:heroFadeUp .6s ease .15s both}
        .hero-headline{animation:heroFadeUp .7s cubic-bezier(.16,1,.3,1) .35s both}
        .hero-sub     {animation:heroFadeUp .65s ease .6s both}
        .hero-ctas    {animation:heroFadeUp .6s ease .8s both}
        .hero-stats   {animation:heroFadeUp .55s ease .95s both}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:#1d4ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;border:none;cursor:pointer;transition:background .18s,transform .18s,box-shadow .18s;text-decoration:none}
        .btn-primary:hover{background:#1e40af;transform:translateY(-2px);box-shadow:0 8px 24px -6px rgba(29,78,216,.5)}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.75);font-weight:600;font-size:15px;padding:14px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.2);cursor:pointer;transition:color .15s,border-color .15s,background .15s;text-decoration:none}
        .btn-ghost:hover{color:#fff;border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.06)}
        .plan-card{transition:transform .25s ease,box-shadow .25s ease}
        .plan-card:hover{transform:translateY(-5px)}
        .nav-link{text-decoration:none;font-size:14px;font-weight:500;transition:color .15s}
        .nav-link:hover{color:#fff!important}
        .nav-enter{font-size:14px;font-weight:600;text-decoration:none;padding:6px 12px;transition:color .15s}
        @media(prefers-reduced-motion:reduce){.hero-badge,.hero-headline,.hero-sub,.hero-ctas,.hero-stats,.gs-reveal{opacity:1!important;transform:none!important}.hero-img{transform:none!important}}
      `}</style>

      <div className="lp">

        {/* ─── NAV ──────────────────────────────────────────────────────── */}
        <nav ref={navRef} style={{ position: "fixed", inset: "0 0 auto", zIndex: 50, transition: "background .3s,backdrop-filter .3s,box-shadow .3s,border-bottom .3s" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <GestCliniLogo size="md" variant="light" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="nav-link">Como funciona</a>
              <a href="#planos" className="nav-link">Planos</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="nav-enter hidden sm:block">Entrar</Link>
              <Link to="/cadastro">
                <button className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>Começar grátis</button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        <section className="hero-section" style={{ position: "relative", minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
          <img src="/hero-clinica.webp" alt="" aria-hidden className="hero-img"
            style={{ position: "absolute", inset: 0, width: "100%", height: "115%", objectFit: "cover", objectPosition: "center", top: "-8%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,9,8,.92) 0%, rgba(10,9,8,.52) 52%, rgba(10,9,8,.15) 100%)" }} />

          <div style={{ position: "relative", zIndex: 2, maxWidth: 1152, margin: "auto auto 0", padding: "0 24px 88px", width: "100%" }}>
            <p className="hero-badge" style={{ display: "inline-block", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 20 }}>
              Sistema de Gestão Odontológica
            </p>

            <h1 className="hero-headline" style={{ fontSize: "clamp(38px,6.5vw,80px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-0.04em", maxWidth: 720, textWrap: "balance", margin: "0 0 24px" }}>
              A clínica que você construiu.<br />A gestão que ela merece.
            </h1>

            <p className="hero-sub" style={{ fontSize: "clamp(16px,1.8vw,20px)", color: "rgba(255,255,255,.62)", lineHeight: 1.65, maxWidth: 500, marginBottom: 36 }}>
              GestClini organiza agenda, prontuários e financeiro em um único lugar —
              para que você gaste menos tempo com papelada e mais com quem importa.
            </p>

            <div className="hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link to="/cadastro"><button className="btn-primary">Começar gratuitamente <ArrowRight size={16} /></button></Link>
              <a href="#como-funciona"><button className="btn-ghost">Ver como funciona <ChevronRight size={16} /></button></a>
            </div>

            <div className="hero-stats" style={{ display: "flex", flexWrap: "wrap", gap: "24px 40px", marginTop: 40 }}>
              {[
                { value: "+200", label: "dentistas ativos" },
                { value: "−3h",  label: "tarefas admin/dia" },
                { value: "1 dia", label: "para estar operacional" },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", letterSpacing: "0.08em" }}>scroll</span>
            <ChevronDown size={14} color="rgba(255,255,255,.35)" />
          </div>
        </section>

        {/* ─── PROBLEMA ─────────────────────────────────────────────────── */}
        <section style={{ padding: "112px 24px", background: "#F5F4F0" }}>
          <div className="max-w-5xl mx-auto">
            <div className="gs-reveal text-center mb-16">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1d4ed8", marginBottom: 16 }}>O problema</p>
              <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 800, color: "#1a1917", letterSpacing: "-0.035em", textWrap: "balance", lineHeight: 1.15, marginBottom: 20 }}>
                Quanto tempo da sua semana<br />você passa administrando — não atendendo?
              </h2>
              <p style={{ fontSize: 17, color: "#78716c", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
                Planilhas, fichas físicas, agendas de papel. A maioria dos dentistas perde até 3 horas por dia
                em tarefas que um sistema certo poderia eliminar.
              </p>
            </div>
            <div className="gs-stagger grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { emoji: "📋", title: "Fichas físicas", body: "Perdidas, ilegíveis ou impossíveis de encontrar na hora que você mais precisa." },
                { emoji: "💸", title: "Financeiro no escuro", body: "Sem saber ao certo se o mês fechou no azul ou no vermelho — até o extrato chegar." },
                { emoji: "📅", title: "Retornos perdidos", body: "Pacientes que somem porque ninguém avisou sobre o retorno agendado." },
              ].map((item) => (
                <div key={item.title} style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 32px", border: "1px solid #e7e5e4", boxShadow: "0 2px 12px -4px rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>{item.emoji}</span>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1917", marginBottom: 8 }}>{item.title}</p>
                  <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.65 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── NÚMEROS ─────────────────────────────────────────────────── */}
        <section id="como-funciona" style={{ padding: "96px 24px", background: "#1a1917" }}>
          <div className="max-w-5xl mx-auto">
            <div className="gs-reveal text-center mb-16">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 16 }}>O que muda na prática</p>
              <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", textWrap: "balance", lineHeight: 1.15 }}>
                Menos administração.<br />Mais resultado.
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 1, background: "rgba(255,255,255,.08)", borderRadius: 20, overflow: "hidden" }}>
              {[
                { end: 200, suffix: "+",   label: "dentistas ativos",          desc: "Que já saíram das planilhas e assumiram o controle da clínica." },
                { end: 3,   suffix: "h",   label: "economizadas por dia",      desc: "Em tarefas administrativas que antes consumiam seu tempo." },
                { end: 1,   suffix: "º dia", label: "para estar operacional",  desc: "Agenda e pacientes organizados desde o primeiro acesso." },
              ].map((item, i) => (
                <div key={i} style={{ background: "#242220", padding: "44px 36px" }}>
                  <p className="gs-count" data-end={item.end} data-suffix={item.suffix}
                    style={{ fontSize: "clamp(40px,5vw,60px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
                    0{item.suffix}
                  </p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#60a5fa", marginBottom: 10 }}>{item.label}</p>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─────────────────────────────────────────────────── */}
        <FeatureSection
          tag="Agenda" bg="#F5F4F0"
          title="Nunca mais perca um horário, um retorno ou uma consulta."
          body="Visão semanal completa, sem conflitos. Saiba exatamente o que acontece em cada hora do dia — de um relance."
          bullets={["Visão semanal e diária em um clique", "Alertas automáticos de retorno", "Histórico completo de cada atendimento"]}
          mockup={<AgendaMockup />}
          reverse
        />

        <FeatureSection
          tag="Pacientes e Prontuário" bg="#fff"
          title="O histórico de cada paciente, sempre ao seu alcance."
          body="Chega de procurar fichas físicas. Em segundos você acessa tudo: tratamentos, anotações, documentos e o próximo retorno."
          bullets={["Prontuário clínico completo e sempre atualizado", "Documentos e atestados em um clique", "Controle de retornos e pendências"]}
          mockup={<ProntuarioMockup />}
        />

        <FeatureSection
          tag="Financeiro" bg="#F5F4F0"
          title="No fim do mês, você vai saber exatamente quanto a clínica lucrou."
          body="Receitas, despesas e lucro atualizados em tempo real. Decisões com base em números reais — não em estimativas."
          bullets={["Visão clara de receitas, despesas e lucro líquido", "Gráficos mensais de crescimento", "Controle de taxas de cartão e parcelamentos"]}
          mockup={<DashboardMockup />}
          reverse
        />

        {/* ─── DEPOIMENTOS ─────────────────────────────────────────────── */}
        <section style={{ padding: "112px 24px", background: "#1a1917" }}>
          <div className="max-w-5xl mx-auto">
            <div className="gs-reveal text-center mb-16">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 16 }}>O que dizem os dentistas</p>
              <h2 style={{ fontSize: "clamp(26px,4vw,46px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", textWrap: "balance", lineHeight: 1.15 }}>
                A diferença que você sente<br />no dia a dia.
              </h2>
            </div>
            <div className="gs-stagger grid grid-cols-1 sm:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{ background: "#242220", borderRadius: 20, padding: "36px", border: "1px solid rgba(255,255,255,.07)" }}>
                  <p style={{ fontSize: 32, lineHeight: 1, color: "#60a5fa", marginBottom: 16 }}>"</p>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,.72)", lineHeight: 1.75, fontStyle: "italic", marginBottom: 28 }}>{t.quote}</p>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 20 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{t.name}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PLANOS ──────────────────────────────────────────────────── */}
        <section id="planos" style={{ padding: "112px 24px", background: "#F5F4F0" }}>
          <div className="max-w-3xl mx-auto">
            <div className="gs-reveal text-center mb-14">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1d4ed8", marginBottom: 16 }}>Planos</p>
              <h2 style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 800, color: "#1a1917", letterSpacing: "-0.035em", textWrap: "balance", lineHeight: 1.15, marginBottom: 10 }}>Simples. Sem surpresas.</h2>
              <p style={{ fontSize: 16, color: "#78716c" }}>Sem contrato. Cancele quando quiser.</p>
            </div>
            <div className="gs-stagger grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLANS.map((plan) => (
                <div key={plan.name} className="plan-card" style={{
                  background: plan.highlight ? "#1a1917" : "#fff",
                  borderRadius: 20, padding: "36px 32px 40px",
                  border: plan.highlight ? "2px solid #2563eb" : "1px solid #e7e5e4",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 24px 60px -16px rgba(29,78,216,.25)" : "0 4px 24px -8px rgba(0,0,0,.06)",
                }}>
                  {plan.badge && (
                    <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {plan.badge}
                    </span>
                  )}
                  <p style={{ fontWeight: 700, fontSize: 18, color: plan.highlight ? "#fff" : "#1a1917", marginBottom: 8 }}>{plan.name}</p>
                  <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.5)" : "#78716c", lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
                  <div style={{ marginBottom: 28 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: plan.highlight ? "rgba(255,255,255,.45)" : "#a8a29e" }}>R$&nbsp;</span>
                    <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", color: plan.highlight ? "#fff" : "#1a1917" }}>{plan.price}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: plan.highlight ? "rgba(255,255,255,.45)" : "#a8a29e" }}>/mês</span>
                  </div>
                  <Link to="/cadastro" style={{ display: "block", marginBottom: 28 }}>
                    <button style={{
                      width: "100%", padding: "12px 0", fontSize: 15, fontWeight: 700, borderRadius: 10, cursor: "pointer",
                      background: plan.highlight ? "#2563eb" : "transparent",
                      color: plan.highlight ? "#fff" : "#1d4ed8",
                      border: plan.highlight ? "none" : "1.5px solid #2563eb",
                      transition: "background .18s",
                    }}>
                      Começar grátis
                    </button>
                  </Link>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: plan.highlight ? "rgba(255,255,255,.72)" : "#44403c" }}>
                        <CheckCircle2 size={15} color={plan.highlight ? "#60a5fa" : "#2563eb"} style={{ flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "96px 24px", background: "#fff" }}>
          <div className="max-w-2xl mx-auto">
            <div className="gs-reveal text-center mb-12">
              <h2 style={{ fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 800, color: "#1a1917", letterSpacing: "-0.035em", textWrap: "balance", lineHeight: 1.2 }}>
                Perguntas frequentes
              </h2>
            </div>
            <div className="gs-reveal" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA FINAL ───────────────────────────────────────────────── */}
        <section style={{ padding: "120px 24px", background: "#1a1917", textAlign: "center" }}>
          <div className="max-w-xl mx-auto gs-reveal">
            <h2 style={{ fontSize: "clamp(30px,5vw,58px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", textWrap: "balance", lineHeight: 1.1, marginBottom: 20 }}>
              Pronto para assumir<br />o controle da sua clínica?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.52)", lineHeight: 1.7, marginBottom: 40 }}>
              Comece gratuitamente hoje. Configure em minutos,<br />sem cartão de crédito exigido.
            </p>
            <Link to="/cadastro">
              <button className="btn-primary" style={{ fontSize: 16, padding: "16px 36px" }}>
                Começar gratuitamente <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </section>

        {/* ─── FOOTER ──────────────────────────────────────────────────── */}
        <footer style={{ padding: "36px 24px", background: "#111110", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <GestCliniLogo size="sm" variant="light" />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>© {new Date().getFullYear()} GestClini. Todos os direitos reservados.</p>
            <div style={{ display: "flex", gap: 24 }}>
              <Link to="/login"   style={{ fontSize: 13, color: "rgba(255,255,255,.38)", textDecoration: "none" }}>Entrar</Link>
              <Link to="/cadastro" style={{ fontSize: 13, color: "rgba(255,255,255,.38)", textDecoration: "none" }}>Criar conta</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
