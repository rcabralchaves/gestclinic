-- ============================================================
-- Adiciona DEFAULT em subscriptions.trial_expira_em
-- Fase 1 da migração de billing.
--
-- Esta migration é EXCLUSIVAMENTE ESTRUTURAL:
--   - Apenas adiciona um DEFAULT à coluna trial_expira_em.
--   - Não altera nenhum dado existente.
--   - Não altera RLS, policies, triggers ou outras colunas.
--   - Não altera nenhuma outra tabela.
--
-- Efeito:
--   INSERTs que omitem trial_expira_em recebem automaticamente
--   now() + 14 days como valor, calculado pelo banco no momento
--   do insert — sem depender do relógio do cliente.
--
-- Registros existentes (backfill):
--   Não são afetados. ALTER COLUMN ... SET DEFAULT nunca
--   reescreve linhas já existentes — age apenas em inserts futuros.
--
-- Reversão manual (se necessário):
--   ALTER TABLE public.subscriptions
--     ALTER COLUMN trial_expira_em DROP DEFAULT;
-- ============================================================

ALTER TABLE public.subscriptions
  ALTER COLUMN trial_expira_em
    SET DEFAULT (now() + interval '14 days');
