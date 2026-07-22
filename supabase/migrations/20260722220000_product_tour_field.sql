-- Adiciona controle do Product Tour (etapa pós-onboarding)
-- Separado do onboarding: responsável apenas por rastrear se o usuário
-- já foi apresentado ao sistema após configurar a clínica.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS product_tour_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Usuários que já têm onboarding concluído não devem ver o tour.
UPDATE public.profiles
SET product_tour_completed_at = now()
WHERE product_tour_completed_at IS NULL
  AND onboarding_completed_at IS NOT NULL;
