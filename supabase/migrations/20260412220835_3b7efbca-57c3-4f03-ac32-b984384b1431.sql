
-- Create contratos table
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT '',
  template_nome TEXT NOT NULL DEFAULT 'personalizado',
  assinado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own contratos" ON public.contratos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own contratos" ON public.contratos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own contratos" ON public.contratos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Add ON DELETE CASCADE to existing foreign keys
ALTER TABLE public.atendimentos DROP CONSTRAINT IF EXISTS atendimentos_paciente_id_fkey;
ALTER TABLE public.atendimentos ADD CONSTRAINT atendimentos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;

ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_paciente_id_fkey;
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;

ALTER TABLE public.receitas DROP CONSTRAINT IF EXISTS receitas_paciente_id_fkey;
ALTER TABLE public.receitas ADD CONSTRAINT receitas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;

-- Trigger for updated_at
CREATE TRIGGER update_contratos_updated_at
BEFORE UPDATE ON public.contratos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
