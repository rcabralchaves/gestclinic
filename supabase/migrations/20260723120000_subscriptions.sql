-- ============================================================
-- Tabela: subscriptions
-- Objetivo: infraestrutura de billing do GestClini.
--
-- Esta migration é EXCLUSIVAMENTE ADITIVA:
--   - Cria apenas a tabela public.subscriptions.
--   - Não altera nenhuma tabela existente.
--   - Não altera profiles, triggers, RLS ou hooks existentes.
--   - Não integra nenhum gateway de pagamento.
--
-- Toda escrita nesta tabela será feita exclusivamente por
-- Edge Functions com service_role JWT — nunca pelo frontend.
-- ============================================================

-- ── 1. Tabela ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculo com o usuário autenticado.
  -- ON DELETE CASCADE: se o usuário for removido do sistema, a
  -- assinatura é removida junto — evita registros órfãos.
  user_id                 UUID        NOT NULL
                            REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plano contratado nesta assinatura.
  -- Espelha profiles.plano mas é a fonte de verdade para billing.
  plano                   TEXT        NOT NULL DEFAULT 'basico',

  -- Estado do ciclo de vida da assinatura.
  -- 'trial'        → período gratuito de avaliação
  -- 'ativo'        → assinatura paga e em dia
  -- 'inadimplente' → pagamento recusado, acesso restrito
  -- 'cancelado'    → cancelado pelo usuário ou por inadimplência
  -- 'expirado'     → período encerrado sem renovação
  status                  TEXT        NOT NULL DEFAULT 'trial',

  -- Datas do ciclo de vida.
  trial_expira_em         TIMESTAMPTZ,   -- null se não entrou em trial
  periodo_inicio          TIMESTAMPTZ,   -- início do período pago atual
  periodo_fim             TIMESTAMPTZ,   -- data de corte / próxima renovação

  -- Dados de cancelamento (preenchidos apenas ao cancelar).
  cancelado_em            TIMESTAMPTZ,
  cancelamento_motivo     TEXT,
    -- valores esperados: 'usuario' | 'inadimplencia' | 'admin'

  -- Identificadores do gateway de pagamento.
  -- Armazenados aqui para localizar o contrato no gateway
  -- sem precisar de uma tabela separada de integrações.
  gateway_customer_id     TEXT,          -- ex: 'cus_xxx' (Stripe)
  gateway_subscription_id TEXT,          -- ex: 'sub_xxx' (Stripe)
  gateway_price_id        TEXT,          -- ex: 'price_xxx' (Stripe)

  -- Último evento de webhook recebido do gateway.
  -- Útil para debug e idempotência (evitar processar o mesmo
  -- evento duas vezes).
  ultimo_evento_gateway   TEXT,

  -- Auditoria automática.
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. CHECK constraints ─────────────────────────────────────

-- Garante que apenas valores válidos sejam aceitos para 'status'.
-- Qualquer outro valor resultará em erro — sem strings arbitrárias.
ALTER TABLE public.subscriptions
  ADD CONSTRAINT chk_subscriptions_status
  CHECK (status IN ('trial', 'ativo', 'inadimplente', 'cancelado', 'expirado'));

-- Garante que apenas planos conhecidos sejam armazenados.
-- Ao adicionar um novo plano no futuro, esta constraint deve ser
-- atualizada junto com a lógica de negócio.
ALTER TABLE public.subscriptions
  ADD CONSTRAINT chk_subscriptions_plano
  CHECK (plano IN ('basico', 'completo'));

-- Garante que cancelamento_motivo só receba valores controlados
-- quando preenchido. Permite NULL (assinatura não cancelada).
ALTER TABLE public.subscriptions
  ADD CONSTRAINT chk_subscriptions_cancelamento_motivo
  CHECK (
    cancelamento_motivo IS NULL
    OR cancelamento_motivo IN ('usuario', 'inadimplencia', 'admin')
  );

-- ── 3. Índices ───────────────────────────────────────────────

-- Índice único parcial: apenas uma assinatura "viva" por usuário.
-- 'cancelado' e 'expirado' ficam fora do índice — permitem múltiplos
-- registros históricos do mesmo usuário.
-- Objetivo: impedir que o gateway (ou um bug) crie duas assinaturas
-- ativas para o mesmo usuário simultaneamente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_ativo
  ON public.subscriptions (user_id)
  WHERE status IN ('trial', 'ativo', 'inadimplente');

-- Índice de lookup rápido por gateway_subscription_id.
-- Todo webhook do gateway identifica a assinatura por este ID.
-- Sem índice, cada evento de webhook faria um seq scan na tabela.
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_sub_id
  ON public.subscriptions (gateway_subscription_id)
  WHERE gateway_subscription_id IS NOT NULL;

-- Índice de lookup por gateway_customer_id.
-- Necessário quando o evento do gateway referencia o customer
-- (ex: customer.subscription.deleted) em vez da subscription.
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_customer_id
  ON public.subscriptions (gateway_customer_id)
  WHERE gateway_customer_id IS NOT NULL;

-- Índice por user_id para queries do tipo "buscar assinatura do usuário".
-- Separado do índice único parcial para suportar busca sem filtro de status.
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

-- ── 4. Trigger de updated_at ─────────────────────────────────
-- Reutiliza a função set_updated_at() criada em
-- 20260720010000_fase2_hardening.sql — já existe em produção.
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. Row Level Security ────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT: usuário autenticado vê apenas a própria assinatura.
-- Necessário para que o frontend possa exibir o status da assinatura
-- sem expor dados de outros usuários.
DROP POLICY IF EXISTS "user reads own subscription" ON public.subscriptions;
CREATE POLICY "user reads own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Sem policies de INSERT, UPDATE ou DELETE para 'authenticated'.
-- Ausência de policy = acesso negado pelo RLS.
-- Toda escrita é feita por Edge Functions com service_role,
-- que bypass RLS por design — sem necessidade de policy explícita.

-- Remove qualquer acesso do role anon (belt-and-suspenders,
-- pois RLS sem policy já bloquearia, mas REVOKE é explícito).
REVOKE ALL ON public.subscriptions FROM anon;
