import { Lock } from "lucide-react";
import { usePlano } from "@/hooks/usePlano";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlanGateProps {
  children: React.ReactNode;
}

export function PlanGate({ children }: PlanGateProps) {
  const { isCompleto, loading } = usePlano();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isCompleto) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-heading font-bold">Disponível apenas no plano completo</h2>
        <p className="text-muted-foreground text-sm">
          Faça upgrade para o plano Completo por R$67/mês e tenha acesso a todas as funcionalidades do GestClini.
        </p>
        <Link to="/perfil">
          <Button className="gradient-primary text-primary-foreground">
            Ver meu plano
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
