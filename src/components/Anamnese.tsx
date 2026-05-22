import { useState } from "react";
import {
  Plus, Trash2, Edit, Save, ChevronDown, ChevronUp, History, FileText, FileDown, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import jsPDF from "jspdf";

export interface AnamnesePergunta {
  id: string;
  pergunta: string;
  tipo: "sim_nao" | "texto" | "multipla_escolha";
  opcoes?: string[];
  resposta?: string;
}

export interface AnamneseRegistro {
  id: string;
  data: string;
  perguntas: AnamnesePergunta[];
  observacoes?: string;
}

const perguntasPadrao: AnamnesePergunta[] = [
  { id: "q1", pergunta: "Está grávida ou suspeita de gravidez?", tipo: "sim_nao", resposta: "" },
  { id: "q2", pergunta: "Possui alergias a medicamentos?", tipo: "sim_nao", resposta: "" },
  { id: "q3", pergunta: "Se sim, quais alergias?", tipo: "texto", resposta: "" },
  { id: "q4", pergunta: "Usa medicamentos atualmente?", tipo: "sim_nao", resposta: "" },
  { id: "q5", pergunta: "Se sim, quais medicamentos?", tipo: "texto", resposta: "" },
  { id: "q6", pergunta: "Tem doenças pré-existentes?", tipo: "multipla_escolha", opcoes: ["Diabetes", "Hipertensão", "Cardiopatia", "Asma", "Nenhuma"], resposta: "" },
  { id: "q7", pergunta: "Já fez procedimentos estéticos?", tipo: "sim_nao", resposta: "" },
  { id: "q8", pergunta: "Tem problemas de cicatrização?", tipo: "sim_nao", resposta: "" },
  { id: "q9", pergunta: "Fuma ou já fumou?", tipo: "sim_nao", resposta: "" },
  { id: "q10", pergunta: "Observações adicionais", tipo: "texto", resposta: "" },
];

interface AnamneseProps {
  pacienteId: string;
  pacienteNome?: string;
  registros: AnamneseRegistro[];
  onSave: (registros: AnamneseRegistro[]) => void;
}

const Anamnese = ({ pacienteId, pacienteNome, registros, onSave }: AnamneseProps) => {
  const registroAtual = registros[0];
  const [currentId, setCurrentId] = useState<string | null>(registroAtual?.id || null);
  const [currentPerguntas, setCurrentPerguntas] = useState<AnamnesePergunta[]>(
    registroAtual ? [...registroAtual.perguntas] : perguntasPadrao.map((p) => ({ ...p }))
  );
  const [observacoes, setObservacoes] = useState(registroAtual?.observacoes || "");
  // Modo edição de perguntas (adicionar/remover/renomear perguntas)
  const [editing, setEditing] = useState(false);
  // Modo geral: visualização x edição das respostas
  const [viewMode, setViewMode] = useState<boolean>(!!registroAtual);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItem, setHistoryItem] = useState<AnamneseRegistro | null>(null);
  const [addPerguntaOpen, setAddPerguntaOpen] = useState(false);
  const [newPergunta, setNewPergunta] = useState({ pergunta: "", tipo: "sim_nao" as AnamnesePergunta["tipo"] });
  const [editingPerguntaId, setEditingPerguntaId] = useState<string | null>(null);
  const [editingPerguntaText, setEditingPerguntaText] = useState("");

  const handleResposta = (id: string, resposta: string) => {
    if (viewMode) return;
    setCurrentPerguntas(currentPerguntas.map((p) => (p.id === id ? { ...p, resposta } : p)));
  };

  const handleSalvar = () => {
    // Se já existe um registro carregado, ATUALIZA esse registro (mesmo id).
    // Senão, cria um novo.
    if (currentId) {
      const atualizados = registros.map((r) =>
        r.id === currentId
          ? { ...r, perguntas: currentPerguntas, observacoes, data: new Date().toISOString().split("T")[0] }
          : r
      );
      onSave(atualizados);
      toast.success("Anamnese atualizada com sucesso!");
    } else {
      const novoRegistro: AnamneseRegistro = {
        id: `an_${Date.now()}`,
        data: new Date().toISOString().split("T")[0],
        perguntas: currentPerguntas,
        observacoes,
      };
      onSave([novoRegistro, ...registros]);
      setCurrentId(novoRegistro.id);
      toast.success("Anamnese salva com sucesso!");
    }
    setViewMode(true);
    setEditing(false);
  };

  const handleGerarPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Ficha de Anamnese", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (pacienteNome) {
      doc.text(`Paciente: ${pacienteNome}`, margin, y);
      y += 6;
    }
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, margin, y);
    y += 10;

    currentPerguntas.forEach((p, i) => {
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${p.pergunta}`, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const resposta = p.resposta || "Não respondida";
      const lines = doc.splitTextToSize(`R: ${resposta}`, maxWidth);
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin + 5, y);
        y += 6;
      }
      y += 2;
    });

    if (observacoes.trim()) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Observações:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const obsLines = doc.splitTextToSize(observacoes, maxWidth);
      for (const line of obsLines) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      }
    }

    const fileName = pacienteNome ? `Anamnese_${pacienteNome.replace(/\s+/g, "_")}.pdf` : "Anamnese.pdf";
    doc.save(fileName);
    toast.success("PDF gerado!");
  };

  const handleAddPergunta = () => {
    if (!newPergunta.pergunta.trim()) return;
    const nova: AnamnesePergunta = {
      id: `q_${Date.now()}`,
      pergunta: newPergunta.pergunta,
      tipo: newPergunta.tipo,
      resposta: "",
      opcoes: newPergunta.tipo === "multipla_escolha" ? ["Opção 1", "Opção 2"] : undefined,
    };
    setCurrentPerguntas([...currentPerguntas, nova]);
    setNewPergunta({ pergunta: "", tipo: "sim_nao" });
    setAddPerguntaOpen(false);
  };

  const handleRemovePergunta = (id: string) => {
    setCurrentPerguntas(currentPerguntas.filter((p) => p.id !== id));
  };

  const handleEditPergunta = (id: string) => {
    setCurrentPerguntas(
      currentPerguntas.map((p) => (p.id === id ? { ...p, pergunta: editingPerguntaText } : p))
    );
    setEditingPerguntaId(null);
  };

  const renderResposta = (p: AnamnesePergunta, readOnly = viewMode) => {
    if (p.tipo === "sim_nao") {
      return (
        <div className="flex gap-2">
          {["Sim", "Não"].map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={p.resposta === opt ? "default" : "outline"}
              className={p.resposta === opt ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => !readOnly && handleResposta(p.id, opt)}
              disabled={readOnly}
            >
              {opt}
            </Button>
          ))}
        </div>
      );
    }
    if (p.tipo === "texto") {
      return (
        <Textarea
          value={p.resposta || ""}
          onChange={(e) => handleResposta(p.id, e.target.value)}
          placeholder="Digite aqui..."
          rows={2}
          readOnly={readOnly}
          className="text-sm"
        />
      );
    }
    if (p.tipo === "multipla_escolha" && p.opcoes) {
      return (
        <div className="flex flex-wrap gap-2">
          {p.opcoes.map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={p.resposta === opt ? "default" : "outline"}
              className={p.resposta === opt ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => !readOnly && handleResposta(p.id, opt)}
              disabled={readOnly}
            >
              {opt}
            </Button>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-semibold text-lg">Anamnese</h3>
          {currentId && (
            <p className="text-xs text-muted-foreground">
              {viewMode ? "Modo visualização" : "Modo edição"}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {registros.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="mr-2 h-4 w-4" />
              Histórico ({registros.length})
            </Button>
          )}
          {viewMode ? (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground"
              onClick={() => setViewMode(false)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar prontuário
            </Button>
          ) : (
            <>
              <Button
                variant={editing ? "outline" : "ghost"}
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {editing ? "Fechar" : "Editar Perguntas"}
              </Button>
              {currentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const r = registros.find((x) => x.id === currentId);
                    if (r) {
                      setCurrentPerguntas([...r.perguntas]);
                      setObservacoes(r.observacoes || "");
                    }
                    setViewMode(true);
                    setEditing(false);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Versões anteriores</p>
          {registros.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-2 rounded bg-card border cursor-pointer hover:bg-muted/50"
              onClick={() => setHistoryItem(r)}
            >
              <span className="text-sm font-medium">
                {new Date(r.data).toLocaleDateString("pt-BR")}
              </span>
              <Badge variant="secondary" className="text-xs">
                {r.perguntas.filter((p) => p.resposta).length}/{r.perguntas.length} respondidas
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {currentPerguntas.map((p, i) => (
          <div key={p.id} className="rounded-lg border bg-card p-4 card-shadow">
            <div className="flex items-start justify-between mb-2">
              {editingPerguntaId === p.id ? (
                <div className="flex-1 flex gap-2 mr-2">
                  <Input
                    value={editingPerguntaText}
                    onChange={(e) => setEditingPerguntaText(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => handleEditPergunta(p.id)}>
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium flex-1">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {p.pergunta}
                </p>
              )}
              {editing && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditingPerguntaId(p.id); setEditingPerguntaText(p.pergunta); }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemovePergunta(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {renderResposta(p)}
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="rounded-lg border bg-card p-4 card-shadow">
        <Label className="font-medium text-sm mb-2 block">Observações</Label>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações adicionais sobre o paciente..."
          rows={3}
          readOnly={viewMode}
          className="text-sm"
        />
      </div>

      {/* Add question */}
      {editing && !viewMode && (
        <Button variant="outline" className="w-full" onClick={() => setAddPerguntaOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Pergunta
        </Button>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!viewMode && (
          <Button onClick={handleSalvar} className="flex-1 gradient-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> {currentId ? "Salvar Alterações" : "Salvar Anamnese"}
          </Button>
        )}
        <Button variant="outline" onClick={handleGerarPDF} className={viewMode ? "flex-1" : ""}>
          <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      {/* Add question dialog */}
      <Dialog open={addPerguntaOpen} onOpenChange={setAddPerguntaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Nova Pergunta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Pergunta</Label>
              <Input
                value={newPergunta.pergunta}
                onChange={(e) => setNewPergunta({ ...newPergunta, pergunta: e.target.value })}
                placeholder="Ex: Tem alergia a látex?"
              />
            </div>
            <div>
              <Label>Tipo de resposta</Label>
              <Select value={newPergunta.tipo} onValueChange={(v) => setNewPergunta({ ...newPergunta, tipo: v as AnamnesePergunta["tipo"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim_nao">Sim/Não</SelectItem>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddPergunta} className="w-full gradient-primary text-primary-foreground">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History detail dialog */}
      <Dialog open={!!historyItem} onOpenChange={(o) => { if (!o) setHistoryItem(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {historyItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">
                  Anamnese — {new Date(historyItem.data).toLocaleDateString("pt-BR")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                {historyItem.perguntas.map((p, i) => (
                  <div key={p.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium mb-1">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>{p.pergunta}
                    </p>
                    {p.resposta ? (
                      <p className="text-sm text-primary font-medium">{p.resposta}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Não respondida</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Anamnese;
