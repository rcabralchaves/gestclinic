-- ============================================================
-- Trigger: criar profile e subscription ao cadastrar usuário
-- Fase 1 da migração de billing.
--
-- Esta migration é EXCLUSIVAMENTE ADITIVA:
--   - Cria função handle_new_user() com SECURITY DEFINER.
--   - Cria trigger trg_on_auth_user_created em auth.users.
--   - Não altera nenhuma tabela existente.
--   - Não altera RLS, policies ou permissões de authenticated.
--   - Não depende de sessão do usuário — roda como o owner
--     da função (postgres), bypassando RLS por design de
--     SECURITY DEFINER, sem desativá-la.
--
-- Campos lidos de raw_user_meta_data:
--   plano → 'basico' | 'completo' (default 'basico' se ausente
--           ou com valor fora do conjunto permitido)
--
-- Idempotente via INSERT ... ON CONFLICT DO NOTHING:
--   se por qualquer motivo o profile ou subscription já
--   existirem, a função não falha nem duplica registros.
--
-- Reversão manual (se necessário):
--   DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_new_user();
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano TEXT;
BEGIN
  -- Lê o plano do metadata enviado pelo frontend no signUp.
  -- Aceita apenas 'basico' ou 'completo'.
  -- Qualquer outro valor (ausente, nulo, string inválida) → 'basico'.
  -- Validação server-side: o banco nunca confia cegamente no cliente.
  v_plano := CASE
    WHEN (NEW.raw_user_meta_data->>'plano') IN ('basico', 'completo')
    THEN NEW.raw_user_meta_data->>'plano'
    ELSE 'basico'
  END;

  -- ── 1. Cria o profile ───────────────────────────────────────
  -- nome: tenta usar metadata 'nome', senão usa a parte local do email.
  -- ON CONFLICT (user_id) DO NOTHING: idempotente se já existir.
  INSERT INTO public.profiles (
    user_id,
    nome,
    email,
    plano,
    onboarding_step
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''),
      split_part(NEW.email, '@', 1),
      ''
    ),
    COALESCE(NEW.email, ''),
    v_plano,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- ── 2. Cria a subscription em trial ────────────────────────
  -- trial_expira_em: omitido — usa DEFAULT (now() + interval '7 days')
  -- definido em 20260723210000 e alterado para 7 dias em 20260724010000.
  -- ON CONFLICT DO NOTHING: idempotente se já existir subscription ativa.
  INSERT INTO public.subscriptions (
    user_id,
    plano,
    status
  )
  VALUES (
    NEW.id,
    v_plano,
    'trial'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotência da migration).
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
