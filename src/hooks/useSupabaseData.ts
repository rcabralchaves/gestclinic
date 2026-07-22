import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Paciente, Atendimento, Agendamento, Receita, Despesa, ProdutoEstoque } from "@/lib/mockData";

// ========== Mappers: DB <-> Frontend ==========

const mapPacienteFromDB = (row: any): Paciente => ({
  id: row.id,
  nome: row.nome,
  cpf: row.cpf || "",
  dataNascimento: row.data_nascimento || "",
  telefone: row.telefone || "",
  email: row.email || "",
  observacoes: row.observacoes || "",
  historicoMedico: row.historico_medico || "",
  retorno: row.retorno_data ? { data: row.retorno_data, tipo: row.retorno_tipo || "" } : undefined,
  criadoEm: row.created_at?.split("T")[0] || "",
});

const mapAtendimentoFromDB = (row: any): Atendimento => ({
  id: row.id,
  pacienteId: row.paciente_id,
  procedimento: row.procedimento || "",
  observacoes: row.observacoes || "",
  data: row.data,
  valor: Number(row.valor),
  realizado: row.realizado,
  formaPagamento: row.forma_pagamento || undefined,
});

const PESSOAL_PREFIX = "[PESSOAL] ";

const mapAgendamentoFromDB = (row: any): Agendamento => {
  const procRaw = row.procedimento || "";
  const isPessoal = procRaw.startsWith(PESSOAL_PREFIX) || !row.paciente_id;
  return {
    id: row.id,
    pacienteId: row.paciente_id || null,
    pacienteNome: row.paciente_nome,
    procedimento: isPessoal ? procRaw.replace(PESSOAL_PREFIX, "") : procRaw,
    data: row.data,
    horaInicio: row.hora_inicio,
    duracao: row.duracao,
    status: row.status as Agendamento["status"],
    pessoal: isPessoal,
  };
};

const mapReceitaFromDB = (row: any): Receita => ({
  id: row.id,
  paciente: row.paciente,
  pacienteId: row.paciente_id || undefined,
  procedimento: row.procedimento || "",
  valor: Number(row.valor),
  formaPagamento: row.forma_pagamento as Receita["formaPagamento"],
  data: row.data,
  parcelas: row.parcelas || undefined,
});

const mapDespesaFromDB = (row: any): Despesa => ({
  id: row.id,
  descricao: row.descricao,
  categoria: row.categoria as Despesa["categoria"],
  valor: Number(row.valor),
  data: row.data,
  tipo: row.tipo as Despesa["tipo"],
});

const mapEstoqueFromDB = (row: any): ProdutoEstoque & { categoria?: string; descricao?: string } => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria || "",
  quantidade: Number(row.quantidade),
  custoUnitario: Number(row.custo_unitario),
  minimo: Number(row.minimo),
  unidade: row.unidade || "un",
  descricao: row.descricao || "",
});

export interface Contrato {
  id: string;
  pacienteId: string;
  titulo: string;
  conteudo: string;
  templateNome: string;
  assinado: boolean;
  criadoEm: string;
}

const mapContratoFromDB = (row: any): Contrato => ({
  id: row.id,
  pacienteId: row.paciente_id,
  titulo: row.titulo || "",
  conteudo: row.conteudo || "",
  templateNome: row.template_nome || "personalizado",
  assinado: row.assinado || false,
  criadoEm: row.created_at?.split("T")[0] || "",
});
// ========== Generic hook (RLS handles filtering) ==========

function useSupabaseTable<T>(
  table: string,
  mapper: (row: any) => T,
) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: rows, error } = await supabase.from(table as any).select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(`Erro ao carregar ${table}:`, error);
    } else if (rows) {
      setData(rows.map(mapper));
    }
    setLoading(false);
  }, [authLoading, mapper, table, user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, setData, loading, refetch: fetch };
}

// ========== Helper to get current user id ==========

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ========== Pacientes ==========

