
-- Add user_id to all tables that need it
ALTER TABLE public.pacientes ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.atendimentos ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.agendamentos ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.despesas ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.estoque ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.receitas ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX idx_pacientes_user_id ON public.pacientes(user_id);
CREATE INDEX idx_atendimentos_user_id ON public.atendimentos(user_id);
CREATE INDEX idx_agendamentos_user_id ON public.agendamentos(user_id);
CREATE INDEX idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX idx_estoque_user_id ON public.estoque(user_id);
CREATE INDEX idx_receitas_user_id ON public.receitas(user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Allow all access to atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Allow all access to agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow all access to despesas" ON public.despesas;
DROP POLICY IF EXISTS "Allow all access to estoque" ON public.estoque;
DROP POLICY IF EXISTS "Allow all access to receitas" ON public.receitas;

-- PACIENTES policies
CREATE POLICY "Users select own pacientes" ON public.pacientes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own pacientes" ON public.pacientes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own pacientes" ON public.pacientes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own pacientes" ON public.pacientes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ATENDIMENTOS policies
CREATE POLICY "Users select own atendimentos" ON public.atendimentos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own atendimentos" ON public.atendimentos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own atendimentos" ON public.atendimentos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own atendimentos" ON public.atendimentos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- AGENDAMENTOS policies
CREATE POLICY "Users select own agendamentos" ON public.agendamentos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own agendamentos" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own agendamentos" ON public.agendamentos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own agendamentos" ON public.agendamentos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- DESPESAS policies
CREATE POLICY "Users select own despesas" ON public.despesas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own despesas" ON public.despesas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own despesas" ON public.despesas FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own despesas" ON public.despesas FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ESTOQUE policies
CREATE POLICY "Users select own estoque" ON public.estoque FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own estoque" ON public.estoque FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own estoque" ON public.estoque FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RECEITAS policies
CREATE POLICY "Users select own receitas" ON public.receitas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own receitas" ON public.receitas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own receitas" ON public.receitas FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own receitas" ON public.receitas FOR DELETE TO authenticated USING (user_id = auth.uid());
