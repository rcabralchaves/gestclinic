import { useState } from "react";
import { Building, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustosConsultorio, type CustoConsultorio } from "@/hooks/useCustosConsultorio";
import { formatCurrency } from "@/lib/mockData";
import { toast } from "sonner";

export default function CustosConsultorioConfig() {
  const { custos, totalMensal, upsert, remove } = useCustosConsultorio();
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");

  const handleAdicionar = () => {
    const nome = novoNome.trim();
    const valor = Number(novoValor);
    if (!nome) {
      toast.error("Informe o nome do custo.");
      return;
    }
    if (!Number.isFinite(valor) || valor < 0) {
      toast.error("Valor inválido.");
      return;
    }
    const id = nome.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString(36);
    upsert({ id, nome, valorMensal: valor });
    setNovoNome("");
    setNovoValor("");
    toast.success("Custo adicionado.");
  };

  const handleAtualizar = (item: CustoConsultorio, valor: string) => {
    const v = Number(valor);
    if (!Number.isFinite(v) || v < 0) return;
    upsert({ ...item, valorMensal: v });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Custos Fixos do Consultório</h3>
      </div>
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        Esses custos são usados para calcular o <strong>lucro real por paciente</strong>. O valor mensal total é
        rateado entre as receitas do mês.
      </p>

      <div className="space-y-2">
        {custos.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={c.nome}
                onChange={(e) => upsert({ ...c, nome: e.target.value })}
                placeholder="Nome do custo"
              />
            </div>
            <div className="w-40">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={c.valorMensal || ""}
                onChange={(e) => handleAtualizar(c, e.target.value)}
                placeholder="0,00"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => remove(c.id)}
              aria-label={`Remover ${c.nome}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1">
          <Label className="text-xs">Novo custo</Label>
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Aluguel, Internet, Software..."
          />
        </div>
        <div className="w-40">
          <Label className="text-xs">Valor mensal (R$)</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <Button onClick={handleAdicionar} variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary flex justify-between">
        <span>Total mensal de custos fixos:</span>
        <span>{formatCurrency(totalMensal)}</span>
      </div>
    </div>
  );
}
