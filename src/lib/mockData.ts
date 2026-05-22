// Mock data for the dental financial platform

export interface Receita {
  id: string;
  paciente: string;
  pacienteId?: string;
  procedimento: string;
  valor: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'convenio' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
  data: string;
  parcelas?: number;
}

/**
 * Expands receitas with parcelas into monthly entries.
 * A receita of R$300 in 3x starting Jan becomes:
 *   R$100 Jan, R$100 Feb, R$100 Mar
 * Used only for monthly financial calculations (dashboard, charts).
 */
export function expandReceitasMensais(receitas: Receita[]): { valor: number; data: string; procedimento: string }[] {
  const result: { valor: number; data: string; procedimento: string }[] = [];
  for (const r of receitas) {
    const parcelas = r.parcelas || 1;
    if (parcelas <= 1) {
      result.push({ valor: r.valor, data: r.data, procedimento: r.procedimento });
    } else {
      // Padroniza parcelas: todas iguais; última absorve eventuais centavos de arredondamento.
      const totalCentavos = Math.round(r.valor * 100);
      const baseCentavos = Math.floor(totalCentavos / parcelas);
      const restoCentavos = totalCentavos - baseCentavos * parcelas;
      const baseDate = new Date(r.data + "T12:00:00");
      for (let i = 0; i < parcelas; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const cents = baseCentavos + (i === parcelas - 1 ? restoCentavos : 0);
        result.push({ valor: cents / 100, data: d.toISOString().split("T")[0], procedimento: r.procedimento });
      }
    }
  }
  return result;
}

export interface Despesa {
  id: string;
  descricao: string;
  // Categoria: padrão (aluguel, materiais...) ou personalizada (string livre).
  categoria: string;
  valor: number;
  data: string;
  tipo: 'fixa' | 'variavel';
}

export interface ProdutoEstoque {
  id: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  minimo: number;
  unidade: string;
}

export interface Atendimento {
  id: string;
  pacienteId: string;
  procedimento: string;
  observacoes: string;
  data: string;
  valor: number;
  realizado: boolean;
  formaPagamento?: 'dinheiro' | 'cartao' | 'pix' | 'convenio' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  observacoes: string;
  historicoMedico: string;
  retorno?: {
    data: string;
    tipo: string;
  };
  criadoEm: string;
}

export interface Agendamento {
  id: string;
  pacienteId: string | null; // null = compromisso pessoal (sem paciente)
  pacienteNome: string;
  procedimento: string;
  data: string;
  horaInicio: string;
  duracao: number; // minutes
  status: 'agendado' | 'em_atendimento' | 'realizado' | 'cancelado';
  pessoal?: boolean; // true = compromisso pessoal/bloqueio
}

