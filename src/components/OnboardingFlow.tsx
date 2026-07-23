/**
 * OnboardingFlow — configura a clínica antes do primeiro acesso.
 * Renderizado em /onboarding (sem AppLayout, sem sidebar).
 * Carregado via React.lazy() — zero impacto no bundle de usuários existentes.
 *
 * Fases:
 *   0 → Boas-vindas
 *   1 → Configuração da clínica
 *   2 → Conclusão → onComplete()
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinicBranding } from "@/hooks/useClinicBranding";
import { useAssinatura } from "@/hooks/useAssinatura";
import { cn } from "@/lib/utils";

// ─── Cores predefinidas ───────────────────────────────────────────────────────

const CORES = [
  { label: "Azul",     value: "#1d4ed8" },
  { label: "Verde",    value: "#15803d" },
  { label: "Roxo",     value: "#7c3aed" },
  { label: "Rosa",     value: "#db2777" },
  { label: "Teal",     value: "#0f766e" },
  { label: "Vermelho", value: "#dc2626" },
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
  // Fase local: 0=boas-vindas, 1=perfil, 2=conclusão
  const [phase, setPhase] = useState(() => Math.min(initialStep, 2));
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const assinatura = useAssinatura();
  const branding = useClinicBranding();

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email! }));
  }, [user]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const goToPhase = async (next: number) => {
    setPhase(next);
    await onSaveStep(next);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await branding.uploadLogo(file);
    e.target.value = "";
  };

  const handleCorChange = (cor: string) => {
    branding.updateCor(cor);
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
    // onComplete() navega para /dashboard via OnboardingRoute
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">

      {/* ── FASE 0: Boas-vindas ──────────────────────────────────────────── */}
      {phase === 0 && (
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          <ProgressBar current={1} total={3} />

          <div className="flex flex-col items-center text-center px-8 py-10 gap-6">
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

            <div className="w-full grid grid-cols-3 gap-3">
              {(assinatura.plano === "completo"
                ? [
                    { icon: "📅", label: "Agenda inteligente" },
                    { icon: "🦷", label: "Prontuário digital" },
                    { icon: "📊", label: "Financeiro completo" },
                  ]
                : [
                    { icon: "📅", label: "Agenda inteligente" },
                    { icon: "🦷", label: "Prontuário digital" },
                    { icon: "👥", label: "Gestão de pacientes" },
                  ]
              ).map((item) => (
                <div key={item.label} className="rounded-xl border bg-muted/40 p-3 text-center">
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

      {/* ── FASE 1: Configuração da clínica ──────────────────────────────── */}
      {phase === 1 && (
        <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          <ProgressBar current={2} total={3} />

          <div className="px-7 pt-6 pb-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base">Dados da clínica</h2>
                <p className="text-xs text-muted-foreground">
                  Essas informações aparecem nos documentos gerados
                </p>
              </div>
            </div>

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
                    onChange={(e) => setForm({ ...form, consultorio_nome: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone *</Label>
                  <Input
                    placeholder="(48) 99999-9999"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

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
                      onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Instagram</Label>
                    <Input
                      placeholder="@clinicasilva"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Endereço</Label>
                    <Input
                      placeholder="Rua das Flores, 123 — Florianópolis/SC"
                      value={form.endereco}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-xs">Logo da clínica</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                      {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
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
                      {branding.logoUrl ? "Trocar logo" : "Enviar logo"}
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
                          branding.corClinica === c.value
                            ? "border-foreground scale-110 ring-2 ring-offset-1 ring-primary"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    <input
                      type="color"
                      value={branding.corClinica}
                      onChange={(e) => handleCorChange(e.target.value)}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/50 cursor-pointer bg-transparent p-0.5"
                      title="Cor personalizada"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 gap-3">
              <Button variant="ghost" size="sm" onClick={() => goToPhase(0)} className="text-xs">
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
                  <>Concluir configuração <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FASE 2: Conclusão ────────────────────────────────────────────── */}
      {phase === 2 && (
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          <ProgressBar current={3} total={3} />

          <div className="flex flex-col items-center text-center px-8 py-10 gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Sua clínica está pronta!
              </h2>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Você já configurou tudo. Ao entrar no sistema, um tour rápido
                vai apresentar cada seção — leva menos de 2 minutos.
              </p>
            </div>

            <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 text-left">
              Seu teste grátis começou! Aproveite todos os recursos do GestClini
              durante os próximos 7 dias.
            </div>

            <Button
              onClick={handleFinish}
              disabled={finishing}
              className="gradient-primary text-primary-foreground w-full gap-2 h-11 text-sm"
            >
              {finishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Entrar no GestClini <ChevronRight className="h-4 w-4" /></>
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
