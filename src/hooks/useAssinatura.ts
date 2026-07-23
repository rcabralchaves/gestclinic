import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Valores válidos espelhando os CHECK constraints do banco.
export type AssinaturaStatus =
  | "trial"
  | "ativo"
  | "inadimplente"
  | "cancelado"
  | "expirado";

export type AssinaturaPlano = "basico" | "completo";

export interface Subscription {
  id: string;
  user_id: string;
  plano: AssinaturaPlano;
  status: AssinaturaStatus;
  trial_expira_em: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  cancelado_em: string | null;
  cancelamento_motivo: string | null;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  gateway_price_id: string | null;
  ultimo_evento_gateway: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssinaturaState {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;

  // Campos derivados — atalhos para evitar repetição nos consumidores.
  status: AssinaturaStatus | null;
  plano: AssinaturaPlano | null;
  trialExpiraEm: string | null;
  periodoInicio: string | null;
  periodoFim: string | null;

  // Flags de estado — fonte única de verdade para decisões de acesso.
  isTrial: boolean;
  isAtivo: boolean;
  isInadimplente: boolean;
  isCancelado: boolean;
  isExpirado: boolean;

  // Força nova leitura do banco sem recarregar a página.
  // Será chamado pela Edge Function após processar um webhook.
  refresh: () => void;
}

export function useAssinatura(): AssinaturaState {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Aguarda a sessão de autenticação para evitar query anônima.
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setSubscription(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      // Busca apenas assinaturas "vivas" (trial, ativo, inadimplente).
      // Registros cancelados/expirados ficam no histórico mas não
      // são retornados aqui — o índice único parcial garante no máximo
      // uma linha por usuário com esses status.
      .in("status", ["trial", "ativo", "inadimplente"])
      .maybeSingle()
      .then(({ data, error: dbError }) => {
        if (!mounted) return;

        if (dbError) {
          setError(dbError.message);
          setSubscription(null);
        } else {
          setSubscription(data as Subscription | null);
        }

        setLoading(false);
      });

    return () => { mounted = false; };
  }, [user, authLoading, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Campos derivados — calculados a partir do subscription atual.
  const status = subscription?.status ?? null;
  const plano  = subscription?.plano  ?? null;

  return {
    loading,
    error,
    subscription,

    status,
    plano,
    trialExpiraEm: subscription?.trial_expira_em  ?? null,
    periodoInicio: subscription?.periodo_inicio   ?? null,
    periodoFim:    subscription?.periodo_fim      ?? null,

    isTrial:        status === "trial",
    isAtivo:        status === "ativo",
    isInadimplente: status === "inadimplente",
    isCancelado:    status === "cancelado",
    isExpirado:     status === "expirado",

    refresh,
  };
}
