-- ============================================================
-- Identidade Visual da Clínica — Migração para o Supabase
-- Objetivo: tirar cor_clinica e logo do localStorage e
--           persistir no banco para funcionar em qualquer
--           dispositivo.
--
-- Safe: ADD COLUMN IF NOT EXISTS, ON CONFLICT DO NOTHING.
-- Nenhum dado existente é modificado ou removido.
-- ============================================================

-- ── 1. Colunas em profiles ──────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cor_clinica TEXT DEFAULT '#1d4ed8',
  ADD COLUMN IF NOT EXISTS logo_url    TEXT DEFAULT NULL;

-- ── 2. Bucket para logos das clínicas ───────────────────────
-- Privado: acesso apenas via políticas RLS de Storage.
-- Limite 2 MB por arquivo (logo não precisa de mais).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinica-logos',
  'clinica-logos',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Políticas de Storage ─────────────────────────────────
-- Cada usuário acessa apenas sua própria pasta ({uid}/logo).

DROP POLICY IF EXISTS "clinica_logos_insert" ON storage.objects;
CREATE POLICY "clinica_logos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'clinica-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "clinica_logos_select" ON storage.objects;
CREATE POLICY "clinica_logos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'clinica-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "clinica_logos_update" ON storage.objects;
CREATE POLICY "clinica_logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'clinica-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "clinica_logos_delete" ON storage.objects;
CREATE POLICY "clinica_logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'clinica-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
