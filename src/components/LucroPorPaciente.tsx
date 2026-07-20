import { useMemo } from "react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { useCustosConsultorio } from "@/hooks/useCustosConsultorio";
import { useReceitasDB } from "@/hooks/useSupabaseData";
import { formatCurrency, expandReceitasMensais } from "@/lib/mockData";
import { Link } from "react-router-dom";

interface LucroPorPacienteProps {
  pacienteId: string;
  receitaTotalPaciente: number;
}

/**
 * Calcula o lucro real do paciente:
 * - Receita do paciente
 * - MENOS o rateio dos custos fixos do consultório por paciente único do mesmo mês
 *
 * Ratreamos por mês para refletir custos recorrentes (aluguel etc).
 */
export default function LucroPorPaciente({ pacienteId, receitaTotalPaciente }: LucroPorPacienteProps) {
  const { totalMensal: custoMensalTotal } = useCustosConsultorio();
  const { receitas } = useReceitasDB();

  const { custoRateado, mesesAtivos, pacientesNoMesMedia } = useMemo(() => {
    // Expande parcelas em entradas mensais para sabermos em quais meses o paciente esteve ativo.
    const expandidas = expandReceitasMensais(
      receitas.map((r) => ({ ...r })),
    );

    // Mapa: "YYYY-MM" -> Set de pacienteIds (chave: paciente_id se houver, senão paciente_nome)
    const pacientesPorMes = new Map<string, Set<string>>();
    for (const r of receitas) {
      const exp = expandReceitasMensais([r]);
      for (const e of exp) {
        const ym = e.data.slice(0, 7);
        if (!pacientesPorMes.has(ym)) pacientesPorMes.set(ym, new Set());
        const key = (r as any).pacienteId || r.paciente;
        pacientesPorMes.get(ym)!.add(key);
      }
    }

    // Em quais meses o paciente teve receita?
    const mesesPaciente = new Set<string>();
    for (const r of receitas.filter((rr) => (rr as any).pacienteId === pacienteId)) {
      const exp = expandReceitasMensais([r]);
      for (const e of exp) {
        mesesPaciente.add(e.data.slice(0, 7));
      }
    }

    // Soma o rateio: para cada mês ativo do paciente, custo / nº pacientes únicos no mês.
    let rateio = 0;
    let totalPac = 0;
    let count = 0;
    for (const ym of mesesPaciente) {
      const nPac = pacientesPorMes.get(ym)?.size || 1;
      rateio += custoMensalTotal / nPac;
      totalPac += nPac;
      count++;
    }

    return {
      custoRateado: rateio,
      mesesAtivos: mesesPaciente.size,
      pacientesNoMesMedia: count > 0 ? Math.round(totalPac / count) : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receitas, pacienteId, custoMensalTotal]);

  const lucro = receitaTotalPaciente - custoRateado;
  const margem = receitaTotalPaciente > 0 ? (lucro / receitaTotalPaciente) * 100 : 0;
  const positivo = lucro >= 0;

  if (custoMensalTotal === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Para ver o <strong>lucro real</strong> deste paciente, configure os custos fixos do consultório
            (aluguel, etc) em{" "}
            <Link to="/perfil" className="text-primary underline underline-offset-2 font-medium">
              Perfil → Custos do Consultório
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-heading font-semibold flex items-center gap-2">
          {positivo ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          Lucro real do paciente
        </h4>
        <span className={`text-xs font-medium ${positivo ? "text-success" : "text-destructive"}`}>
          {margem.toFixed(1)}% margem
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Receita</p>
          <p className="text-base font-semibold">{formatCurrency(receitaTotalPaciente)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Custo rateado</p>
          <p className="text-base font-semibold text-muted-foreground">- {formatCurrency(custoRateado)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Lucro</p>
          <p className={`text-base font-semibold ${positivo ? "text-success" : "text-destructive"}`}>
            {formatCurrency(lucro)}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        Rateio = custo fixo mensal ÷ pacientes únicos no mês (média {pacientesNoMesMedia}/mês), aplicado nos {mesesAtivos} mês(es) em que o paciente teve receita.
      </p>
    </div>
  );
}
