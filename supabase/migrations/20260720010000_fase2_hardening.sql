-- ============================================================
-- FASE 2 — Hardening: Audit Trail + Plan Protection
-- Safe to apply: only ADDs columns/triggers, no data is removed.
-- Idempotent: uses IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADD updated_at TO ALL TABLES (idempotent)
--    Supabase does not add updated_at by default.
--    Adding with DEFAULT now() so existing rows get a sane value.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.pacientes     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.atendimentos  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.agendamentos  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.receitas      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.despesas      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.estoque       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.contratos     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.procedimentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.profiles      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
ALTER TABLE public.metas         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. TRIGGER: auto-stamp updated_at on every UPDATE
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes', 'atendimentos', 'agendamentos', 'receitas',
    'despesas', 'estoque', 'contratos', 'procedimentos', 'profiles', 'metas'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t
    );
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. PROTECT THE plano COLUMN FROM CLIENT-SIDE ESCALATION
--    Without this, any authenticated user can call:
--      PATCH /rest/v1/profiles?user_id=eq.<own_id>
--      { "plano": "completo" }
--    …and upgrade their plan for free.
--    This trigger silently resets plano to its OLD value for any
--    request that does not carry a service_role JWT (payment webhook).
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_plan_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := '';
BEGIN
  BEGIN
    jwt_role := (current_setting('request.jwt.claims', true)::json) ->> 'role';
  EXCEPTION WHEN others THEN
    jwt_role := '';
  END;

  IF NEW.plano IS DISTINCT FROM OLD.plano AND jwt_role != 'service_role' THEN
    -- Silently revert: client cannot self-upgrade
    NEW.plano := OLD.plano;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_plan ON public.profiles;
CREATE TRIGGER trg_protect_plan
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_plan_column();

-- ────────────────────────────────────────────────────────────
-- 4. PERFORMANCE INDEXES for temporal queries
--    (dashboard, relatorios, and agenda all filter/sort by date)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_receitas_data       ON public.receitas(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_data       ON public.despesas(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data   ON public.agendamentos(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data   ON public.atendimentos(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_pacientes_nome      ON public.pacientes(user_id, nome);
CREATE INDEX IF NOT EXISTS idx_estoque_nome        ON public.estoque(user_id, nome);