export const pacientes: Paciente[] = [
  { id: 'p1', nome: 'Maria Silva', cpf: '123.456.789-00', dataNascimento: '1985-03-15', telefone: '(11) 99999-1111', email: 'maria@email.com', observacoes: 'Paciente com sensibilidade dental', historicoMedico: 'Alergia a dipirona', retorno: { data: '2026-04-15', tipo: '6 meses' }, criadoEm: '2025-10-01' },
  { id: 'p2', nome: 'João Santos', cpf: '987.654.321-00', dataNascimento: '1990-07-22', telefone: '(11) 99999-2222', email: 'joao@email.com', observacoes: '', historicoMedico: 'Diabético tipo 2', retorno: { data: '2026-03-20', tipo: '3 meses' }, criadoEm: '2025-09-15' },
  { id: 'p3', nome: 'Ana Oliveira', cpf: '456.789.123-00', dataNascimento: '1978-11-08', telefone: '(11) 99999-3333', email: 'ana@email.com', observacoes: 'Usa aparelho ortodôntico', historicoMedico: 'Hipertensa, usa losartana', retorno: { data: '2026-05-10', tipo: '3 meses' }, criadoEm: '2025-11-20' },
  { id: 'p4', nome: 'Carlos Lima', cpf: '321.654.987-00', dataNascimento: '1995-01-30', telefone: '(11) 99999-4444', email: 'carlos@email.com', observacoes: '', historicoMedico: 'Sem comorbidades', criadoEm: '2026-01-10' },
  { id: 'p5', nome: 'Fernanda Costa', cpf: '654.321.987-00', dataNascimento: '1982-06-12', telefone: '(11) 99999-5555', email: 'fernanda@email.com', observacoes: 'Medo de anestesia', historicoMedico: 'Alergia a penicilina', retorno: { data: '2026-04-05', tipo: '6 meses' }, criadoEm: '2025-08-05' },
  { id: 'p6', nome: 'Roberto Alves', cpf: '789.123.456-00', dataNascimento: '1970-09-25', telefone: '(11) 99999-6666', email: 'roberto@email.com', observacoes: 'Implante em andamento', historicoMedico: 'Cardíaco, usa aspirina', retorno: { data: '2026-04-20', tipo: '1 mês' }, criadoEm: '2026-02-15' },
  { id: 'p7', nome: 'Luciana Ferreira', cpf: '147.258.369-00', dataNascimento: '1988-04-18', telefone: '(11) 99999-7777', email: 'luciana@email.com', observacoes: 'Tratamento ortodôntico mensal', historicoMedico: 'Sem comorbidades', retorno: { data: '2026-05-07', tipo: '1 mês' }, criadoEm: '2025-12-01' },
  { id: 'p8', nome: 'Pedro Souza', cpf: '369.258.147-00', dataNascimento: '1965-12-03', telefone: '(11) 99999-8888', email: 'pedro@email.com', observacoes: 'Prótese total superior', historicoMedico: 'Diabético, hipertenso', criadoEm: '2025-07-20' },
];

export const atendimentos: Atendimento[] = [
  { id: 'a1', pacienteId: 'p1', procedimento: 'Limpeza', observacoes: 'Limpeza de rotina, gengiva saudável', data: '2026-04-01', valor: 250, realizado: true, formaPagamento: 'pix' },
  { id: 'a2', pacienteId: 'p2', procedimento: 'Restauração', observacoes: 'Restauração dente 36, resina composta', data: '2026-04-02', valor: 450, realizado: true, formaPagamento: 'cartao' },
  { id: 'a3', pacienteId: 'p3', procedimento: 'Canal', observacoes: 'Tratamento endodôntico dente 14, 3 canais', data: '2026-04-03', valor: 1200, realizado: true, formaPagamento: 'cartao' },
  { id: 'a4', pacienteId: 'p4', procedimento: 'Clareamento', observacoes: 'Clareamento de consultório com moldeira', data: '2026-04-04', valor: 800, realizado: true, formaPagamento: 'pix' },
  { id: 'a5', pacienteId: 'p5', procedimento: 'Extração', observacoes: 'Extração dente 38 (siso inferior esquerdo)', data: '2026-04-05', valor: 350, realizado: true, formaPagamento: 'dinheiro' },
  { id: 'a6', pacienteId: 'p6', procedimento: 'Implante', observacoes: 'Instalação de implante região 21', data: '2026-04-06', valor: 3500, realizado: true, formaPagamento: 'cartao' },
  { id: 'a7', pacienteId: 'p7', procedimento: 'Ortodontia', observacoes: 'Manutenção mensal do aparelho', data: '2026-04-07', valor: 600, realizado: true, formaPagamento: 'convenio' },
  { id: 'a8', pacienteId: 'p8', procedimento: 'Prótese', observacoes: 'Ajuste de prótese total superior', data: '2026-04-08', valor: 2200, realizado: true, formaPagamento: 'cartao' },
  { id: 'a9', pacienteId: 'p1', procedimento: 'Restauração', observacoes: 'Restauração preventiva dente 25', data: '2026-03-15', valor: 380, realizado: true, formaPagamento: 'pix' },
  { id: 'a10', pacienteId: 'p3', procedimento: 'Limpeza', observacoes: 'Limpeza pré-tratamento de canal', data: '2026-03-20', valor: 250, realizado: true, formaPagamento: 'cartao' },
  { id: 'a11', pacienteId: 'p6', procedimento: 'Consulta', observacoes: 'Avaliação para implante, radiografia panorâmica', data: '2026-03-25', valor: 150, realizado: true, formaPagamento: 'pix' },
  { id: 'a12', pacienteId: 'p2', procedimento: 'Limpeza', observacoes: 'Agendado para próxima semana', data: '2026-04-15', valor: 250, realizado: false },
];

