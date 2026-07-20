import { supabase } from "@/integrations/supabase/client";

/**
 * Format phone number for WhatsApp in the Brazil pattern: 55 + DDD + number.
 */
const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
};

/** Returns just the first name from a full name string. */
const firstName = (fullName: string) => (fullName || "").trim().split(/\s+/)[0] || fullName;

/** Fetches the clinic address from the current user's profile (cached per session). */
let _addressCache: { value: string | null; ts: number } | null = null;
const getClinicAddress = async (): Promise<string> => {
  // Cache for 60s to avoid hitting DB on every WhatsApp click
  if (_addressCache && Date.now() - _addressCache.ts < 60_000) {
    return _addressCache.value || "";
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      _addressCache = { value: "", ts: Date.now() };
      return "";
    }
    const { data } = await supabase
      .from("profiles" as any)
      .select("endereco, consultorio_nome")
      .eq("user_id", user.id)
      .maybeSingle();
    const d = data as any;
    const parts: string[] = [];
    if (d?.consultorio_nome) parts.push(d.consultorio_nome);
    if (d?.endereco) parts.push(d.endereco);
    const value = parts.join(" — ");
    _addressCache = { value, ts: Date.now() };
    return value;
  } catch {
    return "";
  }
};

const openWhatsApp = (phone: string, message: string) => {
  const formattedPhone = formatPhone(phone);
  if (!formattedPhone) return;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const sendWhatsAppLembrete = async (
  nome: string,
  telefone: string,
  data: string,
  horario: string,
) => {
  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const endereco = await getClinicAddress();
  const enderecoLinha = endereco ? `\n\n📍 ${endereco}` : "";
  const msg = `Olá ${firstName(nome)}, passando para lembrar da sua consulta ${dataFormatada} às ${horario}. Qualquer dúvida, me avise. 😊${enderecoLinha}`;
  openWhatsApp(telefone, msg);
};

export const sendWhatsAppRetorno = async (nome: string, telefone: string) => {
  const endereco = await getClinicAddress();
  const enderecoLinha = endereco ? `\n\n📍 ${endereco}` : "";
  const msg = `Olá ${firstName(nome)}, já faz um tempo desde seu último atendimento. Que tal agendar um retorno? 😊${enderecoLinha}`;
  openWhatsApp(telefone, msg);
};
