-- ============================================================
-- Altera DEFAULT de trial_expira_em de 14 para 7 dias.
--
-- Esta migration é EXCLUSIVAMENTE ESTRUTURAL:
--   - Apenas altera o DEFAULT da coluna trial_expira_em.
--   - Não altera nenhum dado existente — registros já gravados
--     com 14 dias permanecem inalterados.
--   - Não altera RLS, policies, triggers ou outras colunas.
--
-- Efeito:
--   Novos INSERTs que omitem trial_expira_em recebem
--   now() + 7 days calculado pelo banco no momento do insert.
--
-- Reversão manual (se necessário):
--   ALTER TABLE public.subscriptions
--     ALTER COLUMN trial_expira_em
--       SET DEFAULT (now() + interval '14 days');
-- ============================================================

ALTER TABLE public.subscriptions
  ALTER COLUMN trial_expira_em
    SET DEFAULT (now() + interval '7 days');
