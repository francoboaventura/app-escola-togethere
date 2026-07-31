/* =========================================================================
   TUTORIAL (b94) — o que cada perfil consegue fazer no app
   Mesmo modelo visual da aba Formação: cards que abrem um modal com o passo a passo.
   ========================================================================= */
let _tutPerfil='todos';
const TUTORIAL=[
  { id:'painel', em:'📊', titulo:'Painel', grp:'Início', roles:['professor','secretaria','direcao'],
    resumo:'Tela inicial com o resumo do dia e atalhos rápidos.',
    passos:`## O que é
A sua porta de entrada no app: um panorama do dia e caminho rápido para o que você mais usa.
## Como usar
- Veja avisos e aniversariantes do dia.
- Use os atalhos para abrir a chamada, lançar notas ou abrir uma ficha.
- Disponível para todos os perfis.` },
  { id:'presenca', em:'📋', titulo:'Chamada do dia', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Fazer a chamada e registrar o que aconteceu com cada aluno.',
    passos:`## Como usar
- Escolha a turma e a data da aula.
- Marque **presente** ou **falta** para cada aluno.
- Registre também **atraso**, **saiu cedo** e **sem material** quando for o caso.
- Se a aula não aconteceu, marque como **cancelada** ou **transferida**.
## Por que importa
Faltas e "sem material" alimentam os **Avisos** automáticos da secretaria.` },
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
  { id:'testes', em:'✏️', titulo:'Testes', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Lançar as notas por habilidade e gerar o boletim.',
    passos:`## Como usar
- Escolha a turma e o número do teste.
- Lance a nota de cada habilidade: **Grammar, Vocabulary, Listening, Reading, Writing, Speaking**.
- A média é calculada sozinha.
- Use **Gerar boletim** para montar o boletim do aluno a partir das notas.
## Dica
Um campo de nota deixado em branco num teste já realizado conta como **zero** na média.` },
  { id:'planos', em:'🗒️', titulo:'Planos de aula', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Montar o plano da aula com checklist e anotações.',
    passos:`## Como usar
- Crie o plano com os itens que pretende trabalhar.
- Marque os itens conforme forem **feitos** (checklist).
- Use o espaço de **anotações** para observações da aula.
## Ligação
Os itens trabalhados podem entrar no **Relatório do dia** enviado às famílias.` },
  { id:'relatorio', em:'🧾', titulo:'Relatório do dia', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Gerar o texto-resumo da aula para enviar aos pais.',
    passos:`## O que é
O resumo automático da aula, em texto, pronto para as famílias.
## Como usar
- Escolha a turma e a data.
- O app monta um resumo com o que foi trabalhado.
- Revise, ajuste se quiser e disponibilize para a secretaria enviar (em **Avisos**).` },
  { id:'planejamento', em:'📅', titulo:'Planejamento', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Planejar as próximas aulas e o andamento do conteúdo.',
    passos:`## Como usar
- Organize o que será dado nas próximas aulas.
- Acompanhe o progresso do conteúdo ao longo do período.` },
  { id:'writings', em:'📝', titulo:'Correção de writings', grp:'Sala de aula', roles:['professor','direcao'],
    resumo:'Corrigir redações com o motor por nível e revisar a nota.',
    passos:`## Como usar
- Escolha o **nível** (A1 a C1) e a tarefa.
- Cole ou transcreva por foto a redação do aluno.
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
    resumo:'Ver tudo do aluno num lugar e enviar por e-mail.',
    passos:`## Como usar
- Busque o aluno.
- Veja presenças/faltas, temas, testes, writings e comentários.
- Gere o **boletim** e envie a ficha por **e-mail** à família.
## Acesso
Professor, secretaria e direção.` },
  { id:'resumo', em:'📄', titulo:'Relatórios por aluno', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Histórico dos relatórios gerados/enviados por aluno.',
    passos:`## Como usar
- Escolha o aluno para ver os relatórios já gerados e enviados.
- Útil para a secretaria acompanhar a comunicação com a família.` },
  { id:'relturma', em:'🏫', titulo:'Relatórios por turma', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Relatórios organizados por turma.',
    passos:`## Como usar
- Escolha a turma para ver o histórico de relatórios daquela turma.` },
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
    resumo:'Arquivo histórico de todos os relatórios.',
    passos:`## Como usar
- Consulte relatórios antigos por aluno, turma ou data.` },
  { id:'vip', em:'👑', titulo:'Alunos VIP', grp:'Acompanhamento', roles:['professor','secretaria','direcao'],
    resumo:'Marcar alunos que pedem atenção especial.',
    passos:`## Como usar
- Cadastre alunos VIP para acompanhamento próximo.
- Disponível para todos os perfis.` },
  { id:'apoio', em:'🤝', titulo:'Aula de apoio', grp:'Acompanhamento', roles:['professor','secretaria','direcao'],
    resumo:'Indicar e acompanhar alunos para reforço.',
    passos:`## Como usar
- Indique alunos que precisam de aula de apoio.
- Acompanhe as indicações em aberto.` },
  { id:'alertas', em:'🔔', titulo:'Avisos', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Alertas automáticos para a secretaria contatar as famílias.',
    passos:`## O que gera aviso
- **3 faltas** consecutivas.
- **3 aulas seguidas** sem material, ou **5 alternadas**.
## Como usar
- A secretaria vê a lista, contata a família e **registra o contato**.
- Aqui também saem os relatórios prontos para envio às famílias.` },
  { id:'comunicados', em:'📣', titulo:'Comunicados', grp:'Acompanhamento', roles:['secretaria','direcao'],
    resumo:'Enviar comunicados às famílias ou à equipe.',
    passos:`## Como usar
- Monte o comunicado e envie para o público desejado.` },
  { id:'turmas', em:'🏫', titulo:'Turmas', grp:'Gestão', roles:['professor','secretaria','direcao'],
    resumo:'Ver as turmas, horários e alunos.',
    passos:`## Como usar
- Veja as turmas, horários e alunos.
- Professores veem as **suas** turmas; secretaria e direção veem todas.
- A secretaria tem acesso **somente leitura** às turmas.` },
  { id:'alunos', em:'🧑‍🎓', titulo:'Alunos', grp:'Gestão', roles:['professor','secretaria','direcao'],
    resumo:'Cadastro e dados dos alunos.',
    passos:`## Como usar
- Consulte e edite os dados dos alunos.
- Veja a qual turma cada um pertence.` },
  { id:'dupes', em:'🧹', titulo:'Limpar duplicidades', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Encontrar e resolver alunos/turmas repetidos.',
    passos:`## Como usar
- Rode a varredura de duplicidades.
- Junte ou remova registros repetidos com cuidado.` },
  { id:'gturmas', em:'🔄', titulo:'Trocar / criar turma', grp:'Gestão', roles:['secretaria','direcao'],
    resumo:'Criar turmas novas e mover alunos entre turmas.',
    passos:`## Como usar
- Crie uma turma nova (trilha, nível, dias).
- Troque alunos de turma quando necessário.` },
  { id:'acessos', em:'🔑', titulo:'Acessos', grp:'Gestão', roles:['direcao'],
    resumo:'Senhas da equipe, logins do portal, cards, assinatura e backup.',
    passos:`## Só direção
O centro de administração do app.
## O que dá para fazer
- **Senhas da equipe:** definir/trocar senha e criar novos usuários (professor, secretaria, direção).
- **Logins do portal do aluno:** criar em lote os acessos de uma turma (login + senha); quem já tem é pulado.
- **Cards de acesso:** gerar cartõezinhos com QR + login + senha para imprimir e colar nos livros.
- **Assinatura e e-mail da escola:** usados nos relatórios às famílias.
- **Backup:** baixar/restaurar uma cópia de todos os dados.` },
  { id:'portal', em:'👨‍👩‍👧', titulo:'Portal do Aluno (famílias)', grp:'Famílias', roles:['professor','secretaria','direcao'],
    resumo:'O que a família vê no portal, com o próprio login.',
    passos:`## O que é
Uma página separada onde o aluno/família entra com o próprio login.
## O que a família vê
- Aulas, faltas, temas pendentes, testes, writings e comentários.
- O **boletim** só aparece depois que a direção **aprova**.
## Primeiro acesso
No primeiro login, o aluno precisa **criar uma senha nova**.
## Como o acesso chega
O login é criado pela direção em **Acessos** e entregue pelos **cards** (QR + login + senha).` },
];
function tutFiltro(p){ _tutPerfil=p; VIEWS.tutorial(); }
VIEWS.tutorial=()=>{
  const v=document.getElementById('view');
  const chips=[['todos','Todos'],['professor','Professor'],['secretaria','Secretaria'],['direcao','Direção']];
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Tutorial</h2></div>
    <p class="sub">O que cada perfil consegue fazer no app — guia de consulta rápida. Toque em um item para ver o passo a passo.</p>
    <div class="card" style="padding:14px 16px">
      <p class="hint" style="margin:0 0 8px">Perfis de acesso do app:</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="tag" style="background:${PERFIS.professor.bg};color:${PERFIS.professor.cor}">👩‍🏫 Professor(a)</span>
        <span class="tag" style="background:${PERFIS.secretaria.bg};color:${PERFIS.secretaria.cor}">🗂️ Secretaria</span>
        <span class="tag" style="background:${PERFIS.direcao.bg};color:${PERFIS.direcao.cor}">🎓 Direção</span>
      </div>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 4px">
      ${chips.map(([k,l])=>`<button class="btn ${_tutPerfil===k?'':'ghost'} sm" onclick="tutFiltro('${k}')">${l}</button>`).join('')}
    </div>
    <div id="tutBox"></div>`;
  _tutRender(document.getElementById('tutBox'));
};
function _tutRender(box){
  const grupos=['Início','Sala de aula','Acompanhamento','Gestão','Famílias'];
  const itens=TUTORIAL.filter(t=>_tutPerfil==='todos'||t.roles.indexOf(_tutPerfil)>=0);
  if(!itens.length){ box.appendChild(el('<div class="card empty"><div class="big">🔍</div><b>Nada para este perfil</b></div>')); return; }
  grupos.forEach(g=>{
    const gi=itens.filter(t=>t.grp===g); if(!gi.length) return;
    box.appendChild(el(`<h3 style="margin:18px 0 10px;font-size:1rem">${esc(g)}</h3>`));
    gi.forEach(t=>{
      box.appendChild(el(`<div class="card" style="cursor:pointer;padding:16px" onclick="tutAbrir('${t.id}')">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="font-size:1.7rem;line-height:1">${t.em}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:1.02rem">${esc(t.titulo)}</b>
            <p class="hint" style="margin:4px 0 8px">${esc(t.resumo)}</p>
            <div style="display:flex;gap:5px;flex-wrap:wrap">${t.roles.map(r=>`<span class="tag" style="background:${PERFIS[r].bg};color:${PERFIS[r].cor};font-size:.7rem">${PERFIS[r].nome}</span>`).join('')}</div>
          </div>
          <div style="color:var(--tinta-suave);font-size:1.2rem">›</div>
        </div></div>`));
    });
  });
}
function tutAbrir(id){
  const t=TUTORIAL.find(x=>x.id===id); if(!t) return;
  modal(`<h3 style="margin-bottom:6px">${t.em} ${esc(t.titulo)} <button class="close" onclick="fechar()">×</button></h3>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">${t.roles.map(r=>`<span class="tag" style="background:${PERFIS[r].bg};color:${PERFIS[r].cor}">${PERFIS[r].nome}</span>`).join('')}</div>
    <div style="max-height:56vh;overflow:auto;padding-right:4px">${_fmFmt(t.passos)}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn sm" onclick="fechar()">Fechar</button></div>`);
}

/* ===== fim do módulo Planejamento (b69) ===== */
