import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/mockData";
import type { Agendamento, ProdutoEstoque } from "@/lib/mockData";

interface MaterialItem {
  produtoId: string;
  nome: string;
  quantidade: number;
}

interface ServicoItem {
  nome: string;
  valor: string;
}

interface FinalizarConsultaDialogProps {
  open: boolean;
  agendamento: Agendamento | null;
  produtos: (ProdutoEstoque & { categoria?: string; descricao?: string })[];
  onClose: () => void;
  onFinalizar: (data: {
    materiais: MaterialItem[];
    servicos: ServicoItem[];
    valor: number;
    formaPagamento: string;
    parcelas: number;
    antecipar: boolean;
    data: string;
    observacoes: string;
  }) => Promise<void>;
}

const FORMAS_PAGAMENTO = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
];

const FinalizarConsultaDialog = ({ open, agendamento, produtos, onClose, onFinalizar }: FinalizarConsultaDialogProps) => {
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [servicos, setServicos] = useState<ServicoItem[]>([
    { nome: agendamento?.procedimento || "Consulta", valor: "" },
  ]);
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [parcelas, setParcelas] = useState(1);
  const [antecipar, setAntecipar] = useState(false);
  const [data, setData] = useState(agendamento?.data || new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const valorTotal = servicos.reduce((sum, s) => sum + (Number(s.valor) || 0), 0);

  const addMaterial = () => {
    setMateriais([...materiais, { produtoId: "", nome: "", quantidade: 1 }]);
  };

  const updateMaterial = (index: number, field: keyof MaterialItem, value: string | number) => {
    const updated = [...materiais];
    if (field === "produtoId") {
      const produto = produtos.find((p) => p.id === value);
      updated[index] = { ...updated[index], produtoId: value as string, nome: produto?.nome || "" };
    } else {
      (updated[index] as any)[field] = value;
    }
    setMateriais(updated);
  };

  const removeMaterial = (index: number) => {
    setMateriais(materiais.filter((_, i) => i !== index));
  };

  const addServico = () => {
    setServicos([...servicos, { nome: "", valor: "" }]);
  };

  const updateServico = (index: number, field: keyof ServicoItem, value: string) => {
    const updated = [...servicos];
    updated[index] = { ...updated[index], [field]: value };
    setServicos(updated);
  };

  const removeServico = (index: number) => {
    if (servicos.length <= 1) return;
    setServicos(servicos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (servicos.every((s) => !s.nome.trim())) return;
    setLoading(true);
    try {
      await onFinalizar({
        materiais,
        servicos,
        valor: valorTotal,
        formaPagamento,
        parcelas: formaPagamento === "cartao_credito" ? parcelas : 1,
        antecipar: formaPagamento === "cartao_credito" && parcelas > 1 ? antecipar : false,
        data,
        observacoes,
      });
      setMateriais([]);
      setServicos([{ nome: "", valor: "" }]);
      setFormaPagamento("pix");
    } finally {
      setLoading(false);
    }
  };

  const produtosDisponiveis = produtos.filter((p) => p.quantidade > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Finalizar Consulta — {agendamento?.pacienteNome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Serviços */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Serviços realizados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addServico}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar serviço
              </Button>
            </div>
            {servicos.map((s, i) => (
              <div key={i} className="flex items-end gap-2 p-2 rounded-lg border bg-muted/30">
                <div className="flex-1">
                  <Label className="text-xs">Nome do serviço</Label>
                  <Input
                    value={s.nome}
                    onChange={(e) => updateServico(i, "nome", e.target.value)}
                    placeholder="Ex: Limpeza, Botox..."
                    className="h-9"
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={s.valor}
                    onChange={(e) => updateServico(i, "valor", e.target.value)}
                    placeholder="0,00"
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  disabled={servicos.length <= 1}
                  onClick={() => removeServico(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {valorTotal > 0 && (
              <div className="text-right text-sm font-semibold">
                Total: <span className="text-success">{formatCurrency(valorTotal)}</span>
              </div>
            )}
          </div>

          {/* Materiais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Materiais utilizados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {materiais.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum material adicionado (opcional)</p>
            )}
            {materiais.map((m, i) => (
              <div key={i} className="flex items-end gap-2 p-2 rounded-lg border bg-muted/30">
                <div className="flex-1">
                  <Label className="text-xs">Produto</Label>
                  <Select value={m.produtoId} onValueChange={(v) => updateMaterial(i, "produtoId", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {produtosDisponiveis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} ({p.quantidade} {p.unidade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min={1}
                    max={produtos.find((p) => p.id === m.produtoId)?.quantidade || 999}
                    value={m.quantidade}
                    onChange={(e) => updateMaterial(i, "quantidade", Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeMaterial(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Pagamento */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
            <p className="text-sm font-semibold">Pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Forma de pagamento</Label>
                <Select value={formaPagamento} onValueChange={(v) => { setFormaPagamento(v); if (v !== "cartao_credito") setParcelas(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <SelectItem key={fp.value} value={fp.value}>{fp.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Data</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
            </div>
            {formaPagamento === "cartao_credito" && (
              <div>
                <Label className="text-xs">Parcelas</Label>
                <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x {n > 1 ? `de ${formatCurrency(valorTotal / n)}` : "à vista"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formaPagamento === "cartao_credito" && parcelas > 1 && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="text-sm font-medium">Antecipar parcelas?</p>
                  <p className="text-xs text-muted-foreground">Receber valor total no mês atual (taxa de antecipação será aplicada)</p>
                </div>
                <Switch checked={antecipar} onCheckedChange={setAntecipar} />
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre o atendimento..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || valorTotal === 0}
            className="w-full gradient-primary text-primary-foreground"
          >
            {loading ? "Salvando..." : `Finalizar — ${formatCurrency(valorTotal)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizarConsultaDialog;