export function usePacientesDB() {
  const { user, loading: authLoading } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (authLoading) return;
    if (!user) { setPacientes([]); setLoading(false); return; }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("pacientes")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) console.error("Erro ao carregar pacientes:", error);
    else if (rows) setPacientes(rows.map(mapPacienteFromDB));
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => { refetch(); }, [refetch]);

  const addPaciente = useCallback(async (p: Omit<Paciente, "id"> & { id?: string }) => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    // Defensa contra duplicação por clique duplo / submissão dupla:
    // se já existe um paciente com mesmo nome (case-insensitive) criado nos últimos 5s, retorna o existente.
    const nomeNormalizado = (p.nome || "").trim().toLowerCase();
    if (nomeNormalizado) {
      const { data: recentes } = await supabase
        .from("pacientes")
        .select("*")
        .eq("user_id", userId)
        .ilike("nome", p.nome.trim())
        .gte("created_at", new Date(Date.now() - 5000).toISOString())
        .is("deleted_at", null)
        .limit(1);
      if (recentes && recentes.length > 0) {
        console.warn("addPaciente: paciente recém-criado detectado, evitando duplicata (id:", recentes[0].id, ")");
        await refetch();
        return mapPacienteFromDB(recentes[0]);
      }
    }
    const { data, error } = await supabase.from("pacientes").insert({
      nome: p.nome,
      cpf: p.cpf || "",
      data_nascimento: p.dataNascimento || "",
      telefone: p.telefone || "",
      email: p.email || "",
      observacoes: p.observacoes || "",
      historico_medico: p.historicoMedico || "",
      retorno_data: p.retorno?.data || null,
      retorno_tipo: p.retorno?.tipo || null,
      user_id: userId,
    } as any).select().single();
    if (!error && data) {
      await refetch();
      return mapPacienteFromDB(data);
    }
    return null;
  }, [refetch]);

  const addPacientes = useCallback(async (ps: Paciente[]) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    // IMPORTANTE: nunca propagamos `id` vindo do frontend (poderia colidir/sobrescrever).
    // O banco gera um UUID novo para cada paciente importado.
    const rows = ps.map((p) => ({
      nome: p.nome,
      cpf: p.cpf || "",
      data_nascimento: p.dataNascimento || "",
      telefone: p.telefone || "",
      email: p.email || "",
      observacoes: p.observacoes || "",
      historico_medico: p.historicoMedico || "",
      retorno_data: p.retorno?.data || null,
      retorno_tipo: p.retorno?.tipo || null,
      user_id: userId,
    }));
    const { error } = await supabase.from("pacientes").insert(rows as any);
    if (error) console.error("Erro ao importar pacientes:", error);
    await refetch();
  }, [refetch]);

  const updatePaciente = useCallback(async (id: string, updates: Partial<Paciente>) => {
    if (!id) {
      console.error("updatePaciente: id ausente, operação cancelada para evitar update global");
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
    if (updates.dataNascimento !== undefined) dbUpdates.data_nascimento = updates.dataNascimento;
    if (updates.telefone !== undefined) dbUpdates.telefone = updates.telefone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
    if (updates.historicoMedico !== undefined) dbUpdates.historico_medico = updates.historicoMedico;
    if (updates.retorno !== undefined) {
      dbUpdates.retorno_data = updates.retorno?.data || null;
      dbUpdates.retorno_tipo = updates.retorno?.tipo || null;
    }
    // Defense-in-depth: filtra por id E user_id (além do RLS).
    await supabase.from("pacientes").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const deletePaciente = useCallback(async (id: string) => {
    if (!id) {
      console.error("deletePaciente: id ausente, operação cancelada para evitar delete global");
      return false;
    }
    const userId = await getCurrentUserId();
    if (!userId) return false;
    // Soft delete: preserva dados médicos (obrigação legal CFM/LGPD).
    // O registro fica no banco com deleted_at preenchido.
    // A RLS de SELECT filtra deleted_at IS NULL — some da UI, mas não do banco.
    const { error } = await supabase
      .from("pacientes")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Erro ao arquivar paciente:", error);
      return false;
    }
    // Remove imediatamente do estado local para que o contexto já esteja
    // atualizado quando navigate() montar Pacientes.tsx (React 18 batching).
    setPacientes(prev => prev.filter(p => p.id !== id));
    await refetch();
    return true;
  }, [refetch]);

  const getPaciente = useCallback((id: string) => {
    return pacientes.find((p) => p.id === id);
  }, [pacientes]);

  return { pacientes, loading, addPaciente, addPacientes, updatePaciente, deletePaciente, getPaciente, refetch };
}

// ========== Atendimentos ==========

export function useAtendimentosDB() {
  const { data: atendimentos, loading, refetch } = useSupabaseTable("atendimentos", mapAtendimentoFromDB);

  const addAtendimento = useCallback(async (a: Omit<Atendimento, "id">) => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from("atendimentos").insert({
      paciente_id: a.pacienteId,
      procedimento: a.procedimento,
      observacoes: a.observacoes || "",
      data: a.data,
      valor: a.valor,
      realizado: a.realizado,
      forma_pagamento: a.formaPagamento || null,
      user_id: userId,
    } as any).select().single();
    if (!error) await refetch();
    return data ? mapAtendimentoFromDB(data) : null;
  }, [refetch]);

  const updateAtendimento = useCallback(async (id: string, updates: Partial<Atendimento>) => {
    if (!id) {
      console.error("updateAtendimento: id ausente, operação cancelada");
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.procedimento !== undefined) dbUpdates.procedimento = updates.procedimento;
    if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.realizado !== undefined) dbUpdates.realizado = updates.realizado;
    if (updates.formaPagamento !== undefined) dbUpdates.forma_pagamento = updates.formaPagamento;
    // ATUALIZA o atendimento existente (NÃO cria novo). Filtra por id E user_id.
    await supabase.from("atendimentos").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const deleteAtendimento = useCallback(async (id: string) => {
    if (!id) {
      console.error("deleteAtendimento: id ausente, operação cancelada");
      return false;
    }
    const userId = await getCurrentUserId();
    if (!userId) return false;
    // Soft delete: prontuários médicos devem ser retidos.
    // O registro permanece no banco — apenas some da UI via RLS SELECT.
    const { error } = await supabase
      .from("atendimentos")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Erro ao arquivar atendimento:", error);
      return false;
    }
    await refetch();
    return true;
  }, [refetch]);

  return { atendimentos, loading, addAtendimento, updateAtendimento, deleteAtendimento, refetch };
}

