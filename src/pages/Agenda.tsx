import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Plus, ChevronLeft, ChevronRight, User, Trash2, Edit, CheckCircle2, X, MessageCircle,
} from "lucide-react";
import { sendWhatsAppLembrete } from "@/lib/whatsapp";
import {
  formatCurrency, formaPagamentoLabels,
  type Atendimento, type Paciente, type Agendamento,
} from "@/lib/mockData";
import { usePacientes } from "@/context/PacientesContext";
import { useAgendamentosDB, useReceitasDB, usePacientesDB, useEstoqueDB, useAtendimentosDB } from "@/hooks/useSupabaseData";
import { useProcedimentos } from "@/hooks/useProcedimentos";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import FinalizarConsultaDialog from "@/components/FinalizarConsultaDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const FIRST_HOUR = 7;
const LAST_HOUR = 21; // estende a agenda até 21h
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => i + FIRST_HOUR); // 7h-21h
const SLOT_HEIGHT = 60; // px per hour

const getAgStartMinutes = (ag: Agendamento) => {
  const [h, m] = ag.horaInicio.split(":").map(Number);
  return (h - FIRST_HOUR) * 60 + (m || 0);
};

const getEndTime = (ag: Agendamento) => {
  const [h, m] = ag.horaInicio.split(":").map(Number);
  const totalMin = h * 60 + (m || 0) + ag.duracao;
  const endH = Math.floor(totalMin / 60).toString().padStart(2, "0");
  const endM = (totalMin % 60).toString().padStart(2, "0");
  return `${endH}:${endM}`;
};
const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Agenda = () => {
  const navigate = useNavigate();
  const { pacientes, atendimentos: allAtendimentos } = usePacientes();
  const { agendamentos: agendamentosList, addAgendamento, updateAgendamento, removeAgendamento } = useAgendamentosDB();
  const { addReceita } = useReceitasDB();
  const { addAtendimento } = useAtendimentosDB();
  const { addPaciente, refetch: refetchPacientes } = usePacientesDB();
  const { produtos, updateProduto } = useEstoqueDB();
  const { procedimentos, addProcedimento, updateProcedimento, getCorByNome } = useProcedimentos();
  const { user } = useAuth();
  const [finalizarAg, setFinalizarAg] = useState<Agendamento | null>(null);
  const [view, setView] = useState<"dia" | "semana" | "mes">("dia");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openNew, setOpenNew] = useState(false);
  const [openDetail, setOpenDetail] = useState<Agendamento | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ hora: "", duracao: "60", procedimento: "", data: "" });
  const [searchPaciente, setSearchPaciente] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [showCreatePaciente, setShowCreatePaciente] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [showNovoProc, setShowNovoProc] = useState(false);
  const [novoProcForm, setNovoProcForm] = useState({ nome: "", cor: "#3b82f6" });
  const [editingProcId, setEditingProcId] = useState<string | null>(null);
  const [isPessoal, setIsPessoal] = useState(false);
  const [tituloPessoal, setTituloPessoal] = useState("");

  const [form, setForm] = useState({
    hora: "09:00",
    duracao: "60",
    procedimento: "",
    novoPacienteNome: "",
    novoPacienteTelefone: "",
  });

  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  const filteredPacientes = useMemo(() => {
    if (!searchPaciente.trim()) return [];
    const q = searchPaciente.toLowerCase();
    return pacientes.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.cpf.includes(q)
    ).slice(0, 5);
  }, [searchPaciente]);

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const agendamentosDia = (date: Date) =>
    agendamentosList.filter((a) => a.data === dateStr(date));

  const navigate_date = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "dia") d.setDate(d.getDate() + dir);
    else if (view === "semana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const handleCreateAgendamento = async () => {
    // Compromisso pessoal — sem paciente
    if (isPessoal) {
      if (!tituloPessoal.trim()) {
        toast.error("Informe um título para o compromisso");
        return;
      }
      await addAgendamento({
        pacienteId: null,
        pacienteNome: tituloPessoal.trim(),
        procedimento: tituloPessoal.trim(),
        data: dateStr(currentDate),
        horaInicio: form.hora,
        duracao: Number(form.duracao),
        status: "agendado",
        pessoal: true,
      });
      toast.success("Compromisso criado!");
      resetForm();
      setOpenNew(false);
      return;
    }

    if (!selectedPaciente && !form.novoPacienteNome) return;

    let pacienteId: string;
    let pacienteNome: string;

    if (selectedPaciente) {
      pacienteId = selectedPaciente.id;
      pacienteNome = selectedPaciente.nome;
    } else {
      // Create new patient first
      const novoPaciente = await addPaciente({
        nome: form.novoPacienteNome,
        telefone: form.novoPacienteTelefone || "",
        cpf: "",
        dataNascimento: "",
        email: "",
        observacoes: "",
        historicoMedico: "",
        criadoEm: new Date().toISOString().split("T")[0],
      });
      if (!novoPaciente) {
        toast.error("Erro ao criar paciente. Tente novamente.");
        return;
      }
      pacienteId = novoPaciente.id;
      pacienteNome = novoPaciente.nome;
      await refetchPacientes();
      toast.success(`Paciente ${pacienteNome} cadastrado!`);
    }

    const procNome = form.procedimento || "Consulta";
    // Auto-save procedimento if it doesn't exist yet
    if (procNome && !procedimentos.find((p) => p.nome.toLowerCase() === procNome.toLowerCase())) {
      await addProcedimento(procNome);
    }
    await addAgendamento({
      pacienteId,
      pacienteNome,
      procedimento: procNome,
      data: dateStr(currentDate),
      horaInicio: form.hora,
      duracao: Number(form.duracao),
      status: "agendado",
    });
    toast.success(`Agendamento criado para ${pacienteNome}`);
    resetForm();
    setOpenNew(false);
  };

  const handleIniciarConsulta = async (ag: Agendamento) => {
    await updateAgendamento(ag.id, { status: "em_atendimento" });
    toast.success(`Consulta de ${ag.pacienteNome} iniciada!`);
    setOpenDetail(null);
  };

  const handleMarcarRealizado = (ag: Agendamento) => {
    setOpenDetail(null);
    setFinalizarAg(ag);
  };

  const handleFinalizarCompleto = async (ag: Agendamento, data: {
    materiais: { produtoId: string; nome: string; quantidade: number }[];
    servicos: { nome: string; valor: string }[];
    valor: number;
    formaPagamento: string;
    parcelas: number;
    antecipar: boolean;
    data: string;
    observacoes: string;
  }) => {
    // 1. Update agendamento status
    await updateAgendamento(ag.id, { status: "realizado" });

    // 2. Deduct stock for each material
    for (const mat of data.materiais) {
      if (!mat.produtoId) continue;
      const produto = produtos.find((p) => p.id === mat.produtoId);
      if (produto) {
        const novaQtd = Math.max(0, produto.quantidade - mat.quantidade);
        await updateProduto(mat.produtoId, { quantidade: novaQtd });
      }
    }

    // 3. Fetch user profile to get card fees
    let taxaCartao = 0;
    let taxaAntecipacao = 0;
    if (user && (data.formaPagamento === "cartao_credito" || data.formaPagamento === "cartao_debito")) {
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("taxa_credito, taxa_debito, taxa_antecipacao")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        const p = profile as any;
        taxaCartao = data.formaPagamento === "cartao_credito"
          ? Number(p.taxa_credito || 0)
          : Number(p.taxa_debito || 0);
        taxaAntecipacao = Number(p.taxa_antecipacao || 0);
      }
    }

    // 4. Create receita with combined service names
    const procedimentoNomes = data.servicos
      .filter((s) => s.nome.trim())
      .map((s) => s.nome.trim())
      .join(", ") || ag.procedimento || "Consulta";

    await addReceita({
      paciente: ag.pacienteNome,
      pacienteId: ag.pacienteId,
      procedimento: procedimentoNomes,
      valor: data.valor,
      formaPagamento: data.formaPagamento as any,
      data: data.data,
      parcelas: data.parcelas,
      taxaCartao,
      antecipar: data.antecipar,
      taxaAntecipacao: data.antecipar ? taxaAntecipacao : 0,
    });

    // 5. Create atendimento record with observations
    await addAtendimento({
      pacienteId: ag.pacienteId,
      procedimento: procedimentoNomes,
      observacoes: data.observacoes || "",
      data: data.data,
      valor: data.valor,
      realizado: true,
      formaPagamento: data.formaPagamento as any,
    });

    const taxaMsg = taxaCartao > 0 ? ` (taxa ${taxaCartao}%${data.antecipar ? ` + antecipação ${taxaAntecipacao}%` : ""})` : data.antecipar ? ` (antecipação ${taxaAntecipacao}%)` : "";
    toast.success(`Atendimento de ${ag.pacienteNome} finalizado!${taxaMsg}`);
    setFinalizarAg(null);
  };

  const handleCancelar = async (ag: Agendamento) => {
    await updateAgendamento(ag.id, { status: "cancelado" });
    toast.info(`Agendamento de ${ag.pacienteNome} cancelado.`);
    setOpenDetail(null);
  };

  const handleRemove = async (ag: Agendamento) => {
    await removeAgendamento(ag.id);
    toast.info("Agendamento removido.");
    setOpenDetail(null);
  };

  const resetForm = () => {
    setForm({ hora: "09:00", duracao: "60", procedimento: "", novoPacienteNome: "", novoPacienteTelefone: "" });
    setSearchPaciente("");
    setSelectedPaciente(null);
    setShowCreatePaciente(false);
    setIsPessoal(false);
    setTituloPessoal("");
  };

  // Mês — gera grid 6 semanas
  const getMonthGrid = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = first.getDay(); // 0=dom
    const start = new Date(first);
    start.setDate(start.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const openNewAtSlot = (hour: number, date?: Date) => {
    const h = hour.toString().padStart(2, "0");
    setForm({ ...form, hora: `${h}:00` });
    if (date) setCurrentDate(date);
    setOpenNew(true);
  };

  const handleDrop = async (hour: number, date?: Date) => {
    if (!dragItem) return;
    const h = hour.toString().padStart(2, "0");
    await updateAgendamento(dragItem, {
      horaInicio: `${h}:00`,
      ...(date ? { data: dateStr(date) } : {}),
    });
    setDragItem(null);
    toast.success("Horário atualizado!");
  };

  const statusColor = (status: string) => {
    if (status === "em_atendimento") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (status === "realizado") return "bg-success/10 text-success border-success/20";
    if (status === "cancelado") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  const statusLabel = (status: string) => {
    if (status === "em_atendimento") return "Em Atendimento";
    if (status === "realizado") return "Finalizado";
    if (status === "cancelado") return "Cancelado";
    return "Agendado";
  };

  const lastProcedure = (pacienteId: string | null) => {
    if (!pacienteId) return null;
    const at = allAtendimentos
      .filter((a) => a.pacienteId === pacienteId && a.realizado)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return at[0]?.procedimento || null;
  };

  const renderDayView = (date: Date) => {
    const items = agendamentosDia(date);
    return (
      <div className="relative">
        {/* Hour grid lines */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex border-b group"
            style={{ height: `${SLOT_HEIGHT}px` }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(h, date)}
            onClick={() => openNewAtSlot(h, date)}
          >
            <div className="w-16 shrink-0 py-2 text-xs text-muted-foreground text-right pr-3 border-r">
              {h.toString().padStart(2, "0")}:00
            </div>
            <div className="flex-1 relative cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
        {/* Overlaid appointments */}
        {items.map((ag) => {
          const topMin = getAgStartMinutes(ag);
          const topPx = (topMin / 60) * SLOT_HEIGHT;
          const heightPx = Math.max((ag.duracao / 60) * SLOT_HEIGHT, 28);
          const cor = ag.procedimento ? getCorByNome(ag.procedimento) : "#3b82f6";
          const isCanceled = ag.status === "cancelado";
          return (
            <div
              key={ag.id}
              draggable
              onDragStart={() => setDragItem(ag.id)}
              onClick={(e) => { e.stopPropagation(); setOpenDetail(ag); }}
              className="absolute left-16 right-0 mx-2 rounded-md px-3 py-1.5 text-xs font-medium cursor-grab active:cursor-grabbing border-l-4 z-10 transition-all hover:shadow-md"
              style={{
                top: `${topPx}px`,
                height: `${heightPx}px`,
                overflow: "hidden",
                backgroundColor: `${cor}1f`,
                borderLeftColor: cor,
                color: cor,
                opacity: isCanceled ? 0.5 : 1,
                textDecoration: isCanceled ? "line-through" : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{ag.horaInicio} – {getEndTime(ag)} — {ag.pacienteNome}</span>
                <span className="opacity-70">{ag.duracao}min</span>
              </div>
              {heightPx > 36 && <div className="opacity-80 mt-0.5">{ag.procedimento} · {statusLabel(ag.status)}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "dia" | "semana" | "mes")}>
            <TabsList>
              <TabsTrigger value="dia">Dia</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="gradient-primary text-primary-foreground" onClick={() => { resetForm(); setOpenNew(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Agendar
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3 card-shadow">
        <Button variant="ghost" size="icon" onClick={() => navigate_date(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="font-heading font-semibold text-lg capitalize">
            {view === "dia"
              ? currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : view === "semana"
              ? `Semana de ${getWeekDays()[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} a ${getWeekDays()[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`
              : currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            }
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate_date(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Grid */}
       <div className="rounded-lg border bg-card card-shadow overflow-hidden">
        {view === "dia" ? (
          renderDayView(currentDate)
        ) : view === "mes" ? (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Month header */}
              <div className="grid grid-cols-7 border-b">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-center py-2 text-xs font-medium text-muted-foreground border-r last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-7">
                {getMonthGrid().map((d, i) => {
                  const items = agendamentosDia(d);
                  const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                  const isToday = dateStr(d) === dateStr(new Date());
                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] border-r border-b last:border-r-0 p-1.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                        !isCurrentMonth ? "bg-muted/20 text-muted-foreground" : ""
                      }`}
                      onClick={() => { setCurrentDate(d); setView("dia"); }}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" : ""}`}>
                        {d.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {items.slice(0, 3).map((ag) => {
                          const cor = ag.procedimento ? getCorByNome(ag.procedimento) : "#3b82f6";
                          return (
                            <div
                              key={ag.id}
                              onClick={(e) => { e.stopPropagation(); setOpenDetail(ag); }}
                              className="truncate rounded px-1 py-0.5 text-[10px] font-medium border-l-2"
                              style={{ backgroundColor: `${cor}1f`, borderLeftColor: cor, color: cor, opacity: ag.status === "cancelado" ? 0.5 : 1 }}
                            >
                              {ag.horaInicio} {ag.pessoal ? "🔒" : ""}{ag.pacienteNome}
                            </div>
                          );
                        })}
                        {items.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1">+{items.length - 3} mais</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Week header */}
              <div className="flex border-b">
                <div className="w-16 shrink-0 border-r" />
                {getWeekDays().map((d, i) => (
                  <div
                    key={i}
                    className={`flex-1 text-center py-2 text-sm font-medium border-r last:border-r-0 ${
                      dateStr(d) === dateStr(currentDate) ? "bg-primary/5 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div>{DAYS_OF_WEEK[d.getDay()]}</div>
                    <div className="text-lg font-heading font-bold">{d.getDate()}</div>
                  </div>
                ))}
              </div>
              {/* Hour rows with overlaid appointments */}
              <div className="flex">
                {/* Time column */}
                <div className="w-16 shrink-0">
                  {HOURS.map((h) => (
                    <div key={h} className="border-b border-r text-xs text-muted-foreground text-right pr-3 py-2" style={{ height: `${SLOT_HEIGHT}px` }}>
                      {h.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {/* Day columns */}
                {getWeekDays().map((d, i) => {
                  const dayItems = agendamentosDia(d);
                  return (
                    <div key={i} className="flex-1 border-r last:border-r-0 relative">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                          style={{ height: `${SLOT_HEIGHT}px` }}
                          onClick={() => openNewAtSlot(h, d)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(h, d)}
                        />
                      ))}
                      {dayItems.map((ag) => {
                        const topMin = getAgStartMinutes(ag);
                        const topPx = (topMin / 60) * SLOT_HEIGHT;
                        const heightPx = Math.max((ag.duracao / 60) * SLOT_HEIGHT, 24);
                        const cor = ag.procedimento ? getCorByNome(ag.procedimento) : "#3b82f6";
                        const isCanceled = ag.status === "cancelado";
                        return (
                          <div
                            key={ag.id}
                            draggable
                            onDragStart={() => setDragItem(ag.id)}
                            onClick={(e) => { e.stopPropagation(); setOpenDetail(ag); }}
                            className="absolute left-0 right-0 mx-1 rounded px-1.5 py-0.5 text-[10px] font-medium cursor-grab border-l-4 z-10"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              overflow: "hidden",
                              backgroundColor: `${cor}1f`,
                              borderLeftColor: cor,
                              color: cor,
                              opacity: isCanceled ? 0.5 : 1,
                              textDecoration: isCanceled ? "line-through" : undefined,
                            }}
                          >
                            <div className="truncate font-semibold">{ag.pacienteNome}</div>
                            {heightPx > 28 && <div className="truncate opacity-80">{ag.procedimento}</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Dialog */}
      <Dialog open={openNew} onOpenChange={(o) => { if (!o) resetForm(); setOpenNew(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{isPessoal ? "Novo Compromisso" : "Novo Agendamento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Toggle pessoal/paciente */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted">
              <button
                type="button"
                onClick={() => setIsPessoal(false)}
                className={`flex-1 text-xs py-1.5 rounded transition-colors ${!isPessoal ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                <User className="inline h-3 w-3 mr-1" /> Paciente
              </button>
              <button
                type="button"
                onClick={() => { setIsPessoal(true); setSelectedPaciente(null); setShowCreatePaciente(false); setSearchPaciente(""); }}
                className={`flex-1 text-xs py-1.5 rounded transition-colors ${isPessoal ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                🔒 Compromisso pessoal
              </button>
            </div>

            {isPessoal && (
              <div>
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Almoço, Reunião, Folga..."
                  value={tituloPessoal}
                  onChange={(e) => setTituloPessoal(e.target.value)}
                />
              </div>
            )}

            {!isPessoal && (<>
            {/* Patient search */}
            {!selectedPaciente && !showCreatePaciente && (
              <div className="space-y-2">
                <Label>Buscar Paciente</Label>
                <Input
                  placeholder="Digite o nome ou CPF..."
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                />
                {filteredPacientes.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {filteredPacientes.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm flex items-center gap-2"
                        onClick={() => { setSelectedPaciente(p); setSearchPaciente(""); }}
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-muted-foreground text-xs">{p.cpf}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchPaciente.length >= 2 && filteredPacientes.length === 0 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    setShowCreatePaciente(true);
                    setForm({ ...form, novoPacienteNome: searchPaciente });
                  }}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Criar paciente "{searchPaciente}"
                  </Button>
                )}
              </div>
            )}

            {selectedPaciente && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <p className="font-medium text-sm">{selectedPaciente.nome}</p>
                  <p className="text-xs text-muted-foreground">{selectedPaciente.cpf}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPaciente(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {showCreatePaciente && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Novo paciente</p>
                <Input placeholder="Nome" value={form.novoPacienteNome} onChange={(e) => setForm({ ...form, novoPacienteNome: e.target.value })} />
                <Input placeholder="Telefone" value={form.novoPacienteTelefone} onChange={(e) => setForm({ ...form, novoPacienteTelefone: e.target.value })} />
                <Button variant="ghost" size="sm" onClick={() => { setShowCreatePaciente(false); setForm({ ...form, novoPacienteNome: "", novoPacienteTelefone: "" }); }}>
                  Cancelar
                </Button>
              </div>
            )}
            </>)}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
              <div>
                <Label>Duração</Label>
                <Select value={form.duracao} onValueChange={(v) => setForm({ ...form, duracao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isPessoal && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Procedimento</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setNovoProcForm({ nome: "", cor: "#3b82f6" }); setEditingProcId(null); setShowNovoProc(true); }}>
                  <Plus className="h-3 w-3 mr-1" /> Novo
                </Button>
              </div>
              <Select value={form.procedimento} onValueChange={(v) => setForm({ ...form, procedimento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {procedimentos.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum procedimento cadastrado</div>}
                  {procedimentos.map((p) => (
                    <SelectItem key={p.id} value={p.nome}>
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: p.cor }} />
                        {p.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.procedimento && procedimentos.find((p) => p.nome === form.procedimento) && (
                <Button type="button" variant="ghost" size="sm" className="h-6 mt-1 text-xs text-muted-foreground" onClick={() => {
                  const p = procedimentos.find((x) => x.nome === form.procedimento)!;
                  setNovoProcForm({ nome: p.nome, cor: p.cor });
                  setEditingProcId(p.id);
                  setShowNovoProc(true);
                }}>
                  <Edit className="h-3 w-3 mr-1" /> Editar cor de "{form.procedimento}"
                </Button>
              )}
            </div>
            )}

            <Button onClick={handleCreateAgendamento} className="w-full gradient-primary text-primary-foreground">
              {isPessoal ? "Criar Compromisso" : "Criar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo/Editar Procedimento Dialog */}
      <Dialog open={showNovoProc} onOpenChange={setShowNovoProc}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">{editingProcId ? "Editar procedimento" : "Novo procedimento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome</Label>
              <Input value={novoProcForm.nome} onChange={(e) => setNovoProcForm({ ...novoProcForm, nome: e.target.value })} placeholder="Ex: Botox, Limpeza..." />
            </div>
            <div>
              <Label>Cor na agenda</Label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={novoProcForm.cor} onChange={(e) => setNovoProcForm({ ...novoProcForm, cor: e.target.value })} className="h-10 w-16 rounded border cursor-pointer" />
                <Input value={novoProcForm.cor} onChange={(e) => setNovoProcForm({ ...novoProcForm, cor: e.target.value })} className="flex-1 font-mono" />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#6366f1"].map((c) => (
                  <button key={c} type="button" onClick={() => setNovoProcForm({ ...novoProcForm, cor: c })} className="h-7 w-7 rounded-full border-2" style={{ backgroundColor: c, borderColor: novoProcForm.cor === c ? "hsl(var(--foreground))" : "transparent" }} />
                ))}
              </div>
            </div>
            <Button onClick={async () => {
              if (!novoProcForm.nome.trim()) { toast.error("Nome obrigatório"); return; }
              if (editingProcId) {
                await updateProcedimento(editingProcId, { nome: novoProcForm.nome.trim(), cor: novoProcForm.cor });
                toast.success("Procedimento atualizado!");
                if (form.procedimento && procedimentos.find((p) => p.id === editingProcId)?.nome === form.procedimento) {
                  setForm({ ...form, procedimento: novoProcForm.nome.trim() });
                }
              } else {
                const created = await addProcedimento(novoProcForm.nome.trim(), novoProcForm.cor);
                if (created) {
                  setForm({ ...form, procedimento: created.nome });
                  toast.success("Procedimento criado!");
                }
              }
              setShowNovoProc(false);
            }} className="w-full gradient-primary text-primary-foreground">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!openDetail} onOpenChange={(o) => { if (!o) { setOpenDetail(null); setEditMode(false); } }}>
        <DialogContent className="sm:max-w-md">
          {openDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center justify-between gap-2">
                  <span>{openDetail.pacienteNome}</span>
                  {!editMode && openDetail.status !== "realizado" && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditForm({ hora: openDetail.horaInicio, duracao: String(openDetail.duracao), procedimento: openDetail.procedimento || "", data: openDetail.data });
                      setEditMode(true);
                    }}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {editMode ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Data</Label>
                        <Input type="date" value={editForm.data} onChange={(e) => setEditForm({ ...editForm, data: e.target.value })} />
                      </div>
                      <div>
                        <Label>Horário</Label>
                        <Input type="time" value={editForm.hora} onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Duração</Label>
                      <Select value={editForm.duracao} onValueChange={(v) => setEditForm({ ...editForm, duracao: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1h30</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Procedimento</Label>
                      <Select value={editForm.procedimento} onValueChange={(v) => setEditForm({ ...editForm, procedimento: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {procedimentos.map((p) => (
                            <SelectItem key={p.id} value={p.nome}>
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: p.cor }} />
                                {p.nome}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                      <Button className="gradient-primary text-primary-foreground" onClick={async () => {
                        await updateAgendamento(openDetail.id, {
                          horaInicio: editForm.hora,
                          duracao: Number(editForm.duracao),
                          procedimento: editForm.procedimento,
                          data: editForm.data,
                        });
                        toast.success("Agendamento atualizado!");
                        setEditMode(false);
                        setOpenDetail({ ...openDetail, horaInicio: editForm.hora, duracao: Number(editForm.duracao), procedimento: editForm.procedimento, data: editForm.data });
                      }}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Procedimento</p>
                      <p className="font-medium flex items-center gap-2">
                        {openDetail.procedimento && <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: getCorByNome(openDetail.procedimento) }} />}
                        {openDetail.procedimento}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium">{new Date(openDetail.data).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="font-medium">{openDetail.horaInicio} ({openDetail.duracao}min)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={`${statusColor(openDetail.status)} text-xs`}>
                        {statusLabel(openDetail.status)}
                      </Badge>
                    </div>
                  </div>
                )}

                {!editMode && (<>
                {/* Last procedure info */}
                {(() => {
                  const last = lastProcedure(openDetail.pacienteId);
                  return last ? (
                    <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Último procedimento</p>
                      <p className="font-medium">{last}</p>
                    </div>
                  ) : null;
                })()}

                {/* WhatsApp button */}
                {(() => {
                  const pac = pacientes.find((p) => p.id === openDetail.pacienteId);
                  return pac?.telefone ? (
                    <Button
                      variant="outline"
                      className="w-full text-green-600 border-green-600/30 hover:bg-green-50"
                      onClick={() => sendWhatsAppLembrete(openDetail.pacienteNome, pac.telefone, openDetail.data, openDetail.horaInicio)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Enviar lembrete via WhatsApp
                    </Button>
                  ) : null;
                })()}

                <div className="flex gap-2">
                  {pacientes.find((p) => p.id === openDetail.pacienteId) && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/pacientes/${openDetail.pacienteId}`)}
                    >
                      <User className="mr-2 h-4 w-4" /> Prontuário
                    </Button>
                  )}
                  {!openDetail.pessoal && openDetail.status === "agendado" && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleIniciarConsulta(openDetail)}
                    >
                      <Clock className="mr-2 h-4 w-4" /> Iniciar Consulta
                    </Button>
                  )}
                  {!openDetail.pessoal && openDetail.status === "em_atendimento" && (
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handleMarcarRealizado(openDetail)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Consulta
                    </Button>
                  )}
                </div>
                {(openDetail.status === "agendado" || openDetail.status === "em_atendimento") && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-destructive" onClick={() => handleCancelar(openDetail)}>
                      <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button variant="ghost" className="text-destructive" onClick={() => handleRemove(openDetail)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                </>)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Finalizar Consulta Dialog */}
      <FinalizarConsultaDialog
        open={!!finalizarAg}
        agendamento={finalizarAg}
        produtos={produtos}
        onClose={() => setFinalizarAg(null)}
        onFinalizar={(data) => handleFinalizarCompleto(finalizarAg!, data)}
      />
    </div>
  );
};

export default Agenda;
