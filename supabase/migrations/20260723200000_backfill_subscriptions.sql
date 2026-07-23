-- ============================================================
-- Backfill: subscriptions para usuários existentes
-- Fase 1 da migração de billing.
--
-- Esta migration é EXCLUSIVAMENTE ADITIVA:
--   - Apenas insere registros em public.subscriptions.
--   - Não altera public.profiles.
--   - Não altera triggers, RLS ou hooks existentes.
--   - É idempotente: executar duas vezes não produz duplicatas
--     nem altera registros já existentes.
--
-- Regra de mapeamento:
--   profiles.plano = 'completo' → status 'ativo', plano 'completo'
--   profiles.plano = 'basico'   → status 'ativo', plano 'basico'
--
-- Valores inválidos em profiles.plano abortam toda a migration
-- antes que qualquer INSERT seja executado.
--
-- O índice único parcial idx_subscriptions_user_ativo garante
-- que não pode existir mais de uma assinatura com status
-- IN ('trial', 'ativo', 'inadimplente') por usuário.
-- O NOT EXISTS abaixo é a segunda camada de proteção.
-- ============================================================

-- ── PASSO 1: Auditoria de pré-condição ───────────────────────
-- Identifica valores de profiles.plano fora do conjunto permitido.
-- Se encontrar qualquer linha, levanta EXCEPTION e aborta tudo —
-- o INSERT abaixo nunca será executado.
-- Se não houver valores inválidos, continua silenciosamente.
DO $$
DECLARE
  valores_invalidos TEXT;
BEGIN
  SELECT string_agg(
           DISTINCT COALESCE(p.plano, '<NULL>') || ' (user_id: ' || p.user_id::text || ')',
           E'\n'
           ORDER BY COALESCE(p.plano, '<NULL>') || ' (user_id: ' || p.user_id::text || ')'
         )
  INTO valores_invalidos
  FROM public.profiles p
  WHERE p.plano NOT IN ('basico', 'completo')
     OR p.plano IS NULL;

  IF valores_invalidos IS NOT NULL THEN
    RAISE EXCEPTION
      E'BACKFILL ABORTADO — valores inválidos em profiles.plano:\n%\n\nCorrija esses registros antes de aplicar esta migration.',
      valores_invalidos;
  END IF;
END;
$$;

-- ── PASSO 2: INSERT idempotente ──────────────────────────────
-- Só executa se o PASSO 1 não levantou exceção.
INSERT INTO public.subscriptions (
  user_id,
  plano,
  status,
  -- Campos de trial/período: nulos para usuários já existentes,
  -- pois eles entram diretamente como 'ativo' (não passaram por trial
  -- no sistema novo — a data de início real é desconhecida).
  trial_expira_em,
  periodo_inicio,
  periodo_fim,
  -- Campos de gateway: nulos — preenchidos futuramente pela
  -- Edge Function de checkout quando o usuário assinar de verdade.
  gateway_customer_id,
  gateway_subscription_id,
  gateway_price_id,
  ultimo_evento_gateway,
  -- Campos de cancelamento: nulos (assinatura ativa).
  cancelado_em,
  cancelamento_motivo
)
SELECT
  p.user_id,

  -- Mapeamento direto — sem fallback silencioso.
  -- O PASSO 1 já garantiu que só existem 'basico' e 'completo'.
  p.plano::text AS plano,

  -- Todos os usuários existentes entram como 'ativo'.
  -- Não há trial retroativo para contas já criadas.
  'ativo' AS status,

  NULL AS trial_expira_em,
  NULL AS periodo_inicio,
  NULL AS periodo_fim,
  NULL AS gateway_customer_id,
  NULL AS gateway_subscription_id,
  NULL AS gateway_price_id,
  NULL AS ultimo_evento_gateway,
  NULL AS cancelado_em,
  NULL AS cancelamento_motivo

FROM public.profiles p

WHERE
  -- Idempotência: pula usuários que já têm uma assinatura
  -- com status 'vivo' (trial, ativo ou inadimplente).
  -- Se a migration rodar duas vezes, nenhuma linha é reinserida.
  NOT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status IN ('trial', 'ativo', 'inadimplente')
  );
