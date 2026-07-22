import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users, CalendarClock, Cake, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/mockData";
import { usePacientes } from "@/context/PacientesContext";
import { useReceitasDB, useDespesasDB, useEstoqueDB } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { supabase } from "@/integrations/supabase/client";
import { Onboarding } from "@/components/Onboarding";

type PeriodoBasico = "7d" | "15d" | "mes";
const PERIODOS: { value: PeriodoBasico; label: string }[] = [
  { value: "7d",  label: "Últimos 7 dias" },
  { value: "15d", label: "Últimos 15 dias" },
  { value: "mes", label: "Este mês" },
];

const ONBOARDING_KEY = (uid: string) => `gestclini_onboarding_v1_${uid}`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCompleto, loading: planoLoading } = usePlano();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [periodoBasico, setPeriodoBasico] = useState<PeriodoBasico>("mes");

  // Mostra onboarding apenas para novos usuários que nunca configuraram o perfil
  useEffect(() => {
    if (!user) return;
    const key = ONBOARDING_KEY(user.id);
    if (localStorage.getItem(key)) return; // já concluiu

    supabase.from("profiles" as any).select("nome, consultorio_nome").eq("user_id", user.id).single()
      .then(({ data }) => {
        const d = data as any;
        if (d?.nome && d?.consultorio_nome) {
          // Usuário existente com perfil preenchido — marca como concluído sem exibir
          localStorage.setItem(key, "1");
        } else {
          setShowOnboarding(true);
        }
      });
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) localStorage.setItem(ONBOARDING_KEY(user.id), "1");
    setShowOnboarding(false);
  };
  const { pacientes, atendimentos: todosAtendimentos } = usePacientes();
  const { receitas } = useReceitasDB();
  const { despesas } = useDespesasDB();
  const { produtos } = useEstoqueDB();

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

  // "Total gerado" para o Plano Básico — soma atendimentos realizados no período selecionado
  const totalGerado = (() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const inicio = new Date(hoje);
    if (periodoBasico === "7d") {
      inicio.setDate(hoje.getDate() - 6);
    } else if (periodoBasico === "15d") {
      inicio.setDate(hoje.getDate() - 14);
    } else {
      inicio.setDate(1);
    }
    inicio.setHours(0, 0, 0, 0);
    return todosAtendimentos
      .filter((a) => {
        if (!a.realizado) return false;
        const d = new Date(a.data + "T12:00:00");
        return d >= inicio && d <= hoje;
      })
      .reduce((sum, a) => sum + a.valor, 0);
  })();

  const mesAniversario = now.getMonth() + 1;
  const aniversariantes = pacientes
    .filter((p) => {
      if (!p.dataNascimento) return false;
      return new Date(p.dataNascimento + "T12:00:00").getMonth() + 1 === mesAniversario;
    })
    .sort((a, b) => {
      const diaA = new Date(a.dataNascimento + "T12:00:00").getDate();
      const diaB = new Date(b.dataNascimento + "T12:00:00").getDate();
      return diaA - diaB;
    });

  const pacientesRetorno = pacientes.filter((p) => {
    if (!p.retorno) return false;
    const diffDays = Math.ceil((new Date(p.retorno.data).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays >= -30;
  });

  const chartData = (() => {
    const meses: Record<string, { mes: string; receita: number; despesa: number; order: number }> = {};
    [...receitas, ...despesas.map(d => ({ ...d, _tipo: "despesa" }))].forEach((item) => {
      const date = new Date(item.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (!meses[key]) meses[key] = { mes: label, receita: 0, despesa: 0, order: date.getFullYear() * 100 + date.getMonth() };
    });
    receitas.forEach((r) => {
      const date = new Date(r.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (!meses[key]) meses[key] = { mes: label, receita: 0, despesa: 0, order: date.getFullYear() * 100 + date.getMonth() };
      meses[key].receita += r.valor;
    });
    despesas.forEach((d) => {
      const date = new Date(d.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (!meses[key]) meses[key] = { mes: label, receita: 0, despesa: 0, order: date.getFullYear() * 100 + date.getMonth() };
      meses[key].despesa += d.valor;
    });
    return Object.values(meses).sort((a, b) => a.order - b.order).slice(-6);
  })();

  const allStats = [
    {
      label: "Faturamento do Mês",
      value: formatCurrency(faturamentoMensal),
      icon: DollarSign,
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      sub: "Mês atual",
      completoOnly: true,
    },
    {
      label: "Lucro Líquido",
      value: formatCurrency(lucroLiquido),
      icon: TrendingUp,
      iconBg: lucroLiquido >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40",
      iconColor: lucroLiquido >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
      sub: "Receitas − Despesas",
      completoOnly: true,
    },
    {
      label: "Total de Despesas",
      value: formatCurrency(totalDespesasMes),
      icon: TrendingDown,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      sub: "Mês atual",
      completoOnly: true,
    },
    {
      label: "Pacientes",
      value: String(pacientes.length),
      icon: Users,
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      sub: `${pacientesRetorno.length} com retorno próximo`,
      completoOnly: false,
    },
  ];
  const stats = allStats.filter((s) => isCompleto || !s.completoOnly);

  return (
    <div className="space-y-6">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow flex items-center gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
              <p className="text-xl font-heading font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Retorno + Aniversariantes */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pacientes para Retorno */}
        <div className="rounded-xl border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm">Pacientes para Retorno</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate("/pacientes")}>
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {pacientesRetorno.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum retorno pendente</p>
          ) : (
            <div className="space-y-2">
              {pacientesRetorno.slice(0, 4).map((p) => {
                const diff = Math.ceil((new Date(p.retorno!.data).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.retorno!.data).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <Badge variant={diff < 0 ? "destructive" : "secondary"} className="text-xs shrink-0">
                      {diff < 0 ? `${Math.abs(diff)}d atrás` : diff === 0 ? "Hoje" : `em ${diff}d`}
                    </Badge>
                  </div>
                );
              })}
              {pacientesRetorno.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+{pacientesRetorno.length - 4} mais</p>
              )}
            </div>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="rounded-xl border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-pink-500" />
              <h3 className="font-heading font-semibold text-sm">Aniversariantes do Mês</h3>
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {now.toLocaleDateString("pt-BR", { month: "long" })}
            </span>
          </div>
          {aniversariantes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum aniversariante este mês</p>
          ) : (
            <div className="space-y-2">
              {aniversariantes.slice(0, 4).map((p) => {
                const dia = new Date(p.dataNascimento + "T12:00:00").getDate();
                const isHoje = dia === now.getDate();
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">Dia {dia}</p>
                    </div>
                    {isHoje && (
                      <Badge className="text-xs bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300">
                        🎂 Hoje
                      </Badge>
                    )}
                  </div>
                );
              })}
              {aniversariantes.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+{aniversariantes.length - 4} mais</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card "Total gerado" — apenas Plano Básico */}
      {!planoLoading && !isCompleto && (
        <div className="rounded-xl border bg-card p-5 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total gerado</p>
                <p className="text-2xl font-heading font-bold text-foreground leading-tight">{formatCurrency(totalGerado)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Atendimentos realizados</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodoBasico(p.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    periodoBasico === p.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receitas vs Despesas — apenas Completo */}
      {!planoLoading && isCompleto && <div className="rounded-xl border bg-card p-5 card-shadow">
        <h2 className="font-heading font-semibold text-sm mb-4">Receitas vs Despesas — últimos 6 meses</h2>
        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            Nenhum lançamento financeiro ainda
          </div>
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 13 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="receita" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="despesa" name="Despesas" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>}

      {/* Estoque baixo — apenas Completo */}
      {!planoLoading && isCompleto && estoqueBaixo.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-heading font-semibold text-sm text-amber-700 dark:text-amber-400">Estoque Baixo</h3>
          </div>
          <ul className="space-y-1">
            {estoqueBaixo.map((p) => (
              <li key={p.id} className="text-sm text-foreground flex justify-between">
                <span className="font-medium">{p.nome}</span>
                <span className="text-muted-foreground">{p.quantidade} {p.unidade} (mín. {p.minimo})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
