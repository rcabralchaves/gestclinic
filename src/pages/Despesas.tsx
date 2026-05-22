import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { formatCurrency, categoriaDespesaLabels, type Despesa } from "@/lib/mockData";
import { useDespesasDB } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import PeriodFilter, { filterByPeriod, type PeriodValue } from "@/components/PeriodFilter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Paleta fixa para categorias — cada categoria tem cor estável (não rotaciona).
// Usa hash determinístico do nome para escolher a cor, garantindo consistência entre renders.
const COLOR_PALETTE = [
  "hsl(213, 94%, 48%)", // azul
  "hsl(0, 72%, 51%)",   // vermelho
  "hsl(38, 92%, 50%)",  // laranja
  "hsl(173, 58%, 39%)", // teal
  "hsl(262, 52%, 47%)", // roxo
  "hsl(142, 71%, 45%)", // verde
  "hsl(330, 81%, 60%)", // rosa
  "hsl(45, 93%, 47%)",  // amarelo
  "hsl(199, 89%, 48%)", // ciano
  "hsl(20, 90%, 50%)",  // laranja escuro
  "hsl(280, 60%, 50%)", // violeta
  "hsl(160, 60%, 40%)", // verde escuro
];

const CUSTOM_CATEGORIES_KEY = "despesas_custom_categories";

const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const colorForCategory = (cat: string) => COLOR_PALETTE[hashStr(cat) % COLOR_PALETTE.length];

const Despesas = () => {
  const { despesas, addDespesa, updateDespesa, deleteDespesa } = useDespesasDB();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodValue>("1m");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ descricao: "", categoria: "materiais" as string, valor: "", data: "", tipo: "variavel" as Despesa["tipo"] });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Categorias personalizadas persistem no localStorage.
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  // Categorias usadas em despesas existentes mas que não estão nas padrão nem nas custom.
  const usedCustomCategories = useMemo(() => {
    const known = new Set([...Object.keys(categoriaDespesaLabels), ...customCategories]);
    const seen = new Set<string>();
    despesas.forEach((d) => {
      if (d.categoria && !known.has(d.categoria)) seen.add(d.categoria);
    });
    return Array.from(seen);
  }, [despesas, customCategories]);

  const allCategories = useMemo(() => {
    const labelFor = (k: string) => categoriaDespesaLabels[k] || k;
    const items = [
      ...Object.keys(categoriaDespesaLabels).map((k) => ({ value: k, label: labelFor(k) })),
      ...customCategories.map((k) => ({ value: k, label: k })),
      ...usedCustomCategories.map((k) => ({ value: k, label: k })),
    ];
    // Dedupe by value
    const seen = new Set<string>();
    return items.filter((i) => (seen.has(i.value) ? false : (seen.add(i.value), true)));
  }, [customCategories, usedCustomCategories]);

  const byPeriod = useMemo(() => filterByPeriod(despesas, period), [despesas, period]);
  const filtered = useMemo(() => byPeriod.filter((d) => d.descricao.toLowerCase().includes(search.toLowerCase())), [byPeriod, search]);
  const total = filtered.reduce((s, d) => s + d.valor, 0);

  const byCategory = useMemo(() => {
    const grouped = byPeriod.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {});
    const sumAll = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        name: categoriaDespesaLabels[key] || key,
        value,
        percent: (value / sumAll) * 100,
        color: colorForCategory(key),
      }))
      .sort((a, b) => b.value - a.value);
  }, [byPeriod]);

  const labelForCategory = (key: string) => categoriaDespesaLabels[key] || key;

  const resetForm = () => {
    setForm({ descricao: "", categoria: "materiais", valor: "", data: "", tipo: "variavel" });
    setEditingId(null);
    setShowNewCategory(false);
    setNewCategory("");
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) resetForm();
  };

  const handleSave = async () => {
    if (!form.descricao || !form.valor || saving) return;
    setSaving(true);
    try {
      const payload = {
        descricao: form.descricao,
        categoria: form.categoria,
        valor: Number(form.valor),
        data: form.data || new Date().toISOString().split("T")[0],
        tipo: form.tipo,
      };
      if (editingId) {
        await updateDespesa(editingId, payload);
        toast.success("Despesa atualizada!");
      } else {
        await addDespesa(payload);
        toast.success("Despesa registrada!");
      }
      resetForm();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (d: Despesa) => {
    setForm({
      descricao: d.descricao,
      categoria: d.categoria,
      valor: String(d.valor),
      data: d.data,
      tipo: d.tipo,
    });
    setEditingId(d.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteDespesa(id);
    if (ok) toast.success("Despesa removida.");
    else toast.error("Erro ao remover despesa.");
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (allCategories.find((c) => c.value.toLowerCase() === trimmed.toLowerCase() || c.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Esta categoria já existe");
      return;
    }
    setCustomCategories((prev) => [...prev, trimmed]);
    setForm((f) => ({ ...f, categoria: trimmed }));
    setNewCategory("");
    setShowNewCategory(false);
    toast.success(`Categoria "${trimmed}" criada!`);
  };

  // Tooltip customizado: mostra valor exato + porcentagem
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="font-semibold">{item.name}</span>
        </div>
        <div className="text-foreground">{formatCurrency(item.value)}</div>
        <div className="text-muted-foreground">{item.percent.toFixed(1)}% do total</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Despesas</h1>
          <p className="text-muted-foreground mt-1">Controle de saídas do consultório</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Nova Despesa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">{editingId ? "Editar Despesa" : "Registrar Despesa"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Descrição</Label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aluguel, Materiais..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Categoria</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNewCategory((v) => !v)}>
                        <Plus className="h-3 w-3 mr-1" /> Nova
                      </Button>
                    </div>
                    {showNewCategory ? (
                      <div className="flex gap-1">
                        <Input
                          autoFocus
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Nome da categoria"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                        />
                        <Button type="button" size="sm" onClick={handleAddCategory}>OK</Button>
                      </div>
                    ) : (
                      <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorForCategory(c.value) }} />
                                {c.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Despesa["tipo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="fixa">Fixa</SelectItem><SelectItem value="variavel">Variável</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor (R$)</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
                  <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                  {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 card-shadow lg:col-span-1">
          <h3 className="font-heading font-semibold mb-3">Por Categoria</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem despesas no período</p>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {byCategory.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {byCategory.map((c) => (
                  <li key={c.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="text-right shrink-0 ml-2">
                      <span className="font-medium">{formatCurrency(c.value)}</span>
                      <span className="text-muted-foreground ml-1.5">({c.percent.toFixed(1)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-lg border bg-card card-shadow lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar despesa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <span className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">
              Total: {formatCurrency(total)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{d.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colorForCategory(d.categoria) }} />
                        {labelForCategory(d.categoria)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-destructive">{formatCurrency(d.valor)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.tipo === "fixa" ? "Fixa" : "Variável"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)} title="Editar">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível. A despesa "{d.descricao}" de {formatCurrency(d.valor)} será removida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(d.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Nenhuma despesa encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Despesas;
