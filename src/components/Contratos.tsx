import { useState, useMemo } from "react";
import { Plus, FileText, Edit, Trash2, Copy, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useContratosDB, type Contrato } from "@/hooks/useSupabaseData";
import type { Paciente } from "@/lib/mockData";

const TEMPLATES: Record<string, { nome: string; conteudo: string }> = {
  toxina: {
    nome: "TCLE - Toxina Botulínica",
    conteudo: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
Toxina Botulínica - Botox

Eu, {{NOME_PACIENTE}}, brasileiro(a), inscrito(a) no CPF sob o nº {{CPF_PACIENTE}}, telefone nº {{TELEFONE_PACIENTE}}, autorizo e declaro que serei atendido(a) pelo(a) Dr(a). Giovana Cabral Chaves, devidamente inscrito(a) no conselho de Odontologia, sob o nº 25.882, no procedimento de aplicação de toxina botulínica.

Definição: O procedimento de aplicação de toxina botulínica, também conhecido como Botox, consiste na injeção de pequenas quantidades do produto diretamente nos músculos da área tratada, bloqueando os sinais nervosos que fazem com que os músculos se contraiam, permitindo o relaxamento, o estiramento e a paralização muscular.

Indicação: A aplicação de toxina botulínica é indicada para o tratamento de rugas e linhas de expressão, o qual injetado diretamente nos músculos faciais, reduz a atividade muscular, suavizando as rugas dinâmicas formadas pela movimentação do rosto. O procedimento é rápido e geralmente leva cerca de 15 minutos para ser concluído. Os resultados do procedimento começam a aparecer dentro de alguns dias após o procedimento e podem durar até seis meses, dependendo da área tratada e das características individuais do paciente.

O profissional responsável pela aplicação irá selecionar as propriedades dos materiais e a quantidade a ser utilizada, levando em consideração a avaliação prévia e as necessidades estéticas individuais do paciente, respeitando os limites anatômicos, a indicação, profundidade e a quantidade permitida na região a ser tratada. Pode ser necessário mais de uma sessão para o alcance do resultado desejado, sendo importante seguir as orientações do profissional para garantir a eficácia do tratamento e a segurança do paciente.

Riscos e complicações: Declaro estar plenamente ciente de que o procedimento a ser realizado, como qualquer procedimento minimamente invasivo, traz a possibilidade de ocorrência de riscos, complicações e efeitos colaterais. Entendo que o sucesso e os resultados mais satisfatórios do tratamento dependem também dos procedimentos de limpeza, assepsia e do cumprimento das instruções indicadas pelo profissional antes e depois do procedimento. Estou ciente de que posso sentir efeitos temporários nos dias seguintes ao procedimento, que podem variar de acordo com minha composição corporal e com a área tratada.

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive estou ciente dos riscos e complicações do procedimento:

• Dor e hematomas no local da aplicação;
• Vermelhidão, inchaço e coceira na área tratada;
• Ptose palpebral (queda temporária da pálpebra superior);
• Dor de cabeça;
• Reações alérgicas.

Impedimentos e Contraindicações: Estão impedidos de realizar o procedimento de aplicação de toxina botulínica, os seguintes casos:

• Gravidas e lactantes;
• Pessoas com infecções ativas na região da face ou no organismo;
• Pessoas que fazem o uso frequente de algum dos seguintes medicamentos ou seus semelhantes: ácido acetil salicílico, ibuprofeno, anti-inflamatórios e/ou medicações que comprometam a coagulação sanguínea;
• Portadores de doenças neuromusculares, como esclerose lateral amiotrófica (ELA), miastenia grave e síndrome de Lambert-Eaton;
• Alérgicos à toxina botulínica ou a qualquer componente da fórmula do produto;

Declaro estar ciente das restrições e contraindicações referentes ao procedimento em questão e afirmo não me enquadrar em nenhuma dessas situações.

Cuidados Gerais:

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive para fins de minimizar a incidência dos riscos descritos, sendo necessário seguir alguns cuidados, tais como:

• Evitar o uso de medicamentos que podem aumentar o risco de hematomas no local da aplicação, como: aspirina, anti-inflamatórios e suplementos de vitamina E;
• Evitar a exposição ao sol ou fazer bronzeamento artificial, visto que poderá ocasionar manchas e pigmentação na pele;
• Evitar o consumo de bebidas alcoólicas e tabaco;
• Evitar fazer uso de produtos químicos na região a ser tratada, como cremes loções ou maquiagem.

Declaro que recebi todas as orientações necessárias sobre os cuidados pré e pós-procedimento e tive a oportunidade de esclarecer todas as minhas dúvidas. Estou plenamente ciente e informado(a) sobre os cuidados que devo tomar após o procedimento e entendo que minha colaboração é essencial para minimizar quaisquer riscos e garantir uma recuperação segura e eficaz.

Estou ciente de que, para execução do procedimento acima especificado, poderá ser necessária a realização de procedimento anestésico ou outro de caráter pré-procedimental.

Declaro que preenchi e assinei corretamente a ficha anamnese e prontuário, sem omitir ou suprimir qualquer informação sobre doenças, tratamentos ou condições pré-existentes que eu tenha conhecimento. Concordo com a realização do procedimento apresentado e estou ciente dos resultados, contraindicações, reações adversas e cuidados pré e pós-procedimento. Declaro, ainda, que me foi dada a oportunidade de fazer perguntas ao profissional a fim de sanar dúvidas sobre o procedimento, as quais foram respondidas satisfatoriamente pelo(a) profissional.

Estou ciente de que, em caso de algum sintoma indesejável devo comunicar imediatamente a parte CONTRATADA, o(a) profissional responsável ou alguém por ela indicada, ciente ainda de que é possível, a qualquer momento antes do procedimento, revogar o meu consentimento, o que, caso deseje, farei neste mesmo documento.

Declaro que qualquer omissão de informação não declarada por mim e que venha trazer qualquer tipo de complicação durante e após o procedimento, ISENTA a responsabilidade da parte CONTRATADA quanto a estes efeitos.

Por fim, declaro que, além dos fatores mencionados acima, fui informado(a) que, assim como todos os procedimentos de saúde, existe um risco de insucesso no tratamento onde o resultado esperado pode não se concretizar. Isso pode ocorrer devido a fatores individuais, como a resposta biológica, fisiológica, bioquímica ou anatômica, limitações da ciência, além de outras variações locais ou sistêmicas.

Declaro estar ciente que o presente TCLE poderá ser arquivado de modo digital, não sendo necessária apresentação da via física para comprovação de autenticidade.

Portanto, aceito e autorizo a execução do tratamento, comprometendo-me a seguir rigorosamente as orientações do profissional. Declaro estar ciente e assino o presente termo de consentimento livre e esclarecido.

Florianópolis, ___ de ________________ de 20____.

Ass.____________________________________________
Paciente: {{NOME_PACIENTE}}
CPF nº: {{CPF_PACIENTE}}`,
  },
  acido: {
    nome: "TCLE - Ácido Hialurônico",
    conteudo: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
Ácido Hialurônico Reticulado

Eu, {{NOME_PACIENTE}}, brasileiro(a), inscrito(a) no CPF sob o nº {{CPF_PACIENTE}}, telefone nº {{TELEFONE_PACIENTE}}, autorizo e declaro que serei atendido(a) pelo(a) Dr(a). Giovana Cabral Chaves, devidamente inscrito(a) no conselho de Odontologia, sob o nº 25.882, no procedimento de preenchimento facial com ácido hialurônico reticulado.

Definição: O procedimento consiste na injeção intradérmica, subdérmica, subcutânea ou supraperiósteo de ácido hialurônico reticulado, produto biocompatível, biodegradável e reabsorvível pelo organismo humano, na região planejada no plano de tratamento, respeitando os limites anatômicos, a indicação, profundidade e a quantidade permitida na região a ser tratada. O efeito de preenchimento pode durar de 3 a 12 meses, dependendo do volume injetado, metabolismo individual, condições sistêmicas, tipo de preenchimento e grau de contração muscular do paciente.

Indicação: O ácido hialurônico é uma substância naturalmente presente no corpo humano, que auxilia a hidratação da pele, conferindo-lhe elasticidade e firmeza. Quando injetado, o ácido preenche o espaço entre as células, trazendo um efeito preenchedor, suavizando as rugas, sulcos, vincos e linhas de expressão na face, além de aumentar o volume de áreas como lábios, maçãs do rosto e queixo, proporcionando um resultado imediato e duradouro. O produto injetado leva cerca de 30 dias para se acomodar e ser parcialmente absorvido nos tecidos, promovendo hidratação local durante esse período.

O profissional responsável pela aplicação selecionará a viscosidade e a quantidade a ser utilizada, levando em consideração as condições anatômicas de cada paciente.

Riscos e complicações: Declaro estar plenamente ciente de que o procedimento a ser realizado, como qualquer procedimento minimamente invasivo, traz a possibilidade de ocorrência de riscos, complicações e efeitos colaterais. Entendo que o sucesso e os resultados mais satisfatórios do tratamento dependem também dos procedimentos de limpeza, assepsia e do cumprimento das instruções indicadas pelo profissional antes e após o procedimento. Estou ciente de que posso sentir efeitos temporários nos dias seguintes ao procedimento, que podem variar de acordo com minha composição corporal e com a área tratada.

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive estou ciente dos riscos e complicações do procedimento:

• Inchaço, vermelhidão, equimose (roxo) e coceira na região tratada;
• Irregularidades na superfície da pele e formação de nódulos;
• Desconforto local, principalmente nos primeiros dias após o procedimento;
• Inflamação na região tratada, que pode causar febre e dor intensa;
• Obstrução vascular e reações alérgicas ao ácido hialurônico;
• Assimetria facial temporária;

Estou ciente também, que em casos de herpes recorrente, é possível que a inflamação gerada pelo preenchimento reative o vírus. No que se refere aos nódulos e assimetria temporária, estes podem ocorrer devido à má distribuição do material de preenchimento, à reação do produto (incluindo inflamação, hipersensibilidade ou reação granulomatosa) ou infecção. O nódulo, em sua grande maioria, é palpável e não visível, podendo ser observada logo após o procedimento ou vários meses depois (início tardio), sendo que, em todos os casos, pode ser tratado ou revertido.

Impedimentos e Contraindicações: Estão impedidos de realizar o procedimento de preenchimento facial com ácido hialurônico reticulado:

• Gravidas e lactantes;
• Portadores de infecções ativas na região da face ou no organismo;
• Pessoas com tendência ou histórico de cicatrização hipertrófica ou queloides;
• Usuário frequente de algum dos seguintes medicamentos ou seus semelhantes: ácido acetil salicílico, ibuprofeno, anti-inflamatórios e/ou medicações que comprometam a coagulação sanguínea;
• Portadores de doenças autoimunes ou imunodepressão, bem como distúrbios de coagulação sanguínea;
• Portador de doença neuromuscular, como esclerose lateral amiotrófica (ELA), miastenia grave e síndrome de Lambert-Eaton;
• Alérgicos ao ácido hialurônico ou qualquer componente da fórmula do produto;
• Pessoas que apresentam lesões pré-cancerígenas ou cancerígenas na região onde o preenchimento é planejado;

Declaro estar ciente das restrições e contraindicações referentes ao procedimento em questão e afirmo não me enquadrar em nenhuma dessas situações.

Cuidados Gerais:

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive para fins de minimizar a incidência dos riscos descritos, é necessário seguir alguns cuidados, sendo exposto pelo(a) profissional:

• Aplicar gelo ou compressa fria (várias aplicações) nas áreas injetadas por 10 minutos a cada vez nas primeiras 24 horas, sem apertar intensamente o local;
• Evitar o uso de medicamentos que podem aumentar o risco de sangramento no local da aplicação, como: aspirina, anti-inflamatórios e suplementos de vitamina E;
• Evitar a exposição ao sol ou fazer bronzeamento artificial, visto que poderá ocasionar manchas e pigmentação na pele;
• Evitar o consumo de bebidas alcoólicas e tabaco;
• Evitar fazer uso de produtos químicos na região a ser tratada, como cremes loções ou maquiagem;
• Evitar praticar exercícios físicos, bem como, esfregar, coçar ou massagear a região por 24 horas;
• No caso de preenchimento labial, evitar beijar, fumar, usar canudo, batom ou maquiagem pelas próximas 72h;
• Aplicar gelo ou compressa fria (várias aplicações) nas áreas injetadas conforme orientação.

Declaro que recebi todas as orientações necessárias sobre os cuidados pré e pós-procedimento e tive a oportunidade de esclarecer todas as minhas dúvidas. Estou plenamente ciente e informado(a) sobre os cuidados que devo tomar após o procedimento e entendo que minha colaboração é essencial para minimizar quaisquer riscos e garantir uma recuperação segura e eficaz.

Estou ciente de que, para execução do procedimento acima especificado, poderá ser necessária a realização de procedimento anestésico ou outro de caráter pré-procedimental.

Declaro que preenchi e assinei corretamente a ficha anamnese e prontuário, sem omitir ou suprimir qualquer informação sobre doenças, tratamentos ou condições pré-existentes que eu tenha conhecimento. Concordo com a realização do procedimento apresentado e estou ciente dos resultados, contraindicações, reações adversas e cuidados pré e pós-procedimento. Declaro, ainda, que me foi dada a oportunidade de fazer perguntas ao profissional a fim de sanar dúvidas sobre o procedimento, as quais foram respondidas satisfatoriamente pelo(a) profissional.

Estou ciente de que, em caso de algum sintoma indesejável devo comunicar imediatamente a parte CONTRATADA, o(a) profissional responsável ou alguém por ela indicada, ciente ainda de que é possível, a qualquer momento antes do procedimento, revogar o meu consentimento, o que, caso deseje, farei neste mesmo documento.

Declaro que qualquer omissão de informação não declarada por mim e que venha trazer qualquer tipo de complicação durante e após o procedimento, ISENTA a responsabilidade da parte CONTRATADA quanto a estes efeitos.

Por fim, declaro que, além dos fatores mencionados acima, fui informado(a) que, assim como todos os procedimentos de saúde, existe um risco de insucesso no tratamento onde o resultado esperado pode não se concretizar. Isso pode ocorrer devido a fatores individuais, como a resposta biológica, fisiológica, bioquímica ou anatômica, limitações da ciência, além de outras variações locais ou sistêmicas.

Declaro estar ciente que o presente TCLE poderá ser arquivado de modo digital, não sendo necessária apresentação da via física para comprovação de autenticidade.

Portanto, aceito e autorizo a execução do tratamento, comprometendo-me a seguir rigorosamente as orientações do profissional. Declaro estar ciente e assino o presente termo de consentimento livre e esclarecido.

Florianópolis, ___ de ________________ de 20____.

Ass.____________________________________________
Paciente: {{NOME_PACIENTE}}
CPF nº: {{CPF_PACIENTE}}`,
  },
  bioestimuladores: {
    nome: "TCLE - Bioestimuladores de Colágeno",
    conteudo: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
Bioestimuladores de Colágeno

Eu, {{NOME_PACIENTE}}, brasileiro(a), inscrito(a) no CPF sob o nº {{CPF_PACIENTE}}, telefone nº {{TELEFONE_PACIENTE}}, autorizo e declaro que serei atendido(a) pelo(a) Dr(a). Giovana Cabral Chaves, devidamente inscrito(a) no conselho de Odontologia, sob o nº 25.882, no procedimento de aplicação de bioestimuladores de colágeno.

Definição: O uso de bioestimuladores de colágeno é um procedimento que consiste na aplicação de injeções nas camadas intradérmica, subdérmica, subcutânea ou supraperiósteo da pele, conforme Plano de Tratamento. Essas injeções são compostas por Hidroxiapatita de Cálcio, Ácido Polilático (PLLA), Policaprolactona ou Aesthefil - Ácido poli D-láctico (PDLLA), produtos biocompatíveis, biodegradáveis e reabsorvíveis pelo organismo humano.

Indicação: A Hidroxiapatita de Cálcio é um componente natural do organismo que, quando injetada na pele, estimula a produção de colágeno, melhorando a sua qualidade, trazendo efeito lifting e de contorno. O Ácido Polilático (PLLA) é um polímero sintético do ácido lático, que ativa a bioestimulação de colágeno tipo I, sendo também utilizado na volumização, preenchimento facial e tratamento de flacidez da face e corpo. A Policaprolactona é utilizada para preencher e corrigir assimetrias e definir contornos faciais, como a linha da mandíbula e maçãs do rosto, estimulando, também, a produção de colágeno, resultando em uma aparência hidratada, macia e com maior sustentação do tecido da pele. O Aesthefil - Ácido poli D-láctico (PDLLA), é um polímero indicado para melhora da atrofia cutânea através do estímulo contínuo do colágeno da pele, bem como a correção das depressões faciais decorrentes dela. Ambos têm efeito por tempo indeterminado, podendo a produção de colágeno perdurar por até 18 meses.

O profissional responsável pela aplicação irá selecionar as propriedades dos materiais e a quantidade a ser utilizada, levando em consideração a avaliação prévia e as necessidades estéticas individuais do paciente, respeitando os limites anatômicos, a indicação, profundidade e a quantidade permitida na região a ser tratada. Via de regra, são necessárias mais de uma sessão para o alcance do resultado desejado, sendo importante seguir as orientações do profissional para garantir a eficácia do tratamento e a segurança do paciente.

Riscos e complicações: Declaro estar plenamente ciente de que o procedimento a ser realizado, como qualquer procedimento minimamente invasivo, traz a possibilidade de ocorrência de riscos, complicações e efeitos colaterais. Entendo que o sucesso e os resultados mais satisfatórios do tratamento dependem também dos procedimentos de limpeza, assepsia e do cumprimento das instruções indicadas pelo profissional antes e depois do procedimento. Estou ciente de que posso sentir efeitos temporários nos dias seguintes ao procedimento, que podem variar de acordo com minha composição corporal e com a área tratada.

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive estou ciente dos riscos e complicações do procedimento:

• Inchaço e vermelhidão no local da aplicação;
• Sensibilidade ou desconforto no local da aplicação;
• Hematomas ou sangramento no local da aplicação;
• Irritação ou reações alérgicas à substância;
• Inflamação, formação de nódulos ou granulomas no local da aplicação;
• Deslocamento ou migração do produto para outras áreas do corpo;
• Desenvolvimento de celulite ou fibrose no local da aplicação.

Impedimentos e Contraindicações: Estão impedidos de realizar o procedimento de aplicação de bioestimuladores de colágeno, os seguintes casos:

• Gravidas e lactantes;
• Portadores de infecções ativas no local da aplicação ou no organismo;
• Pessoas com tendências ou histórico de doenças inflamatórias crônicas, distúrbios de coagulação, hemorragias, cicatrização hipertrófica ou queloides;
• Pessoas com doenças de pele ativas, como acne ou dermatite;
• Pessoas portadoras de doenças sistêmicas não controladas, como diabetes ou hipertensão;
• Pessoas com histórico de hipersensibilidade ou alérgica às substâncias utilizadas no procedimento;
• Portadores de doenças autoimunes ou imunodepressão, bem como distúrbios de coagulação sanguínea;

Declaro estar ciente das restrições e contraindicações referentes ao procedimento em questão e afirmo não me enquadrar em nenhuma dessas situações.

Cuidados Gerais:

Me foi esclarecido que minha colaboração é essencial ao sucesso do procedimento, inclusive para fins de minimizar a incidência dos riscos descritos, é necessário seguir alguns cuidados, sendo exposto pelo(a) profissional:

• Evitar a exposição ao sol ou fazer bronzeamento artificial, visto que poderá ocasionar manchas e pigmentação na pele;
• Evitar o consumo de bebidas alcoólicas e tabaco;
• Evitar fazer uso de produtos químicos na região a ser tratada, como cremes loções ou maquiagem;
• Realizar a limpeza de pele na região a ser tratada, no dia do procedimento, para remover sujidades e impurezas e evitar infecções;
• Evitar praticar exercícios físicos por 24 horas;

Declaro que recebi todas as orientações necessárias sobre os cuidados pré e pós-procedimento e tive a oportunidade de esclarecer todas as minhas dúvidas. Estou plenamente ciente e informado(a) sobre os cuidados que devo tomar após o procedimento e entendo que minha colaboração é essencial para minimizar quaisquer riscos e garantir uma recuperação segura e eficaz.

Estou ciente de que, para execução do procedimento acima especificado, poderá ser necessária a realização de procedimento anestésico ou outro de caráter pré-procedimental.

Declaro que preenchi e assinei corretamente a ficha anamnese e prontuário, sem omitir ou suprimir qualquer informação sobre doenças, tratamentos ou condições pré-existentes que eu tenha conhecimento. Concordo com a realização do procedimento apresentado e estou ciente dos resultados, contraindicações, reações adversas e cuidados pré e pós-procedimento. Declaro, ainda, que me foi dada a oportunidade de fazer perguntas ao profissional a fim de sanar dúvidas sobre o procedimento, as quais foram respondidas satisfatoriamente pelo(a) profissional.

Estou ciente de que, em caso de algum sintoma indesejável devo comunicar imediatamente a parte CONTRATADA, o(a) profissional responsável ou alguém por ela indicada, ciente ainda de que é possível, a qualquer momento antes do procedimento, revogar o meu consentimento, o que, caso deseje, farei neste mesmo documento.

Declaro que qualquer omissão de informação não declarada por mim e que venha trazer qualquer tipo de complicação durante e após o procedimento, ISENTA a responsabilidade da parte CONTRATADA quanto a estes efeitos.

Por fim, declaro que, além dos fatores mencionados acima, fui informado(a) que, assim como todos os procedimentos de saúde, existe um risco de insucesso no tratamento onde o resultado esperado pode não se concretizar. Isso pode ocorrer devido a fatores individuais, como a resposta biológica, fisiológica, bioquímica ou anatômica, limitações da ciência, além de outras variações locais ou sistêmicas.

Declaro estar ciente que o presente TCLE poderá ser arquivado de modo digital, não sendo necessária apresentação da via física para comprovação de autenticidade.

Portanto, aceito e autorizo a execução do tratamento, comprometendo-me a seguir rigorosamente as orientações do profissional. Declaro estar ciente e assino o presente termo de consentimento livre e esclarecido.

Florianópolis, ___ de ________________ de 20____.

Ass.____________________________________________
Paciente: {{NOME_PACIENTE}}
CPF nº: {{CPF_PACIENTE}}`,
  },
  personalizado: {
    nome: "Contrato Personalizado",
    conteudo: `CONTRATO

Paciente: {{NOME_PACIENTE}}
CPF: {{CPF_PACIENTE}}
Data: {{DATA_ATUAL}}

[Insira o conteúdo do contrato aqui]

_________________________________
{{NOME_PACIENTE}}

_________________________________
Profissional Responsável`,
  },
};

function preencherTemplate(conteudo: string, paciente: Paciente): string {
  const hoje = new Date().toLocaleDateString("pt-BR");
  return conteudo
    .replace(/\{\{NOME_PACIENTE\}\}/g, paciente.nome)
    .replace(/\{\{CPF_PACIENTE\}\}/g, paciente.cpf || "Não informado")
    .replace(/\{\{EMAIL_PACIENTE\}\}/g, paciente.email || "Não informado")
    .replace(/\{\{TELEFONE_PACIENTE\}\}/g, paciente.telefone || "Não informado")
    .replace(/\{\{DATA_NASCIMENTO\}\}/g, paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString("pt-BR") : "—")
    .replace(/\{\{DATA_ATUAL\}\}/g, hoje);
}

interface ContratosProps {
  pacienteId: string;
  paciente: Paciente;
}

const Contratos = ({ pacienteId, paciente }: ContratosProps) => {
  const { contratos, addContrato, updateContrato, deleteContrato } = useContratosDB(pacienteId);
  const [openNew, setOpenNew] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("toxina");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const tpl = TEMPLATES[key];
    if (tpl) {
      setTitulo(tpl.nome);
      setConteudo(preencherTemplate(tpl.conteudo, paciente));
    }
  };

  const handleOpenNew = () => {
    setEditingContrato(null);
    handleSelectTemplate("toxina");
    setOpenNew(true);
  };

  const handleEdit = (c: Contrato) => {
    setEditingContrato(c);
    setTitulo(c.titulo);
    setConteudo(c.conteudo);
    setOpenNew(true);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (editingContrato) {
      await updateContrato(editingContrato.id, { titulo, conteudo });
      toast.success("Contrato atualizado!");
    } else {
      await addContrato({
        pacienteId,
        titulo,
        conteudo,
        templateNome: selectedTemplate,
      });
      toast.success("Contrato criado!");
    }
    setOpenNew(false);
  };

  const handleDelete = async (id: string) => {
    await deleteContrato(id);
    toast.info("Contrato removido.");
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado!");
  };

  const handleGerarPDF = (c: Contrato) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(c.titulo, pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${paciente.nome}`, margin, y);
    y += 6;
    doc.text(`Data: ${new Date(c.criadoEm).toLocaleDateString("pt-BR")}`, margin, y);
    y += 10;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(c.conteudo, maxWidth);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    doc.save(`${c.titulo.replace(/\s+/g, "_")}_${paciente.nome.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF gerado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Contratos</h3>
        <Button size="sm" onClick={handleOpenNew} className="gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      {contratos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Nenhum contrato criado</p>
          <p className="text-xs mt-1">Clique em "Novo Contrato" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contratos.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-4 card-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-heading font-semibold">{c.titulo}</h4>
                    <Badge variant="secondary" className="text-xs">{c.templateNome}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGerarPDF(c)} title="Gerar PDF">
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyText(c.conteudo)} title="Copiar texto">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)} title="Editar">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 p-3 rounded bg-muted/50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-xs leading-relaxed">
                {c.conteudo.substring(0, 500)}{c.conteudo.length > 500 ? "..." : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New/Edit contract dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingContrato ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editingContrato && (
              <div>
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATES).map(([key, tpl]) => (
                      <SelectItem key={key} value={key}>{tpl.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome do contrato" />
            </div>
            <div>
              <Label>Conteúdo do contrato</Label>
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={18}
                className="font-mono text-sm leading-relaxed"
                placeholder="Texto do contrato..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Os dados do paciente foram preenchidos automaticamente. Edite conforme necessário.
              </p>
            </div>
            <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
              {editingContrato ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;
