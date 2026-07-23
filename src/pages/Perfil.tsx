import { useState, useEffect, useCallback, useRef } from "react";
import { User, Building2, Save, Loader2, CreditCard, Camera, Palette, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CustosConsultorioConfig from "@/components/CustosConsultorioConfig";
import { useClinicBranding } from "@/hooks/useClinicBranding";

const CORES_PRESET = [
  { label: "Azul", value: "#1d4ed8" },
  { label: "Verde", value: "#15803d" },
  { label: "Roxo", value: "#7c3aed" },
  { label: "Vermelho", value: "#dc2626" },
  { label: "Cinza", value: "#4b5563" },
  { label: "Teal", value: "#0f766e" },
];

interface ProfileData {
  nome: string;
  email: string;
  telefone: string;
  cro: string;
  especialidade: string;
  especialidade_secundaria: string;
  consultorio_nome: string;
  cnpj: string;
  endereco: string;
  instagram: string;
  taxa_credito: string;
  taxa_debito: string;
  taxa_antecipacao: string;
}

const Perfil = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const branding = useClinicBranding();
  const [form, setForm] = useState<ProfileData>({
    nome: "",
    email: "",
    telefone: "",
    cro: "",
    especialidade: "",
    especialidade_secundaria: "",
    consultorio_nome: "",
    cnpj: "",
    endereco: "",
    instagram: "",
    taxa_credito: "0",
    taxa_debito: "0",
    taxa_antecipacao: "0",
  });

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const d = data as any;
      setForm({
        nome: d.nome || user.email?.split("@")[0] || "",
        email: d.email || user.email || "",
        telefone: d.telefone || "",
        cro: d.cro || "",
        especialidade: d.especialidade || "",
        especialidade_secundaria: d.especialidade_secundaria || "",
        consultorio_nome: d.consultorio_nome || "",
        cnpj: d.cnpj || "",
        endereco: d.endereco || "",
        instagram: d.instagram || "",
        taxa_credito: String(d.taxa_credito || 0),
        taxa_debito: String(d.taxa_debito || 0),
        taxa_antecipacao: String(d.taxa_antecipacao || 0),
      });
    } else {
      // Profile should already exist from signup, but create if missing
      setForm((f) => ({
        ...f,
        nome: user.email?.split("@")[0] || "",
        email: user.email || "",
      }));
      await supabase.from("profiles" as any).upsert({
        user_id: user.id,
        nome: user.email?.split("@")[0] || "",
        email: user.email || "",
      } as any, { onConflict: "user_id", ignoreDuplicates: true });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await branding.uploadLogo(file);
    e.target.value = "";
  };

  const handleCorChange = (cor: string) => {
    branding.updateCor(cor);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles" as any)
      .update({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cro: form.cro,
        especialidade: form.especialidade,
        especialidade_secundaria: form.especialidade_secundaria,
        consultorio_nome: form.consultorio_nome,
        cnpj: form.cnpj,
        endereco: form.endereco,
        instagram: form.instagram,
        taxa_credito: Number(form.taxa_credito) || 0,
        taxa_debito: Number(form.taxa_debito) || 0,
        taxa_antecipacao: Number(form.taxa_antecipacao) || 0,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil.");
    } else {
      toast.success("Perfil salvo com sucesso!");
    }
    setSaving(false);
  };

  if (loading || branding.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Perfil</h1>
        <p className="text-muted-foreground mt-1">Configurações do consultório</p>
      </div>

      <div className="rounded-lg border bg-card p-6 card-shadow space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary overflow-hidden">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="Logo da clínica" className="h-full w-full object-cover" />
                : <User className="h-8 w-8 text-primary-foreground" />
              }
            </div>
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg">{form.nome || "Seu nome"}</h2>
            <p className="text-sm text-muted-foreground">{form.especialidade || "Sua especialidade"}</p>
            <div className="flex gap-3 mt-0.5">
              <button type="button" onClick={() => avatarRef.current?.click()} className="text-xs text-primary hover:underline">
                Alterar logo
              </button>
              {branding.logoUrl && (
                <button type="button" onClick={() => branding.removeLogo()} className="text-xs text-destructive hover:underline flex items-center gap-0.5">
                  <X className="h-3 w-3" /> Remover
                </button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Dados Pessoais</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Nome completo</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>CRO</Label><Input value={form.cro} onChange={(e) => setForm({ ...form, cro: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Dados do Consultório</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Nome do consultório</Label><Input value={form.consultorio_nome} onChange={(e) => setForm({ ...form, consultorio_nome: e.target.value })} /></div>
            <div><Label>CNPJ (opcional)</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
            <div><Label>Especialidade principal</Label><Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} /></div>
            <div><Label>Especialidade secundária</Label><Input value={form.especialidade_secundaria} onChange={(e) => setForm({ ...form, especialidade_secundaria: e.target.value })} /></div>
            <div><Label>Instagram (opcional)</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@seuconsultorio" /></div>
        </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Identidade Visual</h3>
          </div>
          <p className="text-xs text-muted-foreground">Esta cor é utilizada nos documentos gerados (receitas, atestados, declarações). Ela aparece em detalhes como linhas, título e rodapé — o documento continua predominantemente branco para facilitar a impressão.</p>
          <div className="space-y-3">
            <Label>Cor Principal da Clínica</Label>
            <div className="flex flex-wrap gap-2">
              {CORES_PRESET.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => handleCorChange(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${branding.corClinica === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={branding.corClinica}
                  onChange={(e) => handleCorChange(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-full border-2 border-dashed border-muted-foreground/50 p-0.5 bg-transparent"
                  title="Escolher cor personalizada"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: branding.corClinica }} />
              Cor selecionada: <span className="font-mono">{branding.corClinica}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Taxas de Cartão</h3>
          </div>
          <p className="text-xs text-muted-foreground">Defina as taxas cobradas pela maquininha. Elas serão descontadas automaticamente ao registrar pagamentos com cartão.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Taxa crédito (%)</Label><Input type="number" min={0} max={100} step={0.1} value={form.taxa_credito} onChange={(e) => setForm({ ...form, taxa_credito: e.target.value })} placeholder="Ex: 4.99" /></div>
            <div><Label>Taxa débito (%)</Label><Input type="number" min={0} max={100} step={0.1} value={form.taxa_debito} onChange={(e) => setForm({ ...form, taxa_debito: e.target.value })} placeholder="Ex: 1.99" /></div>
            <div><Label>Taxa antecipação (%)</Label><Input type="number" min={0} max={100} step={0.1} value={form.taxa_antecipacao} onChange={(e) => setForm({ ...form, taxa_antecipacao: e.target.value })} placeholder="Ex: 2.5" /></div>
          </div>
          <p className="text-xs text-muted-foreground">A taxa de antecipação é aplicada quando você opta por receber parcelas do cartão de forma antecipada.</p>
        </div>

        <Separator />

        <CustosConsultorioConfig />

        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};

export default Perfil;
