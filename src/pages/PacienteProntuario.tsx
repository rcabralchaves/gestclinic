import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Calendar, ClipboardList, DollarSign, User,
  Phone, Mail, CalendarClock, CheckCircle2, Clock, FileText, Syringe, ScrollText, Edit, MessageCircle, Trash2,
  Camera, X as XIcon, ZoomIn
} from "lucide-react";
import { sendWhatsAppRetorno } from "@/lib/whatsapp";
import type { Paciente } from "@/lib/mockData";
import { formatCurrency, formaPagamentoLabels, type Atendimento } from "@/lib/mockData";
import { usePacientes } from "@/context/PacientesContext";
import { useReceitasDB, useAgendamentosDB } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Anamnese, { type AnamneseRegistro } from "@/components/Anamnese";
import MapaFacial, { type MarcacaoFacial } from "@/components/MapaFacial";
import { useAnamnese, useMapaFacial, useFotosProntuario, type FotoProntuario } from "@/hooks/useProntuarioData";
import Contratos from "@/components/Contratos";
import DocumentosPDF from "@/components/DocumentosPDF";
import LucroPorPaciente from "@/components/LucroPorPaciente";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PacienteProntuario = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("novo") === "1";
  const navigate = useNavigate();
  const { getPaciente, atendimentos: allAtendimentos, addAtendimento, updateAtendimento, deleteAtendimento, updatePaciente, deletePaciente } = usePacientes();
  const { receitas } = useReceitasDB();
  const { addAgendamento } = useAgendamentosDB();
  const paciente = getPaciente(id || "");

  const [openAtendimento, setOpenAtendimento] = useState(false);
  const [openRetorno, setOpenRetorno] = useState(false);
  const [retorno, setRetorno] = useState(paciente?.retorno || null);
  const { registros: anamneseRegistros, save: saveAnamnese } = useAnamnese(id || "");
  const { marcacoes: marcacoesFaciais, save: saveMapaFacial } = useMapaFacial(id || "");
  const [defaultTab, setDefaultTab] = useState<string>(isNew ? "dados" : "prontuario");

  const [form, setForm] = useState({
    procedimento: "", observacoes: "", data: new Date().toISOString().split("T")[0],
    valor: "", realizado: false, formaPagamento: "pix" as Atendimento["formaPagamento"],
  });

  const [retornoForm, setRetornoForm] = useState({ tipo: "6 meses", dataCustom: "" });

  const atendimentos = useMemo(() => {
    const lista = allAtendimentos.filter((a) => a.pacienteId === id);
    // Sort ascending for numbering, then reverse for display (latest first)
    const sorted = [...lista].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const numerados = sorted.map((a, i) => ({ ...a, numero: i + 1 }));
    return numerados.reverse();
  }, [allAtendimentos, id]);

  const receitasPaciente = useMemo(
    () => receitas.filter((r) => r.pacienteId === id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [receitas, id]
  );

  const totalReceita = useMemo(
    () => atendimentos.filter((a) => a.realizado).reduce((s, a) => s + a.valor, 0),
    [atendimentos]
  );

  if (!paciente) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Paciente não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/pacientes")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const handleAddAtendimento = async () => {
    if (!form.procedimento.trim() || !form.valor) return;
    await addAtendimento({
      pacienteId: id!,
      procedimento: form.procedimento,
      observacoes: form.observacoes,
      data: form.data,
      valor: Number(form.valor),
      realizado: form.realizado,
      formaPagamento: form.realizado ? form.formaPagamento : undefined,
    });
    if (form.realizado) {
      toast.success(`Receita de ${formatCurrency(Number(form.valor))} registrada automaticamente!`);
    }
    setForm({ procedimento: "", observacoes: "", data: new Date().toISOString().split("T")[0], valor: "", realizado: false, formaPagamento: "pix" });
    setOpenAtendimento(false);
  };

  const handleMarcarRealizado = async (atendimento: Atendimento) => {
    await updateAtendimento(atendimento.id, { realizado: true, formaPagamento: "pix" });
    toast.success(`${atendimento.procedimento} marcado como realizado! Receita registrada.`);
  };

  const handleSalvarRetorno = async () => {
    let dataRetorno: string;
    const hoje = new Date();
    const mesesMap: Record<string, number> = { "3 meses": 3, "6 meses": 6, "8 meses": 8, "1 ano": 12 };
    if (retornoForm.tipo === "personalizado") {
      dataRetorno = retornoForm.dataCustom;
    } else {
      const meses = mesesMap[retornoForm.tipo] || 6;
      hoje.setMonth(hoje.getMonth() + meses);
      dataRetorno = hoje.toISOString().split("T")[0];
    }
    setRetorno({ data: dataRetorno, tipo: retornoForm.tipo });
    await updatePaciente(id!, { retorno: { data: dataRetorno, tipo: retornoForm.tipo } });
    await addAgendamento({
      pacienteId: id!,
      pacienteNome: paciente!.nome,
      procedimento: `Retorno - ${paciente!.nome}`,
      data: dataRetorno,
      horaInicio: "08:00",
      duracao: 30,
      status: "agendado",
      pessoal: false,
    });
    setOpenRetorno(false);
    toast.success("Retorno agendado com sucesso!");
  };

  const idade = paciente.dataNascimento
    ? Math.floor((Date.now() - new Date(paciente.dataNascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">{paciente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {paciente.cpf && `${paciente.cpf} · `}{idade !== null && `${idade} anos`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {paciente.telefone && (
            <Button variant="outline" size="sm" className="text-green-600 border-green-600/30 hover:bg-green-50" onClick={() => sendWhatsAppRetorno(paciente.nome, paciente.telefone)}>
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
                <AlertDialogDescription>
                  O paciente <strong>{paciente.nome}</strong> será arquivado e não aparecerá mais na lista. Os dados clínicos (prontuários, contratos) são preservados no banco de dados por obrigação legal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    const ok = await deletePaciente(id!);
                    if (ok) {
                      toast.success("Paciente excluído com sucesso.");
                      navigate("/pacientes");
                    } else {
                      toast.error("Erro ao excluir paciente.");
                    }
                  }}
                >
                  Arquivar paciente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={openRetorno} onOpenChange={setOpenRetorno}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><CalendarClock className="mr-2 h-4 w-4" /> Retorno</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Agendar Retorno</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Período</Label>
                  <Select value={retornoForm.tipo} onValueChange={(v) => setRetornoForm({ ...retornoForm, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 meses">3 meses</SelectItem>
                      <SelectItem value="6 meses">6 meses</SelectItem>
                      <SelectItem value="8 meses">8 meses</SelectItem>
                      <SelectItem value="1 ano">1 ano</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {retornoForm.tipo === "personalizado" && (
                  <div><Label>Data</Label><Input type="date" value={retornoForm.dataCustom} onChange={(e) => setRetornoForm({ ...retornoForm, dataCustom: e.target.value })} /></div>
                )}
                <Button onClick={handleSalvarRetorno} className="w-full gradient-primary text-primary-foreground">Salvar Retorno</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openAtendimento} onOpenChange={setOpenAtendimento}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground" size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Atendimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Registrar Atendimento</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Procedimento *</Label><Input value={form.procedimento} onChange={(e) => setForm({ ...form, procedimento: e.target.value })} placeholder="Ex: Limpeza, Canal, Restauração..." /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Detalhes do procedimento..." rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                  <div><Label>Valor (R$)</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <Checkbox id="realizado" checked={form.realizado} onCheckedChange={(c) => setForm({ ...form, realizado: c === true })} />
                  <label htmlFor="realizado" className="text-sm font-medium cursor-pointer">Procedimento realizado — gerar receita automaticamente</label>
                </div>
                {form.realizado && (
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Select value={form.formaPagamento} onValueChange={(v) => setForm({ ...form, formaPagamento: v as Atendimento["formaPagamento"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(formaPagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAddAtendimento} className="w-full gradient-primary text-primary-foreground">
                  {form.realizado ? "Registrar e Gerar Receita" : "Registrar Atendimento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick actions for new patient */}
      {isNew && atendimentos.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6">
          <p className="text-sm font-medium text-primary mb-3">✨ Paciente cadastrado! O que deseja fazer agora?</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDefaultTab("anamnese")}>
              <ScrollText className="mr-2 h-4 w-4" /> Preencher anamnese
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenAtendimento(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar atendimento
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/agenda")}>
              <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
            </Button>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><DollarSign className="h-4 w-4" /> Receita Total</div>
          <p className="text-2xl font-heading font-bold text-success">{formatCurrency(totalReceita)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><ClipboardList className="h-4 w-4" /> Atendimentos</div>
          <p className="text-2xl font-heading font-bold">{atendimentos.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><CalendarClock className="h-4 w-4" /> Próximo Retorno</div>
          <p className="text-lg font-heading font-bold">{retorno ? new Date(retorno.data).toLocaleDateString("pt-BR") : "Não agendado"}</p>
          {retorno && <p className="text-xs text-muted-foreground">{retorno.tipo}</p>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <div className="w-full overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-max min-w-full sm:w-full h-auto gap-1 p-1">
            <TabsTrigger value="prontuario" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Prontuário</span></TabsTrigger>
            <TabsTrigger value="anamnese" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><ScrollText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Anamnese</span></TabsTrigger>
            <TabsTrigger value="mapa_facial" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><Syringe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Mapa</span></TabsTrigger>
            <TabsTrigger value="contratos" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Contratos</span></TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Documentos</span></TabsTrigger>
            <TabsTrigger value="dados" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Dados</span></TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs sm:text-sm px-3 py-2 gap-1.5 whitespace-nowrap"><DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /><span>Financeiro</span></TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="prontuario" className="space-y-4 mt-4">
          {atendimentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum atendimento registrado</p>
              <Button variant="outline" className="mt-3" onClick={() => setOpenAtendimento(true)}>
                <Plus className="mr-2 h-4 w-4" /> Registrar primeiro atendimento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentos.map((a) => (
                <AtendimentoCard
                  key={a.id}
                  atendimento={a}
                  numero={(a as any).numero}
                  onSave={async (updates) => {
                    await updateAtendimento(a.id, updates);
                    toast.success("Atendimento atualizado!");
                  }}
                  onMarcarRealizado={() => handleMarcarRealizado(a)}
                  onDelete={async () => {
                    const ok = await deleteAtendimento(a.id);
                    if (ok) toast.success("Prontuário excluído!");
                    else toast.error("Erro ao excluir prontuário.");
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="anamnese" className="mt-4">
          <Anamnese pacienteId={id!} pacienteNome={paciente?.nome} registros={anamneseRegistros} onSave={saveAnamnese} />
        </TabsContent>

        <TabsContent value="mapa_facial" className="mt-4">
          <MapaFacial pacienteId={id!} marcacoes={marcacoesFaciais} onSave={saveMapaFacial} />
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <Contratos pacienteId={id!} paciente={paciente} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <DocumentosPDF paciente={paciente} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <EditarPacienteTab paciente={paciente} onSave={async (updates) => {
            await updatePaciente(id!, updates);
            toast.success("Dados do paciente atualizados!");
          }} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4 space-y-6">
          <LucroPorPaciente pacienteId={id!} receitaTotalPaciente={totalReceita} />

          {/* Receitas from receitas table */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Receitas</h3>
            {receitasPaciente.length === 0 && atendimentos.filter(a => a.realizado).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma receita registrada</p>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden card-shadow">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Procedimento</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pagamento</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parcelas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitasPaciente.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-3 font-medium">{r.procedimento}</td>
                        <td className="px-4 py-3 font-medium text-success">{formatCurrency(r.valor)}</td>
                        <td className="px-4 py-3">{r.formaPagamento ? formaPagamentoLabels[r.formaPagamento as keyof typeof formaPagamentoLabels] || r.formaPagamento : "—"}</td>
                        <td className="px-4 py-3">{(r as any).parcelas && (r as any).parcelas > 1 ? `${(r as any).parcelas}x` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 text-right">
              <span className="text-muted-foreground text-sm">Total recebido: </span>
              <span className="text-xl font-heading font-bold text-success">{formatCurrency(totalReceita)}</span>
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoField = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1.5">{icon}{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const EditarPacienteTab = ({ paciente, onSave }: { paciente: Paciente; onSave: (updates: Partial<Paciente>) => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: paciente.nome,
    cpf: paciente.cpf || "",
    dataNascimento: paciente.dataNascimento || "",
    telefone: paciente.telefone || "",
    email: paciente.email || "",
    historicoMedico: paciente.historicoMedico || "",
    observacoes: paciente.observacoes || "",
  });

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setEditing(false);
  };

  // Sync form when paciente changes
  useState(() => {
    setForm({
      nome: paciente.nome,
      cpf: paciente.cpf || "",
      dataNascimento: paciente.dataNascimento || "",
      telefone: paciente.telefone || "",
      email: paciente.email || "",
      historicoMedico: paciente.historicoMedico || "",
      observacoes: paciente.observacoes || "",
    });
  });

  if (!editing) {
    return (
      <div className="rounded-lg border bg-card p-6 card-shadow space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField icon={<User className="h-4 w-4" />} label="Nome" value={paciente.nome} />
          <InfoField label="CPF" value={paciente.cpf || "Não informado"} />
          <InfoField label="Data de nascimento" value={paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString("pt-BR") : "—"} />
          <InfoField icon={<Phone className="h-4 w-4" />} label="Telefone" value={paciente.telefone || "—"} />
          <InfoField icon={<Mail className="h-4 w-4" />} label="E-mail" value={paciente.email || "—"} />
          <InfoField label="Cadastrado em" value={new Date(paciente.criadoEm).toLocaleDateString("pt-BR")} />
        </div>
        {paciente.historicoMedico && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-1">Histórico Médico</p>
            <p className="text-sm bg-warning/10 text-warning rounded-lg p-3">⚕️ {paciente.historicoMedico}</p>
          </div>
        )}
        {paciente.observacoes && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
            <p className="text-sm">{paciente.observacoes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 card-shadow space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
        <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
        <div><Label>Data de nascimento</Label><Input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} /></div>
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
        <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div><Label>Histórico médico</Label><Textarea value={form.historicoMedico} onChange={(e) => setForm({ ...form, historicoMedico: e.target.value })} rows={3} /></div>
      <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};

const AtendimentoCard = ({ atendimento, numero, onSave, onMarcarRealizado, onDelete }: { atendimento: Atendimento; numero?: number; onSave: (updates: Partial<Atendimento>) => Promise<void>; onMarcarRealizado: () => void; onDelete: () => void | Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    procedimento: atendimento.procedimento,
    observacoes: atendimento.observacoes || "",
    data: atendimento.data,
    valor: String(atendimento.valor),
    formaPagamento: atendimento.formaPagamento || "pix",
  });

  const { fotos, uploading: fotosUploading, addFoto, removeFoto } = useFotosProntuario(atendimento.id);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const handleAddFoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try { await addFoto(file); } catch { /* toast mostrado pelo chamador */ }
    }
    e.target.value = "";
  }, [addFoto]);

  const handleRemoveFoto = useCallback(async (foto: FotoProntuario) => {
    await removeFoto(foto);
  }, [removeFoto]);

  if (editing) {
    return (
      <div className="rounded-lg border bg-card p-4 card-shadow space-y-3">
        <div><Label>Procedimento</Label><Input value={form.procedimento} onChange={(e) => setForm({ ...form, procedimento: e.target.value })} /></div>
        <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          <div><Label>Valor (R$)</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
        </div>
        {atendimento.realizado && (
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.formaPagamento} onValueChange={(v) => setForm({ ...form, formaPagamento: v as Atendimento["formaPagamento"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(formaPagamentoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button size="sm" disabled={saving} className="gradient-primary text-primary-foreground" onClick={async () => {
            setSaving(true);
            await onSave({
              procedimento: form.procedimento,
              observacoes: form.observacoes,
              data: form.data,
              valor: Number(form.valor),
              formaPagamento: atendimento.realizado ? (form.formaPagamento as Atendimento["formaPagamento"]) : undefined,
            });
            setSaving(false);
            setEditing(false);
          }}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 card-shadow hover:border-primary/50 hover:shadow-md transition-all">
      {/* Lightbox */}
      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Foto ampliada" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setFotoAmpliada(null)}>
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true); } }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {numero !== undefined && (
              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                #{numero}
              </span>
            )}
            <h4 className="font-heading font-semibold">{atendimento.procedimento}</h4>
            {atendimento.realizado ? (
              <Badge variant="default" className="bg-success/10 text-success border-success/20 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Realizado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>
            )}
          </div>
          {atendimento.observacoes && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{atendimento.observacoes}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(atendimento.data).toLocaleDateString("pt-BR")}</span>
            <span className="font-medium text-foreground">{formatCurrency(atendimento.valor)}</span>
            {atendimento.formaPagamento && <span>{formaPagamentoLabels[atendimento.formaPagamento]}</span>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Editar</span>
          </Button>
          {!atendimento.realizado && (
            <Button size="sm" variant="outline" onClick={onMarcarRealizado} className="text-success border-success/30 hover:bg-success/10">
              <CheckCircle2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Realizado</span>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir prontuário?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. O atendimento <strong>{atendimento.procedimento}</strong> de {new Date(atendimento.data).toLocaleDateString("pt-BR")} será removido. A receita já registrada (se houver) NÃO será removida automaticamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete()}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Galeria de fotos */}
      <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
        {fotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {fotos.map((foto, idx) => (
              <div key={foto.id} className="relative group">
                <img
                  src={foto.url}
                  alt={`Foto ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setFotoAmpliada(foto.url)}
                />
                <button
                  className="absolute -top-1.5 -right-1.5 hidden group-hover:flex bg-destructive text-destructive-foreground rounded-full p-0.5"
                  onClick={() => handleRemoveFoto(foto)}
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <button
                  className="absolute bottom-1 right-1 hidden group-hover:flex bg-black/50 text-white rounded p-0.5"
                  onClick={() => setFotoAmpliada(foto.url)}
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={fotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddFoto} />
        <Button size="sm" variant="outline" onClick={() => fotoRef.current?.click()} disabled={fotosUploading} className="text-xs h-7 gap-1.5">
          <Camera className="h-3.5 w-3.5" /> {fotosUploading ? "Salvando..." : fotos.length === 0 ? "Adicionar foto" : "Adicionar mais fotos"}
        </Button>
      </div>
    </div>
  );
};

export default PacienteProntuario;
