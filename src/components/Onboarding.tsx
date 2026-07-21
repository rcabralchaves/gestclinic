import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Building2, CreditCard, LayoutDashboard, CalendarDays, Users, TrendingUp, ChevronRight, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Bem-vindo ao GestClini", icon: User },
  { id: 2, title: "Dados do Consultório", icon: Building2 },
  { id: 3, title: "Taxas de Cartão", icon: CreditCard },
  { id: 4, title: "Conheça o sistema", icon: LayoutDashboard },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    especialidade: "",
    consultorio_nome: "",
    telefone: "",
    taxa_credito: "",
    taxa_debito: "",
  });

  const totalSteps = STEPS.length;

  const saveAndFinish = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles" as any).update({
      ...(form.nome ? { nome: form.nome } : {}),
      ...(form.especialidade ? { especialidade: form.especialidade } : {}),
      ...(form.consultorio_nome ? { consultorio_nome: form.consultorio_nome } : {}),
      ...(form.telefone ? { telefone: form.telefone } : {}),
      taxa_credito: Number(form.taxa_credito) || 0,
      taxa_debito: Number(form.taxa_debito) || 0,
    } as any).eq("user_id", user.id);
    setSaving(false);
    onComplete();
    toast.success("Perfil configurado! Bem-vindo ao GestClini.");
  };

  const skip = () => onComplete();

  const areas = [
    { icon: CalendarDays, label: "Agenda", desc: "Gerencie consultas e horários", path: "/agenda" },
    { icon: Users, label: "Pacientes", desc: "Prontuários e histórico", path: "/pacientes" },
    { icon: TrendingUp, label: "Financeiro", desc: "Receitas, despesas e relatórios", path: "/receitas" },
    { icon: LayoutDashboard, label: "Dashboard", desc: "Visão geral do consultório", path: "/dashboard" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">G</span>
            </div>
            <span className="font-heading font-bold text-sm">GestClini</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{step} de {totalSteps}</span>
            <button onClick={skip} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[320px]">
          {/* Step 1 — Boas-vindas */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center gap-4 pt-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold">Bem-vindo ao GestClini!</h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Vamos configurar o seu consultório em alguns passos rápidos.
                  Você pode pular essa etapa e configurar mais tarde em <strong>Perfil</strong>.
                </p>
              </div>
              <div className="w-full space-y-3 mt-2">
                <div>
                  <Label className="text-sm">Seu nome</Label>
                  <Input
                    placeholder="Dr. João Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Especialidade</Label>
                  <Input
                    placeholder="Ex: Odontologia, Clínica Geral..."
                    value={form.especialidade}
                    onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Consultório */}
          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold">Dados do Consultório</h2>
                  <p className="text-xs text-muted-foreground">Aparecem nos documentos e contratos</p>
                </div>
              </div>
              <div>
                <Label className="text-sm">Nome do consultório / clínica</Label>
                <Input
                  placeholder="Ex: Clínica Odontológica Silva"
                  value={form.consultorio_nome}
                  onChange={(e) => setForm({ ...form, consultorio_nome: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Telefone de contato</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Taxas */}
          {step === 3 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold">Taxas de Cartão</h2>
                  <p className="text-xs text-muted-foreground">O sistema descontará automaticamente ao registrar pagamentos</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Taxa crédito (%)</Label>
                  <Input
                    type="number"
                    min={0} max={100} step={0.1}
                    placeholder="Ex: 4.99"
                    value={form.taxa_credito}
                    onChange={(e) => setForm({ ...form, taxa_credito: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Taxa débito (%)</Label>
                  <Input
                    type="number"
                    min={0} max={100} step={0.1}
                    placeholder="Ex: 1.99"
                    value={form.taxa_debito}
                    onChange={(e) => setForm({ ...form, taxa_debito: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                Pode deixar em branco por agora e configurar depois em <strong>Perfil → Taxas de Cartão</strong>.
              </p>
            </div>
          )}

          {/* Step 4 — Tour */}
          {step === 4 && (
            <div className="space-y-4 pt-2">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-heading font-bold">Tudo pronto!</h2>
                <p className="text-xs text-muted-foreground mt-1">Conheça as principais áreas do sistema</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {areas.map((area) => (
                  <div key={area.label} className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <area.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{area.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{area.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2 gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} size="sm">
              Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={skip} size="sm" className="text-muted-foreground">
              Pular tudo
            </Button>
          )}

          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} className="gradient-primary text-primary-foreground gap-1">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={saveAndFinish} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? "Salvando..." : "Começar a usar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
