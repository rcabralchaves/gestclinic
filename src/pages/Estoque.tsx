import { useState, useRef } from "react";
import { AlertTriangle, Package, Plus, Edit, Trash2, Search, Upload, Loader2, X } from "lucide-react";
import { formatCurrency, type ProdutoEstoque } from "@/lib/mockData";
import { useEstoqueDB } from "@/hooks/useSupabaseData";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { processInvoiceFile } from "@/lib/invoiceParser";

const CATEGORIAS = [
  "Resinas e Cimentos",
  "Anestésicos",
  "Descartáveis",
  "Instrumentais",
  "Materiais de Moldagem",
  "Ortodontia",
  "Endodontia",
  "Cirúrgico",
  "Outros",
];

interface ProdutoForm {
  nome: string;
  categoria: string;
  quantidade: string;
  custoUnitario: string;
  minimo: string;
  unidade: string;
  descricao: string;
}

const emptyForm: ProdutoForm = {
  nome: "", categoria: "", quantidade: "", custoUnitario: "", minimo: "", unidade: "un", descricao: "",
};

const createImportedProductDraft = (product?: Partial<ProdutoForm>): ProdutoForm => ({
  ...emptyForm,
  minimo: product?.minimo ?? "5",
  unidade: product?.unidade ?? "un",
  nome: product?.nome ?? "",
  categoria: product?.categoria ?? "",
  quantidade: product?.quantidade ?? "",
  custoUnitario: product?.custoUnitario ?? "",
  descricao: product?.descricao ?? "",
});

