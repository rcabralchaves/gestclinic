-- ============================================================
-- SECURITY PHASE 2 — Sistema de Audit Logs
--
-- Esta migration é EXCLUSIVAMENTE ADITIVA:
--   - Cria tabela public.audit_logs.
--   - Cria função public.fn_audit_log() com SECURITY DEFINER.
--   - Cria triggers em pacientes, atendimentos e anamnese.
--   - Não altera nenhuma tabela existente.
--   - Não altera nenhum dado existente.
--   - Não altera RLS, policies ou triggers preexistentes.
--   - Não requer nenhuma alteração no código frontend.
--
-- Idempotente:
--   - CREATE TABLE IF NOT EXISTS
--   - CREATE INDEX IF NOT EXISTS
--   - DROP TRIGGER IF EXISTS antes de CREATE TRIGGER
--   - CREATE OR REPLACE FUNCTION
--
-- Imutabilidade:
--   - Nenhuma policy de INSERT/UPDATE/DELETE para authenticated.
--   - INSERTs ocorrem exclusivamente via trigger SECURITY DEFINER,
--     que executa com permissão do owner (postgres/service_role),
--     bypassando RLS.
--   - Authenticated: apenas SELECT dos próprios registros.
--   - service_role: acesso total (para LGPD e administração).
--
-- Diff em UPDATE:
--   - old_data e new_data armazenam APENAS os campos alterados.
--   - INSERTs gravam apenas new_data (sem estado anterior).
--   - DELETEs gravam apenas old_data (sem estado posterior).
--   - UPDATE que só modifica updated_at é descartado (sem log).
--
-- Campos extras para evolução:
--   - request_id   UUID NULL    → correlação com Edge Functions
--   - schema_version SMALLINT   → permite evolução do formato sem migration
--
-- Reversão manual (se necessário):
--   DROP TRIGGER IF EXISTS trg_audit_pacientes    ON public.pacientes;
--   DROP TRIGGER IF EXISTS trg_audit_atendimentos ON public.atendimentos;
--   DROP TRIGGER IF EXISTS trg_audit_anamnese     ON public.anamnese;
--   DROP FUNCTION IF EXISTS public.fn_audit_log();
--   DROP TABLE IF EXISTS public.audit_logs;
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. TABELA: audit_logs
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (

  -- ── Identificação do evento ──────────────────────────────
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    -- clock_timestamp(): momento real do evento, não início da transação.
    -- Diferença relevante quando há múltiplas operações na mesma tx.

  -- ── Autoria ──────────────────────────────────────────────
  user_id          UUID         NOT NULL,
    -- auth.uid() capturado no trigger — nunca informado pelo cliente.
  user_email       TEXT,
    -- Desnormalizado do JWT para leitura humana.
    -- Nullable: em operações de sistema (service_role) pode estar ausente.

  -- ── Contexto da operação ──────────────────────────────────
  table_name       TEXT         NOT NULL,
  record_id        UUID         NOT NULL,
  operation        TEXT         NOT NULL,

  -- ── Diff dos campos alterados ─────────────────────────────
  -- INSERT: old_data = NULL,  new_data = linha completa
  -- UPDATE: old_data = {campos_alterados: valor_anterior}
  --         new_data = {campos_alterados: valor_novo}
  -- DELETE: old_data = linha completa, new_data = NULL
  old_data         JSONB,
  new_data         JSONB,

  -- Nomes dos campos que mudaram (pre-computado para queries eficientes)
  -- Permite: WHERE 'cpf' = ANY(changed_fields)
  -- INSERT/DELETE: NULL (nenhum "diff" — é o estado inteiro)
  changed_fields   TEXT[],

  -- ── Campos para evolução futura ───────────────────────────
  request_id       UUID,
    -- Correlação com Edge Functions: preencher via GUC se disponível.
    -- NULL por enquanto — reservado para v2.
  schema_version   SMALLINT     NOT NULL DEFAULT 1,
    -- Versão do formato deste log. Permite evoluir old_data/new_data
    -- sem quebrar queries que dependem da estrutura atual.

  -- ── Constraints de consistência ──────────────────────────
  CONSTRAINT chk_audit_operation
    CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

  CONSTRAINT chk_audit_data_coherence
    CHECK (
      (operation = 'INSERT' AND old_data IS NULL     AND new_data IS NOT NULL) OR
      (operation = 'UPDATE' AND old_data IS NOT NULL AND new_data IS NOT NULL) OR
      (operation = 'DELETE' AND old_data IS NOT NULL AND new_data IS NULL)
    )
);