export const agendamentos: Agendamento[] = [
  { id: 'ag1', pacienteId: 'p1', pacienteNome: 'Maria Silva', procedimento: 'Limpeza', data: '2026-04-10', horaInicio: '09:00', duracao: 60, status: 'agendado' },
  { id: 'ag2', pacienteId: 'p2', pacienteNome: 'João Santos', procedimento: 'Restauração', data: '2026-04-10', horaInicio: '10:00', duracao: 90, status: 'agendado' },
  { id: 'ag3', pacienteId: 'p3', pacienteNome: 'Ana Oliveira', procedimento: 'Ortodontia', data: '2026-04-10', horaInicio: '14:00', duracao: 45, status: 'agendado' },
  { id: 'ag4', pacienteId: 'p5', pacienteNome: 'Fernanda Costa', procedimento: 'Consulta', data: '2026-04-11', horaInicio: '08:00', duracao: 30, status: 'agendado' },
  { id: 'ag5', pacienteId: 'p6', pacienteNome: 'Roberto Alves', procedimento: 'Implante', data: '2026-04-11', horaInicio: '10:00', duracao: 120, status: 'agendado' },
  { id: 'ag6', pacienteId: 'p7', pacienteNome: 'Luciana Ferreira', procedimento: 'Ortodontia', data: '2026-04-12', horaInicio: '09:00', duracao: 60, status: 'agendado' },
];

export const receitas: Receita[] = [
  { id: '1', paciente: 'Maria Silva', pacienteId: 'p1', procedimento: 'Limpeza', valor: 250, formaPagamento: 'pix', data: '2026-04-01' },
  { id: '2', paciente: 'João Santos', pacienteId: 'p2', procedimento: 'Restauração', valor: 450, formaPagamento: 'cartao', data: '2026-04-02' },
  { id: '3', paciente: 'Ana Oliveira', pacienteId: 'p3', procedimento: 'Canal', valor: 1200, formaPagamento: 'cartao', data: '2026-04-03' },
  { id: '4', paciente: 'Carlos Lima', pacienteId: 'p4', procedimento: 'Clareamento', valor: 800, formaPagamento: 'pix', data: '2026-04-04' },
  { id: '5', paciente: 'Fernanda Costa', pacienteId: 'p5', procedimento: 'Extração', valor: 350, formaPagamento: 'dinheiro', data: '2026-04-05' },
  { id: '6', paciente: 'Roberto Alves', pacienteId: 'p6', procedimento: 'Implante', valor: 3500, formaPagamento: 'cartao', data: '2026-04-06' },
  { id: '7', paciente: 'Luciana Ferreira', pacienteId: 'p7', procedimento: 'Ortodontia', valor: 600, formaPagamento: 'convenio', data: '2026-04-07' },
  { id: '8', paciente: 'Pedro Souza', pacienteId: 'p8', procedimento: 'Prótese', valor: 2200, formaPagamento: 'cartao', data: '2026-04-08' },
  { id: '9', paciente: 'Juliana Martins', procedimento: 'Limpeza', valor: 250, formaPagamento: 'pix', data: '2026-04-09' },
  { id: '10', paciente: 'Marcos Ribeiro', procedimento: 'Restauração', valor: 500, formaPagamento: 'dinheiro', data: '2026-04-10' },
];

