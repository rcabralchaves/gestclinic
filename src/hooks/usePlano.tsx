import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type Plano = "basico" | "completo";

// Features only available on "completo"
// Básico includes: agenda, pacientes (prontuário), dashboard, perfil
// Completo adds: receitas, despesas, estoque, planejamento, relatorios
const COMPLETO_ONLY_ROUTES = ["/receitas", "/despesas", "/estoque", "/planejamento", "/relatorios"];

export function usePlano() {
  const { user } = useAuth();
  const [plano, setPlano] = useState<Plano>("basico");
  const [loading, setLoading] = useState(true);

  const fetchPlano = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("plano")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setPlano((data as any).plano || "basico");
    }
    setLoading(false);
  }, [user]);

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
