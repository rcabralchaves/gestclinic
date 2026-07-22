import { lazy, Suspense } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

const OnboardingFlow = lazy(() => import("@/components/OnboardingFlow"));

function FullscreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function OnboardingRoute() {
  const { session, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onbLoading, step, saveStep, markComplete } =
    useOnboarding();
  const navigate = useNavigate();

  if (authLoading || onbLoading) return <FullscreenLoader />;

  // Não autenticado → login
  if (!session) return <Navigate to="/login" replace />;

  // Onboarding já concluído → app
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;

  const handleComplete = async () => {
    await markComplete();
    navigate("/dashboard", { replace: true });
  };

  return (
    <Suspense fallback={<FullscreenLoader />}>
      <OnboardingFlow
        initialStep={step}
        onSaveStep={saveStep}
        onComplete={handleComplete}
      />
    </Suspense>
  );
}
