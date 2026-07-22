/**
 * OnboardingFlow — fluxo de 4 fases para novos usuários.
 * Carregado via React.lazy() — zero impacto no bundle de usuários existentes.
 *
 * Fases:
 *   0 → Boas-vindas
 *   1 → Configuração da clínica
 *   2 → Tour guiado (SpotlightTour)
 *   3 → Conclusão  → markComplete()
 */

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Palette,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotlightTour, type TourStep } from "@/components/ui/SpotlightTour";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { COR_CLINICA_KEY, LOGO_CLINICA_KEY } from "@/lib/clinicStorage";
import { cn } from "@/lib/utils";

// ─── Etapas do tour (genérico, reutilizável) ─────────────────────────────────

const TOUR_BASE: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: "Dashboard",
    description:
      "Visão geral do consultório em tempo real: retornos, aniversariantes e desempenho.",
    placement: "right",
  },
  {
    target: '[data-tour="agenda"]',
    title: "Agenda",
    description:
      "Gerencie todos os seus atendimentos. Agende, visualize e controle os horários.",
    placement: "right",
  },
  {
    target: '[data-tour="pacientes"]',
    title: "Pacientes",
    description:
      "Cadastre pacientes e acesse o prontuário completo com histórico e documentos.",
    placement: "right",
  },
];

const TOUR_COMPLETO: TourStep[] = [
  ...TOUR_BASE,
  {
    target: '[data-tour="receitas"]',
    title: "Financeiro",
    description:
      "Registre receitas e despesas para acompanhar a saúde financeira do consultório.",
    placement: "right",
  },
  {
    target: '[data-tour="estoque"]',
    title: "Estoque",
    description:
      "Controle materiais e equipamentos. Receba alertas quando o estoque estiver baixo.",
    placement: "right",
  },
  {
    target: '[data-tour="relatorios"]',
    title: "Relatórios",
    description:
      "Análises completas de desempenho, faturamento e procedimentos realizados.",
    placement: "right",
  },
  {
    target: '[data-tour="perfil"]',
    title: "Perfil",
    description:
      "Atualize seus dados, logo e cor da clínica a qualquer momento.",
    placement: "right",
  },
];

const TOUR_BASICO: TourStep[] = [
  ...TOUR_BASE,
  {
    target: '[data-tour="perfil"]',
    title: "Perfil",
    description:
      "Atualize seus dados, logo e cor da clínica a qualquer momento.",
    placement: "right",
  },
];

// ─── Cores predefinidas ───────────────────────────────────────────────────────

const CORES = [
  { label: "Azul",      value: "#1d4ed8" },
  { label: "Verde",     value: "#15803d" },
  { label: "Roxo",      value: "#7c3aed" },
  { label: "Rosa",      value: "#db2777" },
  { label: "Teal",      value: "#0f766e" },
  { label: "Vermelho",  value: "#dc2626" },
];

// ─── Formulário de perfil ─────────────────────────────────────────────────────

interface ProfileForm {
  consultorio_nome: string;
  nome: string;
  cro: string;
  email: string;
  telefone: string;
  endereco: string;
  especialidade: string;
  instagram: string;
}

const EMPTY_FORM: ProfileForm = {
  consultorio_nome: "",
  nome: "",
  cro: "",
  email: "",
  telefone: "",
  endereco: "",
  especialidade: "",
  instagram: "",
};

