/* ===== 33 · Contratos oficiais (b159) =====
   Texto oficial dos contratos da escola (turmas e VIP), fornecido pela direção em 03/08/2026.
   ⚠️ O texto das cláusulas é jurídico e deve permanecer EXATAMENTE como está — só a direção altera.
   O que o app preenche são os dados variáveis: partes, quadro, remuneração, local/data e portal. */

const _CT_TIT='CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS – IDIOMA ESTRANGEIRO';
const _CT_ESCOLA='<b>CONTRATADA/ESCOLA:</b> THE CHOICE CENTRO DE IDIOMAS LTDA., CNPJ n. 14.621.475/0001-00, com sede na cidade de Gravataí, RS, na Rua Pompílio Gomes, 229, neste ato representado na forma de seu Contrato Social, e-mail: atendimento@togethere.com.br.';
const _CT_FECHO='E, estando de acordo, as partes firmam este contrato em duas vias de igual teor e forma, obrigando-se por si, seus herdeiros e sucessores, elegendo o foro da Comarca de Gravataí para dirimir as questões que dele derivem.';

/* ---- Cláusulas comuns aos dois contratos (texto idêntico nos dois PDFs oficiais) ---- */
const _CT_LOCAL='<b>LOCAL.</b> O local das atividades, na modalidade presencial, é o endereço da ESCOLA e, na modalidade on-line, por meio de plataforma de reuniões virtuais que será indicada previamente pela ESCOLA ao ALUNO.\n<b>Parágrafo único.</b> As aulas online serão realizadas pela plataforma escolhida pela ESCOLA. O uso da plataforma para as aulas não terá custo adicional ao ALUNO. A aula poderá ser síncrona ou assíncrona, à escolha da ESCOLA.';
const _CT_CONDUTA='O CONTRATANTE e o ALUNO deverão observar a conduta e os princípios éticos, morais, disciplinares e de respeito às normas de boa convivência coletiva necessários ao pleno desenvolvimento do processo educacional almejado.';
const _CT_VINCULO='<b>VÍNCULO EXCLUSIVO COM A ESCOLA.</b> O CONTRATANTE e o ALUNO declaram que utilizarão os materiais e metodologias exclusivamente para os fins deste contrato, bem como que não possuem vínculo de qualquer natureza com outra empresa com atividades similares às da ESCOLA.';
const _CT_EQUIPE='<b>EQUIPE.</b> As aulas serão ministradas por quaisquer dos professores integrantes da equipe da ESCOLA, à escolha e conforme a programação interna desta.';
const _CT_REMUN='<b>REMUNERAÇÃO.</b> Em contraprestação à prestação de serviço convencionada, o CONTRATANTE pagará à Escola o montante previsto no quadro resumo.\n<b>§1º.</b> Caso não ocorra o pagamento, o valor devido (que é o principal, multa de 2% sobre a parcela, atualização pelo IGP-M/FGV e juros de 1% ao mês) será inserido em boleto bancário, cujo não pagamento ensejará os apontamentos devidos, inclusive em cadastros de inadimplentes e acarretará as cobranças cabíveis, sendo que, caso a cobrança venha a ser realizada por advogado/empresa de cobrança, será acrescentado o percentual de 20% para remuneração do trabalho do referido profissional. Caso tenha que ocorrer a baixa de apontamentos ou protestos, isso deverá ser providenciado e custeado pelo CONTRATANTE e a ESCOLA se compromete a emitir o comprovante de pagamento após a confirmação do efetivo ingresso do crédito no seu caixa, no prazo de até 03 (três) dias úteis a contar da solicitação, o qual ficará à disposição do CONTRATANTE para retirada no setor financeiro da ESCOLA.\n<b>§2º.</b> Não está incluído no valor a ser pago à ESCOLA, indicado no quadro resumo, o fornecimento de livros, apostilas e qualquer outro material didático de uso individual, exceto aquele que, sendo de uso obrigatório, faça parte do acervo disponibilizado gratuitamente pela ESCOLA em razão de sua prática pedagógica.\n<b>§3º.</b> Os boletos serão fornecidos presencialmente ao CONTRATANTE ou ao ALUNO ou enviados ao endereço eletrônico fornecido pelo CONTRATANTE na sua qualificação, constante neste contrato.';
const _CT_DESCONTOS='<b>DESCONTOS/PROMOÇÕES.</b> Eventuais descontos, promoções ou assemelhados, caso cabíveis, serão especificados no quadro deste contrato. Caso incidam, não poderão ser aplicados cumulativamente com outros e tampouco serão incorporados à relação entre as partes, valendo apenas para o período ou condição especificados no quadro.';
const _CT_PRAZO='<b>PRAZO.</b> Este contrato tem prazo de vigência por um ano letivo a contar da data aposta no quadro, conforme calendário da ESCOLA.\n<b>Parágrafo único.</b> Após o término do prazo, não havendo manifestação expressa no sentido da continuidade da prestação de serviços ora contratada, o contrato será considerado extinto.';
const _CT_TEMATICAS='<b>ATIVIDADES ESPECÍFICAS/TEMÁTICAS.</b> No decorrer do período contratado poderão ser ministradas aulas interativas temáticas, tendo como objetivo fomentar a prática do idioma por meios lúdicos (por exemplo, culinária, datas típicas tanto no Brasil quanto nos países do idioma escolhido), sendo que isso será especificado no calendário e avisado caso demande alguma providência do ALUNO, como, por exemplo, indumentária, envio de materiais ou de produtos que serão utilizados em atividades, o que deverá ser providenciado pelo CONTRATANTE ao tempo e modos devidos, sob pena de comprometer o objetivo da proposta pedagógica.';
const _CT_EXTRAS='<b>ATIVIDADES EXTRAS.</b> Eventuais atividades extras, assim consideradas aquelas que não estejam previstas no calendário e carga horária programados e contratados, deverão ser pagas de modo apartado pelo CONTRATANTE.';
const _CT_DADOS='<b>TRATAMENTO DE DADOS.</b> Para realização do serviço, a ESCOLA terá acesso às informações do CONTRATANTE e do ALUNO que estejam envolvidas nas atividades relacionadas com os serviços a serem prestados.\n<b>§1º.</b> A ESCOLA submete-se ao cumprimento dos deveres e obrigações referentes à proteção de dados pessoais e se obriga a tratar os dados pessoais coletados do CONTRATANTE e do ALUNO de acordo com a legislação vigente aplicável, incluindo, mas não se limitando à Lei nº 12.965, de 23 de abril de 2014 e Decreto nº 8.771, de 11 de maio de 2016 (“Marco Civil da Internet”) e Lei nº 13.709, de 14 de agosto de 2018 (“Lei Geral de Proteção de Dados” ou “LGPD”), no que couber e conforme aplicável.\n<b>§2º.</b> O tratamento dos dados coletados possui como finalidade garantir a prestação dos serviços objeto do Contrato através da execução de diferentes atos, tais como: matrícula/renovação da matrícula do ALUNO; presenças em aula, processamento de pagamentos e emissão de certificados, históricos, relatórios de notas e afins.\n<b>§3º.</b> Os dados serão arquivados e utilizados pelo tempo necessário ao atendimento das diferentes finalidades, tanto ao atendimento dos controles internos da ESCOLA e que envolvem a sua responsabilidade, quanto ao atendimento dos interesses pedagógicos do próprio ALUNO. Maiores especificações sobre como e por quanto tempo a ESCOLA utiliza os dados pessoais coletados, assim como sobre ferramentas disponíveis para o exercício dos direitos dos titulares de dados pessoais previstos em lei, estão disponíveis na política de privacidade da ESCOLA.\n<b>§4º.</b> Nos termos da LGPD, a ESCOLA é a controladora dos dados pessoais coletados no âmbito do Contrato e utilizados para atender à finalidade descrita nesta cláusula. Dúvidas e esclarecimentos relacionados ao referido tratamento de dados pessoais podem ser enviados para o endereço da ESCOLA, indicado na qualificação deste contrato. O encarregado está disponível para contato pelo email: atendimento@togethere.com.br, e o operador é o Sr. Franco Boaventura Jachemet, email: franco@togethere.com.br.';
const _CT_IMAGEM='<b>IMAGEM.</b> O CONTRATANTE permite que a imagem e a voz do ALUNO e de seus representantes legais e/ou responsáveis sejam utilizadas em materiais de divulgação das atividades da ESCOLA nas redes sociais e materiais publicitários, por prazo indeterminado sem que seja devido qualquer pagamento ou indenização a título de uso de imagem.\n<b>§ único.</b> Ao veicular publicidade com a imagem do ALUNO, em se tratando de criança ou adolescente, a ESCOLA atenderá aos ditames legais.';
const _CT_ELETRONICOS='<b>APARELHOS ELETRÔNICOS.</b> O ALUNO não poderá usar smartphones ou outros equipamentos eletrônicos durante as aulas, exceto no que for solicitado pelo professor para atendimento das atividades, tampouco poderá fazer imagens em sala de aula de si ou de terceiros não autorizadas pela ESCOLA.';
const _CT_DESIST='<b>DESISTÊNCIA.</b> O CONTRATANTE, caso queira desistir, deverá comunicar a sua decisão por e-mail à Escola ou pessoalmente à Secretaria, ficando ciente que o certificado somente é emitido para alunos que finalizam o período contratado com frequência mínima atendida e com aprovação em todas as avaliações.\n<b>§ 1º.</b> Caso o CONTRATANTE desista do curso antes do término do período contratado, pagará os valores previstos no quadro acima, incidentes até a data que for entregue o referido aviso, e ainda valor correspondente a 20% (vinte por cento) sobre as parcelas vincendas.\n<b>§ 2º.</b> O simples não comparecimento do ALUNO nas aulas não será considerado como desistência, de modo que serão devidos os pagamentos integrais como referido na remuneração que consta no quadro.\n<b>§ 3º.</b> Em qualquer das hipóteses de rescisão do presente contrato, a ESCOLA não devolverá eventuais valores pagos pelo CONTRATANTE.';
const _CT_AVALIACOES='<b>AVALIAÇÕES E APROVAÇÕES.</b> As avaliações orais e/ou escritas serão feitas conforme o calendário do ano, que será passado aos alunos na primeira semana das aulas. Serão considerados aprovados no respectivo nível os alunos que atingirem média final mínima de 70%. O ALUNO deverá, conforme a modalidade contratada, comparecer presencialmente ou realizar os atos online que lhe competirem, para participar das avaliações.\n<b>§1º.</b> Caso o ALUNO não possa realizar a avaliação na data agendada pela Escola, deverá solicitar reagendamento por e-mail ou presencialmente, na Secretaria.\n<b>§2º.</b> A avaliação será reagendada, sem custos adicionais ao ALUNO, caso este comprove a impossibilidade de comparecimento, através de Atestado Médico ou justificativa por escrito dos responsáveis, sob pena de ser cobrado o custo adicional para a nova data de avaliação, conforme tabela vigente ao tempo do reagendamento.\n<b>§3º.</b> É condição para a realização da avaliação que os pagamentos devidos estejam em dia.';
const _CT_PERDAS='<b>PERDAS E DANOS.</b> O ALUNO deve cuidar dos seus pertences e não poderá deixar em sala objetos de valor. Tais objetos deverão estar sempre consigo, pois a ESCOLA não se responsabiliza pela perda, extravio, deterioração, furto ou roubo de objetos pessoais e/ou valores trazidos pelos alunos às suas dependências, tais como celulares, ipods, notebooks, tablets ou similares.\n<b>§ único.</b> A ESCOLA não oferece estacionamento e não se responsabiliza por danos em veículos que eventualmente estacionem nas dependências da ESCOLA.';
const _CT_TRANSPORTE='<b>NÃO FORNECIMENTO DE TRANSPORTE.</b> A ESCOLA não fornece serviço de transporte. O CONTRATANTE deverá providenciar o transporte e o cuidado do ALUNO fora dos horários de aula.';
const _CT_FORTUITO='<b>CASO FORTUITO OU FORÇA MAIOR.</b> Caso ocorra caso fortuito ou força maior, inclusive ordem de fechamento por autoridade pública, o contrato se manterá ativo se a ESCOLA oferecer as aulas na modalidade on-line, para os alunos de turmas presenciais, mantidos os valores contratados.';
const _CT_EXTINCAO='<b>EXTINÇÃO DO CONTRATO.</b> O contrato pode ser extinto de pleno direito, independentemente de qualquer notificação, interpelação judicial ou extrajudicial, além das hipóteses previstas em lei, se houver o descumprimento de qualquer obrigação principal ou acessória nele prevista que não seja sanada no prazo de 10 (dez) dias, a contar do recebimento de notificação por escrito neste sentido, respondendo a parte inadimplente pelas perdas e danos a que der causa.';
const _CT_REGIMENTO='<b>REGIMENTO INTERNO.</b> O CONTRATANTE declara conhecer e estar de acordo com o regimento interno da ESCOLA, o qual segue estará à disposição no website desta, na área do aluno, a partir de 31/01/2022. podendo ser solicitado a qualquer tempo por e-mail ou na Secretaria da ESCOLA.';
const _CT_COMUNICACOES='<b>COMUNICAÇÕES.</b> A comunicação necessária ao relacionamento entre CONTRATANTE e ESCOLA será realizada ordinariamente pela forma escrita, através de consultas e respostas, seja por meio de correspondência ou e-mail conforme dados de e-mail da qualificação deste contrato. As partes comprometem-se a comunicar uma a outra quaisquer mudanças nos meios de comunicação.';
const _CT_CONSOLIDA='Este contrato consolida todos os entendimentos das partes, cancelando todo e qualquer outro ajuste anterior entre as partes.';
const _CT_INVALIDO='Se qualquer dispositivo contido neste contrato for considerado inválido ou inexequível, isso não invalidará as demais disposições ora convencionadas, que permanecerão vigentes entre as partes.';