export const despesas: Despesa[] = [
  { id: '1', descricao: 'Aluguel do consultório', categoria: 'aluguel', valor: 3500, data: '2026-04-01', tipo: 'fixa' },
  { id: '2', descricao: 'Resina composta', categoria: 'materiais', valor: 450, data: '2026-04-02', tipo: 'variavel' },
  { id: '3', descricao: 'Salário recepcionista', categoria: 'funcionarios', valor: 2200, data: '2026-04-05', tipo: 'fixa' },
  { id: '4', descricao: 'Google Ads', categoria: 'marketing', valor: 800, data: '2026-04-03', tipo: 'variavel' },
  { id: '5', descricao: 'Luvas descartáveis', categoria: 'materiais', valor: 180, data: '2026-04-04', tipo: 'variavel' },
  { id: '6', descricao: 'Manutenção autoclave', categoria: 'equipamentos', valor: 600, data: '2026-04-06', tipo: 'variavel' },
  { id: '7', descricao: 'Conta de luz', categoria: 'outros', valor: 350, data: '2026-04-07', tipo: 'fixa' },
  { id: '8', descricao: 'Anestésicos', categoria: 'materiais', valor: 320, data: '2026-04-08', tipo: 'variavel' },
];

export const estoque: ProdutoEstoque[] = [
  { id: '1', nome: 'Resina Composta', quantidade: 25, custoUnitario: 45, minimo: 10, unidade: 'un' },
  { id: '2', nome: 'Anestésico Lidocaína', quantidade: 50, custoUnitario: 8, minimo: 20, unidade: 'tubetes' },
  { id: '3', nome: 'Luvas Descartáveis', quantidade: 5, custoUnitario: 35, minimo: 10, unidade: 'cx' },
  { id: '4', nome: 'Agulha Gengival', quantidade: 100, custoUnitario: 1.5, minimo: 30, unidade: 'un' },
  { id: '5', nome: 'Fio de Sutura', quantidade: 15, custoUnitario: 12, minimo: 5, unidade: 'un' },
  { id: '6', nome: 'Cimento Ionômero', quantidade: 8, custoUnitario: 65, minimo: 5, unidade: 'un' },
  { id: '7', nome: 'Máscara Descartável', quantidade: 3, custoUnitario: 25, minimo: 8, unidade: 'cx' },
  { id: '8', nome: 'Broca Diamantada', quantidade: 40, custoUnitario: 6, minimo: 15, unidade: 'un' },
];

export const faturamentoMensal = [
  { mes: 'Jan', receita: 28500, despesa: 12400 },
  { mes: 'Fev', receita: 32100, despesa: 11800 },
  { mes: 'Mar', receita: 29800, despesa: 13200 },
  { mes: 'Abr', receita: 35200, despesa: 12900 },
  { mes: 'Mai', receita: 31400, despesa: 11500 },
  { mes: 'Jun', receita: 38700, despesa: 14100 },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const categoriaDespesaLabels: Record<string, string> = {
  aluguel: 'Aluguel',
  materiais: 'Materiais',
  funcionarios: 'Funcionários',
  marketing: 'Marketing',
  equipamentos: 'Equipamentos',
  outros: 'Outros',
};

export const formaPagamentoLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  cartao: 'Cartão',
  pix: 'PIX',
  convenio: 'Convênio',
  transferencia: 'Transferência',
};

export const getPacientesParaRetorno = () => {
  const hoje = new Date();
  return pacientes.filter((p) => {
    if (!p.retorno) return false;
    const dataRetorno = new Date(p.retorno.data);
    const diffDays = Math.ceil((dataRetorno.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays >= -30;
  });
};

export const getAtendimentosPaciente = (pacienteId: string) =>
  atendimentos.filter((a) => a.pacienteId === pacienteId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

export const getReceitaPaciente = (pacienteId: string) =>
  atendimentos.filter((a) => a.pacienteId === pacienteId && a.realizado).reduce((sum, a) => sum + a.valor, 0);
