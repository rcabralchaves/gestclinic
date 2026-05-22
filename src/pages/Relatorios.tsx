import { useState, useMemo } from "react";
import { FileText, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, categoriaDespesaLabels, expandReceitasMensais } from "@/lib/mockData";
import { useReceitasDB, useDespesasDB } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PeriodFilter, { filterByPeriod, type PeriodValue } from "@/components/PeriodFilter";

const Relatorios = () => {
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState<PeriodValue>("3m");
  const { receitas } = useReceitasDB();
  const { despesas } = useDespesasDB();

  const receitasFiltradas = useMemo(() => filterByPeriod(receitas, period), [receitas, period]);
  const despesasFiltradas = useMemo(() => filterByPeriod(despesas, period), [despesas, period]);

  const cleanProcName = (name: string) => name.replace(/\s*\(\d+\/\d+\)$/, "").trim();

  const lucroPorProcedimento = useMemo(() =>
    Object.entries(
      receitasFiltradas.reduce<Record<string, { total: number; count: number }>>((acc, r) => {
        const key = cleanProcName(r.procedimento);
        if (!acc[key]) acc[key] = { total: 0, count: 0 };
        acc[key].total += r.valor;
        acc[key].count += 1;
        return acc;
      }, {})
    ).map(([name, { total, count }]) => ({ name, value: total, count })).sort((a, b) => b.value - a.value),
    [receitasFiltradas]
  );

  const despesasPorCategoria = useMemo(() =>
    Object.entries(
      despesasFiltradas.reduce<Record<string, number>>((acc, d) => {
        acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: categoriaDespesaLabels[name] || name, value })).sort((a, b) => b.value - a.value),
    [despesasFiltradas]
  );

  const receitasMensais = expandReceitasMensais(receitasFiltradas);
  const totalReceitas = receitasMensais.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesasFiltradas.reduce((s, d) => s + d.valor, 0);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("GestClinic — Relatório Financeiro", 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Resumo Financeiro", 14, 50);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Receita Total:`, 14, 62);
      doc.setTextColor(22, 163, 74);
      doc.text(formatCurrency(totalReceitas), 65, 62);
      doc.setTextColor(80, 80, 80);
      doc.text(`Despesa Total:`, 14, 72);
      doc.setTextColor(220, 38, 38);
      doc.text(formatCurrency(totalDespesas), 65, 72);
      doc.setTextColor(80, 80, 80);
      doc.text(`Lucro Líquido:`, 14, 82);
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(13);
      doc.text(formatCurrency(totalReceitas - totalDespesas), 65, 82);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 90, pageWidth - 14, 90);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Receitas por Procedimento", 14, 102);

      autoTable(doc, {
        startY: 108,
        head: [["Procedimento", "Qtd", "Valor Total"]],
        body: lucroPorProcedimento.map((r) => [r.name, String(r.count), formatCurrency(r.value)]),
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });

      const afterFirst = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Despesas por Categoria", 14, afterFirst);

      autoTable(doc, {
        startY: afterFirst + 6,
        head: [["Categoria", "Valor"]],
        body: despesasPorCategoria.map((d) => [d.name, formatCurrency(d.value)]),
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Detalhamento de Receitas", 14, 17);

      autoTable(doc, {
        startY: 35,
        head: [["Data", "Paciente", "Procedimento", "Valor", "Pagamento"]],
        body: receitasFiltradas.map((r) => [
          new Date(r.data).toLocaleDateString("pt-BR"),
          r.paciente,
          r.procedimento,
          formatCurrency(r.valor),
          r.formaPagamento.toUpperCase(),
        ]),
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });

      const afterRevenue = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Detalhamento de Despesas", 14, afterRevenue);

      autoTable(doc, {
        startY: afterRevenue + 6,
        head: [["Data", "Descrição", "Categoria", "Valor", "Tipo"]],
        body: despesasFiltradas.map((d) => [
          new Date(d.data).toLocaleDateString("pt-BR"),
          d.descricao,
          categoriaDespesaLabels[d.categoria] || d.categoria,
          formatCurrency(d.valor),
          d.tipo === "fixa" ? "Fixa" : "Variável",
        ]),
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`GestClinic · Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }

      doc.save("GestClinic_Relatorio.pdf");
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise detalhada do consultório</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={exporting}>
            <Download className="h-4 w-4" /> {exporting ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold">Resumo Financeiro</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center p-4 rounded-lg bg-primary/5">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-xl font-heading font-bold text-primary mt-1">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/5">
            <p className="text-sm text-muted-foreground">Despesa Total</p>
            <p className="text-xl font-heading font-bold text-destructive mt-1">{formatCurrency(totalDespesas)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-success/5">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className="text-xl font-heading font-bold text-success mt-1">{formatCurrency(totalReceitas - totalDespesas)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <h3 className="font-heading font-semibold mb-4">Receita por Procedimento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lucroPorProcedimento} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 card-shadow">
          <h3 className="font-heading font-semibold mb-4">Maiores Despesas</h3>
          <div className="space-y-4">
            {despesasPorCategoria.map((d, i) => (
              <div key={d.name} className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-destructive font-medium">{formatCurrency(d.value)}</span>
                  </div>
                  <div className="bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${(d.value / (despesasPorCategoria[0]?.value || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