/* ---- Contrato de TURMAS: Arts. 1º a 25 ---- */
const _CT_ARTS_TURMA=[
  '<b>Art. 1º. OBJETO.</b> A ESCOLA, por meio da sua equipe de professores, compromete-se a oferecer ao ALUNO aulas do idioma escolhido, durante o período indicado, nos dias e horários referidos no quadro deste contrato, acima referido.\n<b>§1º.</b> As aulas do idioma escolhido pelo ALUNO ocorrerão em turmas de até 12 (doze) alunos.\n<b>§2º.</b> A ESCOLA fará a adequação permanente das turmas conforme as disponibilidades, podendo fazer junções de turmas ou readequação de alunos por turma no decorrer do período contratado.\n<b>§3º.</b> A ESCOLA não assegura a continuidade de turmas, pois isso depende de fatores alheios à sua organização ou vontade.\n<b>§4º.</b> A ESCOLA reserva-se o direito de cancelar, em até 03 (três) dias antes do início de cada nível, qualquer turma cujo número de alunos seja inferior a 03 (três), proporcionando, porém, aos alunos, o direito de optar por vagas existentes em outras turmas do mesmo nível. Caso não seja possível ao ALUNO frequentar outra turma oferecida, os pagamentos ainda não efetuados por este, referentes ao período que seria cursado e foi cancelado, serão interrompidos.',
  '<b>Art. 2º.</b> '+_CT_LOCAL,
  '<b>Art. 3º. METODOLOGIA E MATERIAL.</b> É de responsabilidade da ESCOLA a escolha e aplicação do material e método (inclusive de avaliação) a ser adotado nos cursos, fixação do calendário e carga horária do curso. O material didático poderá ser adquirido junto à própria escola, conforme preço e condições vigentes ao tempo da aquisição.\n<b>§1º.</b> O uso do material didático indicado pela ESCOLA é obrigatório em todos os módulos do curso, não podendo ser reutilizado material de terceiros. Não serão aceitas cópias xerográficas e/ou qualquer outro tipo de reprodução dos livros, conforme dispõe a Lei de Direitos Autorais.\n<b>§2º.</b> Para o melhor desempenho da turma, ganho de tempo e de performance, o material deverá ser adquirido pelo ALUNO antes do início do semestre e a edição do material deverá sempre ser uniforme e, para isso, deverá corresponder sempre à mais recente. O material deve ser levado obrigatoriamente pelo aluno em todas as aulas, sob pena de perda de performance individual e da turma.\n<b>§3º.</b> O material didático adquirido deverá ser pago integralmente, independentemente da conclusão do curso. Não será admitida a devolução deste material com restituição dos valores pagos, mesmo que haja cancelamento ou desistência do curso, por parte do CONTRATANTE ou do ALUNO.',
  '<b>Art. 4º.</b> '+_CT_CONDUTA,
  '<b>Art. 5º.</b> '+_CT_VINCULO,
  '<b>Art. 6º.</b> '+_CT_EQUIPE,
  '<b>Art. 7º.</b> '+_CT_REMUN,
  '<b>Art. 8º.</b> '+_CT_DESCONTOS,
  '<b>Art. 9º.</b> '+_CT_PRAZO,
  '<b>Art. 10º.</b> '+_CT_TEMATICAS,
  '<b>Art. 11.</b> '+_CT_EXTRAS,
  '<b>Art. 12.</b> '+_CT_DADOS,
  '<b>Art. 13.</b> '+_CT_IMAGEM,
  '<b>Art. 14.</b> '+_CT_ELETRONICOS,
  '<b>Art. 15.</b> '+_CT_DESIST,
  '<b>Art. 16. FREQUÊNCIA.</b> A frequência mínima do ALUNO para se habilitar a participar das avaliações é de 75% das aulas e atividades. O ALUNO deverá observar os horários das aulas, sendo permitida uma tolerância de ingresso em sala de aula de até 10 minutos.',
  '<b>Art. 17.</b> '+_CT_AVALIACOES,
  '<b>Art. 18.</b> '+_CT_PERDAS,
  '<b>Art. 19.</b> '+_CT_TRANSPORTE,
  '<b>Art. 20.</b> '+_CT_FORTUITO,
  '<b>Art. 21.</b> '+_CT_EXTINCAO,
  '<b>Art. 22.</b> '+_CT_REGIMENTO,
  '<b>Art. 23.</b> '+_CT_COMUNICACOES,
  '<b>Art. 24.</b> '+_CT_CONSOLIDA,
  '<b>Art. 25.</b> '+_CT_INVALIDO
];

