
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  cro TEXT DEFAULT '',
  especialidade TEXT DEFAULT '',
  especialidade_secundaria TEXT DEFAULT '',
  consultorio_nome TEXT DEFAULT '',
  cnpj TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Metas table
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'currency',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add parcelas to receitas
ALTER TABLE public.receitas ADD COLUMN parcelas INTEGER DEFAULT 1;
