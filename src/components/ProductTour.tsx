import { useState } from "react";
import { SpotlightTour, type TourStep } from "@/components/ui/SpotlightTour";
import { useProductTour } from "@/hooks/useProductTour";
import { usePlanoUnificado } from "@/hooks/usePlanoUnificado";

const TOUR_BASE: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: "Dashboard",
    description:
      "Visão geral do consultório em tempo real: retornos, aniversariantes e desempenho.",
    placement: "right",
  },
  {
    target: '[data-tour="agenda"]',
    title: "Agenda",
    description:
      "Gerencie todos os seus atendimentos. Agende, visualize e controle os horários.",
    placement: "right",
  },
  {
    target: '[data-tour="pacientes"]',
    title: "Pacientes",
    description:
      "Cadastre pacientes e acesse o prontuário completo com histórico e documentos.",
    placement: "right",
  },
];

const TOUR_COMPLETO: TourStep[] = [
  ...TOUR_BASE,
  {
    target: '[data-tour="receitas"]',
    title: "Financeiro",
    description:
      "Registre receitas e despesas para acompanhar a saúde financeira do consultório.",
    placement: "right",
  },
  {
    target: '[data-tour="estoque"]',
    title: "Estoque",
    description:
      "Controle materiais e equipamentos. Receba alertas quando o estoque estiver baixo.",
    placement: "right",
  },
  {
    target: '[data-tour="relatorios"]',
    title: "Relatórios",
    description:
      "Análises completas de desempenho, faturamento e procedimentos realizados.",
    placement: "right",
  },
  {
    target: '[data-tour="perfil"]',
    title: "Perfil",
    description:
      "Atualize seus dados, logo e cor da clínica a qualquer momento.",
    placement: "right",
  },
];

const TOUR_BASICO: TourStep[] = [
  ...TOUR_BASE,
  {
    target: '[data-tour="perfil"]',
    title: "Perfil",
    description:
      "Atualize seus dados, logo e cor da clínica a qualquer momento.",
    placement: "right",
  },
];

export function ProductTour() {
  const { needsTour, loading, markComplete } = useProductTour();
  const { isCompleto } = usePlanoUnificado();
  const [currentStep, setCurrentStep] = useState(0);

  if (loading || !needsTour) return null;

  const steps = isCompleto ? TOUR_COMPLETO : TOUR_BASICO;

  return (
    <SpotlightTour
      steps={steps}
      currentStep={currentStep}
      totalFlowSteps={steps.length}
      flowStepOffset={0}
      onNext={() => setCurrentStep((s) => s + 1)}
      onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
      onComplete={markComplete}
      onSkip={markComplete}
      completeLabel="Finalizar tour"
    />
  );
}