function isValid(f: ProfileForm) {
  return (
    f.consultorio_nome.trim() !== "" &&
    f.nome.trim() !== "" &&
    f.cro.trim() !== "" &&
    f.email.trim() !== "" &&
    f.telefone.trim() !== ""
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  initialStep: number;
  onSaveStep: (step: number) => Promise<void>;
  onComplete: () => Promise<void>;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingFlow({
  initialStep,
  onSaveStep,
  onComplete,
}: OnboardingFlowProps) {
  // Fase local: 0=boas-vindas, 1=perfil, 2=tour, 3=conclusão
  const [phase, setPhase] = useState(() => Math.min(initialStep, 3));
  const [tourStep, setTourStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Perfil
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [corClinica, setCorClinica] = useState("#1d4ed8");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { isCompleto } = usePlano();
  const tourSteps = isCompleto ? TOUR_COMPLETO : TOUR_BASICO;

  // Pré-carrega email do usuário
  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email! }));
  }, [user]);

  // Carrega cor salva anteriormente (se houver)
  useEffect(() => {
    if (!user) return;
    const cor = localStorage.getItem(COR_CLINICA_KEY(user.id));
    if (cor) setCorClinica(cor);
    const logo = localStorage.getItem(LOGO_CLINICA_KEY(user.id));
    if (logo) setLogoBase64(logo);
  }, [user]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const goToPhase = async (next: number) => {
    setPhase(next);
    await onSaveStep(next);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setLogoBase64(url);
      if (user) localStorage.setItem(LOGO_CLINICA_KEY(user.id), url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCorChange = (cor: string) => {
    setCorClinica(cor);
    if (user) localStorage.setItem(COR_CLINICA_KEY(user.id), cor);
  };

  const handleSaveProfile = async () => {
    if (!user || !isValid(form)) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        consultorio_nome: form.consultorio_nome,
        nome:             form.nome,
        cro:              form.cro,
        email:            form.email,
        telefone:         form.telefone,
        endereco:         form.endereco,
        especialidade:    form.especialidade,
        instagram:        form.instagram,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    await goToPhase(2);
  };

  const handleFinish = async () => {
    setFinishing(true);
    await onComplete();
    setFinishing(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // FASE 2: Tour — o SpotlightTour é sobreposto diretamente; o app fica visível por baixo.
  if (phase === 2) {
    return (
      <SpotlightTour
        steps={tourSteps}
        currentStep={tourStep}
        totalFlowSteps={4}
        flowStepOffset={2}
        onNext={() => setTourStep((s) => s + 1)}
        onBack={() => {
          if (tourStep === 0) goToPhase(1);
          else setTourStep((s) => s - 1);
        }}
        onComplete={() => goToPhase(3)}
        onSkip={() => goToPhase(3)}
        completeLabel="Finalizar tour"
      />
    );
  }

  // FASES 0, 1 e 3: overlay opaco (bloqueia totalmente o app abaixo)
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      aria-modal="true"
    >
      {/* ── FASE 0: Boas-vindas ────────────────────────────────────────── */}
      {phase === 0 && (
        <div
          key="welcome"
          className="w-full max-w-md bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        >
          {/* Faixa de progresso */}
          <ProgressBar current={1} total={4} />

          <div className="flex flex-col items-center text-center px-8 py-10 gap-6">
            {/* Ícone */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-3xl font-heading">G</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Bem-vindo ao GestClini!
              </h1>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Seu sistema de gestão odontológica está pronto. Vamos configurar
                sua clínica em alguns passos rápidos.
              </p>
            </div>

            {/* Destaques */}
            <div className="w-full grid grid-cols-3 gap-3">
              {[
                { icon: "📅", label: "Agenda inteligente" },
                { icon: "🦷", label: "Prontuário digital" },
                { icon: "📊", label: "Financeiro completo" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border bg-muted/40 p-3 text-center"
                >
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => goToPhase(1)}
              className="gradient-primary text-primary-foreground w-full gap-2 h-11 text-sm"
            >
              Configurar minha clínica <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── FASE 1: Configuração da clínica ───────────────────────────── */}
      {phase === 1 && (
        <div
          key="profile"
          className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        >
          <ProgressBar current={2} total={4} />

          <div className="px-7 pt-6 pb-7">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base">
                  Dados da clínica
                </h2>
                <p className="text-xs text-muted-foreground">
                  Essas informações aparecem nos documentos gerados
                </p>
              </div>
            </div>

            {/* Campos obrigatórios */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Obrigatórios
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Nome da clínica *</Label>
                  <Input
                    placeholder="Clínica Odontológica Silva"
                    value={form.consultorio_nome}
                    onChange={(e) =>
                      setForm({ ...form, consultorio_nome: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome do dentista *</Label>
                  <Input
                    placeholder="Dr. João Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">CRO *</Label>
                  <Input
                    placeholder="SC-12345"
                    value={form.cro}
                    onChange={(e) => setForm({ ...form, cro: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail *</Label>
                  <Input
                    type="email"
                    placeholder="contato@clinica.com.br"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone *</Label>
                  <Input
                    placeholder="(48) 99999-9999"
                    value={form.telefone}
                    onChange={(e) =>
                      setForm({ ...form, telefone: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Campos opcionais */}
              <div className="pt-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                  Opcionais
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Especialidade</Label>
                    <Input
                      placeholder="Clínica Geral"
                      value={form.especialidade}
                      onChange={(e) =>
                        setForm({ ...form, especialidade: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Instagram</Label>
                    <Input
                      placeholder="@clinicasilva"
                      value={form.instagram}
                      onChange={(e) =>
                        setForm({ ...form, instagram: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Endereço</Label>
                    <Input
                      placeholder="Rua das Flores, 123 — Florianópolis/SC"
                      value={form.endereco}
                      onChange={(e) =>
                        setForm({ ...form, endereco: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Logo */}
                <div className="mt-3">
                  <Label className="text-xs">Logo da clínica</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                      {logoBase64 ? (
                        <img
                          src={logoBase64}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {logoBase64 ? "Trocar logo" : "Enviar logo"}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>

                {/* Cor da clínica */}
                <div className="mt-3">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Cor da clínica
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {CORES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => handleCorChange(c.value)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                          corClinica === c.value
                            ? "border-foreground scale-110 ring-2 ring-offset-1 ring-primary"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    <input
                      type="color"
                      value={corClinica}
                      onChange={(e) => handleCorChange(e.target.value)}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/50 cursor-pointer bg-transparent p-0.5"
                      title="Cor personalizada"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between mt-6 gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPhase(0)}
                className="text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={!isValid(form) || saving}
                className="gradient-primary text-primary-foreground gap-2 text-xs"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuar para o tour <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FASE 3: Conclusão ──────────────────────────────────────────── */}
      {phase === 3 && (
        <div
          key="done"
          className="w-full max-w-md bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        >
          <ProgressBar current={4} total={4} />

          <div className="flex flex-col items-center text-center px-8 py-10 gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Sua clínica está pronta!
              </h2>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Você já conhece o GestClini e tem tudo configurado para
                começar. Qualquer dado pode ser atualizado em{" "}
                <strong>Perfil</strong> a qualquer momento.
              </p>
            </div>

            <Button
              onClick={handleFinish}
              disabled={finishing}
              className="gradient-primary text-primary-foreground w-full gap-2 h-11 text-sm"
            >
              {finishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Começar a usar o GestClini <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: barra de progresso ──────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 bg-muted">
      <div
        className="h-full gradient-primary transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}
