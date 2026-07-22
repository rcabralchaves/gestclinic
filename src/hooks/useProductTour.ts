import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useProductTour() {
  const { user, loading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("product_tour_completed_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Coluna ainda não existe (migration pendente): não exibir tour
          setIsCompleted(true);
        } else {
          setIsCompleted(!!(data as any)?.product_tour_completed_at);
        }
        setLoading(false);
      });
  }, [user, authLoading]);

  const markComplete = useCallback(async () => {
    if (!user) return;
    setIsCompleted(true);
    await supabase
      .from("profiles")
      .update({ product_tour_completed_at: new Date().toISOString() } as any)
      .eq("user_id", user.id);
  }, [user]);

  return {
    loading,
    needsTour: !loading && !isCompleted,
    markComplete,
  };
}
