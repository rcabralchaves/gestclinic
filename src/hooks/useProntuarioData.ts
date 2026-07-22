import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnamneseRegistro } from "@/components/Anamnese";
import type { MarcacaoFacial } from "@/components/MapaFacial";

// ════════════════════════════════════════════════════════════
// ANAMNESE
// Persiste no Supabase (tabela anamnese, JSONB registros).
// Uma linha por (user_id, paciente_id) via upsert.
// ════════════════════════════════════════════════════════════

export function useAnamnese(pacienteId: string) {
  const [registros, setRegistros] = useState<AnamneseRegistro[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pacienteId) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("anamnese" as any)
      .select("registros")
      .eq("user_id", user.id)
      .eq("paciente_id", pacienteId)
      .maybeSingle();

    setRegistros((data as any)?.registros ?? []);
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (novosRegistros: AnamneseRegistro[]) => {
    if (!pacienteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("anamnese")
      .upsert(
        { user_id: user.id, paciente_id: pacienteId, registros: novosRegistros },
        { onConflict: "user_id,paciente_id" }
      );

    if (error) {
      console.error("useAnamnese: erro ao salvar:", error);
      return;
    }
    setRegistros(novosRegistros);
  }, [pacienteId]);

  return { registros, loading, save };
}

// ════════════════════════════════════════════════════════════
// MAPA FACIAL
// Persiste no Supabase (tabela mapa_facial, JSONB marcacoes).
// Uma linha por (user_id, paciente_id) via upsert.
// ════════════════════════════════════════════════════════════

export function useMapaFacial(pacienteId: string) {
  const [marcacoes, setMarcacoes] = useState<MarcacaoFacial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pacienteId) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("mapa_facial" as any)
      .select("marcacoes")
      .eq("user_id", user.id)
      .eq("paciente_id", pacienteId)
      .maybeSingle();

    setMarcacoes((data as any)?.marcacoes ?? []);
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (novasMarcacoes: MarcacaoFacial[]) => {
    if (!pacienteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("mapa_facial")
      .upsert(
        { user_id: user.id, paciente_id: pacienteId, marcacoes: novasMarcacoes },
        { onConflict: "user_id,paciente_id" }
      );

    if (error) {
      console.error("useMapaFacial: erro ao salvar:", error);
      return;
    }
    setMarcacoes(novasMarcacoes);
  }, [pacienteId]);

  return { marcacoes, loading, save };
}

// ════════════════════════════════════════════════════════════
// FOTOS DE PRONTUÁRIO
// Arquivos no Supabase Storage (bucket prontuario-fotos).
// Metadados na tabela prontuario_fotos.
// Path: {user_id}/{atendimento_id}/{timestamp}.{ext}
// ════════════════════════════════════════════════════════════

const BUCKET = "prontuario-fotos";

export interface FotoProntuario {
  id: string;
  url: string;
  storagePath: string;
  originalName: string | null;
}

function dataURLToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}

export function useFotosProntuario(atendimentoId: string) {
  const [fotos, setFotos] = useState<FotoProntuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!atendimentoId) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("prontuario_fotos" as any)
      .select("id, storage_path, original_name")
      .eq("atendimento_id", atendimentoId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error || !data || (data as any[]).length === 0) {
      setFotos([]);
      setLoading(false);
      return;
    }

    const comUrl = await Promise.all(
      (data as any[]).map(async (f) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.storage_path, 3600);
        return {
          id: f.id,
          url: signed?.signedUrl ?? "",
          storagePath: f.storage_path,
          originalName: f.original_name ?? null,
        };
      })
    );
    setFotos(comUrl);
    setLoading(false);
  }, [atendimentoId]);

  useEffect(() => { load(); }, [load]);

  // Migração automática de fotos antigas do localStorage para o Supabase.
  // Executa uma vez quando: (a) DB não tem fotos, (b) localStorage tem.
  // Ao final, remove a chave do localStorage.
  useEffect(() => {
    if (loading || uploading || !atendimentoId) return;

    const localKey = `prontuario_fotos_${atendimentoId}`;
    const raw = localStorage.getItem(localKey);
    if (!raw) return;

    let localFotos: string[] = [];
    try { localFotos = JSON.parse(raw); } catch { localStorage.removeItem(localKey); return; }
    if (!localFotos.length) { localStorage.removeItem(localKey); return; }

    if (fotos.length > 0) {
      // Já migrado anteriormente — só limpa localStorage
      localStorage.removeItem(localKey);
      return;
    }

    (async () => {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploading(false); return; }

      let migrated = 0;
      for (const dataUrl of localFotos) {
        try {
          const ext = dataUrl.startsWith("data:image/png") ? "png"
            : dataUrl.startsWith("data:image/webp") ? "webp" : "jpg";
          const file = dataURLToFile(dataUrl, `foto_migrada_${Date.now()}.${ext}`);
          const path = `${user.id}/${atendimentoId}/${Date.now()}_${migrated}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) { console.error("Migração localStorage: upload falhou", upErr); continue; }

          await (supabase as any).from("prontuario_fotos").insert({
            user_id: user.id,
            atendimento_id: atendimentoId,
            storage_path: path,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          });
          migrated++;
        } catch (e) {
          console.error("Migração localStorage: erro ao migrar foto", e);
        }
      }

      if (migrated === localFotos.length) {
        localStorage.removeItem(localKey);
      }
      await load();
      setUploading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, atendimentoId]);

  const addFoto = useCallback(async (file: File) => {
    if (!atendimentoId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${atendimentoId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await (supabase as any).from("prontuario_fotos").insert({
        user_id: user.id,
        atendimento_id: atendimentoId,
        storage_path: path,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (dbErr) {
        // Rollback: remove arquivo orphan
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }

      await load();
    } finally {
      setUploading(false);
    }
  }, [atendimentoId, load]);

  const removeFoto = useCallback(async (foto: FotoProntuario) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.storage.from(BUCKET).remove([foto.storagePath]);
    await (supabase as any)
      .from("prontuario_fotos")
      .delete()
      .eq("id", foto.id)
      .eq("user_id", user.id);

    setFotos((prev) => prev.filter((f) => f.id !== foto.id));
  }, []);

  return { fotos, loading, uploading, addFoto, removeFoto };
}
