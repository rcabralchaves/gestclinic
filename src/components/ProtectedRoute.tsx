import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

// Carregado apenas quando o usuário ainda não concluiu o onboarding.
// Usuários existentes nunca baixam esse chunk — zero impacto no bundle deles.
const OnboardingFlow = lazy(() => import("@/components/OnboardingFlow"));

function FullscreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onbLoading, step, saveStep, markComplete } =
    useOnboarding();

  // Aguarda auth E onboarding antes de renderizar qualquer coisa
  if (authLoading || onbLoading) {
    return <FullscreenLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* OnboardingFlow fica sobre o app (position: fixed, z-index: 9999).
          O children (AppLayout) é renderizado embaixo para que o SpotlightTour
          consiga encontrar e destacar os elementos do sidebar no DOM.
          O overlay bloqueia toda interação enquanto o onboarding não é concluído. */}
      {needsOnboarding && (
        <Suspense fallback={<FullscreenLoader />}>
          <OnboardingFlow
            initialStep={step}
            onSaveStep={saveStep}
            onComplete={markComplete}
          />
        </Suspense>
      )}
      {children}
    </>
  );
}