-- Sem FK para tabelas de dados:
-- O log deve sobreviver à exclusão/anonimização do registro original.
-- Uma FK impediria operações LGPD (DELETE/anonimização) em pacientes.


-- ════════════════════════════════════════════════════════════
-- 2. ÍNDICES
-- ════════════════════════════════════════════════════════════

-- Principal: "mostre o histórico de ações do usuário X, do mais recente"
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs (user_id, created_at DESC);

-- Investigação: "o que aconteceu com este registro específico?"
CREATE INDEX IF NOT EXISTS idx_audit_logs_record
  ON public.audit_logs (table_name, record_id, created_at DESC);

-- Filtro por tabela: "todos os eventos em atendimentos nos últimos 30 dias"
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
  ON public.audit_logs (table_name, created_at DESC);

-- Retenção: "selecione logs mais antigos que N anos para arquivar"
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at);


-- ════════════════════════════════════════════════════════════
-- 3. RLS — IMUTABILIDADE TOTAL PARA USUÁRIOS AUTENTICADOS
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: cada usuário lê apenas seus próprios logs (transparência).
-- INSERTs via trigger SECURITY DEFINER bypassam RLS por design —
-- nenhuma policy de INSERT é necessária (e nenhuma é criada).
DROP POLICY IF EXISTS "Users read own audit logs" ON public.audit_logs;
CREATE POLICY "Users read own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Bloqueia acesso anônimo completamente.
REVOKE ALL ON public.audit_logs FROM anon;


-- ════════════════════════════════════════════════════════════
-- 4. FUNÇÃO GENÉRICA DO TRIGGER
-- ════════════════════════════════════════════════════════════
--
-- SECURITY DEFINER: executa com permissão do owner (postgres),
-- que tem acesso direto à audit_logs ignorando RLS.
-- Isso é necessário porque authenticated não tem policy de INSERT.
--
-- SET search_path = public: previne search_path hijacking —
-- padrão de segurança obrigatório em funções SECURITY DEFINER
-- (Supabase Security Advisor exige).
--
-- Uma única função serve todas as tabelas auditadas.
-- Adicionar nova tabela = uma linha de SQL (CREATE TRIGGER).

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Campos de metadados excluídos de todos os snapshots INSERT/DELETE.
  -- Estes campos são redundantes com as colunas da própria tabela audit_logs:
  --   user_id    → já capturado em public.audit_logs.user_id
  --   updated_at → timestamp automático; o created_at do log registra quando
  -- Para INSERT, created_at também é excluído (= now() = audit log created_at).
  c_meta_always  CONSTANT TEXT[] := ARRAY['user_id', 'updated_at'];

  v_user_id      UUID;
  v_user_email   TEXT;
  v_old          JSONB;
  v_new          JSONB;
  v_changed      TEXT[];
  v_record_id    UUID;
  v_old_row      JSONB;
  v_new_row      JSONB;
  k              TEXT;
