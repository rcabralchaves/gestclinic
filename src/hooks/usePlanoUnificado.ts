import { useAssinatura } from "@/hooks/useAssinatura";
import type { Plano } from "@/hooks/usePlano";

// Rotas exclusivas do plano completo — espelha a lista de usePlano.
const COMPLETO_ONLY_ROUTES = [
  "/receitas",
  "/despesas",
  "/estoque",
  "/planejamento",
  "/relatorios",
];

/**
 * Hook ponte para migração gradual de usePlano → useAssinatura.
 *
 * Expõe a mesma interface de usePlano:
 *   { plano, loading, isCompleto, canAccess }
 *
 * Fonte de dados: public.subscriptions (via useAssinatura).
 * Cada componente pode trocar o import de usePlano para
 * usePlanoUnificado sem alterar nenhuma outra linha.
 *
 * Regras de transição (Fase 2):
 *   - subscription null → trata como "basico" (permissivo)
 *   - trial com plano completo → libera acesso completo
 */
export function usePlanoUnificado(): {
  plano: Plano;
  loading: boolean;
  isCompleto: boolean;
  canAccess: (route: string) => boolean;
} {
  const assinatura = useAssinatura();

  // null (sem registro) → "basico" durante a transição.
  const plano: Plano = (assinatura.plano as Plano) ?? "basico";

  // Trial com plano completo libera acesso completo.
  // Inadimplente ainda tem acesso — cobrança é tratada em Fase 3.
  const temAcesso = assinatura.isAtivo || assinatura.isTrial || assinatura.isInadimplente;
  const isCompleto = temAcesso && plano === "completo";

  const canAccess = (route: string): boolean => {
    if (isCompleto) return true;
    const base = "/" + route.split("/").filter(Boolean)[0];
    return !COMPLETO_ONLY_ROUTES.includes(base);
  };

  return {
    plano,
    loading: assinatura.loading,
    isCompleto,
    canAccess,
  };
}