/* ---- Contrato VIP (aulas particulares): Arts. 1º a 24 ---- */
const _CT_ARTS_VIP=[
  '<b>Art. 1º. OBJETO.</b> A ESCOLA, por meio da sua equipe de professores, compromete-se a oferecer ao ALUNO aulas do idioma escolhido, durante o período indicado, nos dias e horários referidos no quadro deste contrato, acima referido.',
  '<b>Art. 2º.</b> '+_CT_LOCAL,
  '<b>Art. 3º. METODOLOGIA E MATERIAL.</b> É de responsabilidade da ESCOLA a escolha e aplicação do material e método (inclusive de avaliação) a ser adotado nos cursos, fixação do calendário e carga horária do curso.\n<b>§1º.</b> O uso do material didático indicado pela ESCOLA é obrigatório em todos os módulos do curso, não podendo ser reutilizado material de terceiros. Não serão aceitas cópias xerográficas e/ou qualquer outro tipo de reprodução dos livros, conforme dispõe a Lei de Direitos Autorais.\n<b>§2º.</b> O material didático adquirido para o curso deverá ser pago integralmente, independentemente da conclusão do curso. Não será admitida a devolução deste material com restituição dos valores pagos, mesmo que haja cancelamento ou desistência do curso, por parte do CONTRATANTE ou do ALUNO.',
  '<b>Art. 4º.</b> '+_CT_CONDUTA,
  '<b>Art. 5º.</b> '+_CT_VINCULO,
  '<b>Art. 6º.</b> '+_CT_EQUIPE,
  '<b>Art. 7º.</b> '+_CT_REMUN,
  '<b>Art. 8º.</b> '+_CT_DESCONTOS,
  '<b>Art. 9º.</b> '+_CT_PRAZO,
  '<b>Art. 10º.</b> '+_CT_TEMATICAS,
  '<b>Art. 11.</b> '+_CT_EXTRAS,
  '<b>Art. 12.</b> '+_CT_DADOS,
  '<b>Art. 13.</b> '+_CT_IMAGEM,
  '<b>Art. 14.</b> '+_CT_ELETRONICOS,
  '<b>Art. 15.</b> '+_CT_DESIST,
  '<b>Art. 16.</b> '+_CT_AVALIACOES,
  '<b>Art. 17.</b> '+_CT_PERDAS,
  '<b>Art. 18.</b> '+_CT_TRANSPORTE,
  '<b>Art. 19.</b> '+_CT_FORTUITO,
  '<b>Art. 20.</b> '+_CT_EXTINCAO,
  '<b>Art. 21.</b> '+_CT_REGIMENTO,
  '<b>Art. 22.</b> '+_CT_COMUNICACOES,
  '<b>Art. 23.</b> '+_CT_CONSOLIDA,
  '<b>Art. 24.</b> '+_CT_INVALIDO
];

