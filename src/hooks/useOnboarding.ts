import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingState {
  // 0=não iniciado, 1=boas-vindas, 2=perfil, 3=tour, 4=concluído
  step: number;
  isCompleted: boolean;
  loading: boolean;
  needsOnboarding: boolean;
}

export function useOnboarding(): OnboardingState & {
  saveStep: (step: number) => Promise<void>;
  markComplete: () => Promise<void>;
} {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
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
      .select("onboarding_step, onboarding_completed_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Coluna ainda não existe no banco (migration pendente): não exibir onboarding
          setIsCompleted(true);
        } else {
          const d = data as any;
          setStep(d?.onboarding_step ?? 0);
          setIsCompleted(!!d?.onboarding_completed_at);
        }
        setLoading(false);
      });
  }, [user, authLoading]);

  const saveStep = useCallback(
    async (newStep: number) => {
      if (!user) return;
      setStep(newStep);
      await supabase
        .from("profiles")
        .update({ onboarding_step: newStep } as any)
        .eq("user_id", user.id);
    },
    [user],
  );

  const markComplete = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setStep(4);
    setIsCompleted(true);
    await supabase
      .from("profiles")
      .update({ onboarding_step: 4, onboarding_completed_at: now } as any)
      .eq("user_id", user.id);
  }, [user]);

  return {
    step,
    isCompleted,
    loading,
    needsOnboarding: !loading && !isCompleted,
    saveStep,
    markComplete,
  };
}
