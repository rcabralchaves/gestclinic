import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { FileText, Download, Pill, FileCheck2, ListChecks, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Paciente } from "@/lib/mockData";
import { COR_CLINICA_KEY, LOGO_CLINICA_KEY } from "@/pages/Perfil";

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
  recomendacoes: "Recomendações Pós-Procedimento",
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
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 29 : r, isNaN(g) ? 78 : g, isNaN(b) ? 216 : b];
}

function gerarPDF(opts: {
  tipo: DocTipo;
  pacienteNome: string;
  conteudo: string;
  profile: ProfileData;
  corHex: string;
  logoBase64: string | null;
}) {
  const { tipo, pacienteNome, conteudo, profile, corHex, logoBase64 } = opts;
  const [cr, cg, cb] = hexToRgb(corHex);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ml = 20; // margin left
  const mr = 20; // margin right
  const cw = W - ml - mr; // content width
  let y = 18;

  // ── CABEÇALHO ─────────────────────────────────────────────────────
  const clinicaNome = profile.consultorio_nome || profile.nome || "Consultório";

  if (logoBase64) {
    // Logo à esquerda, dados à direita
    const logoH = 18;
    const logoW = 18;
    try {
      doc.addImage(logoBase64, "JPEG", ml, y - 2, logoW, logoH);
    } catch {
      // formato não suportado — ignora logo silenciosamente
    }
    const textX = ml + logoW + 5;
    const textW = W - mr - textX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(clinicaNome, textX, y + 4, { maxWidth: textW });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const subLines: string[] = [];
    if (profile.nome && profile.consultorio_nome) subLines.push(profile.nome);
    if (profile.especialidade) subLines.push(profile.especialidade);
    if (profile.cro) subLines.push(`CRO: ${profile.cro}`);
    if (profile.endereco) subLines.push(profile.endereco);
    const contato = [profile.telefone, profile.email].filter(Boolean).join("  ·  ");
    if (contato) subLines.push(contato);

    let sy = y + 9;
    for (const line of subLines) {
      doc.text(line, textX, sy, { maxWidth: textW });
      sy += 4;
    }
    y = Math.max(y + logoH + 4, sy + 2);
  } else {
    // Sem logo — tudo centralizado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(clinicaNome, W / 2, y, { align: "center" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const subLines: string[] = [];
    if (profile.nome && profile.consultorio_nome) subLines.push(profile.nome);
    if (profile.especialidade) subLines.push(profile.especialidade);
    if (profile.cro) subLines.push(`CRO: ${profile.cro}`);
    if (profile.endereco) subLines.push(profile.endereco);
    const contato = [profile.telefone, profile.email].filter(Boolean).join("  ·  ");
    if (contato) subLines.push(contato);
    for (const line of subLines) {
      doc.text(line, W / 2, y, { align: "center" });
      y += 4.2;
    }
    y += 2;
  }

  // ── LINHA COLORIDA DE SEPARAÇÃO ────────────────────────────────────
  doc.setDrawColor(cr, cg, cb);
  doc.setLineWidth(1.2);
  doc.line(ml, y, W - mr, y);
  doc.setLineWidth(0.2);
  y += 10;

  // ── TÍTULO DO DOCUMENTO ───────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(cr, cg, cb);
  doc.text(TIPO_LABELS[tipo].toUpperCase(), W / 2, y, { align: "center" });
  y += 12;

  // ── BLOCO DO PACIENTE ─────────────────────────────────────────────
  doc.setDrawColor(210, 210, 210);
  doc.setFillColor(250, 250, 250);
  const boxH = 14;
  doc.roundedRect(ml, y - 5, cw, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Paciente:", ml + 4, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(pacienteNome, ml + 28, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(formatDataExtenso(new Date()), W - mr - 4, y + 2, { align: "right" });
  y += boxH + 6;

  // ── CONTEÚDO ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const linhas = doc.splitTextToSize(conteudo || "", cw);
  for (const linha of linhas) {
    if (y > H - 52) {
      doc.addPage();
      y = 20;
    }
    doc.text(linha, ml, y);
    y += 6.5;
  }

  // ── RODAPÉ / ASSINATURA ───────────────────────────────────────────
  const footerY = Math.max(y + 20, H - 46);
  const pageCount = (doc as any).internal.getNumberOfPages();
  if (footerY > H - 46 && pageCount === (doc as any).internal.getCurrentPageInfo().pageNumber) {
    doc.addPage();
    y = H - 46;
  }

  const fy = footerY > H - 46 ? 20 : footerY;

  // Linha colorida do rodapé
  doc.setDrawColor(cr, cg, cb);
  doc.setLineWidth(0.5);
  doc.line(ml, fy, W - mr, fy);
  doc.setLineWidth(0.2);

  // Linha de assinatura centralizada
  const sigW = 75;
  const sigX = (W - sigW) / 2;
  doc.setDrawColor(80, 80, 80);
  doc.line(sigX, fy + 16, sigX + sigW, fy + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(profile.nome || "Profissional", W / 2, fy + 21, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (profile.cro) {
    doc.text(`CRO: ${profile.cro}`, W / 2, fy + 26, { align: "center" });
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
  const [corHex, setCorHex] = useState("#1d4ed8");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

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

      const cor = localStorage.getItem(COR_CLINICA_KEY(user.id));
      if (mounted && cor) setCorHex(cor);

      const logo = localStorage.getItem(LOGO_CLINICA_KEY(user.id));
      if (mounted && logo) setLogoBase64(logo);
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
      gerarPDF({ tipo, pacienteNome: paciente.nome, conteudo, profile, corHex, logoBase64 });
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
