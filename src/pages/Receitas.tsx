import { useState, useMemo } from "react";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formaPagamentoLabels, type Receita } from "@/lib/mockData";
import { useReceitasDB } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const Receitas = () => {
  const { receitas, addReceita } = useReceitasDB();
  const [search, setSearch] = useState("");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ paciente: "", procedimento: "", valor: "", formaPagamento: "pix" as Receita["formaPagamento"], data: "" });

  const goMonth = (dir: number) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const filtered = useMemo(() => {
    const byMonth = receitas.filter((r) => {
      const d = new Date(r.data + "T00:00:00");
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    if (!search.trim()) return byMonth;
    const q = search.toLowerCase();
    return byMonth.filter(
      (r) => r.paciente.toLowerCase().includes(q) || r.procedimento.toLowerCase().includes(q)
    );
  }, [receitas, selectedMonth, selectedYear, search]);

  const total = filtered.reduce((s, r) => s + r.valor, 0);

  const handleAdd = async () => {
    if (!form.paciente || !form.valor) return;
    await addReceita({
      paciente: form.paciente,
      procedimento: form.procedimento,
      valor: Number(form.valor),
      formaPagamento: form.formaPagamento,
      data: form.data || new Date().toISOString().split("T")[0],
    });
    setForm({ paciente: "", procedimento: "", valor: "", formaPagamento: "pix", data: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Receitas</h1>
          <p className="text-muted-foreground mt-1">Controle de entradas do consultório</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Registrar Receita</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Paciente</Label><Input value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} placeholder="Nome do paciente" /></div>
                <div><Label>Procedimento</Label><Input value={form.procedimento} onChange={(e) => setForm({ ...form, procedimento: e.target.value })} placeholder="Ex: Limpeza, Canal..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor (R$)</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
                  <div><Label>Pagamento</Label>
                    <Select value={form.formaPagamento} onValueChange={(v) => setForm({ ...form, formaPagamento: v as Receita["formaPagamento"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(formaPagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por paciente ou procedimento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          Total: {formatCurrency(total)}
        </div>
      </div>

      <div className="rounded-lg border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Procedimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pagamento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.paciente}</td>
                  <td className="px-4 py-3">{r.procedimento}</td>
                  <td className="px-4 py-3 font-medium text-success">{formatCurrency(r.valor)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {formaPagamentoLabels[r.formaPagamento]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Receitas;