BEGIN
  -- ── Captura autoria ──────────────────────────────────────
  v_user_id := auth.uid();

  -- NULLIF protege contra string vazia ('') em contextos sem PostgREST
  -- (ex: service_role via psql, migrations, pg_cron), onde o GUC existe
  -- mas pode ser ''. Sem NULLIF, ''::jsonb lança syntax error e ativa
  -- o EXCEPTION handler desnecessariamente.
  v_user_email := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';

  -- Operações de sistema (service_role, migrations) não têm auth.uid().
  -- UUID sentinela '00000000-0000-0000-0000-000000000000' identifica
  -- operações administrativas nos logs.
  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- ── Monta diff por tipo de operação ─────────────────────
  IF TG_OP = 'INSERT' THEN
    -- INSERT: não há estado anterior — grava campos clínicos como new_data.
    -- Remove: user_id (redundante), updated_at (= created_at), created_at
    -- (= now() ≈ audit log created_at). Mantém todos os campos de negócio.
    v_old       := NULL;
    v_new       := to_jsonb(NEW) - c_meta_always - 'created_at';
    v_changed   := NULL;
    v_record_id := NEW.id;

  ELSIF TG_OP = 'DELETE' THEN
    -- DELETE: não há estado posterior — grava snapshot do registro excluído.
    -- Remove: user_id (redundante).
    -- Mantém: created_at (data de criação original — útil para timeline)
    --         updated_at (data do último update antes da exclusão — útil)
    --         deleted_at (indica se já estava em soft delete antes do hard delete)
    v_old       := to_jsonb(OLD) - c_meta_always;
    v_new       := NULL;
    v_changed   := NULL;
    v_record_id := OLD.id;

  ELSE
    -- UPDATE: grava APENAS os campos que mudaram (diff).
    -- old_data = {campo: valor_antes}, new_data = {campo: valor_depois}
    v_old_row   := to_jsonb(OLD);
    v_new_row   := to_jsonb(NEW);
    v_old       := '{}'::jsonb;
    v_new       := '{}'::jsonb;
    v_changed   := ARRAY[]::TEXT[];
    v_record_id := NEW.id;

    FOR k IN SELECT key FROM jsonb_each(v_new_row) LOOP
      IF (v_new_row -> k) IS DISTINCT FROM (v_old_row -> k) THEN
        v_old     := v_old || jsonb_build_object(k, v_old_row -> k);
        v_new     := v_new || jsonb_build_object(k, v_new_row -> k);
        v_changed := v_changed || k;
      END IF;
    END LOOP;

    -- Descarta UPDATE que só modificou updated_at (ruído do trigger automático).
    -- Caso típico: trg_set_updated_at dispara junto com qualquer UPDATE,
    -- mas se nenhum campo de negócio mudou, não há evento auditável.
    IF v_changed IS NULL OR v_changed = ARRAY[]::TEXT[]
       OR (array_length(v_changed, 1) = 1 AND v_changed[1] = 'updated_at')
    THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    -- Remove updated_at do diff se houver outros campos alterados.
    -- updated_at é ruído — o created_at do log já registra quando ocorreu.
    v_changed := array_remove(v_changed, 'updated_at');
    v_old     := v_old - 'updated_at';
    v_new     := v_new - 'updated_at';

    -- Segurança: se após remover updated_at não sobrar nada, descarta.
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  END IF;

  -- ── Persiste o log ───────────────────────────────────────
  -- Em caso de falha (ex: tabela audit_logs indisponível, constraint violada),
  -- registra aviso mas NÃO bloqueia a operação principal.
  -- Escolha deliberada: a operação clínica nunca deve falhar por causa do audit.
  BEGIN
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      changed_fields,
      request_id,
      schema_version
    )
    VALUES (
      v_user_id,
      v_user_email,
      TG_TABLE_NAME,
      v_record_id,
      TG_OP,
      v_old,
      v_new,
      v_changed,
      NULL,    -- request_id: reservado para v2 (Edge Function correlation)
      1        -- schema_version: versão atual do formato
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_audit_log: falha ao registrar log em % (op=%, id=%): %',
      TG_TABLE_NAME, TG_OP, v_record_id, SQLERRM;
  END;

  -- COALESCE(NEW, OLD): AFTER DELETE → NEW é NULL → retorna OLD.
  -- Para AFTER triggers o valor de retorno é ignorado pelo PostgreSQL,
  -- mas retornar NULL em DELETE é semanticamente incorreto.
  RETURN COALESCE(NEW, OLD);
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 5. TRIGGERS — pacientes, atendimentos, anamnese
-- ════════════════════════════════════════════════════════════
--
-- AFTER: garante que o log só é criado se a operação principal
-- foi bem-sucedida (commit). Um trigger BEFORE criaria o log
-- mesmo em operações que depois falham com EXCEPTION.
--
-- Os triggers coexistem sem conflito com os preexistentes:
--   trg_enforce_user_id  → BEFORE INSERT (ordem diferente)
--   trg_set_updated_at   → BEFORE UPDATE (ordem diferente)
--   trg_audit_*          → AFTER INSERT/UPDATE/DELETE (este)

-- ── 5.1 pacientes ────────────────────────────────────────────
-- Auditamos INSERT e UPDATE. DELETE é proibido por RLS (migration c7),
-- então o trigger AFTER DELETE nunca disparará — mas fica declarado
-- para capturar eventual exclusão via service_role.
DROP TRIGGER IF EXISTS trg_audit_pacientes ON public.pacientes;
CREATE TRIGGER trg_audit_pacientes
  AFTER INSERT OR UPDATE OR DELETE
  ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_log();

-- ── 5.2 atendimentos ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_audit_atendimentos ON public.atendimentos;
CREATE TRIGGER trg_audit_atendimentos
  AFTER INSERT OR UPDATE OR DELETE
  ON public.atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_log();

-- ── 5.3 anamnese ─────────────────────────────────────────────
-- Tabela com JSONB registros[] — o diff captura apenas se o array
-- de registros mudou, sem comparar campo a campo dentro do JSONB.
-- Isso é adequado: o conteúdo completo antes/depois fica visível.
DROP TRIGGER IF EXISTS trg_audit_anamnese ON public.anamnese;
CREATE TRIGGER trg_audit_anamnese
  AFTER INSERT OR UPDATE OR DELETE
  ON public.anamnese
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_log();
