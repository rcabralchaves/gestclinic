import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users, CalendarClock, Cake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/mockData";
import { usePacientes } from "@/context/PacientesContext";
import { useReceitasDB, useDespesasDB, useEstoqueDB } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const { pacientes } = usePacientes();
  const { receitas } = useReceitasDB();
  const { despesas } = useDespesasDB();
  const { produtos } = useEstoqueDB();

  // Receitas are already stored as individual parcels in the DB — no need to expand
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const faturamentoMensal = receitas
    .filter((r) => r.data.substring(0, 7) === mesAtual)
    .reduce((sum, r) => sum + r.valor, 0);
  const totalDespesasMes = despesas
    .filter((d) => d.data.substring(0, 7) === mesAtual)
    .reduce((sum, d) => sum + d.valor, 0);
  const lucroLiquido = faturamentoMensal - totalDespesasMes;
  const estoqueBaixo = produtos.filter((p) => p.quantidade <= p.minimo);

  const mesAniversario = now.getMonth() + 1;
  const aniversariantes = pacientes.filter((p) => {
    if (!p.dataNascimento) return false;
    const mes = new Date(p.dataNascimento + "T12:00:00").getMonth() + 1;
    return mes === mesAniversario;
  }).sort((a, b) => {
    const diaA = new Date(a.dataNascimento + "T12:00:00").getDate();
    const diaB = new Date(b.dataNascimento + "T12:00:00").getDate();
    return diaA - diaB;
  });

  const pacientesRetorno = pacientes.filter((p) => {
    if (!p.retorno) return false;
    const dataRetorno = new Date(p.retorno.data);
    const diffDays = Math.ceil((dataRetorno.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays >= -30;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu consultório</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento Mensal" value={formatCurrency(faturamentoMensal)} icon={DollarSign} trend="Mês atual (parcelas proporcionais)" trendUp variant="primary" />
        <StatCard title="Lucro Líquido" value={formatCurrency(lucroLiquido)} icon={TrendingUp} trend="Mês atual" trendUp variant="success" />
        <StatCard title="Total de Despesas" value={formatCurrency(totalDespesasMes)} icon={TrendingDown} trend="Mês atual" trendUp variant="warning" />
        <StatCard title="Pacientes" value={`${pacientes.length}`} icon={Users} trend={`${pacientesRetorno.length} para retorno`} variant="primary" />
      </div>

      {pacientesRetorno.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-primary">Pacientes para Retorno</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/pacientes")}>Ver todos</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pacientesRetorno.map((p) => {
              const diff = Math.ceil((new Date(p.retorno!.data).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} onClick={() => navigate(`/pacientes/${p.id}`)} className="flex items-center justify-between rounded-lg bg-card p-3 border cursor-pointer hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.retorno!.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant={diff < 0 ? "destructive" : "default"} className="text-xs">
                    {diff < 0 ? `${Math.abs(diff)}d atrasado` : `em ${diff}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {aniversariantes.length > 0 && (
        <div className="rounded-lg border border-pink-300/50 bg-pink-50/50 dark:bg-pink-950/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="h-5 w-5 text-pink-500" />
            <h3 className="font-heading font-semibold text-pink-600 dark:text-pink-400">
              Aniversariantes do Mês
            </h3>
            <span className="ml-auto text-xs text-pink-500 font-medium">{now.toLocaleDateString("pt-BR", { month: "long" })}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {aniversariantes.map((p) => {
              const dia = new Date(p.dataNascimento + "T12:00:00").getDate();
              const isHoje = dia === now.getDate();
              return (
                <div key={p.id} onClick={() => navigate(`/pacientes/${p.id}`)} className="flex items-center justify-between rounded-lg bg-card p-3 border cursor-pointer hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">Dia {dia}</p>
                  </div>
                  {isHoje && <Badge className="text-xs bg-pink-100 text-pink-600 border-pink-200">🎂 Hoje!</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 card-shadow">
        <h2 className="text-lg font-heading font-semibold mb-4">Receitas vs Despesas</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(() => {
              const meses: Record<string, { receita: number; despesa: number }> = {};
              receitas.forEach((r) => {
                const m = new Date(r.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                if (!meses[m]) meses[m] = { receita: 0, despesa: 0 };
                meses[m].receita += r.valor;
              });
              despesas.forEach((d) => {
                const m = new Date(d.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                if (!meses[m]) meses[m] = { receita: 0, despesa: 0 };
                meses[m].despesa += d.valor;
              });
              return Object.entries(meses).map(([mes, v]) => ({ mes, ...v }));
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 13 }} formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="receita" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesas" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {estoqueBaixo.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-heading font-semibold text-destructive">Alertas de Estoque Baixo</h3>
          </div>
          <ul className="space-y-1">
            {estoqueBaixo.map((p) => (
              <li key={p.id} className="text-sm text-foreground">
                <span className="font-medium">{p.nome}</span> — apenas {p.quantidade} {p.unidade} (mínimo: {p.minimo})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
