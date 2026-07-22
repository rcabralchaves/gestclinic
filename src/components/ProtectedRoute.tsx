import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

function FullscreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onbLoading } = useOnboarding();

  if (authLoading || onbLoading) return <FullscreenLoader />;

  if (!session) return <Navigate to="/login" replace />;

  // Onboarding pendente: nenhuma rota do app é acessível
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
