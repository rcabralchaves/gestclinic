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

function lighten(c: number, pct: number): number {
  return Math.min(255, Math.round(c + (255 - c) * pct));
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

  // A5: 148 × 210 mm — pensado desde o início para A5
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = 148;
  const H = 210;
  const ml = 16;        // margem esquerda
  const mr = 16;        // margem direita
  const cw = W - ml - mr; // 116 mm de largura útil

  // ── MARCA D'ÁGUA (fundo, antes de qualquer elemento) ──────────────
  // Dois círculos muito claros criam textura sutil similar ao mármore da referência
  doc.setFillColor(lighten(cr, 0.94), lighten(cg, 0.94), lighten(cb, 0.94));
  doc.circle(W * 0.78, H * 0.28, 52, "F");
  doc.circle(W * 0.18, H * 0.62, 42, "F");

  // ── CABEÇALHO CENTRALIZADO ────────────────────────────────────────
  let y = 14;
  const logoSize = 22;
  const logoX = (W - logoSize) / 2;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", logoX, y, logoSize, logoSize);
    } catch { /* formato não suportado */ }
    y += logoSize + 5;
  } else {
    // Monograma circular quando não há logo cadastrada
    doc.setFillColor(lighten(cr, 0.88), lighten(cg, 0.88), lighten(cb, 0.88));
    doc.circle(W / 2, y + logoSize / 2, logoSize / 2, "F");
    doc.setFillColor(cr, cg, cb);
    doc.circle(W / 2, y + logoSize / 2, logoSize / 2 - 2, "F");
    const inicial = (profile.consultorio_nome || profile.nome || "C").charAt(0).toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(inicial, W / 2, y + logoSize / 2 + 5.5, { align: "center" });
    y += logoSize + 5;
  }

  // Nome principal (clínica ou doutor)
  const nomeClinica = profile.consultorio_nome || profile.nome || "";
  if (nomeClinica) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(28, 28, 28);
    doc.text(nomeClinica, W / 2, y, { align: "center", maxWidth: cw });
    y += 6.5;
  }

  // Nome do doutor (se houver nome da clínica separado)
  if (profile.nome && profile.consultorio_nome) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(cr, cg, cb);
    doc.text(profile.nome, W / 2, y, { align: "center" });
    y += 5;
  }

  // Especialidade + CRO numa linha só
  const subtituloParts: string[] = [];
  if (profile.especialidade) subtituloParts.push(profile.especialidade);
  if (profile.cro) subtituloParts.push(`CRO ${profile.cro}`);
  if (subtituloParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(subtituloParts.join("  ·  "), W / 2, y, { align: "center" });
    y += 5;
  }

  // ── LINHA SEPARADORA COLORIDA ─────────────────────────────────────
  y += 4;
  doc.setDrawColor(cr, cg, cb);
  doc.setLineWidth(0.5);
  doc.line(ml, y, W - mr, y);
  doc.setLineWidth(0.2);
  y += 9;

  // ── TÍTULO DO DOCUMENTO ───────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(28, 28, 28);
  doc.text(TIPO_LABELS[tipo].toUpperCase(), W / 2, y, { align: "center" });
  y += 10;

  // ── PACIENTE (linha discreta, não uma caixa pesada) ───────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text("Paciente:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(28, 28, 28);
  doc.text(pacienteNome, ml + 20, y);
  // Linha fina embaixo (papel timbrado)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(ml, y + 1.5, W - mr, y + 1.5);
  doc.setLineWidth(0.2);
  y += 11;

  // ── CONTEÚDO ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(45, 45, 45);
  const linhas = doc.splitTextToSize(conteudo || "", cw);
  const reservaRodape = 58; // mm reservados para assinatura + rodapé
  for (const linha of linhas) {
    if (y > H - reservaRodape) {
      doc.addPage();
      y = 14;
    }
    doc.text(linha, ml, y);
    y += 5.8;
  }

  // ── DATA ──────────────────────────────────────────────────────────
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(formatDataExtenso(new Date()), W - mr, y, { align: "right" });

  // ── ASSINATURA (posição fixa no fundo) ───────────────────────────
  const sigAnchor = H - 46;
  const sigW = 65;
  const sigX = (W - sigW) / 2;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(sigX, sigAnchor, sigX + sigW, sigAnchor);
  doc.setLineWidth(0.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(28, 28, 28);
  doc.text(profile.nome || "Profissional", W / 2, sigAnchor + 5, { align: "center" });

  if (profile.cro) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(cr, cg, cb);
    doc.text(`CRO ${profile.cro}`, W / 2, sigAnchor + 10, { align: "center" });
  }

  // ── RODAPÉ DE CONTATO ─────────────────────────────────────────────
  const contactRow: string[] = [];
  if (profile.telefone) contactRow.push(profile.telefone);
  if (profile.email) contactRow.push(profile.email);
  if (contactRow.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(contactRow.join("   ·   "), W / 2, H - 14, { align: "center" });
  }
  if (profile.endereco) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(profile.endereco, W / 2, H - 9.5, { align: "center", maxWidth: cw });
  }

  // ── BARRA COLORIDA SÓLIDA NO FUNDO ───────────────────────────────
  doc.setFillColor(cr, cg, cb);
  doc.rect(0, H - 6, W, 6, "F");

  const safeNome = pacienteNome.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40);
  doc.save(`${tipo}_${safeNome}_${new Date().toISOString().split("T")[0]}.pdf`);
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
