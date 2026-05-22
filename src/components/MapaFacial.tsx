import { useState } from "react";
import { Trash2, Edit, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface MarcacaoFacial {
  id: string;
  x: number;
  y: number;
  procedimento: string;
  quantidade: string;
  data: string;
  observacoes: string;
  regiao: string;
}

interface MapaFacialProps {
  pacienteId: string;
  marcacoes: MarcacaoFacial[];
  onSave: (marcacoes: MarcacaoFacial[]) => void;
}

const REGIOES: Record<string, string> = {
  testa: "Testa",
  glabela: "Glabela",
  olho_esq: "Periocular Esq.",
  olho_dir: "Periocular Dir.",
  nariz: "Nariz",
  zigomatico_esq: "Zigomático Esq.",
  zigomatico_dir: "Zigomático Dir.",
  nasolabial_esq: "Sulco Nasolabial Esq.",
  nasolabial_dir: "Sulco Nasolabial Dir.",
  labio_sup: "Lábio Superior",
  labio_inf: "Lábio Inferior",
  mento: "Mento (Queixo)",
  mandibula_esq: "Mandíbula Esq.",
  mandibula_dir: "Mandíbula Dir.",
};

const PROCEDIMENTOS = [
  "Toxina botulínica",
  "Ácido hialurônico",
  "Bioestimulador de colágeno",
  "Preenchimento labial",
  "Sculptra",
  "Outro",
];

const procColor = (proc: string) => {
  if (proc.includes("botulínica")) return "#3B82F6";
  if (proc.includes("hialurônico")) return "#EC4899";
  if (proc.includes("colágeno")) return "#F59E0B";
  if (proc.includes("labial")) return "#EF4444";
  if (proc.includes("Sculptra")) return "#8B5CF6";
  return "#6B7280";
};

const procColorClass = (proc: string) => {
  if (proc.includes("botulínica")) return "bg-blue-500";
  if (proc.includes("hialurônico")) return "bg-pink-500";
  if (proc.includes("colágeno")) return "bg-amber-500";
  if (proc.includes("labial")) return "bg-red-500";
  if (proc.includes("Sculptra")) return "bg-violet-500";
  return "bg-gray-500";
};

const MapaFacial = ({ pacienteId, marcacoes, onSave }: MapaFacialProps) => {
  const [marks, setMarks] = useState<MarcacaoFacial[]>(marcacoes);
  const [openForm, setOpenForm] = useState(false);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [editingMark, setEditingMark] = useState<MarcacaoFacial | null>(null);
  const [form, setForm] = useState({
    procedimento: "",
    quantidade: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
    regiao: "",
  });

  const detectRegion = (x: number, y: number): string => {
    if (y < 22) return "testa";
    if (y < 30 && x > 35 && x < 65) return "glabela";
    if (y >= 27 && y < 40 && x < 38) return "olho_esq";
    if (y >= 27 && y < 40 && x > 62) return "olho_dir";
    if (y >= 38 && y < 52 && x > 42 && x < 58) return "nariz";
    if (y >= 38 && y < 55 && x < 35) return "zigomatico_esq";
    if (y >= 38 && y < 55 && x > 65) return "zigomatico_dir";
    if (y >= 52 && y < 60 && x > 25 && x < 42) return "nasolabial_esq";
    if (y >= 52 && y < 60 && x > 58 && x < 75) return "nasolabial_dir";
    if (y >= 55 && y < 65 && x > 38 && x < 62) return "labio_sup";
    if (y >= 65 && y < 72 && x > 38 && x < 62) return "labio_inf";
    if (y >= 72 && y < 85 && x > 35 && x < 65) return "mento";
    if (y >= 65 && x < 35) return "mandibula_esq";
    if (y >= 65 && x > 65) return "mandibula_dir";
    return "";
  };

  const handleFaceClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const regiao = detectRegion(x, y);

    setClickPos({ x, y });
    setForm({ procedimento: "", quantidade: "", data: new Date().toISOString().split("T")[0], observacoes: "", regiao });
    setEditingMark(null);
    setOpenForm(true);
  };

  const handleSave = () => {
    if (!form.procedimento || !clickPos) return;
    const nova: MarcacaoFacial = {
      id: editingMark?.id || `mf_${Date.now()}`,
      x: editingMark?.x || clickPos.x,
      y: editingMark?.y || clickPos.y,
      procedimento: form.procedimento,
      quantidade: form.quantidade,
      data: form.data,
      observacoes: form.observacoes,
      regiao: form.regiao,
    };
    const updated = editingMark
      ? marks.map((m) => (m.id === editingMark.id ? nova : m))
      : [...marks, nova];
    setMarks(updated);
    onSave(updated);
    toast.success("Marcação salva!");
    setOpenForm(false);
    setClickPos(null);
  };

  const handleRemove = (id: string) => {
    const updated = marks.filter((m) => m.id !== id);
    setMarks(updated);
    onSave(updated);
    toast.info("Marcação removida.");
  };

  const handleEditMark = (m: MarcacaoFacial) => {
    setEditingMark(m);
    setClickPos({ x: m.x, y: m.y });
    setForm({ procedimento: m.procedimento, quantidade: m.quantidade, data: m.data, observacoes: m.observacoes, regiao: m.regiao });
    setOpenForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Mapa Facial</h3>
        <Badge variant="secondary" className="text-xs">{marks.length} marcação(ões)</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clean Professional Face SVG */}
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <p className="text-xs text-muted-foreground mb-4 text-center">
            Clique na região desejada para adicionar um procedimento
          </p>
          <div className="relative mx-auto" style={{ width: "280px", height: "380px" }}>
            <svg
              viewBox="0 0 200 280"
              className="w-full h-full cursor-crosshair"
              onClick={handleFaceClick}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Head - clean symmetrical oval */}
              <ellipse
                cx="100" cy="130" rx="72" ry="95"
                fill="url(#faceGrad)"
                stroke="hsl(var(--border))"
                strokeWidth="1.2"
              />

              {/* Hairline - subtle arc */}
              <path
                d="M38 85 Q 55 40, 100 32 Q 145 40, 162 85"
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="0.6"
                opacity="0.12"
              />

              {/* Eyebrows - clean arcs */}
              <path d="M55 100 Q 68 93 82 97" stroke="hsl(var(--foreground))" strokeWidth="1.8" fill="none" opacity="0.3" strokeLinecap="round" />
              <path d="M118 97 Q 132 93 145 100" stroke="hsl(var(--foreground))" strokeWidth="1.8" fill="none" opacity="0.3" strokeLinecap="round" />

              {/* Eyes - simple almond shapes */}
              <ellipse cx="68" cy="110" rx="12" ry="6" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.2" />
              <ellipse cx="132" cy="110" rx="12" ry="6" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.2" />
              {/* Pupils */}
              <circle cx="68" cy="110" r="3.5" fill="hsl(var(--foreground))" opacity="0.15" />
              <circle cx="132" cy="110" r="3.5" fill="hsl(var(--foreground))" opacity="0.15" />

              {/* Nose - minimal lines */}
              <path d="M100 105 L 99 145" stroke="hsl(var(--foreground))" strokeWidth="0.6" fill="none" opacity="0.1" />
              <path d="M88 148 Q 94 154 100 152 Q 106 154 112 148" stroke="hsl(var(--foreground))" strokeWidth="0.9" fill="none" opacity="0.2" />

              {/* Nasolabial folds */}
              <path d="M85 148 Q 82 163 80 175" stroke="hsl(var(--foreground))" strokeWidth="0.4" fill="none" opacity="0.08" />
              <path d="M115 148 Q 118 163 120 175" stroke="hsl(var(--foreground))" strokeWidth="0.4" fill="none" opacity="0.08" />

              {/* Lips - clean shapes */}
              <path d="M80 178 Q 90 172 100 175 Q 110 172 120 178" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" opacity="0.25" />
              <path d="M80 178 Q 90 185 100 183 Q 110 185 120 178" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.18" />

              {/* Chin line */}
              <path d="M85 205 Q 100 215 115 205" stroke="hsl(var(--foreground))" strokeWidth="0.4" fill="none" opacity="0.08" />

              {/* Jawline hints */}
              <path d="M35 140 Q 38 210 75 240" stroke="hsl(var(--foreground))" strokeWidth="0.4" fill="none" opacity="0.06" />
              <path d="M165 140 Q 162 210 125 240" stroke="hsl(var(--foreground))" strokeWidth="0.4" fill="none" opacity="0.06" />

              {/* Ears */}
              <path d="M29 100 Q 22 115, 28 130" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.12" />
              <path d="M171 100 Q 178 115, 172 130" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.12" />

              {/* Region labels - subtle, professional */}
              <text x="100" y="60" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))" opacity="0.45" fontFamily="system-ui, sans-serif" fontWeight="500" letterSpacing="1">TESTA</text>
              <text x="100" y="88" textAnchor="middle" fontSize="5.5" fill="hsl(var(--muted-foreground))" opacity="0.4" fontFamily="system-ui, sans-serif" fontWeight="500" letterSpacing="0.5">GLABELA</text>
              <text x="100" y="160" textAnchor="middle" fontSize="5.5" fill="hsl(var(--muted-foreground))" opacity="0.4" fontFamily="system-ui, sans-serif" fontWeight="500" letterSpacing="0.5">NARIZ</text>
              <text x="100" y="195" textAnchor="middle" fontSize="5.5" fill="hsl(var(--muted-foreground))" opacity="0.4" fontFamily="system-ui, sans-serif" fontWeight="500" letterSpacing="0.5">LÁBIOS</text>
              <text x="100" y="228" textAnchor="middle" fontSize="5.5" fill="hsl(var(--muted-foreground))" opacity="0.4" fontFamily="system-ui, sans-serif" fontWeight="500" letterSpacing="0.5">MENTO</text>
              <text x="44" y="118" textAnchor="middle" fontSize="5" fill="hsl(var(--muted-foreground))" opacity="0.35" fontFamily="system-ui, sans-serif">PERIOC.</text>
              <text x="156" y="118" textAnchor="middle" fontSize="5" fill="hsl(var(--muted-foreground))" opacity="0.35" fontFamily="system-ui, sans-serif">PERIOC.</text>

              {/* Divider lines for regions - very subtle */}
              <line x1="35" y1="75" x2="165" y2="75" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="3 3" opacity="0.2" />
              <line x1="40" y1="95" x2="160" y2="95" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="3 3" opacity="0.15" />
            </svg>

            {/* Markers overlay */}
            {marks.map((m) => (
              <div
                key={m.id}
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all hover:scale-150 hover:z-10"
                style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: procColor(m.procedimento) }}
                onClick={(e) => { e.stopPropagation(); handleEditMark(m); }}
                title={`${m.procedimento} — ${REGIOES[m.regiao] || m.regiao}`}
              >
                <Syringe className="h-2 w-2 text-white" />
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {PROCEDIMENTOS.slice(0, -1).map((p) => (
              <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: procColor(p) }} />
                <span>{p.split(" ").slice(-1)[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Markers list */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Procedimentos marcados</p>
          {marks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm rounded-lg border border-dashed">
              <Syringe className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Nenhuma marcação</p>
              <p className="text-xs mt-1">Clique no rosto para adicionar</p>
            </div>
          ) : (
            marks.map((m) => (
              <div key={m.id} className="rounded-lg border bg-card p-3 card-shadow hover:card-shadow-hover transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${procColorClass(m.procedimento)}`} />
                    <div>
                      <p className="text-sm font-medium">{m.procedimento}</p>
                      <p className="text-xs text-muted-foreground">
                        {REGIOES[m.regiao] || "Região"} · {new Date(m.data).toLocaleDateString("pt-BR")}
                      </p>
                      {m.quantidade && <p className="text-xs text-muted-foreground">Qtd: {m.quantidade}</p>}
                      {m.observacoes && <p className="text-xs text-muted-foreground mt-1">{m.observacoes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditMark(m)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form dialog */}
      <Dialog open={openForm} onOpenChange={(o) => { if (!o) { setOpenForm(false); setClickPos(null); setEditingMark(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingMark ? "Editar Marcação" : "Nova Marcação"}
              {form.regiao && ` — ${REGIOES[form.regiao] || form.regiao}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Procedimento</Label>
              <Select value={form.procedimento} onValueChange={(v) => setForm({ ...form, procedimento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {PROCEDIMENTOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="Ex: 20U, 1ml" />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas do procedimento..." rows={2} />
            </div>
            <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
              {editingMark ? "Atualizar" : "Salvar Marcação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapaFacial;
