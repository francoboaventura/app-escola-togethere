/* =========================================================================
   TUTORIAL (b94) — o que cada perfil consegue fazer no app
   Mesmo modelo visual da aba Formação: cards que abrem um modal com o passo a passo.
   ========================================================================= */
let _tutPerfil='todos';
// telas que têm print gerado (public/tutorial/<id>.png) — regerar os prints a cada mudança visual grande
const _TUT_IMGS={painel:1,busca:1,aparencia:1,presenca:1,temas:1,material:1,testes:1,planos:1,relatorio:1,planejamento:1,writings:1,formacao:1,ficha:1,resumo:1,relturma:1,aprovacoes:1,arquivo:1,vip:1,apoio:1,alertas:1,comunicados:1,turmas:1,alunos:1,dupes:1,gturmas:1,gestaoturmas:1,estoque:1,matriculas:1,financeiro:1,configfin:1,permissoes:1,tarefas:1,acessos:1,cards:1,portal:1};
function _tutImg(t){ return _TUT_IMGS[t.id]?('tutorial/'+t.id+'.png'):null; }
// O tutorial se ADAPTA: professor/secretaria veem só o que é deles, e itens
// desligados em 🔐 Permissões somem do guia (mesma regra do menu).
function _tutPerfilAtivo(){ return (S.perfil==='professor'||S.perfil==='secretaria')?S.perfil:_tutPerfil; }
function _tutVisivel(t){
  const p=_tutPerfilAtivo();
  if(p!=='todos' && t.roles.indexOf(p)<0) return false;
  if(S.perfil==='professor'){
    if(t.id==='writings' && !perm('prof_writings')) return false;
    if(t.id==='apoio' && !perm('prof_apoio')) return false;
  }
  if(S.perfil==='secretaria'){
    if(t.id==='estoque' && !perm('sec_estoque')) return false;
  }
  return true;
}
const TUTORIAL=[
  { id:'painel', em:'📊', titulo:'Painel', grp:'Início', roles:['professor','secretaria','direcao'],
    resumo:'Tela inicial com o resumo do dia e atalhos rápidos.',
    passos:`## O que é
A sua porta de entrada no app: um panorama do dia e caminho rápido para o que você mais usa.
## Como usar
- **🗓️ Suas próximas aulas** ficam no topo: toque num card e abre o **ambiente completo da turma** (chamada, planos, testes, linha do tempo, relatórios e a lista de alunos).
- Logo abaixo, o **seu menu em quadradinhos**: só aparece o que o seu perfil pode acessar — professor vê o dele, secretaria o dela, direção vê tudo.
- Veja avisos e aniversariantes do dia.
- No topo da tela, o botão **☰ Menu** abre esse mesmo menu de qualquer lugar do app.
- Disponível para todos os perfis.` },
  { id:'busca', em:'🔎', titulo:'Buscar', grp:'Início', roles:['professor','secretaria','direcao'],
    resumo:'Busca global: encontre alunos, turmas e telas pelo nome.',
    passos:`## Como usar
- Digite parte do nome de um **aluno**, **turma** ou **tela** do app.
- Toque no resultado para ir direto (ficha do aluno, turma, etc.).
- Respeita o seu perfil: só aparece o que você pode ver.` },
  { id:'aparencia', em:'🎨', titulo:'Aparência (tema e cores)', grp:'Início', roles:['professor','secretaria','direcao'],
    resumo:'Modo escuro e 6 combinações de cores — cada usuário escolhe a sua.',
    passos:`## Como usar
- Abra o **menu da conta** (canto superior direito).
- **🌙 Modo escuro:** alterna claro/escuro.
- **🎨 Cor do app:** toque numa das bolinhas para trocar a cor principal (azul, marinho, vermelho, rosa, roxo ou verde — as cores da Togethere).
- A escolha fica salva **no seu aparelho** e não muda para os colegas.` },
  { id:'presenca', em:'📋', titulo:'Chamada do dia', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Presença, material e tema da aula — tudo numa tela só.',
    passos:`## Como usar
1. Escolha a **turma** e a **data** — só aparecem os dias em que a turma tem aula.
2. Toque em **Presente/Falta** para cada aluno; marque também **atraso**, **saiu mais cedo** e **🎒 sem material** quando for o caso.
3. Se houver tema com entrega hoje, a **conferência do tema** aparece na mesma tela.
4. Toque em **Salvar chamada e material** — a chamada fica **travada** (Editar chamada reabre).
## Se a aula não aconteceu
Marque **Cancelada** ou **Transferida** — a aula não conta, as pendências não cobram e os temas com entrega no dia **pulam para a próxima aula** sozinhos.
## O que acontece por trás
- **3 faltas consecutivas** → aviso automático para a secretaria contatar a família.
- Sem material **3 aulas seguidas** (ou 5 alternadas) → mesmo caminho.
- Aula prevista sem chamada gera lembrete para você e, após 24h, avisa a direção.
## Dica
Passou da hora e esqueceu? Use **Buscar chamada anterior por data** no fim da tela.` },
  { id:'temas', em:'📚', titulo:'Temas de casa', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Registrar os temas e marcar quem fez, fez parcial ou não fez.',
    passos:`## Como usar
- Lance o tema da aula com a descrição.
- Marque para cada aluno: **feito**, **parcial** ou **não feito**.
## Por que importa
Os temas não feitos aparecem na ficha do aluno e no portal da família.` },
  { id:'material', em:'🎒', titulo:'Sem material', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Registrar quando o aluno não traz o material da aula.',
    passos:`## Como usar
- Escolha a turma e a data.
- Marque os alunos que não trouxeram material.
## Por que importa
3 aulas seguidas ou 5 alternadas sem material geram um **aviso** para a secretaria contatar a família.` },
  { id:'testes', em:'✏️', titulo:'Testes e boletim', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Notas por habilidade, faixas Cambridge e o boletim do aluno.',
    passos:`## Como usar
1. Escolha a **turma** e o **número do teste** (KIDS não tem teste formal; B2/C1 fazem 2 no ano; os demais, 3).
2. Lance a nota (0–100) de cada habilidade: **Grammar, Vocabulary, Listening, Reading, Writing, Speaking** — a média sai sozinha, com as cores das faixas.
## Faixas (padrão Cambridge)
0–59 *in need of improvement* · 60–89 **pass** · 90–100 **merit** · ★ **Distinction** (selo, sem nota).
## Boletim
- **Gerar boletim completo** monta o documento e envia para **✅ Aprovar boletins** (direção).
- Só depois de **aprovado** ele pode ser impresso, enviado por e-mail e aparecer no Portal do Aluno.
- **Mudou uma nota depois?** A aprovação é cancelada na hora e o boletim volta para reaprovação — o que a família recebe é sempre a versão aprovada.
## Regras da média
- Nota em branco num teste que o aluno FEZ conta **zero**.
- Teste que o aluno **não fez** (entrou depois, por exemplo) **não** conta contra ele.` },
  { id:'planos', em:'🗒️', titulo:'Planos de aula', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Checklist da aula, anotações e a ponte para o relatório às famílias.',
    passos:`## Como usar
1. Crie o plano com **um item por linha** (o que pretende trabalhar na aula).
2. Durante/depois da aula, **marque os itens feitos** — o que ficou aberto você pode **↪️ transferir para a próxima aula**.
3. Use as **anotações** para registrar como a turma respondeu.
4. **✓ Marcar como feito** fecha o plano.
## Superpoderes do plano
- **📩 tema**: transforma qualquer item do plano em tema de casa com data de entrega (e dá para desfazer).
- **🔗 Links úteis**: cole os links da SUA aula (vídeo, jogo, apresentação) no plano — ficam a um toque na hora de dar aula.
- **Gerar relatório da aula**: o plano vira o texto do **Relatório do dia** que a secretaria envia às famílias.
- Temas com entrega na data da aula aparecem dentro do plano para conferência.` },
  { id:'relatorio', em:'🧾', titulo:'Relatório do dia', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'O texto-resumo da aula, pronto para as famílias.',
    passos:`## O que é
O app escreve sozinho um resumo da aula — conteúdos do plano, tema de casa passado, presenças — em texto pronto para os pais.
## Como usar
1. Escolha a turma e a data.
2. Revise o texto gerado (dá para **editar** antes).
3. O relatório cai nos **Avisos** da secretaria, que copia para o grupo de WhatsApp da turma e marca como **enviado**.
## Boas práticas
- Gere no mesmo dia da aula — a família sente a escola presente.
- Detalhes pessoais de um aluno específico vão na **Ficha** (comentários), não no relatório coletivo.` },
  { id:'planejamento', em:'📅', titulo:'Planejamento', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'A coleção da turma, unidade por unidade, com o ritmo do ano.',
    passos:`## O que é
O mapa do conteúdo da turma: a **coleção/material** definido para ela, as unidades e o que já foi dado.
## Como usar
1. Escolha a turma — a coleção vem do cadastro da turma (a direção define; materiais novos são cadastrados em ⚙️ Config. financeira → Produtos).
2. Marque as unidades/lições conforme forem **dadas** — a barra de progresso mostra o ritmo real × previsto.
3. Recessos cadastrados pausam a previsão (o app não cobra ritmo em semana de férias).
## Por que importa
É daqui que o app sabe **qual livro cada aluno precisa** (módulo 📚 Livros) e se a turma está adiantada ou atrasada no ano.` },
  { id:'writings', em:'📝', titulo:'Correção de writings', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Corrigir redações com o motor por nível e revisar a nota.',
    passos:`## Como usar
- Escolha o **nível** (A1 a C1) e a tarefa.
- Cole o texto ou **transcreva por foto** — dá para **✂️ recortar a foto** antes, deixando só a área do texto (melhora muito a leitura).
- O motor devolve as bandas e uma nota geral — sempre para **revisão do professor**.
- Você pode **editar** o relatório e **imprimir**.
## Importante
A nota é uma sugestão calibrada; a palavra final é sempre do professor.` },
  { id:'formacao', em:'🎓', titulo:'Formação', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Biblioteca da metodologia e registro de formações da equipe.',
    passos:`## O que é
A metodologia Togethere sempre à mão, para consulta e treinamento.
## Como usar
- **Professores:** leem os tópicos e registram a leitura.
- **Direção:** cria/edita tópicos e registra as **sessões de formação**.
- Cada tópico volta para revisão depois do prazo definido.` },
  { id:'ficha', em:'📇', titulo:'Ficha do aluno', grp:'Acompanhamento', roles:['professor','secretaria','direcao'],
    resumo:'Tudo do aluno numa tela: aulas, notas, temas, livros e comentários.',
    passos:`## O que tem nela
- **Topo**: foto, turma, idade, e-mail do responsável e os tiles Presenças/Faltas/Temas/Material.
- **Seções em quadradinhos**: Aulas (cada aula expansível), Testes (médias com barras), Writings (relatório completo), Temas, Material e Comentários — cada quadradinho mostra quantos registros tem; toque para abrir.
- **📚 Livros**: o estágio do material do aluno (pedir → chegou → entregue).
- Para **alunos VIP**, a ficha ainda traz 🎥 Aula online, ⏱️ Pacote de horas, 🕒 Horários, remanejamentos e pausas.
## Ações
- **Comentários**: registre observações individuais (aparecem no portal da família).
- No rodapé, em quadradinhos: **enviar a ficha ao responsável**, **gerar boletim**, **copiar** (WhatsApp) e **imprimir/PDF**. Na ficha do aluno VIP é igual (enviar, copiar, imprimir).
- Período ajustável (mês, ano, tudo) para os números.
## Dica
Chega nela voando: 🔎 **Buscar** pelo nome do aluno, de qualquer tela.` },
  { id:'resumo', em:'📄', titulo:'Relatórios por aluno', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Histórico dos relatórios gerados/enviados por aluno.',
    passos:`## Como usar
- Escolha o aluno para ver os relatórios já gerados e enviados.
- Útil para a secretaria acompanhar a comunicação com a família.` },
  { id:'relturma', em:'🏫', titulo:'Relatórios por turma', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Relatórios da turma + relatório mensal com estatísticas.',
    passos:`## Como usar
- Escolha a turma para ver o histórico de relatórios daquela turma.
- **Relatório mensal:** presença, temas e conteúdos do mês, pronto para **imprimir** ou baixar em **planilha (CSV)**.
- Também dá para exportar as **horas VIP** do mês em planilha.` },
  { id:'aprovacoes', em:'✅', titulo:'Aprovar boletins', grp:'Acompanhamento', roles:['direcao'],
    resumo:'A direção aprova (ou reprova) os boletins antes de enviar.',
    passos:`## O que é
O controle de qualidade dos boletins.
## Como usar
- Veja os boletins gerados aguardando aprovação.
- **Aprove** para liberar envio por e-mail, impressão, PDF e a exibição no portal do aluno.
- Editar um boletim aprovado **cancela** a aprovação (precisa aprovar de novo).
## Só direção
Apenas a direção aprova.` },
  { id:'arquivo', em:'🗄️', titulo:'Arquivo de relatórios', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'O histórico do que já foi enviado às famílias.',
    passos:`## Como usar
- Consulte relatórios de aula e relatórios por aluno já **enviados**, por turma e data.
- Abra qualquer um para ver o **texto exatamente como foi enviado** (cópia congelada) e use **📋 Copiar** para reenviar se a família pedir.
## Por que importa
É a memória da comunicação com as famílias — útil em qualquer conversa sobre "a escola nunca me avisou".` },
  { id:'vip', em:'👑', titulo:'Alunos VIP', grp:'Acompanhamento', roles:['professor','secretaria','direcao'],
    resumo:'Aulas particulares: lançamentos, pacotes de horas, pausas e remanejamentos.',
    passos:`## O que é
Alunos de aulas particulares, fora das turmas regulares.
## Professor
- A ficha do aluno VIP mostra **só o que é seu**: o painel **"Sua aula com este aluno"** (próxima aula prevista, botão 🎥 **Entrar na aula** e ➕ **Lançar aula**), horários, links úteis e o histórico de aulas.
- **Você não vê** pacote de horas, totais de horas feitas, contadores no topo da ficha nem cancelamentos registrados pela secretaria — isso é controle interno. Os writings aparecem na seção própria, mais abaixo.
- **Horários previstos** são definidos pela secretaria (você só consulta). A aula aconteceu em outro horário? Ajuste o campo **"Hora em que aconteceu"** ao lançar — ele já vem preenchido com o previsto do dia.
- Lança as aulas dadas (data, hora, duração — **mínimo 30 minutos** —, tema, presença).
- **Aluno não compareceu?** Você mesmo registra a falta — a hora é **descontada do pacote** (regra da escola).
- **Cancelou com menos de 12h e você foi liberado?** Não registre nada — a **secretaria** registra o cancelamento.
## Secretaria e direção
- Controlam o **pacote de horas** (contratadas × utilizadas) na ficha do aluno — o aluno **não** vê isso.
- **👥 Aula em dupla:** marque na ficha do VIP; o app passa a usar a hora-aula de dupla da tabela (valor por aluno) e mostra o valor estimado do pacote.
- **🕒 Horários:** cada linha é um dia com a SUA hora **e duração** (mínimo 30min) — use **＋ Adicionar horário** para mais dias; o alerta segue cada horário e o lançamento de aula já vem com a hora e a duração daquele dia. **Só secretaria/direção alteram** os horários previstos e os remanejamentos; o professor consulta.
- **⏸️ Pausa:** período sem alertas (férias/recesso do aluno).
- **🔁 Remanejamento:** troca pontual de dia/horário de uma aula prevista.
- Horas de **consolidação** (importadas de antes do app) aparecem separadas e **não contam** como aula lançada.
- **📊 Panorama:** escolha o período (este mês, mês passado, este ano) para ver as horas utilizadas no período — contratadas e saldo são sempre do total.
- **🎥 Aula online:** a **secretaria/direção** mantém o link (Meet/Zoom) na ficha do VIP — para o professor ele aparece em destaque no painel "Sua aula com este aluno".
- **🚫 Cancelamento em cima da hora (<12h):** registrado pela **secretaria** (botão na ficha do VIP) — a aula fica como não realizada e a hora é **descontada do pacote**. Falta sem aviso ("não compareceu") é registrada pelo professor e também desconta.
- **🔗 Links úteis:** espaço para o professor guardar os links daquele aluno (jogos, playlists, PDFs) na mesma seção.
- **📄 Contrato oficial (só direção):** na ficha do VIP, preencha os dados do contratante uma vez e gere o contrato de aulas particulares com o texto oficial da escola — quadro com horas, período e parcelas, pronto para assinar.
## Alertas
Aula prevista sem lançamento há mais de 24h gera **aviso** para a secretaria.` },
  { id:'apoio', em:'🤝', titulo:'Aula de apoio', grp:'Acompanhamento', roles:['professor','secretaria','direcao'],
    resumo:'Do professor à secretaria: indicação, aprovação e agendamento do reforço.',
    passos:`## O fluxo
1. **Professor** indica o aluno com o motivo (ex.: dificuldade com um conteúdo).
2. **Direção** aprova a indicação.
3. **Secretaria** combina com a família e agenda a aula de apoio.
## Como usar
- Acompanhe na tela o status de cada indicação (indicado → aprovado → agendado → realizado).
- O badge no menu mostra quantas indicações esperam a sua ação.` },
  { id:'alertas', em:'🔔', titulo:'Avisos', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'A central da secretaria: alertas automáticos + relatórios a enviar.',
    passos:`## O que gera aviso (sozinho)
- **3 faltas consecutivas** de um aluno.
- Sem material em **3 aulas seguidas** ou **5 alternadas**.
- Aula **VIP prevista** sem lançamento há mais de 24h.
- **💰 Mensalidade vencida** (secretaria vê quem contatar; os valores detalhados só a direção).
## Como usar
1. Contate a família e toque em **✓ Contatei** — o aviso some.
2. O contato vale para a **sequência atual**: se o aluno voltar a faltar 3x mais adiante, o aviso **volta a aparecer** (é assim mesmo).
3. Na mesma tela ficam os **relatórios de aula prontos**: copie para o grupo de WhatsApp da turma e marque **enviado**.
## Pausas
Em recesso/férias cadastrados, os alertas de falta/material param sozinhos.` },
  { id:'comunicados', em:'📣', titulo:'Comunicados', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Avisos gerais para as famílias — reunião de pais, recesso, eventos.',
    passos:`## Como usar
1. Escreva o **título** e o **texto** do comunicado.
2. Escolha o público: **todas as turmas** ou turmas específicas.
3. O comunicado fica registrado com data e autor — copie para o WhatsApp dos grupos.
## Boas práticas
- Um comunicado por assunto, texto curto.
- Datas importantes (reunião, recesso) também entram em **Recessos** quando pausam as aulas.` },
  { id:'turmas', em:'🏫', titulo:'Turmas', grp:'Gestão', roles:['professor','secretaria','direcao'],
    resumo:'Ver as turmas, horários e alunos.',
    passos:`## Como usar
- Veja as turmas, horários e alunos.
- Professores veem as **suas** turmas; secretaria e direção veem todas.
- **➕ Nova turma** (secretaria e direção): o card fica no topo da tela — nome, categoria e nível.
- **Níveis oficiais**: KIDS Pré A1 → A1+ · JUNIOR A1 → A2+ · TEENS/ADULTS A1, A2, B1, B1+, B2, C1 e C1+ (não existe B2+). Precisou de outro? Cadastre em ⚙️ Config. financeira → 🧩 Produtos.
- Ao abrir uma turma, as ações ficam em **quadradinhos** (chamada, planos, testes, linha do tempo, tema extra, relatórios) — um toque em cada um.
- Na lista de alunos da turma ficam só o **nome e as ações** — e-mail do responsável e nascimento são editados na 📇 **ficha do aluno**.
- Para a secretaria, as ações de **sala de aula** (chamada, planos, testes) são somente leitura; o **cadastro** (turmas e alunos) ela edita.` },
  { id:'alunos', em:'🧑‍🎓', titulo:'Alunos', grp:'Gestão', roles:['professor','secretaria','direcao'],
    resumo:'O diretório de todos os alunos, com busca e dados de contato.',
    passos:`## Como usar
- **Busque** por nome — o resultado mostra a turma e atalhos para a 🏫 turma e a 📇 ficha.
- E-mail do responsável e nascimento são editados na 📇 **ficha do aluno**.
- **Arquivar** tira o aluno das turmas e alertas sem apagar o histórico (reativável).
## Ligações
- Trocar de turma: botão 🔄 (ou em Trocar/criar turma).
- Virar VIP: botão ⭐ (o histórico fica preservado).` },
  { id:'dupes', em:'🧹', titulo:'Limpar duplicidades', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Faxina segura: encontra alunos e turmas repetidos.',
    passos:`## Como usar
1. A varredura roda sozinha ao abrir a tela e lista possíveis repetidos (nomes muito parecidos).
2. Confira caso a caso antes de juntar/remover — **um dos registros pode ter histórico** (chamadas, notas).
## Dica
Duplicidade costuma nascer no "+ Aluno" com nome digitado diferente. O app avisa quando você tenta criar um nome que já existe — prefira **reaproveitar** o cadastro existente.` },
  { id:'gturmas', em:'🔄', titulo:'Trocar / criar turma', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Criar turmas novas e mover alunos entre turmas.',
    passos:`## Criar turma
- Informe segmento, nível CEFR, dias e horário — o **nome sai sozinho** no padrão \`CEFR + SEGMENTO + DIAS + HORA\` (ex.: *A2+ JUNIOR SEG/QUA 18h*).
- Segmentos e níveis novos? A direção cadastra em ⚙️ Config. financeira → **🧩 Produtos** e eles aparecem aqui.
## Mover aluno
- Escolha o aluno, a turma de origem e a de destino — o histórico vai junto.
## Veja também
**🔁 Status e sequência de turmas** (direção): em formação/vigente/encerrada e criação da turma continuação com o próximo nível sugerido.` },
  { id:'gestaoturmas', em:'🔁', titulo:'Status e sequência de turmas', grp:'Gestão', roles:['direcao'],
    resumo:'Status da turma (em formação, vigente, encerrada) e criação de sequências.',
    passos:`## Status
Cada turma tem um status: **EM FORMAÇÃO** (montando), **VIGENTE** (rodando) e **ENCERRADA** (arquivada).
## Sequência
- Na lista de turmas, use **🔁 Sequência** para criar a continuação de uma turma existente.
- A sequência **herda** dias, horário e professor, e o app **sugere o próximo nível** do CEFR (ex.: A2 → A2+).
- A turma nova nasce **em formação** com o nome já no padrão.` },
  { id:'estoque', em:'📚', titulo:'Livros', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Compra sob demanda: pedir → chegou na escola → entregar ao aluno.',
    passos:`## O que é
A escola compra os livros conforme as matrículas — sem estoque parado. Cada livro segue o fluxo **🛒 pedido → 📦 recebido → ✅ entregue**.
## Como usar
- **A pedir:** o app lista sozinho quem precisa de livro (turmas com coleção + VIPs com material) — "pedir" um a um ou **pedir todos** da turma.
- Quando o livro chega: **📦 chegou**. Quando vai para a mão do aluno: **✅ entregar**.
- Em lote: **📦 chegou tudo** e **✅ entregar todos** fazem a etapa inteira de uma vez (a cobrança dos materiais pode ser lançada junta ou ficar pendente no Financeiro).
- **Pedido avulso** para reposições; **planilha (CSV)** com tudo.
- Na **ficha do aluno**, o card 📚 mostra o estágio e a próxima ação.
## Cobrança
Ao entregar para aluno de turma, a **direção** pode lançar o material no financeiro pela tabela do segmento (não duplica). Entrega para VIP não cobra.` },
  { id:'matriculas', em:'📝', titulo:'Matrículas', grp:'Gestão', roles:['direcao'],
    resumo:'Orçamentos, matrículas e contrato — o cadastro comercial.',
    passos:`## Só direção
## Como usar
- **⚡ Fechar venda:** a venda inteira numa sequência guiada — aluno e turma → valores (já puxados da tabela do segmento) → confirmar. Cria o aluno na turma, a matrícula ATIVA, o plano financeiro e já pede o livro, tudo de uma vez.
- **Orçamento:** monte a proposta (aluno, turma, valores da tabela) e **exporte em PDF** — os orçamentos ficam num atalho próprio para apoiar a venda.
- **Converter** o orçamento em matrícula quando fechar (cria o aluno e o plano financeiro).
- Venda não fechou? **✖ não fechou** registra o **motivo** (vira aprendizado comercial; dá para reabrir). Orçamentos também podem ser **🗑 excluídos**.
- Status da matrícula: orçamento, **ativa**, trancada, concluída, cancelada.
- **📄 Contrato oficial:** gera o contrato com o **texto oficial da escola** (cláusulas jurídicas completas), já preenchido com aluno, responsável, turma, período e as parcelas do plano financeiro — pronto para imprimir e assinar, em até 4 páginas. Preencha **endereço**, fim do período e modalidade na matrícula para o quadro sair completo.` },
  { id:'financeiro', em:'💰', titulo:'Financeiro', grp:'Gestão', roles:['direcao'],
    resumo:'Carnê de parcelas, descontos, negociação, extras e recebimentos.',
    passos:`## Só direção
## Como usar
- Cada matrícula tem um **plano**: mensalidade, nº de parcelas, vencimento e descontos (em **%** e em **R$**).
- **Carnê:** receba parcelas manualmente (registra a forma de pagamento); parcela paga ganha **🖨️ recibo** em PDF na hora (extras pagos também); **boleto** e **cartão** por enquanto são **simulação** (as integrações vêm depois).
- **Negociação de valores:** troca o valor da mensalidade e **exige a senha da direção**.
- **Cobranças extras** (ex.: material didático) somam nos totais e no PDF.
- Atraso aplica **multa e juros** conforme a Config. financeira.` },
  { id:'configfin', em:'⚙️', titulo:'Config. financeira', grp:'Gestão', roles:['direcao'],
    resumo:'Tabela de preços por segmento, hora VIP, cobranças diversas, multa e juros.',
    passos:`## Só direção
## O que se define aqui
- **Preços por segmento** (Kids, Junior, Teens, Adults, Talking): taxa de matrícula, valor anual do curso e material.
- **Valor da hora-aula VIP** — renovação, **aluno novo** e **👥 em dupla** (valor por aluno).
- **Política de descontos** (ex.: família 5% + à vista 5%) — o texto sai no PDF do orçamento.
- **Cobranças diversas** (itens avulsos com nome e valor).
- **🧩 Produtos:** cadastre segmentos novos (ex.: Conversation Club), níveis (ex.: PRE-A1) e materiais/coleções — eles aparecem na tabela de preços, no cadastro de turmas e nos pedidos de livros.
- **Multa e juros por atraso** — usados no cálculo das parcelas vencidas.` },
  { id:'tarefas', em:'🎯', titulo:'Tarefas internas', grp:'Gestão', roles:['professor','secretaria','direcao'],
    resumo:'Matriz de Eisenhower da equipe — com Standby no lugar de "delegar".',
    passos:`## Como usar
- Crie tarefas no quadrante certo: **✅ Fazer agora** (urgente e importante), **📅 Agendar** (importante, sem pressa), **⏸️ Standby** (urgente, mas não importante — fica aguardando) e **🗑️ Eliminar** (nem um, nem outro).
- Defina **responsável** e **prazo**; tarefa vencida fica marcada em vermelho.
- Marque a caixinha para **concluir** (e reabra se precisar).
- Excluir: só a direção ou quem criou a tarefa.` },
  { id:'permissoes', em:'🔐', titulo:'Permissões', grp:'Gestão', roles:['direcao'],
    resumo:'Ligar/desligar o que a secretaria e os professores podem fazer.',
    passos:`## Só direção
## Como usar
- Cada chave liga/desliga uma ação de um perfil — ex.: secretaria **cadastrar turmas/alunos**, mexer nas **horas VIP**, **pausar VIP**, gerenciar **livros**; professor **excluir plano**, **lançar aula VIP**, **editar chamada salva**…
- Desligou, o botão some ou a ação é bloqueada na hora, e o item pode sumir do menu do perfil.
- **Restaurar padrão** volta tudo ao comportamento original.
- A direção **sempre** pode tudo.` },
  { id:'cards', em:'🖨️', titulo:'Cards de acesso', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Cartõezinhos com QR + login + senha do portal, prontos para imprimir.',
    passos:`## Como usar
1. Escolha o escopo: **uma turma**, **um aluno** ou **todas as turmas**.
2. **Gerar cards** abre a folha agrupada por turma, pronta para imprimir ou salvar em PDF.
3. Entregue o cartão ao aluno (vale colar no livro) — nele vão o QR do portal, o login e a senha inicial.
## Bom saber
- Gerar os cards também **conserta logins antigos** para o formato único (nome+sobrenome).
- No 1º acesso o aluno é obrigado a **criar uma senha nova** — a do card deixa de valer.` },
  { id:'acessos', em:'🔑', titulo:'Acessos', grp:'Gestão', roles:['direcao'],
    resumo:'Senhas da equipe, logins do portal, assinatura e backup.',
    passos:`## Só direção
O centro de administração do app.
## O que dá para fazer
- **Senhas da equipe:** trocar a senha de qualquer usuário e **criar usuários novos** (a conta de login é criada na hora — a pessoa já entra).
- **Logins do portal do aluno:** criar em lote os acessos de uma turma (quem já tem é pulado).
- **Assinatura e e-mail da escola:** aparecem nos relatórios às famílias.
- **Backup:** baixar uma cópia de todos os dados ou restaurar de um arquivo. Além disso, o servidor guarda **backups automáticos a cada 6h** e o histórico das últimas versões.
## Veja também
**🖨️ Cards de acesso** para imprimir login+senha dos alunos.` },
  { id:'portal', em:'👨‍👩‍👧', titulo:'Portal do Aluno (famílias)', grp:'Famílias', roles:['professor','secretaria','direcao'],
    resumo:'O que a família vê no portal, com o próprio login.',
    passos:`## O que é
Uma página separada (portal-aluno) onde o aluno/família entra com o próprio login e vê **as informações dele, ao vivo** — a escola não precisa publicar nada.
## O que a família vê
- No topo, **quadradinhos** para cada seção (Aulas, Writings, Testes, Temas, Comentários e Boletim), cada um com o número de registros.
- Aulas (com o que foi trabalhado), faltas, temas pendentes, testes, writings com o relatório completo e comentários do professor.
- O **boletim** aparece com cadeado até a direção **aprovar** — depois, liberado.
- Botão **Baixar ficha em PDF**.
## Segurança
Cada login só enxerga os dados do próprio aluno (LGPD) — a ponte é feita no servidor.
## Primeiro acesso
Login no formato nome+sobrenome (ex.: sofiamartins@tgt.app), senha do card e **troca obrigatória de senha** na 1ª entrada. Alunos VIP ainda não têm portal.` },
];
function tutFiltro(p){ _tutPerfil=p; VIEWS.tutorial(); }
VIEWS.tutorial=()=>{
  const v=document.getElementById('view');
  const ehDir=(S.perfil==='direcao');
  const chips=[['todos','Todos'],['professor','Professor'],['secretaria','Secretaria'],['direcao','Direção']];
  const meu=PERFIS[S.perfil]||PERFIS.professor;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Tutorial</h2></div>
    <p class="sub">${ehDir?'Guia ilustrado de todas as telas. Toque em um item para ver o print e o passo a passo.':'O seu guia ilustrado do app — só o que faz parte do <b>seu</b> dia a dia. Toque em um item para ver o print e o passo a passo.'}</p>
    ${ehDir?'':`<div class="card" style="padding:12px 16px"><p class="hint" style="margin:0">Você está vendo o tutorial de <span class="tag" style="background:${meu.bg};color:${meu.cor}">${meu.nome}</span> — ele se ajusta sozinho quando a direção muda as suas permissões.</p></div>`}
    ${ehDir?`<div style="display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 4px">
      ${chips.map(([k,l])=>`<button class="btn ${_tutPerfil===k?'':'ghost'} sm" onclick="tutFiltro('${k}')">${l}</button>`).join('')}
    </div>`:''}
    <div id="tutBox"></div>`;
  _tutRender(document.getElementById('tutBox'));
};
function _tutRender(box){
  const grupos=['Início','Sala de aula','Acompanhamento','Gestão','Famílias'];
  const itens=TUTORIAL.filter(_tutVisivel);
  if(!itens.length){ box.appendChild(el('<div class="card empty"><div class="big">🔍</div><b>Nada para este perfil</b></div>')); return; }
  const mostraTags=(S.perfil==='direcao');
  grupos.forEach(g=>{
    const gi=itens.filter(t=>t.grp===g); if(!gi.length) return;
    box.appendChild(el(`<h3 style="margin:18px 0 10px;font-size:1rem">${esc(g)}</h3>`));
    gi.forEach(t=>{
      const img=_tutImg(t);
      box.appendChild(el(`<div class="card" style="cursor:pointer;padding:16px" onclick="tutAbrir('${t.id}')">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="font-size:1.7rem;line-height:1">${t.em}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:1.02rem">${esc(t.titulo)}</b>
            <p class="hint" style="margin:4px 0 8px">${esc(t.resumo)}</p>
            ${mostraTags?`<div style="display:flex;gap:5px;flex-wrap:wrap">${t.roles.map(r=>`<span class="tag" style="background:${PERFIS[r].bg};color:${PERFIS[r].cor};font-size:.7rem">${PERFIS[r].nome}</span>`).join('')}</div>`:''}
          </div>
          ${img?`<img src="${img}" loading="lazy" alt="" style="width:118px;height:74px;object-fit:cover;object-position:top;border-radius:9px;border:1px solid var(--linha);flex:none">`:`<div style="color:var(--tinta-suave);font-size:1.2rem">›</div>`}
        </div></div>`));
    });
  });
}
function tutAbrir(id){
  const t=TUTORIAL.find(x=>x.id===id); if(!t) return;
  const img=_tutImg(t);
  modal(`<h3 style="margin-bottom:6px">${t.em} ${esc(t.titulo)} <button class="close" onclick="fechar()">×</button></h3>
    ${S.perfil==='direcao'?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${t.roles.map(r=>`<span class="tag" style="background:${PERFIS[r].bg};color:${PERFIS[r].cor}">${PERFIS[r].nome}</span>`).join('')}</div>`:''}
    <div style="max-height:62vh;overflow:auto;padding-right:4px">
      ${img?`<img src="${img}" loading="lazy" alt="Print da tela ${escAttr(t.titulo)}" style="width:100%;border-radius:10px;border:1px solid var(--linha);margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.08)">`:''}
      ${_fmFmt(t.passos)}
    </div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn sm" onclick="fechar()">Fechar</button></div>`);
}

/* ===== fim do módulo Planejamento (b69) ===== */
