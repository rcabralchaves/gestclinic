import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, CalendarClock, Phone, Mail, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { formatCurrency, type Paciente } from "@/lib/mockData";
import { usePacientes } from "@/context/PacientesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type OrdemFiltro = "az" | "maior-gasto" | "sem-retorno";

const Pacientes = () => {
  const navigate = useNavigate();
  const { pacientes, atendimentos, addPaciente, addPacientes } = usePacientes();
  const [search, setSearch] = useState("");
  const [ordem, setOrdem] = useState<OrdemFiltro>("az");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<Partial<Paciente>[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "preview">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "", cpf: "", dataNascimento: "", telefone: "", email: "",
    observacoes: "", historicoMedico: "",
  });

  const filtered = useMemo(() => {
    const base = pacientes.filter((p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.cpf && p.cpf.includes(search)) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    );

    if (ordem === "az") {
      return [...base].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }
    if (ordem === "maior-gasto") {
      return [...base].sort((a, b) => {
        const ga = atendimentos.filter((x) => x.pacienteId === a.id && x.realizado).reduce((s, x) => s + x.valor, 0);
        const gb = atendimentos.filter((x) => x.pacienteId === b.id && x.realizado).reduce((s, x) => s + x.valor, 0);
        return gb - ga;
      });
    }
    if (ordem === "sem-retorno") {
      return [...base].sort((a, b) => {
        const da = a.retorno ? new Date(a.retorno.data).getTime() : 0;
        const db = b.retorno ? new Date(b.retorno.data).getTime() : 0;
        return da - db;
      });
    }
    return base;
  }, [pacientes, atendimentos, search, ordem]);

  const handleAdd = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const novo = await addPaciente({
      ...form,
      criadoEm: new Date().toISOString().split("T")[0],
    });
    toast.success("Paciente cadastrado com sucesso!");
    setForm({ nome: "", cpf: "", dataNascimento: "", telefone: "", email: "", observacoes: "", historicoMedico: "" });
    setOpen(false);
    if (novo) navigate(`/pacientes/${novo.id}?novo=1`);
  };

  const getRetornoStatus = (p: Paciente) => {
    if (!p.retorno) return null;
    const diff = Math.ceil((new Date(p.retorno.data).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Atrasado", variant: "destructive" as const };
    if (diff <= 15) return { label: `Em ${diff}d`, variant: "default" as const };
    return { label: p.retorno.tipo, variant: "secondary" as const };
  };

  // CSV/Excel parsing with SheetJS
  const parseSheetData = (rows: string[][]) => {
    if (rows.length < 2) {
      toast.error("Arquivo vazio ou sem dados");
      return;
    }

    const header = rows[0].map((h) => (h || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const findCol = (keywords: string[]) => header.findIndex((h) => keywords.some((k) => h.includes(k)));

    const nameIdx = findCol(["nome", "name", "paciente", "patient"]);
    const phoneIdx = findCol(["telefone", "phone", "cel", "celular", "fone", "whatsapp"]);
    const emailIdx = findCol(["email", "e-mail", "correio"]);
    const cpfIdx = findCol(["cpf", "documento", "doc"]);
    const dobIdx = findCol(["nascimento", "birth", "data_nasc", "dt_nasc", "data nasc", "aniversario"]);

    if (nameIdx === -1) {
      toast.error("Coluna 'Nome' não encontrada. Verifique o cabeçalho do arquivo.");
      return;
    }

    const parsed: Partial<Paciente>[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c) => (c || "").toString().trim());
      const nome = cols[nameIdx] || "";
      if (!nome) continue;

      const cpfVal = cpfIdx >= 0 ? cols[cpfIdx] || "" : "";
      const isDuplicate = pacientes.some(
        (p) =>
          p.nome.toLowerCase() === nome.toLowerCase() ||
          (cpfVal && p.cpf && p.cpf.replace(/\D/g, "") === cpfVal.replace(/\D/g, ""))
      );

      parsed.push({
        id: `p${Date.now()}_${i}`,
        nome,
        telefone: phoneIdx >= 0 ? cols[phoneIdx] || "" : "",
        email: emailIdx >= 0 ? cols[emailIdx] || "" : "",
        cpf: cpfVal,
        dataNascimento: dobIdx >= 0 ? cols[dobIdx] || "" : "",
        observacoes: isDuplicate ? "⚠️ POSSÍVEL DUPLICATA" : "",
        historicoMedico: "",
        criadoEm: new Date().toISOString().split("T")[0],
      });
    }

    if (parsed.length === 0) {
      toast.error("Nenhum paciente encontrado no arquivo.");
      return;
    }

    setImportData(parsed);
    setImportStep("preview");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          parseSheetData(rows);
        } catch {
          toast.error("Erro ao ler arquivo Excel. Verifique o formato.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text) return;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        const rows = lines.map((l) => l.split(/[,;\t]/).map((c) => c.replace(/^["']|["']$/g, "")));
        parseSheetData(rows);
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    const toImport = importData.filter((p) => !p.observacoes?.includes("DUPLICATA"));
    const novos: Paciente[] = toImport.map((p) => ({
      id: p.id || `p${Date.now()}`,
      nome: p.nome || "",
      cpf: p.cpf || "",
      dataNascimento: p.dataNascimento || "",
      telefone: p.telefone || "",
      email: p.email || "",
      observacoes: p.observacoes || "",
      historicoMedico: p.historicoMedico || "",
      criadoEm: p.criadoEm || new Date().toISOString().split("T")[0],
    }));
    await addPacientes(novos);
    toast.success(`${novos.length} pacientes importados com sucesso!`);
    setImportOpen(false);
    setImportData([]);
    setImportStep("upload");
  };

  const removeImportRow = (idx: number) => {
    setImportData((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateImportRow = (idx: number, field: string, value: string) => {
    setImportData((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Prontuário eletrônico e gestão de pacientes</p>
        </div>
        <div className="flex gap-2">
          {/* Import button */}
          <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); if (!v) { setImportStep("upload"); setImportData([]); } }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" /> Importar Pacientes
                </DialogTitle>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Envie um arquivo CSV ou Excel com colunas: <strong>Nome</strong>, Telefone, E-mail, CPF.
                  </p>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Clique para selecionar arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, TXT, Excel (.xlsx, .xls)</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </div>
              )}

              {importStep === "preview" && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{importData.length} pacientes encontrados</p>
                    <Button variant="ghost" size="sm" onClick={() => { setImportStep("upload"); setImportData([]); }}>
                      <X className="h-4 w-4 mr-1" /> Recomeçar
                    </Button>
                  </div>

                  {importData.some((p) => p.observacoes?.includes("DUPLICATA")) && (
                    <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-warning/10 text-warning">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Pacientes marcados como duplicata não serão importados.
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Nome</th>
                          <th className="px-3 py-2 text-left font-medium">Telefone</th>
                          <th className="px-3 py-2 text-left font-medium">E-mail</th>
                          <th className="px-3 py-2 text-left font-medium">CPF</th>
                          <th className="px-3 py-2 text-left font-medium">Nascimento</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.map((p, idx) => (
                          <tr key={idx} className={`border-t ${p.observacoes?.includes("DUPLICATA") ? "bg-warning/5 opacity-60" : ""}`}>
                            <td className="px-3 py-2">
                              <Input value={p.nome || ""} onChange={(e) => updateImportRow(idx, "nome", e.target.value)} className="h-8 text-sm" />
                            </td>
                            <td className="px-3 py-2">
                              <Input value={p.telefone || ""} onChange={(e) => updateImportRow(idx, "telefone", e.target.value)} className="h-8 text-sm" />
                            </td>
                            <td className="px-3 py-2">
                              <Input value={p.email || ""} onChange={(e) => updateImportRow(idx, "email", e.target.value)} className="h-8 text-sm" />
                            </td>
                            <td className="px-3 py-2">
                              <Input value={p.cpf || ""} onChange={(e) => updateImportRow(idx, "cpf", e.target.value)} className="h-8 text-sm" />
                            </td>
                            <td className="px-3 py-2">
                              <Input value={p.dataNascimento || ""} onChange={(e) => updateImportRow(idx, "dataNascimento", e.target.value)} className="h-8 text-sm" placeholder="dd/mm/aaaa" />
                            </td>
                            <td className="px-3 py-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeImportRow(idx)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button onClick={handleImportConfirm} className="w-full gradient-primary text-primary-foreground">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Importar {importData.filter((p) => !p.observacoes?.includes("DUPLICATA")).length} pacientes
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* New patient */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Cadastrar Paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do paciente" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>CPF <span className="text-muted-foreground text-xs">(opcional)</span></Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                  <div><Label>Data de nascimento</Label><Input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                  <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                </div>
                <div><Label>Histórico médico</Label><Textarea value={form.historicoMedico} onChange={(e) => setForm({ ...form, historicoMedico: e.target.value })} placeholder="Alergias, doenças crônicas, medicamentos..." rows={3} /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações gerais sobre o paciente" rows={2} /></div>
                <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground">Cadastrar Paciente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={ordem} onValueChange={(v) => setOrdem(v as OrdemFiltro)}>
          <SelectTrigger className="w-52">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="az">A-Z (nome)</SelectItem>
            <SelectItem value="maior-gasto">Maiores gastos</SelectItem>
            <SelectItem value="sem-retorno">Sem retorno há mais tempo</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary flex items-center gap-2 whitespace-nowrap">
          <Users className="h-4 w-4" /> {filtered.length} pacientes
        </div>
      </div>

      {/* Patient cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const retorno = getRetornoStatus(p);
          const totalReceita = atendimentos.filter((a) => a.pacienteId === p.id && a.realizado).reduce((s, a) => s + a.valor, 0);
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/pacientes/${p.id}`)}
              className="rounded-lg border bg-card p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">{p.nome}</h3>
                  {p.cpf && <p className="text-xs text-muted-foreground mt-0.5">{p.cpf}</p>}
                </div>
                {retorno && (
                  <Badge variant={retorno.variant} className="text-xs">
                    <CalendarClock className="h-3 w-3 mr-1" />{retorno.label}
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {p.telefone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {p.telefone}</div>}
                {p.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {p.email}</div>}
              </div>
              {totalReceita > 0 && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Total gerado: </span>
                  <span className="font-medium text-success">{formatCurrency(totalReceita)}</span>
                </div>
              )}
              {p.historicoMedico && p.historicoMedico !== 'Sem comorbidades' && (
                <div className="mt-2 text-xs text-warning bg-warning/10 rounded px-2 py-1">⚕️ {p.historicoMedico}</div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Nenhum paciente encontrado</p>
          <p className="text-sm mt-1">Tente buscar por outro termo ou cadastre um novo paciente</p>
        </div>
      )}
    </div>
  );
};

export default Pacientes;
