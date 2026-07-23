import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Chaves antigas do localStorage — mantidas apenas para a migração automática.
const LS_COR  = (uid: string) => `gestclini_cor_clinica_${uid}`;
const LS_LOGO = (uid: string) => `perfil_avatar_${uid}`;

// Caminho no Storage: {uid}/logo (sem extensão — sempre sobrescrito)
const storagePath = (uid: string) => `${uid}/logo`;

export interface ClinicBranding {
  corClinica: string;
  logoUrl: string | null;   // URL assinada para exibir no <img>
  loading: boolean;
  updateCor: (hex: string) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  removeLogo: () => Promise<void>;
  /** Retorna base64 da logo para geração de PDF. null se não houver logo. */
  getLogoBase64: () => Promise<string | null>;
}

export function useClinicBranding(): ClinicBranding {
  const { user } = useAuth();
  const [corClinica, setCorClinica] = useState("#1d4ed8");
  const [logoStoragePath, setLogoStoragePath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Gera URL assinada (60 min) a partir do caminho de storage
  const refreshSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage
      .from("clinica-logos")
      .createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) setLogoUrl(data.signedUrl);
  }, []);

  // Carrega branding do banco + roda migração do localStorage se necessário
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from("profiles" as any)
        .select("cor_clinica, logo_url")
        .eq("user_id", user.id)
        .single();

      const dbCor  = (data as any)?.cor_clinica ?? null;
      const dbLogo = (data as any)?.logo_url    ?? null;

      // ── Migração automática do localStorage ─────────────────
      // Se o banco ainda não tem cor ou logo, verifica o localStorage.
      // Migra os dados para o Supabase e apaga o localStorage
      // somente depois de confirmar que a persistência funcionou.
      const lsCor  = localStorage.getItem(LS_COR(user.id));
      const lsLogo = localStorage.getItem(LS_LOGO(user.id));

      let corFinal  = dbCor  ?? lsCor  ?? "#1d4ed8";
      let logoFinal = dbLogo;

      const updates: Record<string, string> = {};

      // Migra cor
      if (!dbCor && lsCor) {
        updates.cor_clinica = lsCor;
        corFinal = lsCor;
      }

      // Migra logo (base64 → Storage)
      if (!dbLogo && lsLogo && lsLogo.startsWith("data:")) {
        try {
          const path = storagePath(user.id);
          const blob = base64ToBlob(lsLogo);
          const { error: upErr } = await supabase.storage
            .from("clinica-logos")
            .upload(path, blob, { upsert: true, contentType: blob.type });

          if (!upErr) {
            updates.logo_url = path;
            logoFinal = path;
          }
        } catch {
          // migração de logo falhou — mantém localStorage intacto
        }
      }

      // Persiste migrações no banco
      if (Object.keys(updates).length > 0) {
        const { error: saveErr } = await supabase
          .from("profiles" as any)
          .update(updates as any)
          .eq("user_id", user.id);

        if (!saveErr) {
          // Remove localStorage SOMENTE após confirmação de persistência
          if (updates.cor_clinica) localStorage.removeItem(LS_COR(user.id));
          if (updates.logo_url)    localStorage.removeItem(LS_LOGO(user.id));
        }
      }

      // ── Estado final ─────────────────────────────────────────
      setCorClinica(corFinal);

      if (logoFinal) {
        setLogoStoragePath(logoFinal);
        await refreshSignedUrl(logoFinal);
      }

      setLoading(false);
    })();
  }, [user, refreshSignedUrl]);

  const updateCor = useCallback(async (hex: string) => {
    if (!user) return;
    setCorClinica(hex);
    const { error } = await supabase
      .from("profiles" as any)
      .update({ cor_clinica: hex } as any)
      .eq("user_id", user.id);
    if (error) toast.error("Erro ao salvar cor da clínica.");
  }, [user]);

  const uploadLogo = useCallback(async (file: File) => {
    if (!user) return;
    const path = storagePath(user.id);

    const { error: upErr } = await supabase.storage
      .from("clinica-logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) { toast.error("Erro ao enviar logo."); return; }

    const { error: dbErr } = await supabase
      .from("profiles" as any)
      .update({ logo_url: path } as any)
      .eq("user_id", user.id);

    if (dbErr) { toast.error("Erro ao salvar referência da logo."); return; }

    setLogoStoragePath(path);
    await refreshSignedUrl(path);
    toast.success("Logo atualizada!");
  }, [user, refreshSignedUrl]);

  const removeLogo = useCallback(async () => {
    if (!user || !logoStoragePath) return;
    await supabase.storage.from("clinica-logos").remove([logoStoragePath]);
    await supabase
      .from("profiles" as any)
      .update({ logo_url: null } as any)
      .eq("user_id", user.id);
    setLogoStoragePath(null);
    setLogoUrl(null);
  }, [user, logoStoragePath]);

  const getLogoBase64 = useCallback(async (): Promise<string | null> => {
    if (!logoStoragePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from("clinica-logos")
        .download(logoStoragePath);
      if (error || !data) return null;
      return await blobToBase64(data);
    } catch {
      return null;
    }
  }, [logoStoragePath]);

  return { corClinica, logoUrl, loading, updateCor, uploadLogo, removeLogo, getLogoBase64 };
}

// ── Utilitários ────────────────────────────────────────────────────────────

function base64ToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
