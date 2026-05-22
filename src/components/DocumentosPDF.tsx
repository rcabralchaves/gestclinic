import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { FileText, Download, Pill, FileCheck2, ListChecks, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Paciente } from "@/lib/mockData";

type DocTipo = "receita" | "atestado" | "recomendacoes" | "declaracao";

interface ProfileData {
  nome?: string;
  cro?: string;
  especialidade?: string;
  consultorio_nome?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

const TIPO_LABELS: Record<DocTipo, string> = {
  receita: "Receita Médica",
  atestado: "Atestado",
  recomendacoes: "Recomendações",
  declaracao: "Declaração de Comparecimento",
};

const TIPO_PLACEHOLDERS: Record<DocTipo, string> = {
  receita:
    "Ex.:\n1) Amoxicilina 500mg — 1 comprimido de 8/8h por 7 dias\n2) Ibuprofeno 600mg — 1 comprimido de 8/8h se dor, por até 3 dias",
  atestado:
    "Atesto, para os devidos fins, que o(a) paciente esteve sob meus cuidados, necessitando de afastamento de suas atividades por __ dia(s), a partir desta data.",
  recomendacoes:
    "• Evitar alimentos duros nas próximas 48h\n• Não fazer bochechos vigorosos hoje\n• Higienização normal a partir de amanhã\n• Em caso de dor persistente, entrar em contato",
  declaracao:
    "Declaro, para os devidos fins, que o(a) paciente compareceu a esta clínica nesta data, no período das __:__ às __:__, para atendimento odontológico.",
};

function formatDataExtenso(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function gerarPDF(opts: {
  tipo: DocTipo;
  pacienteNome: string;
  conteudo: string;
  profile: ProfileData;
}) {
  const { tipo, pacienteNome, conteudo, profile } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Cabeçalho — clínica/profissional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const headerNome = profile.consultorio_nome || profile.nome || "Consultório";
  doc.text(headerNome, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const headerLines: string[] = [];
  if (profile.nome && profile.consultorio_nome) headerLines.push(profile.nome);
  if (profile.especialidade) headerLines.push(profile.especialidade);
  if (profile.cro) headerLines.push(`CRO: ${profile.cro}`);
  if (profile.endereco) headerLines.push(profile.endereco);
  const contato = [profile.telefone, profile.email].filter(Boolean).join(" · ");
  if (contato) headerLines.push(contato);
  for (const line of headerLines) {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  }

  // Linha separadora
  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Título do documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(TIPO_LABELS[tipo].toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 12;

  // Paciente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Paciente:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(pacienteNome, margin + 22, y);
  y += 8;

  // Conteúdo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const linhas = doc.splitTextToSize(conteudo || "", contentWidth);
  for (const linha of linhas) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }
    doc.text(linha, margin, y);
    y += 6;
  }

  // Espaço antes da assinatura
  y = Math.max(y + 20, pageHeight - 50);
  if (y > pageHeight - 40) {
    doc.addPage();
    y = pageHeight - 50;
  }

  // Local + data
  doc.setFontSize(11);
  doc.text(`${formatDataExtenso(new Date())}`, pageWidth - margin, y, { align: "right" });
  y += 18;

  // Linha de assinatura
  doc.setDrawColor(80);
  const sigWidth = 80;
  const sigX = (pageWidth - sigWidth) / 2;
  doc.line(sigX, y, sigX + sigWidth, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(profile.nome || "Profissional", pageWidth / 2, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  if (profile.cro) {
    doc.text(`CRO: ${profile.cro}`, pageWidth / 2, y, { align: "center" });
  }

  const safeNome = pacienteNome.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40);
  const fileName = `${tipo}_${safeNome}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

interface DocumentosPDFProps {
  paciente: Paciente;
}

export default function DocumentosPDF({ paciente }: DocumentosPDFProps) {
  const [profile, setProfile] = useState<ProfileData>({});
  const [tipo, setTipo] = useState<DocTipo | null>(null);
  const [conteudo, setConteudo] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("nome, cro, especialidade, consultorio_nome, endereco, telefone, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (mounted && data) setProfile(data as ProfileData);
    })();
    return () => { mounted = false; };
  }, []);

  const abrirDoc = (t: DocTipo) => {
    setTipo(t);
    setConteudo(TIPO_PLACEHOLDERS[t]);
    setOpen(true);
  };

  const handleGerar = () => {
    if (!tipo) return;
    if (!conteudo.trim()) {
      toast.error("Preencha o conteúdo do documento.");
      return;
    }
    try {
      gerarPDF({ tipo, pacienteNome: paciente.nome, conteudo, profile });
      toast.success("PDF gerado com sucesso!");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const tiposBotoes: { tipo: DocTipo; icon: typeof Pill; desc: string }[] = [
    { tipo: "receita", icon: Pill, desc: "Prescrição de medicamentos" },
    { tipo: "atestado", icon: FileCheck2, desc: "Afastamento de atividades" },
    { tipo: "recomendacoes", icon: ListChecks, desc: "Cuidados pós-procedimento" },
    { tipo: "declaracao", icon: FileSignature, desc: "Comparecimento à consulta" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Gere documentos em PDF com cabeçalho do consultório, dados do paciente e assinatura.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tiposBotoes.map(({ tipo: t, icon: Icon, desc }) => (
          <button
            key={t}
            onClick={() => abrirDoc(t)}
            className="text-left rounded-lg border bg-card p-4 card-shadow hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-semibold text-sm">{TIPO_LABELS[t]}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {tipo ? TIPO_LABELS[tipo] : "Documento"} — {paciente.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Conteúdo do documento</Label>
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Digite o conteúdo..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Edite livremente. O PDF incluirá automaticamente cabeçalho, paciente, data e assinatura.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleGerar} className="gradient-primary text-primary-foreground">
                <Download className="mr-2 h-4 w-4" /> Gerar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
