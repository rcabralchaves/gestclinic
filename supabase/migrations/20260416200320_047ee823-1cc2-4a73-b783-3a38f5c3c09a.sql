CREATE TABLE public.procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, nome)
);

ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own procedimentos" ON public.procedimentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own procedimentos" ON public.procedimentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own procedimentos" ON public.procedimentos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own procedimentos" ON public.procedimentos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_procedimentos_updated_at
  BEFORE UPDATE ON public.procedimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();