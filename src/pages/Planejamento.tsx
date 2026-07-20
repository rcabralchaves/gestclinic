import { useState, useEffect, useCallback } from "react";
import { Target, TrendingUp, Plus, Trash2, Edit, Save, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Meta {
  id: string;
  nome: string;
  valor_atual: number;
  valor_meta: number;
  tipo: string;
}


const Planejamento = () => {
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [editMeta, setEditMeta] = useState<Meta | null>(null);
  const [form, setForm] = useState({ nome: "", valor_atual: "", valor_meta: "", tipo: "currency" });

  const fetchMetas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("metas" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setMetas(data as any[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMetas(); }, [fetchMetas]);

  const handleAdd = async () => {
    if (!user || !form.nome.trim()) return;
    await supabase.from("metas" as any).insert({
      user_id: user.id,
      nome: form.nome,
      valor_atual: Number(form.valor_atual) || 0,
      valor_meta: Number(form.valor_meta) || 0,
      tipo: form.tipo,
    } as any);
    setForm({ nome: "", valor_atual: "", valor_meta: "", tipo: "currency" });
    setOpenNew(false);
    await fetchMetas();
    toast.success("Meta criada!");
  };

  const handleUpdate = async () => {
    if (!editMeta) return;
    await supabase.from("metas" as any).update({
      nome: form.nome,
      valor_atual: Number(form.valor_atual) || 0,
      valor_meta: Number(form.valor_meta) || 0,
      tipo: form.tipo,
    } as any).eq("id", editMeta.id);
    setEditMeta(null);
    await fetchMetas();
    toast.success("Meta atualizada!");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("metas" as any).delete().eq("id", id);
    await fetchMetas();
    toast.success("Meta removida!");
  };

  const openEdit = (m: Meta) => {
    setForm({ nome: m.nome, valor_atual: String(m.valor_atual), valor_meta: String(m.valor_meta), tipo: m.tipo });
    setEditMeta(m);
  };

  const openCreate = () => {
    setForm({ nome: "", valor_atual: "", valor_meta: "", tipo: "currency" });
    setOpenNew(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Planejamento Financeiro</h1>
          <p className="text-muted-foreground mt-1">Metas, projeções e fluxo de caixa</p>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Nova Meta
        </Button>
      </div>

      {/* Metas */}
      {metas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-lg border bg-card">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma meta cadastrada</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {metas.map((m) => {
            const isCurrency = m.tipo === "currency";
            const pct = m.valor_meta > 0 ? (m.valor_atual / m.valor_meta) * 100 : 0;
            return (
              <div key={m.id} className="rounded-lg border bg-card p-5 card-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-semibold text-sm">{m.nome}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Atual</span>
                  <span className="font-medium">{isCurrency ? formatCurrency(m.valor_atual) : m.valor_atual}</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2.5 mb-2 [&>div]:bg-primary" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Meta: {isCurrency ? formatCurrency(m.valor_meta) : m.valor_meta}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projeção */}
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="font-heading font-semibold">Projeção de Faturamento</h2>
          </div>
          <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum dado de receita ainda.</p>
            <p className="text-xs opacity-70">Cadastre receitas para ver a projeção aqui.</p>
          </div>
        </div>

        {/* Fluxo de Caixa */}
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <h2 className="font-heading font-semibold mb-4">Fluxo de Caixa</h2>
          <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum dado disponível ainda.</p>
            <p className="text-xs opacity-70">O fluxo de caixa aparecerá conforme receitas e despesas forem registradas.</p>
          </div>
        </div>
      </div>

      {/* New / Edit Meta Dialog */}
      <Dialog open={openNew || !!editMeta} onOpenChange={(o) => { if (!o) { setOpenNew(false); setEditMeta(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editMeta ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Nome da meta</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Faturamento mensal" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor atual</Label><Input type="number" value={form.valor_atual} onChange={(e) => setForm({ ...form, valor_atual: e.target.value })} /></div>
              <div><Label>Valor meta</Label><Input type="number" value={form.valor_meta} onChange={(e) => setForm({ ...form, valor_meta: e.target.value })} /></div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="currency">Valor monetário (R$)</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={editMeta ? handleUpdate : handleAdd} className="w-full gradient-primary text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> {editMeta ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planejamento;
