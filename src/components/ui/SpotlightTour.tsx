/**
 * SpotlightTour — componente genérico de tour guiado com spotlight.
 *
 * Pode ser reutilizado para:
 *   - Onboarding de novos usuários
 *   - Lançamento de novas funcionalidades
 *   - Dicas contextuais
 *   - Ajuda dentro das telas
 *
 * Recebe `steps[]` e callbacks — nada específico do onboarding.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** Seletor CSS do elemento a destacar. Ex.: '[data-tour="agenda"]' */
  target: string;
  title: string;
  description: string;
  /** Posicionamento do tooltip em relação ao elemento. Default: 'auto' */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  /** Padding extra ao redor do elemento destacado (px). Default: 10 */
  padding?: number;
}

export interface SpotlightTourProps {
  steps: TourStep[];
  /** Índice atual dentro de `steps` */
  currentStep: number;
  /** Total de etapas no fluxo completo (inclui fases pré-tour) — para o indicador de progresso */
  totalFlowSteps?: number;
  /** Quantas etapas já passaram antes do tour começar — para exibição correta do progresso */
  flowStepOffset?: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  onSkip?: () => void;
  completeLabel?: string;
}

// ─── Geometria ────────────────────────────────────────────────────────────────

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 308;
const TOOLTIP_GAP   = 16;

function resolvePlacement(
  rect: Rect,
  preferred: TourStep["placement"],
  vw: number,
  vh: number,
): "top" | "bottom" | "left" | "right" {
  if (preferred && preferred !== "auto") return preferred;
  // Heurística: prefere abaixo → acima → direita → esquerda
  if (vh - rect.y - rect.height > 180) return "bottom";
  if (rect.y > 180) return "top";
  if (vw - rect.x - rect.width > TOOLTIP_WIDTH + TOOLTIP_GAP * 2) return "right";
  return "left";
}

function tooltipPosition(
  rect: Rect,
  placement: "top" | "bottom" | "left" | "right",
  vw: number,
  vh: number,
): React.CSSProperties {
  const centerX = rect.x + rect.width / 2 - TOOLTIP_WIDTH / 2;
  const safeLeft = Math.max(16, Math.min(centerX, vw - TOOLTIP_WIDTH - 16));

  switch (placement) {
    case "bottom":
      return { top: rect.y + rect.height + TOOLTIP_GAP, left: safeLeft, width: TOOLTIP_WIDTH };
    case "top":
      return { top: rect.y - TOOLTIP_GAP - 160, left: safeLeft, width: TOOLTIP_WIDTH };
    case "right":
      return { top: Math.max(16, rect.y + rect.height / 2 - 80), left: rect.x + rect.width + TOOLTIP_GAP, width: TOOLTIP_WIDTH };
    case "left":
      return { top: Math.max(16, rect.y + rect.height / 2 - 80), left: Math.max(16, rect.x - TOOLTIP_WIDTH - TOOLTIP_GAP), width: TOOLTIP_WIDTH };
  }
}

// ─── Hook: rastreia a posição do elemento alvo ────────────────────────────────

function useTargetRect(target: string, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number>();

  const update = useCallback(() => {
    const el = document.querySelector(target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ x: r.x, y: r.y, width: r.width, height: r.height });
  }, [target]);

  useLayoutEffect(() => {
    if (!active) return;
    // Aguarda o render terminar antes de medir
    const t = setTimeout(update, 80);
    return () => clearTimeout(t);
  }, [active, update]);

  useEffect(() => {
    if (!active) return;
    const handler = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    const ro = new ResizeObserver(handler);
    const el = document.querySelector(target);
    if (el) ro.observe(el);
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, update]);

  return rect;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SpotlightTour({
  steps,
  currentStep,
  totalFlowSteps,
  flowStepOffset = 0,
  onNext,
  onBack,
  onComplete,
  onSkip,
  completeLabel = "Concluir tour",
}: SpotlightTourProps) {
  const step    = steps[currentStep];
  const isLast  = currentStep === steps.length - 1;
  const padding = step?.padding ?? 10;

  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const [visible, setVisible] = useState(false);

  // Atualiza viewport ao redimensionar
  useEffect(() => {
    const handler = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fade-in suave ao trocar etapa
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, [currentStep]);

  const rect = useTargetRect(step?.target ?? "", !!step);

  // ── Spotlight ──
  const spotlightStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top:    rect.y - padding,
        left:   rect.x - padding,
        width:  rect.width  + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 10,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
        outline: "2px solid rgba(255,255,255,0.18)",
        transition: "top 0.32s cubic-bezier(.4,0,.2,1), left 0.32s cubic-bezier(.4,0,.2,1), width 0.32s cubic-bezier(.4,0,.2,1), height 0.32s cubic-bezier(.4,0,.2,1)",
        pointerEvents: "none",
        zIndex: 9998,
      }
    : {
        // Sem elemento: cobertura total sem buraco
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        pointerEvents: "none",
        zIndex: 9998,
      };

  const placement    = rect ? resolvePlacement(rect, step?.placement ?? "auto", vw, vh) : "bottom";
  const tipPos       = rect ? tooltipPosition(rect, placement, vw, vh) : { top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: TOOLTIP_WIDTH };
  const displayStep  = currentStep + 1 + flowStepOffset;
  const displayTotal = totalFlowSteps ?? steps.length;

  return (
    <>
      {/* Bloqueador de cliques (z abaixo do spotlight e tooltip, mas acima do app) */}
      <div className="fixed inset-0 z-[9997]" aria-hidden="true" />

      {/* Spotlight */}
      <div style={spotlightStyle} aria-hidden="true" />

      {/* Tooltip */}
      <div
        style={{ position: "fixed", zIndex: 10000, ...tipPos }}
        className={cn(
          "bg-card border rounded-xl shadow-2xl p-5",
          "transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={step?.title}
      >
        {/* Indicador de progresso */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentStep
                  ? "w-6 bg-primary"
                  : i < currentStep
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-muted-foreground/25",
              )}
            />
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {displayStep}&nbsp;/&nbsp;{displayTotal}
          </span>
        </div>

        <h3 className="font-heading font-semibold text-sm mb-1 text-foreground">
          {step?.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-5">
          {step?.description}
        </p>

        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              Pular tour
            </button>
          )}
          {currentStep > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onBack}
              className="h-8 px-3 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
          )}
          {isLast ? (
            <Button
              size="sm"
              onClick={onComplete}
              className="gradient-primary text-primary-foreground h-8 px-4 text-xs"
            >
              {completeLabel}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onNext}
              className="gradient-primary text-primary-foreground h-8 px-3 text-xs gap-1"
            >
              Próximo <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
