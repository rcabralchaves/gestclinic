import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type Plano = "basico" | "completo";

// Features only available on "completo"
// Básico includes: agenda, pacientes (prontuário), dashboard, perfil
// Completo adds: receitas, despesas, estoque, planejamento, relatorios
const COMPLETO_ONLY_ROUTES = ["/receitas", "/despesas", "/estoque", "/planejamento", "/relatorios"];

export function usePlano() {
  const { user, loading: authLoading } = useAuth();
  const [plano, setPlano] = useState<Plano>("basico");
  const [loading, setLoading] = useState(true);

  const fetchPlano = useCallback(async () => {
    // Aguarda a sessão de autenticação terminar de carregar antes de
    // consultar o plano. Evita disparar a query antes do token de sessão
    // estar disponível (race condition que fazia o plano cair para
    // "basico" mesmo quando o usuário tinha plano "completo" no banco).
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("plano")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // Não mascaramos o erro caindo silenciosamente para "basico":
      // registramos no console para facilitar o diagnóstico.
      console.error("usePlano: erro ao carregar plano do usuário:", error);
    } else if (data) {
      setPlano((data as any).plano || "basico");
    }
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    fetchPlano();
  }, [fetchPlano]);

  const isCompleto = plano === "completo";

  const canAccess = (route: string) => {
    if (isCompleto) return true;
    // Basic plan can't access completo-only routes
    const base = "/" + route.split("/").filter(Boolean)[0];
    return !COMPLETO_ONLY_ROUTES.includes(base);
  };

  return { plano, loading, isCompleto, canAccess };
}
