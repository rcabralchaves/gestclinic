-- Adiciona controle de onboarding ao perfil do usuário
-- onboarding_step: progresso atual (0=não iniciado, 1=boas-vindas, 2=perfil, 3=tour, 4=concluído)
-- onboarding_completed_at: marcado apenas ao finalizar — é o campo definitivo de conclusão
-- instagram: campo opcional para redes sociais do consultório

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_step          INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at  TIMESTAMPTZ          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instagram                TEXT                 DEFAULT '';

-- Usuários existentes que já têm clínica e nome configurados são marcados como concluídos.
-- Evita exibir onboarding para usuários ativos como a clínica da irmã.
UPDATE public.profiles
SET
  onboarding_step         = 4,
  onboarding_completed_at = now()
WHERE
  onboarding_completed_at IS NULL
  AND trim(coalesce(nome, ''))             <> ''
  AND trim(coalesce(consultorio_nome, '')) <> '';
