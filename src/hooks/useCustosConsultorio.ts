import { useEffect, useState, useCallback } from "react";

export interface CustoConsultorio {
  id: string;
  nome: string;
  valorMensal: number;
}

const STORAGE_KEY = "custos_consultorio_v1";

const DEFAULT_CUSTOS: CustoConsultorio[] = [
  { id: "aluguel", nome: "Aluguel", valorMensal: 0 },
];

function load(): CustoConsultorio[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_CUSTOS;
  } catch {
    return DEFAULT_CUSTOS;
  }
}

function save(custos: CustoConsultorio[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custos));
  // Notifica outras abas/instâncias do hook
  window.dispatchEvent(new Event("custos-consultorio-changed"));
}

/**
 * Custos fixos do consultório (aluguel etc), persistidos em localStorage.
 * Usados no cálculo de lucro real por paciente.
 */
export function useCustosConsultorio() {
  const [custos, setCustos] = useState<CustoConsultorio[]>(load);

  useEffect(() => {
    const handler = () => setCustos(load());
    window.addEventListener("custos-consultorio-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("custos-consultorio-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const totalMensal = custos.reduce((s, c) => s + (Number(c.valorMensal) || 0), 0);

  const upsert = useCallback((item: CustoConsultorio) => {
    setCustos((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      const next = idx >= 0
        ? prev.map((c, i) => (i === idx ? item : c))
        : [...prev, item];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCustos((prev) => {
      const next = prev.filter((c) => c.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { custos, totalMensal, upsert, remove };
}
