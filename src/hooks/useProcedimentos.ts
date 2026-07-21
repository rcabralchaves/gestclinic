import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Procedimento {
  id: string;
  nome: string;
  cor: string;
}

const DEFAULT_COLOR = "#3b82f6";

export function useProcedimentos() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("procedimentos" as any)
      .select("*")
      .order("nome", { ascending: true });
    if (!error && data) {
      setProcedimentos((data as any[]).map((r) => ({ id: r.id, nome: r.nome, cor: r.cor || DEFAULT_COLOR })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProcedimento = useCallback(async (nome: string, cor: string = DEFAULT_COLOR) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const trimmed = nome.trim();
    if (!trimmed) return null;
    // upsert by (user_id, nome)
    const { data, error } = await supabase
      .from("procedimentos" as any)
      .upsert({ user_id: user.id, nome: trimmed, cor } as any, { onConflict: "user_id,nome" })
      .select()
      .single();
    if (!error && data) {
      await fetchAll();
      return { id: (data as any).id, nome: (data as any).nome, cor: (data as any).cor };
    }
    return null;
  }, [fetchAll]);

  const updateProcedimento = useCallback(async (id: string, updates: Partial<{ nome: string; cor: string }>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("procedimentos" as any).update(updates as any).eq("id", id).eq("user_id", user.id);
    if (!error) await fetchAll();
  }, [fetchAll]);

  const deleteProcedimento = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("procedimentos" as any).delete().eq("id", id).eq("user_id", user.id);
    await fetchAll();
  }, [fetchAll]);

  const getCorByNome = useCallback((nome: string) => {
    const p = procedimentos.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
    return p?.cor || DEFAULT_COLOR;
  }, [procedimentos]);

  return { procedimentos, loading, addProcedimento, updateProcedimento, deleteProcedimento, getCorByNome, refetch: fetchAll };
}
