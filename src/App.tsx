import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { PacientesProvider } from "@/context/PacientesContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PacientesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agenda" element={<PlanGate><Agenda /></PlanGate>} />
                <Route path="/pacientes" element={<PlanGate><Pacientes /></PlanGate>} />
                <Route path="/pacientes/:id" element={<PlanGate><PacienteProntuario /></PlanGate>} />
                <Route path="/receitas" element={<Receitas />} />
                <Route path="/despesas" element={<Despesas />} />
                <Route path="/estoque" element={<PlanGate><Estoque /></PlanGate>} />
                <Route path="/planejamento" element={<PlanGate><Planejamento /></PlanGate>} />
                <Route path="/relatorios" element={<Relatorios />} />
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