const Estoque = () => {
  const { produtos, addProduto, updateProduto, deleteProduto, addProdutos } = useEstoqueDB();
  const [busca, setBusca] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [form, setForm] = useState<ProdutoForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importedProducts, setImportedProducts] = useState<ProdutoForm[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "processing" | "review">("upload");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const valorTotal = produtos.reduce((s, p) => s + p.quantidade * p.custoUnitario, 0);
  const alertas = produtos.filter((p) => p.quantidade <= p.minimo);

  const handleAdd = async () => {
    if (!form.nome.trim() || !form.quantidade || !form.custoUnitario) {
      toast.error("Preencha nome, quantidade e custo unitário.");
      return;
    }
    await addProduto({
      nome: form.nome,
      categoria: form.categoria,
      quantidade: Number(form.quantidade),
      custoUnitario: Number(form.custoUnitario),
      minimo: Number(form.minimo) || 5,
      unidade: form.unidade || "un",
      descricao: form.descricao,
    });
    setForm(emptyForm);
    setOpenAdd(false);
    toast.success("Produto adicionado ao estoque!");
  };

  const handleEdit = (p: ProdutoEstoque & { categoria?: string; descricao?: string }) => {
    setEditingId(p.id);
    setForm({
      nome: p.nome,
      categoria: p.categoria || "",
      quantidade: String(p.quantidade),
      custoUnitario: String(p.custoUnitario),
      minimo: String(p.minimo),
      unidade: p.unidade,
      descricao: p.descricao || "",
    });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !form.nome.trim()) return;
    await updateProduto(editingId, {
      nome: form.nome,
      categoria: form.categoria,
      quantidade: Number(form.quantidade),
      custoUnitario: Number(form.custoUnitario),
      minimo: Number(form.minimo) || 5,
      unidade: form.unidade || "un",
      descricao: form.descricao,
    });
    setOpenEdit(false);
    setEditingId(null);
    setForm(emptyForm);
    toast.success("Produto atualizado!");
  };

  const handleDelete = async (id: string) => {
    await deleteProduto(id);
    toast.info("Produto removido do estoque.");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportStep("processing");
    setOcrProgress(0);

    try {
      const { products, rawText: text } = await processInvoiceFile(file, setOcrProgress);
      setRawText(text);

      const draftProducts = products.length > 0
        ? products.map((product) => createImportedProductDraft({
            nome: product.nome,
            quantidade: product.quantidade,
            custoUnitario: product.custoUnitario,
            unidade: product.unidade || "un",
          }))
        : [createImportedProductDraft()];

      setImportedProducts(draftProducts);

      if (products.length > 0) {
        toast.success(`${products.length} produtos preparados para revisão.`);
      } else if (text.trim()) {
        toast.info("A leitura foi parcial. Revise o texto extraído e complete os produtos manualmente.");
      } else {
        toast.info("Não foi possível estruturar a nota automaticamente. Preencha os produtos manualmente.");
      }

      setImportStep("review");
    } catch (err: any) {
      setRawText("");
      setImportedProducts([createImportedProductDraft()]);
      setImportStep("review");
      toast.error(err?.message || "Falha na leitura automática. Complete os produtos manualmente.");
    }
  };

  const handleConfirmImport = async () => {
    const validItems = importedProducts.filter((f) => f.nome.trim());
    if (validItems.length === 0) {
      toast.error("Preencha pelo menos um produto antes de confirmar a importação.");
      return;
    }

    const items = validItems.map((f) => ({
      nome: f.nome,
      categoria: f.categoria,
      quantidade: Number(f.quantidade) || 0,
      custoUnitario: Number(f.custoUnitario) || 0,
      minimo: Number(f.minimo) || 5,
      unidade: f.unidade || "un",
      descricao: f.descricao,
    }));

    const result = await addProdutos(items);
    setOpenImport(false);
    setImportStep("upload");
    setImportedProducts([]);
    setRawText("");
    const parts = [];
    if (result.added) parts.push(`${result.added} adicionados`);
    if (result.updated) parts.push(`${result.updated} atualizados`);
    toast.success(`Produtos importados: ${parts.join(", ")}!`);
  };

  const addManualImportRow = () => {
    setImportedProducts([...importedProducts, createImportedProductDraft()]);
  };

  const updateImportedProduct = (index: number, field: keyof ProdutoForm, value: string) => {
    setImportedProducts(importedProducts.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removeImportedProduct = (index: number) => {
    setImportedProducts(importedProducts.filter((_, i) => i !== index));
  };

  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-4 pt-2">
      <div>
        <Label>Nome do produto *</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Resina Composta Z350" />
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Quantidade *</Label>
          <Input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Custo unit. *</Label>
          <Input type="number" step="0.01" value={form.custoUnitario} onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })} placeholder="0,00" />
        </div>
        <div>
          <Label>Mínimo</Label>
          <Input type="number" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} placeholder="5" />
        </div>
      </div>
      <div>
        <Label>Unidade</Label>
        <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="un">Unidade (un)</SelectItem>
            <SelectItem value="cx">Caixa (cx)</SelectItem>
            <SelectItem value="tubetes">Tubetes</SelectItem>
            <SelectItem value="pct">Pacote (pct)</SelectItem>
            <SelectItem value="ml">Mililitros (ml)</SelectItem>
            <SelectItem value="g">Gramas (g)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Descrição (opcional)</Label>
        <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do produto..." rows={2} />
      </div>
      <Button onClick={onSubmit} className="w-full gradient-primary text-primary-foreground">{submitLabel}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Estoque</h1>
          <p className="text-muted-foreground mt-1">Materiais odontológicos do consultório</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openImport} onOpenChange={(o) => { setOpenImport(o); if (!o) { setImportStep("upload"); setImportedProducts([]); setRawText(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Importar NF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Importar Nota Fiscal</DialogTitle></DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Envie uma nota fiscal (PDF ou imagem). O sistema tentará identificar os produtos, mas você poderá revisar e corrigir tudo antes de importar.
                  </p>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Clique para selecionar arquivo</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-xs text-muted-foreground"
                      onClick={() => {
                        setImportedProducts([createImportedProductDraft(), createImportedProductDraft(), createImportedProductDraft()]);
                        setImportStep("review");
                      }}
                    >
                      Ou preencha manualmente sem arquivo
                    </Button>
                  </div>
                </div>
              )}

              {importStep === "processing" && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Lendo documento...</p>
                  {ocrProgress > 0 && (
                    <div className="w-48">
                      <Progress value={ocrProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center mt-1">{ocrProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {importStep === "review" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Revise e corrija os dados abaixo antes de importar.
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => { setImportStep("upload"); setImportedProducts([]); setRawText(""); }}>
                      <X className="h-4 w-4 mr-1" /> Recomeçar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {importedProducts.map((p, i) => (
                      <div key={i} className="rounded-lg border p-3 flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-[1fr_80px_90px_60px] gap-2 items-center">
                          <Input
                            value={p.nome}
                            onChange={(e) => updateImportedProduct(i, "nome", e.target.value)}
                            placeholder="Nome do produto"
                            className="text-sm h-9"
                          />
                          <Input
                            type="number"
                            value={p.quantidade}
                            onChange={(e) => updateImportedProduct(i, "quantidade", e.target.value)}
                            placeholder="Qtd"
                            className="text-sm h-9"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={p.custoUnitario}
                            onChange={(e) => updateImportedProduct(i, "custoUnitario", e.target.value)}
                            placeholder="Valor"
                            className="text-sm h-9"
                          />
                          <Select value={p.unidade} onValueChange={(v) => updateImportedProduct(i, "unidade", v)}>
                            <SelectTrigger className="h-9 text-xs px-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="un">un</SelectItem>
                              <SelectItem value="cx">cx</SelectItem>
                              <SelectItem value="pct">pct</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="tubetes">tubetes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeImportedProduct(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Header labels */}
                  {importedProducts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum produto na lista. Adicione abaixo.</p>
                  )}

                  <Button variant="outline" onClick={addManualImportRow} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar produto
                  </Button>

                  <Button onClick={handleConfirmImport} className="w-full gradient-primary text-primary-foreground">
                    Confirmar Importação ({importedProducts.filter((product) => product.nome.trim()).length} produtos)
                  </Button>

                  {rawText && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver texto extraído do documento</summary>
                      <pre className="mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">{rawText}</pre>
                    </details>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-heading">Novo Produto</DialogTitle></DialogHeader>
              {renderForm(handleAdd, "Adicionar ao Estoque")}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Total de Produtos</p>
          <p className="text-2xl font-heading font-bold mt-1">{produtos.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Valor em Estoque</p>
          <p className="text-2xl font-heading font-bold mt-1">{formatCurrency(valorTotal)}</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 card-shadow">
          <p className="text-sm text-destructive">Estoque Baixo</p>
          <p className="text-2xl font-heading font-bold text-destructive mt-1">{alertas.length} itens</p>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtrados.map((produto) => {
          const porcentagem = Math.min((produto.quantidade / (produto.minimo * 3)) * 100, 100);
          const baixo = produto.quantidade <= produto.minimo;
          return (
            <div key={produto.id} className={`rounded-lg border p-5 card-shadow hover:card-shadow-hover transition-shadow ${baixo ? "border-destructive/30" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3 className="font-medium text-sm truncate">{produto.nome}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  {baixo && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(produto)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(produto.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className="font-medium">{produto.quantidade} {produto.unidade}</span>
                </div>
                <Progress value={porcentagem} className={`h-2 ${baixo ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo unit.</span>
                  <span className="font-medium">{formatCurrency(produto.custoUnitario)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor total</span>
                  <span className="font-medium">{formatCurrency(produto.quantidade * produto.custoUnitario)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Editar Produto</DialogTitle></DialogHeader>
          {renderForm(handleSaveEdit, "Salvar Alterações")}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