/* -------------------- montagem do documento -------------------- */
function _ctDado(v){ return (v!=null && String(v).trim()!=='') ? esc(String(v).trim()) : '<span class="falta">—</span>'; }
function _ctPessoaLinha(rotulo,nome,cpf,cidade,endereco,email,wpp){
  return `<p class="pessoa"><b>${rotulo}:</b> ${_ctDado(nome)}, inscrito(a) no CPF sob n. ${_ctDado(cpf)}, com endereço na cidade de ${_ctDado(cidade||'Gravataí, RS')}, na ${_ctDado(endereco)}, e-mail ${_ctDado(email)}, whatsapp ${_ctDado(wpp)}.</p>`;
}
function _ctPortalBox(login){
  const site='https://bit.ly/portal_togethere';
  return `<b>SITE:</b> ${site}<br><b>LOGIN:</b> ${_ctDado(login)}<br><b>SENHA:</b> Se não souber sua senha, use a opção “Esqueci minha senha” no Portal do Aluno para redefini-la.`;
}
function _ctQuadroHTML(rows){
  return `<table class="quadro">${rows.map(r=>`<tr><td class="k">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
}
function _ctHTML(opts){
  const arts=opts.arts.map(a=>`<p class="art">${a.replace(/\n/g,'<br>')}</p>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato — ${esc(opts.nomeDoc)}</title><style>
@page{size:A4;margin:11mm 12mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;font-size:9.6px;line-height:1.38;margin:0}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:5px;margin-bottom:8px}
.top h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:17px;margin:0}
.top .sub{font-weight:700;font-size:10px;color:#002B64}.top .per{margin-left:auto;color:#5a6b86;font-size:8.5px}
h2.tit{font-family:'Zilla Slab',Georgia,serif;text-align:center;font-size:11.5px;color:#002B64;margin:2px 0 8px;letter-spacing:.2px}
h3.sec{font-family:'Zilla Slab',Georgia,serif;text-align:center;font-size:10.5px;color:#005EAF;margin:10px 0 5px;border-top:1px solid #DCE4EC;padding-top:7px}
.pessoa{margin:0 0 4px;text-align:justify}
table.quadro{width:100%;border-collapse:collapse;margin:2px 0 4px}
table.quadro td{border:1px solid #C9D6E4;padding:3.5px 7px;vertical-align:top}
table.quadro td.k{background:#F0F6FC;color:#002B64;font-weight:700;width:24%}
table.rem{width:100%;border-collapse:collapse;font-size:9.2px}
table.rem th{background:#F0F6FC;color:#002B64;border:1px solid #C9D6E4;padding:2.5px 6px;font-weight:700}
table.rem td{border:1px solid #C9D6E4;padding:2.5px 6px;text-align:center}
.remwrap{display:flex;gap:8px}.remwrap>div{flex:1}
p.art{margin:0 0 4.5px;text-align:justify}
.falta{background:#FFF7DA;padding:0 4px;color:#9a7b00;font-weight:600}
.fecho{margin:8px 0 0;text-align:justify}
.ass{margin-top:26px;display:flex;gap:36px;page-break-inside:avoid}
.ass div{flex:1;border-top:1px solid #15233b;padding-top:3px;text-align:center;font-size:9px}
.testem{margin-top:22px;page-break-inside:avoid}
.testem .tl{display:flex;gap:36px;margin-top:20px}
.testem .tl div{flex:1;border-top:1px solid #15233b;padding-top:3px;font-size:9px}
.foot{margin-top:8px;color:#8a97a8;font-size:7.8px;border-top:1px solid #DCE4EC;padding-top:4px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div class="sub">${esc(opts.subtitulo)}</div><div class="per">gerado em ${brDate(hoje())} · ${esc(S.usuario||'')}</div></div>
<h2 class="tit">${_CT_TIT}</h2>
<h3 class="sec" style="border-top:0;padding-top:0;margin-top:4px">I – PARTES</h3>
${opts.partes}
<h3 class="sec">II – QUADRO</h3>
${opts.quadro}
<h3 class="sec">III – ESTIPULAÇÕES</h3>
${arts}
<p class="fecho">${_CT_FECHO}</p>
<div class="ass"><div>Contratante</div><div>Contratada/Escola</div></div>
<div class="testem"><b>TESTEMUNHAS:</b><div class="tl"><div>1. Nome:<br>CI:</div><div>2. Nome:<br>CI:</div></div></div>
<p class="foot">Contrato gerado pelo app Togethere a partir do texto oficial da escola. Togethere · inglês para chegar lá.</p>
</body></html>`;
}
function _ctRemTurmaHTML(f){
  if(!f) return '<span class="falta">defina o plano no Financeiro para preencher as parcelas</span>';
  const parc=finParcelas(f);
  const linhas=[];
  if(_matN(f.valorMatricula)>0) linhas.push(`<tr><td>Matrícula</td><td>${_moeda(_matN(f.valorMatricula))}</td></tr>`);
  parc.forEach(p=>linhas.push(`<tr><td>${brDate(p.venc)}</td><td>${_moeda(p.valor)}</td></tr>`));
  if(!linhas.length) return '<span class="falta">—</span>';
  const meio=Math.ceil(linhas.length/2);
  const tab=ls=>`<table class="rem"><tr><th>Vencimento</th><th>Valor</th></tr>${ls.join('')}</table>`;
  return linhas.length>6?`<div class="remwrap"><div>${tab(linhas.slice(0,meio))}</div><div>${tab(linhas.slice(meio))}</div></div>`:tab(linhas);
}
function _ctFimPadrao(ini){ const y=(ini&&/^\d{4}/.test(ini))?ini.slice(0,4):String(new Date().getFullYear()); return '31/12/'+y; }

/* -------------------- CONTRATO DE TURMA (a partir da matrícula) -------------------- */
function verContrato(id){
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const t=m.turmaId?(S.turmas||[]).find(x=>x.id===m.turmaId):null;
  const f=(S.financeiro||[]).find(x=>x.matriculaId===id);
  const alu=m.alunoId?(S.alunos||[]).find(a=>a.id===m.alunoId):null;
  const contratante=m.respNome||matNome(m);   // aluno adulto sem responsável: ele mesmo contrata
  const partes=
    _ctPessoaLinha('CONTRATANTE',contratante,m.respDoc,m.cidade,m.endereco,m.email,m.telefone)
    +`<p class="pessoa">${_CT_ESCOLA}</p>`
    +_ctPessoaLinha('ALUNO',matNome(m),m.docAluno,m.cidade,m.endereco,(alu&&alu.email)||'','');
  const ini=m.dataInicio?brDate(m.dataInicio):'';
  const fim=m.fimPeriodo?brDate(m.fimPeriodo):_ctFimPadrao(m.dataInicio);
  const diasHor=t?[diasTurmaLabel(t),t.horario||''].filter(Boolean).join(', '):'';
  const quadro=_ctQuadroHTML([
    ['Período contratado', `${_ctDado(ini)} até ${esc(fim)}`],
    ['Idioma','Inglês'],
    ['Dias e horário das aulas', _ctDado(diasHor)],
    ['Níveis', _ctDado(t?((t.cefr?t.cefr+' · ':'')+t.nome):'')],
    ['Composição','Aulas de Turmas'],
    ['Modalidade', _ctDado(m.modalidade||'Presencial')],
    ['Remuneração', _ctRemTurmaHTML(f)],
    ['Observações', m.observacoes?esc(m.observacoes):''],
    ['Local e data deste contrato','Gravataí, RS, '+brDate(hoje())],
    ['Dados para acesso ao portal do aluno', _ctPortalBox((alu&&alu.email)||'')]
  ]);
  imprimirDoc(_ctHTML({nomeDoc:matNome(m), subtitulo:'Contrato — aulas em turma', partes, quadro, arts:_CT_ARTS_TURMA}));
}
function verContratoExemplo(id){ return verContrato(id); }   // compat: botões antigos

/* -------------------- CONTRATO VIP (aulas particulares) -------------------- */
function _cardContratoOficialVip(vip){
  if(S.perfil!=='direcao') return '';
  const cd=vip.contratoDados||{};
  const tem=!!(cd.contratante||cd.cpf);
  return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 6px">📄 Contrato oficial</h3>
    <p class="hint" style="margin:0 0 8px">${tem?('Dados do contratante preenchidos ('+esc(cd.contratante||'')+').'):'Preencha os dados do contratante uma vez; o contrato sai pronto para imprimir e assinar.'}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost sm" onclick="abrirContratoVip('${vip.id}')">${tem?'✏️ Dados do contrato':'📝 Preencher dados'}</button>
      ${tem?`<button class="btn sm" onclick="verContratoVip('${vip.id}')">📄 Gerar contrato</button>`:''}
    </div></div>`;
}
function abrirContratoVip(vid){
  if(S.perfil!=='direcao') return toast('Só a direção gera contratos');
  const vip=(S.vipAlunos||[]).find(v=>v.id===vid); if(!vip) return;
  const cd=vip.contratoDados||{};
  const horasPad=cd.horas || (function(){ const min=(typeof vipContratadoMin==='function')?vipContratadoMin(vid):0; return min>0?(Math.floor(min/60)+':'+String(min%60).padStart(2,'0')):''; })();
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">📄 Dados do contrato — ${esc(vip.nome)}</h3><button class="close" onclick="fechar()">×</button></div>
    <p class="hint" style="margin:0 0 10px">Preenchem o quadro e a qualificação das partes. O texto das cláusulas é o oficial da escola e não muda.</p>
    <div style="font-weight:700;color:#0A7A3D;margin:6px 0 4px">Contratante (quem assina e paga)</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Nome completo</label><input type="text" id="cv_nome" value="${escAttr(cd.contratante||'')}"></div>
      <div class="field"><label class="lbl">CPF</label><input type="text" id="cv_cpf" value="${escAttr(cd.cpf||'')}"></div></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Endereço (rua e número)</label><input type="text" id="cv_end" value="${escAttr(cd.endereco||'')}" placeholder="Rua …, n. …"></div>
      <div class="field"><label class="lbl">Cidade</label><input type="text" id="cv_cid" value="${escAttr(cd.cidade||'Gravataí, RS')}"></div></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="cv_email" value="${escAttr(cd.email||vip.email||'')}"></div>
      <div class="field"><label class="lbl">WhatsApp</label><input type="text" id="cv_wpp" value="${escAttr(cd.wpp||vip.telefone||'')}"></div></div>
    <div style="font-weight:700;color:#0A7A3D;margin:10px 0 4px">Aluno e contrato</div>
    <div class="row"><div class="field"><label class="lbl">CPF do aluno</label><input type="text" id="cv_cpfAluno" value="${escAttr(cd.alunoCpf||'')}" placeholder="se tiver"></div>
      <div class="field"><label class="lbl">Nº de horas/aula</label><input type="text" id="cv_horas" value="${escAttr(horasPad)}" placeholder="Ex: 180:00"></div>
      <div class="field"><label class="lbl">Nível</label><input type="text" id="cv_nivel" value="${escAttr(cd.nivel||vip.cefr||'')}" placeholder="Ex: B1 Adult"></div></div>
    <div class="row"><div class="field"><label class="lbl">Início do período</label><input type="date" id="cv_ini" value="${escAttr(cd.ini||'')}"></div>
      <div class="field"><label class="lbl">Fim do período</label><input type="date" id="cv_fim" value="${escAttr(cd.fim||'')}"></div></div>
    <div class="field"><label class="lbl">Parcelas — uma por linha: vencimento e valor</label><textarea id="cv_parc" style="min-height:90px" placeholder="05/01/2026 417,50&#10;05/02/2026 417,50">${esc((cd.parcelas||[]).map(p=>p.venc+' '+p.valor).join('\n'))}</textarea></div>
    <div class="field"><label class="lbl">Observações (entram no quadro)</label><input type="text" id="cv_obs" value="${escAttr(cd.obs||'')}"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      <button class="btn" onclick="salvarContratoVip('${vid}')">💾 Salvar</button>
      <button class="btn ghost" onclick="salvarContratoVip('${vid}',true)">💾 Salvar e gerar 📄</button>
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
}
function salvarContratoVip(vid,gerar){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const vip=(S.vipAlunos||[]).find(v=>v.id===vid); if(!vip) return;
  const g=id=>{ const e=document.getElementById(id); return e?(e.value||'').trim():''; };
  const parcelas=g('cv_parc').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const mm=l.match(/^(\S+)\s+(.+)$/); return mm?{venc:mm[1],valor:mm[2]}:{venc:l,valor:''};
  });
  vip.contratoDados={ contratante:g('cv_nome'), cpf:g('cv_cpf'), endereco:g('cv_end'), cidade:g('cv_cid'),
    email:g('cv_email'), wpp:g('cv_wpp'), alunoCpf:g('cv_cpfAluno'), horas:g('cv_horas'), nivel:g('cv_nivel'),
    ini:g('cv_ini'), fim:g('cv_fim'), parcelas, obs:g('cv_obs') };
  vip.atualizadoEm=Date.now();
  save(); fechar(); if(typeof abrirFicha==='function' && rota==='ficha'){ /* recarrega se estiver na ficha */ try{abrirFicha(vid);}catch(e){} }
  toast('Dados do contrato salvos ✓');
  if(gerar) verContratoVip(vid);
}
function _ctRemVipHTML(parcelas){
  if(!parcelas||!parcelas.length) return '<span class="falta">preencha as parcelas nos dados do contrato</span>';
  const n=parcelas.length;
  const linhas=parcelas.map((p,i)=>`<tr><td>${i+1}/${n}</td><td>${esc(p.venc)}</td><td>${esc(p.valor)}</td><td>-</td></tr>`);
  const meio=Math.ceil(linhas.length/2);
  const tab=ls=>`<table class="rem"><tr><th>Nº</th><th>Vencimento</th><th>Valor</th><th>% Bolsa Desc.</th></tr>${ls.join('')}</table>`;
  return linhas.length>6?`<div class="remwrap"><div>${tab(linhas.slice(0,meio))}</div><div>${tab(linhas.slice(meio))}</div></div>`:tab(linhas);
}
function verContratoVip(vid){
  const vip=(S.vipAlunos||[]).find(v=>v.id===vid); if(!vip) return;
  const cd=vip.contratoDados||{};
  const partes=
    _ctPessoaLinha('CONTRATANTE',cd.contratante,cd.cpf,cd.cidade,cd.endereco,cd.email,cd.wpp)
    +`<p class="pessoa">${_CT_ESCOLA}</p>`
    +_ctPessoaLinha('ALUNO',vip.nome,cd.alunoCpf,cd.cidade,cd.endereco,vip.email||'','');
  const per=(cd.ini?brDate(cd.ini):'')+(cd.fim?(' até '+brDate(cd.fim)):'');
  const quadro=_ctQuadroHTML([
    ['Período contratado', _ctDado(per)],
    ['Idioma','Inglês'],
    ['Número de Horas/Aula', _ctDado(cd.horas)],
    ['Nível', _ctDado(cd.nivel)],
    ['Composição','Aulas Particulares'],
    ['Remuneração', _ctRemVipHTML(cd.parcelas)],
    ['Observações', cd.obs?esc(cd.obs):''],
    ['Local e data deste contrato','Gravataí, RS, '+brDate(hoje())],
    ['Dados para acesso ao portal do aluno', _ctPortalBox(vip.email||'')]
  ]);
  imprimirDoc(_ctHTML({nomeDoc:vip.nome, subtitulo:'Contrato — aulas particulares (VIP)', partes, quadro, arts:_CT_ARTS_VIP}));
}
