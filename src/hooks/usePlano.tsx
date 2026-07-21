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
    console.log("[usePlano] fetchPlano chamado — authLoading:", authLoading, "| user.id:", user?.id ?? "null");
    if (authLoading) {
      console.log("[usePlano] aguardando authLoading...");
      return;
    }

    if (!user) {
      console.log("[usePlano] sem usuário autenticado — loading = false");
      setLoading(false);
      return;
    }

    console.log("[usePlano] consultando profiles para user_id:", user.id);
    const { data, error } = await supabase
      .from("profiles")
      .select("plano")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("[usePlano] ERRO ao buscar plano:", error.code, error.message);
    } else if (data) {
      const planoRaw = (data as any).plano;
      console.log("[usePlano] profiles.plano retornado pelo banco:", JSON.stringify(planoRaw));
      setPlano(planoRaw || "basico");
    } else {
      console.warn("[usePlano] profiles retornou data=null sem erro — plano permanece 'basico'");
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

  // DEBUG TEMPORÁRIO — remover após diagnóstico
  console.log("[usePlano] estado atual →", {
    "user.id": user?.id ?? "null",
    "authLoading": authLoading,
    "plano (state)": plano,
    "loading (state)": loading,
    "isCompleto": isCompleto,
    "canAccess('/agenda')": canAccess("/agenda"),
    "canAccess('/pacientes')": canAccess("/pacientes"),
    "canAccess('/receitas')": canAccess("/receitas"),
  });

  return { plano, loading, isCompleto, canAccess };
}
