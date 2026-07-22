import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { PacientesProvider } from "@/context/PacientesContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingRoute } from "@/components/OnboardingRoute";
import { PlanGate } from "@/components/PlanGate";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import Estoque from "./pages/Estoque";
import Planejamento from "./pages/Planejamento";
import Relatorios from "./pages/Relatorios";
import Perfil from "./pages/Perfil";
import Pacientes from "./pages/Pacientes";
import PacienteProntuario from "./pages/PacienteProntuario";
import Agenda from "./pages/Agenda";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Detecta token de recuperação de senha no hash da URL e redireciona para /redefinir-senha.
// Não age quando já estamos em /redefinir-senha para evitar race condition com exchangeCodeForSession.
function RecoveryRedirect() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/redefinir-senha") return;

    if (window.location.hash.includes("type=recovery")) {
      navigate("/redefinir-senha", { replace: true });
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/redefinir-senha", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PacientesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RecoveryRedirect />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/onboarding" element={<OnboardingRoute />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agenda" element={<PlanGate><Agenda /></PlanGate>} />
                <Route path="/pacientes" element={<PlanGate><Pacientes /></PlanGate>} />
                <Route path="/pacientes/:id" element={<PlanGate><PacienteProntuario /></PlanGate>} />
                <Route path="/receitas" element={<PlanGate><Receitas /></PlanGate>} />
                <Route path="/despesas" element={<PlanGate><Despesas /></PlanGate>} />
                <Route path="/estoque" element={<PlanGate><Estoque /></PlanGate>} />
                <Route path="/planejamento" element={<PlanGate><Planejamento /></PlanGate>} />
                <Route path="/relatorios" element={<PlanGate><Relatorios /></PlanGate>} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PacientesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
