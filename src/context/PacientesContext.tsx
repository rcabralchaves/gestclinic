import { createContext, useContext, type ReactNode } from "react";
import { usePacientesDB, useAtendimentosDB } from "@/hooks/useSupabaseData";
import type { Paciente, Atendimento } from "@/lib/mockData";

interface PacientesContextType {
  pacientes: Paciente[];
  atendimentos: Atendimento[];
  loading: boolean;
  addPaciente: (p: Omit<Paciente, "id"> & { id?: string }) => Promise<Paciente | null>;
  addPacientes: (ps: Paciente[]) => Promise<void>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<void>;
  deletePaciente: (id: string) => Promise<boolean>;
  addAtendimento: (a: Omit<Atendimento, "id">) => Promise<Atendimento | null>;
  updateAtendimento: (id: string, data: Partial<Atendimento>) => Promise<void>;
  deleteAtendimento: (id: string) => Promise<boolean>;
  getPaciente: (id: string) => Paciente | undefined;
}

const PacientesContext = createContext<PacientesContextType | null>(null);

export const usePacientes = () => {
  const ctx = useContext(PacientesContext);
  if (!ctx) throw new Error("usePacientes must be used within PacientesProvider");
  return ctx;
};

export const PacientesProvider = ({ children }: { children: ReactNode }) => {
  const { pacientes, loading: loadingP, addPaciente, addPacientes, updatePaciente, deletePaciente, getPaciente } = usePacientesDB();
  const { atendimentos, loading: loadingA, addAtendimento, updateAtendimento, deleteAtendimento } = useAtendimentosDB();

  const loading = loadingP || loadingA;

  return (
    <PacientesContext.Provider value={{ pacientes, atendimentos, loading, addPaciente, addPacientes, updatePaciente, deletePaciente, addAtendimento, updateAtendimento, deleteAtendimento, getPaciente }}>
      {children}
    </PacientesContext.Provider>
  );
};