// ========== Agendamentos ==========

export function useAgendamentosDB() {
  const { data: agendamentos, loading, refetch, setData } = useSupabaseTable("agendamentos", mapAgendamentoFromDB);

  const addAgendamento = useCallback(async (a: Omit<Agendamento, "id">) => {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const procToSave = a.pessoal ? `${PESSOAL_PREFIX}${a.procedimento || "Compromisso"}` : (a.procedimento || "");
    const { error } = await supabase.from("agendamentos").insert({
      paciente_id: a.pacienteId || null,
      paciente_nome: a.pacienteNome,
      procedimento: procToSave,
      data: a.data,
      hora_inicio: a.horaInicio,
      duracao: a.duracao,
      status: a.status,
      user_id: userId,
    } as any);
    if (error) {
      console.error("Erro ao criar agendamento:", error);
      return false;
    }
    await refetch();
    return true;
  }, [refetch]);

  const updateAgendamento = useCallback(async (id: string, updates: Partial<Agendamento>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.procedimento !== undefined) {
      // Preserve [PESSOAL] prefix if it's a personal appointment
      dbUpdates.procedimento = updates.pessoal ? `${PESSOAL_PREFIX}${updates.procedimento}` : updates.procedimento;
    }
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.horaInicio !== undefined) dbUpdates.hora_inicio = updates.horaInicio;
    if (updates.duracao !== undefined) dbUpdates.duracao = updates.duracao;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    await supabase.from("agendamentos").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const removeAgendamento = useCallback(async (id: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from("agendamentos").delete().eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  return { agendamentos, loading, addAgendamento, updateAgendamento, removeAgendamento, refetch, setAgendamentos: setData };
}

// ========== Receitas ==========

export function useReceitasDB() {
  const { data: receitas, loading, refetch } = useSupabaseTable("receitas", mapReceitaFromDB);

  const addReceita = useCallback(async (r: Omit<Receita, "id"> & { taxaCartao?: number; antecipar?: boolean; taxaAntecipacao?: number }) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const taxa = r.taxaCartao || 0;
    const valorLiquido = r.valor * (1 - taxa / 100);
    const numParcelas = r.parcelas || 1;

    // If prepaying (antecipar), put full amount in current month with additional fee
    if (r.antecipar && numParcelas > 1) {
      const taxaAntecipacao = r.taxaAntecipacao || 0;
      const valorAntecipado = valorLiquido * (1 - taxaAntecipacao / 100);
      await supabase.from("receitas").insert({
        paciente: r.paciente,
        paciente_id: r.pacienteId || null,
        procedimento: `${r.procedimento} (${numParcelas}x antecipado)`,
        valor: Math.round(valorAntecipado * 100) / 100,
        forma_pagamento: r.formaPagamento,
        data: r.data,
        parcelas: numParcelas,
        user_id: userId,
      } as any);
    } else if (numParcelas > 1) {
      // Padroniza parcelas: todas iguais; última absorve eventuais centavos de arredondamento.
      const totalCentavos = Math.round(valorLiquido * 100);
      const baseCentavos = Math.floor(totalCentavos / numParcelas);
      const restoCentavos = totalCentavos - baseCentavos * numParcelas;
      const baseDate = new Date(r.data + "T12:00:00");
      const rows = Array.from({ length: numParcelas }, (_, i) => {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const cents = baseCentavos + (i === numParcelas - 1 ? restoCentavos : 0);
        return {
          paciente: r.paciente,
          paciente_id: r.pacienteId || null,
          procedimento: `${r.procedimento} (${i + 1}/${numParcelas})`,
          valor: cents / 100,
          forma_pagamento: r.formaPagamento,
          data: d.toISOString().split("T")[0],
          parcelas: numParcelas,
          user_id: userId,
        };
      });
      await supabase.from("receitas").insert(rows as any);
    } else {
      await supabase.from("receitas").insert({
        paciente: r.paciente,
        paciente_id: r.pacienteId || null,
        procedimento: r.procedimento,
        valor: valorLiquido,
        forma_pagamento: r.formaPagamento,
        data: r.data,
        parcelas: 1,
        user_id: userId,
      } as any);
    }
    await refetch();
  }, [refetch]);

  return { receitas, loading, addReceita, refetch };
}

// ========== Despesas ==========

export function useDespesasDB() {
  const { data: despesas, loading, refetch } = useSupabaseTable("despesas", mapDespesaFromDB);

  const addDespesa = useCallback(async (d: Omit<Despesa, "id">) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from("despesas").insert({
      descricao: d.descricao,
      categoria: d.categoria,
      valor: d.valor,
      data: d.data,
      tipo: d.tipo,
      user_id: userId,
    } as any);
    await refetch();
  }, [refetch]);

  const updateDespesa = useCallback(async (id: string, updates: Partial<Despesa>) => {
    if (!id) {
      console.error("updateDespesa: id ausente, operação cancelada");
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    await supabase.from("despesas").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const deleteDespesa = useCallback(async (id: string) => {
    if (!id) return false;
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const { error } = await supabase.from("despesas").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      console.error("Erro ao excluir despesa:", error);
      return false;
    }
    await refetch();
    return true;
  }, [refetch]);

  return { despesas, loading, addDespesa, updateDespesa, deleteDespesa, refetch };
}

// ========== Estoque ==========

export function useEstoqueDB() {
  const { data: produtos, loading, refetch } = useSupabaseTable("estoque", mapEstoqueFromDB);

  const addProduto = useCallback(async (p: { nome: string; categoria?: string; quantidade: number; custoUnitario: number; minimo: number; unidade: string; descricao?: string }) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from("estoque").insert({
      nome: p.nome,
      categoria: p.categoria || "",
      quantidade: p.quantidade,
      custo_unitario: p.custoUnitario,
      minimo: p.minimo,
      unidade: p.unidade,
      descricao: p.descricao || "",
      user_id: userId,
    } as any);
    await refetch();
  }, [refetch]);

  const updateProduto = useCallback(async (id: string, updates: Partial<ProdutoEstoque & { categoria?: string; descricao?: string }>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.quantidade !== undefined) dbUpdates.quantidade = updates.quantidade;
    if (updates.custoUnitario !== undefined) dbUpdates.custo_unitario = updates.custoUnitario;
    if (updates.minimo !== undefined) dbUpdates.minimo = updates.minimo;
    if (updates.unidade !== undefined) dbUpdates.unidade = updates.unidade;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    await supabase.from("estoque").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const deleteProduto = useCallback(async (id: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from("estoque").delete().eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const addProdutos = useCallback(async (items: { nome: string; categoria?: string; quantidade: number; custoUnitario: number; minimo: number; unidade: string; descricao?: string }[]) => {
    const userId = await getCurrentUserId();
    if (!userId) return { added: 0, updated: 0 };
    const { data: existing } = await supabase.from("estoque").select("*").eq("user_id", userId);
    const existingMap = new Map((existing || []).map((e: any) => [e.nome.toLowerCase().trim(), e]));

    const toInsert: any[] = [];
    const toUpdate: { id: string; quantidade: number; custo_unitario: number }[] = [];

    for (const item of items) {
      const key = item.nome.toLowerCase().trim();
      const ex = existingMap.get(key);
      if (ex) {
        toUpdate.push({
          id: ex.id,
          quantidade: Number(ex.quantidade) + item.quantidade,
          custo_unitario: item.custoUnitario || Number(ex.custo_unitario),
        });
      } else {
        toInsert.push({
          nome: item.nome,
          categoria: item.categoria || "",
          quantidade: item.quantidade,
          custo_unitario: item.custoUnitario,
          minimo: item.minimo,
          unidade: item.unidade,
          descricao: item.descricao || "",
          user_id: userId,
        });
      }
    }

    if (toInsert.length > 0) await supabase.from("estoque").insert(toInsert as any);
    for (const u of toUpdate) {
      await supabase.from("estoque").update({ quantidade: u.quantidade, custo_unitario: u.custo_unitario }).eq("id", u.id).eq("user_id", userId);
    }
    await refetch();
    return { added: toInsert.length, updated: toUpdate.length };
  }, [refetch]);

  return { produtos, loading, addProduto, updateProduto, deleteProduto, addProdutos, refetch };
}

// ========== Contratos ==========

export function useContratosDB(pacienteId?: string) {
  const { data: allContratos, loading, refetch } = useSupabaseTable("contratos", mapContratoFromDB);

  const contratos = pacienteId ? allContratos.filter(c => c.pacienteId === pacienteId) : allContratos;

  const addContrato = useCallback(async (c: { pacienteId: string; titulo: string; conteudo: string; templateNome: string }) => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from("contratos").insert({
      paciente_id: c.pacienteId,
      titulo: c.titulo,
      conteudo: c.conteudo,
      template_nome: c.templateNome,
      user_id: userId,
    } as any).select().single();
    if (!error && data) {
      await refetch();
      return mapContratoFromDB(data);
    }
    return null;
  }, [refetch]);

  const updateContrato = useCallback(async (id: string, updates: Partial<{ titulo: string; conteudo: string; assinado: boolean }>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const dbUpdates: any = {};
    if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
    if (updates.conteudo !== undefined) dbUpdates.conteudo = updates.conteudo;
    if (updates.assinado !== undefined) dbUpdates.assinado = updates.assinado;
    await supabase.from("contratos").update(dbUpdates).eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  const deleteContrato = useCallback(async (id: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from("contratos").delete().eq("id", id).eq("user_id", userId);
    await refetch();
  }, [refetch]);

  return { contratos, loading, addContrato, updateContrato, deleteContrato, refetch };
}
