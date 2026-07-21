-- ============================================================
-- SECURITY HARDENING — GestClini
-- Safe to apply to production: no data is modified.
-- Drops and recreates all RLS policies to ensure correctness.
-- Adds a trigger-based guard so user_id can never be NULL on INSERT.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. RE-ASSERT RLS ENABLED on every table (idempotent)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.pacientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas         ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 2. PACIENTES — drop old, recreate correct policies
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to pacientes"  ON public.pacientes;
DROP POLICY IF EXISTS "Users select own pacientes"     ON public.pacientes;
DROP POLICY IF EXISTS "Users insert own pacientes"     ON public.pacientes;
DROP POLICY IF EXISTS "Users update own pacientes"     ON public.pacientes;
DROP POLICY IF EXISTS "Users delete own pacientes"     ON public.pacientes;

CREATE POLICY "Users select own pacientes" ON public.pacientes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own pacientes" ON public.pacientes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own pacientes" ON public.pacientes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own pacientes" ON public.pacientes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. ATENDIMENTOS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to atendimentos"  ON public.atendimentos;
DROP POLICY IF EXISTS "Users select own atendimentos"     ON public.atendimentos;
DROP POLICY IF EXISTS "Users insert own atendimentos"     ON public.atendimentos;
DROP POLICY IF EXISTS "Users update own atendimentos"     ON public.atendimentos;
DROP POLICY IF EXISTS "Users delete own atendimentos"     ON public.atendimentos;

CREATE POLICY "Users select own atendimentos" ON public.atendimentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own atendimentos" ON public.atendimentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own atendimentos" ON public.atendimentos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own atendimentos" ON public.atendimentos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 4. AGENDAMENTOS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to agendamentos"  ON public.agendamentos;
DROP POLICY IF EXISTS "Users select own agendamentos"     ON public.agendamentos;
DROP POLICY IF EXISTS "Users insert own agendamentos"     ON public.agendamentos;
DROP POLICY IF EXISTS "Users update own agendamentos"     ON public.agendamentos;
DROP POLICY IF EXISTS "Users delete own agendamentos"     ON public.agendamentos;

CREATE POLICY "Users select own agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own agendamentos" ON public.agendamentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own agendamentos" ON public.agendamentos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own agendamentos" ON public.agendamentos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 5. RECEITAS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to receitas"  ON public.receitas;
DROP POLICY IF EXISTS "Users select own receitas"     ON public.receitas;
DROP POLICY IF EXISTS "Users insert own receitas"     ON public.receitas;
DROP POLICY IF EXISTS "Users update own receitas"     ON public.receitas;
DROP POLICY IF EXISTS "Users delete own receitas"     ON public.receitas;

CREATE POLICY "Users select own receitas" ON public.receitas
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own receitas" ON public.receitas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own receitas" ON public.receitas
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own receitas" ON public.receitas
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 6. DESPESAS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to despesas"  ON public.despesas;
DROP POLICY IF EXISTS "Users select own despesas"     ON public.despesas;
DROP POLICY IF EXISTS "Users insert own despesas"     ON public.despesas;
DROP POLICY IF EXISTS "Users update own despesas"     ON public.despesas;
DROP POLICY IF EXISTS "Users delete own despesas"     ON public.despesas;

CREATE POLICY "Users select own despesas" ON public.despesas
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own despesas" ON public.despesas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own despesas" ON public.despesas
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own despesas" ON public.despesas
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 7. ESTOQUE
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to estoque"  ON public.estoque;
DROP POLICY IF EXISTS "Users select own estoque"     ON public.estoque;
DROP POLICY IF EXISTS "Users insert own estoque"     ON public.estoque;
DROP POLICY IF EXISTS "Users update own estoque"     ON public.estoque;
DROP POLICY IF EXISTS "Users delete own estoque"     ON public.estoque;

CREATE POLICY "Users select own estoque" ON public.estoque
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own estoque" ON public.estoque
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own estoque" ON public.estoque
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own estoque" ON public.estoque
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 8. CONTRATOS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users select own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users insert own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users update own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users delete own contratos" ON public.contratos;

CREATE POLICY "Users select own contratos" ON public.contratos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own contratos" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own contratos" ON public.contratos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own contratos" ON public.contratos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 9. PROCEDIMENTOS
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users select own procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Users insert own procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Users update own procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Users delete own procedimentos" ON public.procedimentos;

CREATE POLICY "Users select own procedimentos" ON public.procedimentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own procedimentos" ON public.procedimentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own procedimentos" ON public.procedimentos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own procedimentos" ON public.procedimentos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 10. PROFILES and METAS — already correct, re-assert as safeguard
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own metas"   ON public.metas;
DROP POLICY IF EXISTS "Users can insert own metas" ON public.metas;
DROP POLICY IF EXISTS "Users can update own metas" ON public.metas;
DROP POLICY IF EXISTS "Users can delete own metas" ON public.metas;

CREATE POLICY "Users can view own metas" ON public.metas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas" ON public.metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas" ON public.metas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas" ON public.metas
  FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 11. TRIGGER: enforce user_id = auth.uid() on every INSERT
--     Belt-and-suspenders beyond RLS.
--     Raises an exception if application code tries to insert
--     a row with user_id NULL or user_id != the authenticated user.
--     Safe to add: does not touch existing data.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_user_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null — all rows must be tied to an authenticated user';
  END IF;
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must equal the authenticated user (auth.uid())';
  END IF;
  RETURN NEW;
END;
$$;

-- Apply the trigger to all user-scoped tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes', 'atendimentos', 'agendamentos',
    'receitas', 'despesas', 'estoque',
    'contratos', 'procedimentos'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_enforce_user_id ON public.%I', t
    );
    EXECUTE format(
      'CREATE TRIGGER trg_enforce_user_id
       BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.enforce_user_id_on_insert()', t
    );
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 12. Revoke anon access to all sensitive tables
--     By default Supabase grants anon the ability to attempt
--     queries — RLS blocks them, but revoking is belt-and-suspenders.
-- ────────────────────────────────────────────────────────────
REVOKE ALL ON public.pacientes     FROM anon;
REVOKE ALL ON public.atendimentos  FROM anon;
REVOKE ALL ON public.agendamentos  FROM anon;
REVOKE ALL ON public.receitas      FROM anon;
REVOKE ALL ON public.despesas      FROM anon;
REVOKE ALL ON public.estoque       FROM anon;
REVOKE ALL ON public.contratos     FROM anon;
REVOKE ALL ON public.procedimentos FROM anon;
REVOKE ALL ON public.profiles      FROM anon;
REVOKE ALL ON public.metas         FROM anon;
