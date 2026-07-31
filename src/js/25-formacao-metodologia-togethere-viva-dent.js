/* =========================================================================
   FORMAÇÃO (b89) — metodologia Togethere viva dentro do app
   • Biblioteca de tópicos (conteúdo editável pela direção, mora em S.formacao)
   • Percurso do professor: cada tópico "vence" depois de N meses → volta a
     aparecer como "revisar" (é o que impede o módulo de morrer)
   • Painel da direção: quem está em dia, quem precisa revisar
   • Sessões de formação: a direção registra um treinamento e marca todos os
     participantes de uma vez
   ARMAZENAMENTO: S.formacao / S.formacaoReg / S.formacaoSessoes (em MERGE_COLS,
   com atualizadoEm e marcarExcluido — sincroniza entre aparelhos).
   ========================================================================= */
let _fmAba='biblioteca';

function _fmTopicos(){ return (S.formacao||[]).slice().sort((a,b)=>(a.ordem||0)-(b.ordem||0)); }
function _fmProfs(){ return (S.usuarios||[]).filter(u=>u.ensina).sort((a,b)=>a.nome.localeCompare(b.nome)); }
function _fmEnsino(){ const u=(S.usuarios||[]).find(u=>u.nome===S.usuario); return !!(u&&u.ensina); }
function _fmMesesMs(m){ return (m||6)*30.44*24*3600*1000; }
function _fmUltimo(topicoId, usuario){
  let t=0;
  (S.formacaoReg||[]).forEach(r=>{ if(r.topicoId===topicoId && r.usuario===usuario && (r.ts||0)>t) t=r.ts||0; });
  return t;
}
function _fmStatus(top, usuario){
  const ts=_fmUltimo(top.id, usuario);
  if(!ts) return {k:'novo', ts:0};
  if(Date.now()-ts > _fmMesesMs(top.revisarMeses)) return {k:'revisar', ts};
  return {k:'ok', ts};
}
const _FM_CHIP={
  novo:    {t:'novo',      bg:'#eaf3ff', c:'var(--azul)'},
  revisar: {t:'revisar',   bg:'#fff8e0', c:'#b88600'},
  ok:      {t:'em dia',    bg:'#eafaf0', c:'#1a8a4a'}
};
function _fmChip(k){ const c=_FM_CHIP[k]||_FM_CHIP.novo; return `<span class="tag" style="background:${c.bg};color:${c.c}">${c.t}</span>`; }
function formacaoBadge(){
  if(!_fmEnsino()) return 0;
  return _fmTopicos().filter(t=>_fmStatus(t,S.usuario).k!=='ok').length;
}
/* formatador leve: "## título", "- item", "1. item", **negrito** */
function _fmFmt(txt){
  const linhas=esc(txt||'').split(/\r?\n/);
  let out='', lista=null;
  const fim=()=>{ if(lista){ out+='</'+lista+'>'; lista=null; } };
  linhas.forEach(l=>{
    const s=l.trim();
    if(!s){ fim(); return; }
    if(s.slice(0,3)==='## '){ fim(); out+=`<h4 style="margin:16px 0 6px;font-size:.98rem;color:var(--azul)">${s.slice(3)}</h4>`; return; }
    let m=s.match(/^[-•]\s+(.*)$/);
    if(m){ if(lista!=='ul'){ fim(); out+='<ul style="margin:6px 0 6px 20px">'; lista='ul'; } out+=`<li style="margin:3px 0">${m[1]}</li>`; return; }
    m=s.match(/^\d+[.)]\s+(.*)$/);
    if(m){ if(lista!=='ol'){ fim(); out+='<ol style="margin:6px 0 6px 20px">'; lista='ol'; } out+=`<li style="margin:3px 0">${m[1]}</li>`; return; }
    fim(); out+=`<p style="margin:6px 0">${s}</p>`;
  });
  fim();
  return out.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
}

/* ---------------------------- TELA ---------------------------- */
VIEWS.formacao=()=>{
  const v=document.getElementById('view');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--amarelo)"></span><h2 class="display">Formação</h2></div>
    <p class="sub">A metodologia Togethere sempre à mão — biblioteca de consulta.</p>
    <div id="fmBox"></div>`;
  _fmRenderBiblioteca(document.getElementById('fmBox'));
};
function fmAba(a){ _fmAba=a; VIEWS.formacao(); }

function _fmRenderBiblioteca(box){
  const tops=_fmTopicos(), dir=(S.perfil==='direcao'), ensina=_fmEnsino();
  if(dir) box.appendChild(el(`<div style="margin-bottom:14px"><button class="btn" onclick="fmNovoTopico()">➕ Novo tópico</button></div>`));
  if(!tops.length){ box.appendChild(el('<div class="card empty"><div class="big">📚</div><b>Nenhum tópico ainda</b><br>A direção pode criar o primeiro pelo botão acima.</div>')); return; }
  tops.forEach(t=>{
    box.appendChild(el(`<div class="card" style="cursor:pointer;padding:16px" onclick="fmAbrir('${t.id}')">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:1.7rem;line-height:1">${t.emoji||'📘'}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <b style="font-size:1.02rem">${esc(t.titulo)}</b>
          </div>
          <p class="hint" style="margin:4px 0 0">${esc(t.resumo||'')}</p>
        </div>
        <div style="color:var(--tinta-suave);font-size:1.2rem">›</div>
      </div></div>`));
  });
}

function _fmRenderPercurso(box){
  const tops=_fmTopicos();
  const pend=tops.filter(t=>_fmStatus(t,S.usuario).k!=='ok');
  const ok=tops.filter(t=>_fmStatus(t,S.usuario).k==='ok');
  box.appendChild(el(`<div class="card" style="background:${pend.length?'#fff8e0':'#eafaf0'};padding:14px 16px">
    <b>${pend.length? pend.length+' tópico(s) para ver ou revisar' : 'Tudo em dia 🎉'}</b>
    <p class="hint" style="margin:4px 0 0">Cada tópico volta para revisão depois do prazo definido pela direção.</p></div>`));
  const linha=t=>{
    const st=_fmStatus(t,S.usuario);
    return el(`<div class="card" style="cursor:pointer;padding:14px 16px" onclick="fmAbrir('${t.id}')">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:1.2rem">${t.emoji||'📘'}</span>
        <b style="flex:1;min-width:120px">${esc(t.titulo)}</b>${_fmChip(st.k)}
      </div>
      <p class="hint" style="margin:6px 0 0">${st.ts? 'Última vez: '+brDate(ymd(new Date(st.ts))) : 'Ainda não registrado'} · revisar a cada ${t.revisarMeses||6} meses</p>
    </div>`);
  };
  if(pend.length){ box.appendChild(el(`<h3 style="margin:18px 0 10px;font-size:1rem">⏳ Pendentes (${pend.length})</h3>`)); pend.forEach(t=>box.appendChild(linha(t))); }
  if(ok.length){ box.appendChild(el(`<h3 style="margin:18px 0 10px;font-size:1rem">✅ Em dia (${ok.length})</h3>`)); ok.forEach(t=>box.appendChild(linha(t))); }
}

function _fmRenderPainel(box){
  const tops=_fmTopicos(), profs=_fmProfs();
  if(!profs.length){ box.appendChild(el('<div class="card empty"><div class="big">👥</div><b>Nenhum professor cadastrado</b><br>Marque o campo "ensina" em Acessos.</div>')); return; }
  box.appendChild(el(`<div style="margin-bottom:14px"><button class="btn" onclick="fmNovaSessao()">📌 Registrar sessão de formação</button></div>`));
  profs.forEach(p=>{
    const sts=tops.map(t=>({t, st:_fmStatus(t,p.nome)}));
    const pend=sts.filter(x=>x.st.k!=='ok').length;
    box.appendChild(el(`<div class="card" style="padding:16px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <b style="flex:1;min-width:120px">${esc(p.nome)}</b>
        <span class="tag" style="background:${pend?'#fff8e0':'#eafaf0'};color:${pend?'#b88600':'#1a8a4a'}">${pend? pend+' pendente(s)':'em dia'}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${sts.map(x=>{
        const c=_FM_CHIP[x.st.k];
        return `<span class="tag" style="background:${c.bg};color:${c.c}" title="${esc(x.t.titulo)}">${x.t.emoji||'📘'} ${esc(x.t.titulo)}</span>`;
      }).join('')||'<span class="hint">Sem tópicos cadastrados.</span>'}</div></div>`));
  });
}

function _fmRenderSessoes(box){
  const ss=(S.formacaoSessoes||[]).slice().sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  box.appendChild(el(`<div style="margin-bottom:14px"><button class="btn" onclick="fmNovaSessao()">📌 Registrar sessão de formação</button></div>`));
  if(!ss.length){ box.appendChild(el('<div class="card empty"><div class="big">📌</div><b>Nenhuma sessão registrada</b><br>Registre os treinamentos para manter o histórico da equipe.</div>')); return; }
  ss.forEach(s=>{
    const nt=(s.topicos||[]).length, np=(s.participantes||[]).length;
    box.appendChild(el(`<div class="card" style="padding:16px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <b style="flex:1;min-width:140px">${esc(s.titulo||'Sessão de formação')}</b>
        <span class="hint">${brDate(s.data)}</span>
      </div>
      <p class="hint" style="margin:6px 0 10px">${np} participante(s) · ${nt} tópico(s) · por ${esc(s.por||'—')}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ghost sm" onclick="fmVerSessao('${s.id}')">👁 Ver</button>
        <button class="btn ghost sm" onclick="fmExcluirSessao('${s.id}')">🗑 Excluir</button>
      </div></div>`));
  });
}

/* ---------------------------- TÓPICO ---------------------------- */
function fmAbrir(id){
  const t=(S.formacao||[]).find(x=>x.id===id); if(!t) return;
  const dir=(S.perfil==='direcao');
  modal(`<h3 style="margin-bottom:4px">${t.emoji||'📘'} ${esc(t.titulo)} <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:14px">${esc(t.resumo||'')}</p>
    <div style="max-height:52vh;overflow:auto;padding-right:4px">${_fmFmt(t.conteudo)}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end;gap:8px">
      ${dir?`<button class="btn ghost sm" style="flex:none" onclick="fmEditarTopico('${t.id}')">✏️ Editar</button>`:''}
      ${dir?`<button class="btn ghost sm" style="flex:none" onclick="fmExcluirTopico('${t.id}')">🗑</button>`:''}
    </div>`);
}
function fmMarcarLido(id){
  S.formacaoReg=S.formacaoReg||[];
  S.formacaoReg.push({id:uid(), topicoId:id, usuario:S.usuario, ts:Date.now(), tipo:'leitura', atualizadoEm:Date.now()});
  save(); fechar(); VIEWS.formacao(); montarNav(); toast('Registrado — obrigado!');
}
function fmNovoTopico(){ _fmFormTopico(null); }
function fmEditarTopico(id){ _fmFormTopico((S.formacao||[]).find(x=>x.id===id)); }
function _fmFormTopico(t){
  const n=!t;
  modal(`<h3 style="margin-bottom:14px">${n?'➕ Novo tópico':'✏️ Editar tópico'} <button class="close" onclick="fechar()">×</button></h3>
    <div class="row">
      <div class="field" style="max-width:90px"><label class="lbl">Ícone</label><input id="fmEmoji" value="${esc((t&&t.emoji)||'📘')}"></div>
      <div class="field" style="flex:3"><label class="lbl">Título</label><input id="fmTit" value="${esc((t&&t.titulo)||'')}" placeholder="Ex.: TGT Class Framework"></div>
    </div>
    <div class="field"><label class="lbl">Resumo (uma linha)</label><input id="fmRes" value="${esc((t&&t.resumo)||'')}" placeholder="Aparece na lista da biblioteca"></div>
    <div class="field"><label class="lbl">Conteúdo</label>
      <textarea id="fmCont" rows="12" placeholder="Use ## para subtítulos, - para listas, 1. para passos e **negrito**">${esc((t&&t.conteudo)||'')}</textarea>
      <p class="hint" style="margin:4px 0 0">## subtítulo · - item · 1. passo · **negrito**</p></div>
    <div class="row">
      <div class="field"><label class="lbl">Revisar a cada (meses)</label><input id="fmRev" type="number" min="1" max="60" value="${(t&&t.revisarMeses)||6}"></div>
      <div class="field"><label class="lbl">Ordem na lista</label><input id="fmOrd" type="number" value="${(t&&t.ordem)||( _fmTopicos().length+1)*10}"></div>
    </div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" onclick="fmSalvarTopico(${t?"'"+t.id+"'":'null'})">Salvar</button>
    </div>`);
}
function fmSalvarTopico(id){
  const titulo=(document.getElementById('fmTit').value||'').trim();
  if(!titulo) return toast('Dê um título ao tópico');
  const dados={
    titulo,
    emoji:(document.getElementById('fmEmoji').value||'📘').trim(),
    resumo:(document.getElementById('fmRes').value||'').trim(),
    conteudo:document.getElementById('fmCont').value||'',
    revisarMeses:Math.max(1, +document.getElementById('fmRev').value||6),
    ordem:+document.getElementById('fmOrd').value||0,
    atualizadoEm:Date.now()
  };
  S.formacao=S.formacao||[];
  if(id){ const t=S.formacao.find(x=>x.id===id); if(t) Object.assign(t,dados); }
  else { S.formacao.push(Object.assign({id:uid(), criadoEm:Date.now(), por:S.usuario}, dados)); }
  save(); fechar(); VIEWS.formacao(); montarNav(); toast('Tópico salvo');
}
function fmExcluirTopico(id){
  if(!confirm('Excluir este tópico da biblioteca? O histórico de quem já leu será mantido.')) return;
  S.formacao=(S.formacao||[]).filter(x=>x.id!==id);
  marcarExcluido('formacao', id);
  save(); fechar(); VIEWS.formacao(); montarNav(); toast('Tópico excluído');
}

/* ---------------------------- SESSÃO ---------------------------- */
function fmNovaSessao(){
  const tops=_fmTopicos(), profs=_fmProfs();
  if(!tops.length) return toast('Cadastre ao menos um tópico primeiro');
  if(!profs.length) return toast('Nenhum professor cadastrado');
  modal(`<h3 style="margin-bottom:4px">📌 Registrar sessão de formação <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:14px">Marca de uma vez todos os participantes nos tópicos cobertos.</p>
    <div class="row">
      <div class="field"><label class="lbl">Data</label><input id="fsData" type="date" value="${hoje()}"></div>
      <div class="field" style="flex:2"><label class="lbl">Título</label><input id="fsTit" placeholder="Ex.: Treinamento inicial — Maitê"></div>
    </div>
    <div class="field"><label class="lbl">Tópicos cobertos</label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;max-height:26vh;overflow:auto">
      ${tops.map(t=>`<label class="check" style="cursor:pointer"><input type="checkbox" class="fsTop" value="${t.id}" style="width:auto;margin-right:8px"> ${t.emoji||'📘'} ${esc(t.titulo)}</label>`).join('')}
      </div></div>
    <div class="field"><label class="lbl">Participantes</label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;max-height:26vh;overflow:auto">
      ${profs.map(p=>`<label class="check" style="cursor:pointer"><input type="checkbox" class="fsPart" value="${esc(p.nome)}" style="width:auto;margin-right:8px"> ${esc(p.nome)}</label>`).join('')}
      </div></div>
    <div class="field"><label class="lbl">Anotações (opcional)</label><textarea id="fsNotas" rows="3" placeholder="O que foi trabalhado, combinados, próximos passos…"></textarea></div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" onclick="fmSalvarSessao()">Salvar sessão</button>
    </div>`);
}
function fmSalvarSessao(){
  const topicos=[...document.querySelectorAll('.fsTop:checked')].map(c=>c.value);
  const participantes=[...document.querySelectorAll('.fsPart:checked')].map(c=>c.value);
  if(!topicos.length) return toast('Marque ao menos um tópico');
  if(!participantes.length) return toast('Marque ao menos um participante');
  const data=document.getElementById('fsData').value||hoje();
  const titulo=(document.getElementById('fsTit').value||'').trim()||'Sessão de formação';
  const notas=(document.getElementById('fsNotas').value||'').trim();
  const sid=uid(), ts=_ymdToTs(data);
  S.formacaoSessoes=S.formacaoSessoes||[];
  S.formacaoSessoes.push({id:sid, data, titulo, topicos, participantes, notas, por:S.usuario, criadoEm:Date.now(), atualizadoEm:Date.now()});
  S.formacaoReg=S.formacaoReg||[];
  participantes.forEach(p=>topicos.forEach(tid=>{
    S.formacaoReg.push({id:uid(), topicoId:tid, usuario:p, ts, tipo:'sessao', sessaoId:sid, atualizadoEm:Date.now()});
  }));
  save(); fechar(); _fmAba='sessoes'; VIEWS.formacao(); montarNav();
  toast(participantes.length+' professor(es) marcados em '+topicos.length+' tópico(s)');
}
function fmVerSessao(id){
  const s=(S.formacaoSessoes||[]).find(x=>x.id===id); if(!s) return;
  const nomes=(s.topicos||[]).map(tid=>{ const t=(S.formacao||[]).find(x=>x.id===tid); return t?((t.emoji||'📘')+' '+t.titulo):'(tópico removido)'; });
  modal(`<h3 style="margin-bottom:4px">📌 ${esc(s.titulo)} <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:14px">${brDate(s.data)} · registrado por ${esc(s.por||'—')}</p>
    <div class="field"><label class="lbl">Participantes</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${(s.participantes||[]).map(p=>`<span class="tag" style="background:#eaf3ff;color:var(--azul)">${esc(p)}</span>`).join('')}</div></div>
    <div class="field"><label class="lbl">Tópicos cobertos</label>
      <div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${nomes.map(n=>`<div>${esc(n)}</div>`).join('')}</div></div>
    ${s.notas?`<div class="field"><label class="lbl">Anotações</label><div style="margin-top:4px">${_fmFmt(s.notas)}</div></div>`:''}
    <div class="row" style="margin-top:8px;justify-content:flex-end"><button class="btn ghost" onclick="fechar()">Fechar</button></div>`);
}
function fmExcluirSessao(id){
  if(!confirm('Excluir esta sessão? As marcações feitas por ela também serão removidas.')) return;
  S.formacaoSessoes=(S.formacaoSessoes||[]).filter(x=>x.id!==id);
  marcarExcluido('formacaoSessoes', id);
  (S.formacaoReg||[]).filter(r=>r.sessaoId===id).forEach(r=>marcarExcluido('formacaoReg', r.id));
  S.formacaoReg=(S.formacaoReg||[]).filter(r=>r.sessaoId!==id);
  save(); VIEWS.formacao(); montarNav(); toast('Sessão excluída');
}
/* ===== fim do módulo Formação (b89) ===== */

/* ---- semente: o quadro do treinamento vira a biblioteca inicial (b89) ----
   IDs fixos de propósito: se dois aparelhos semearem, o merge une pelo mesmo id
   em vez de duplicar. */
function _semearFormacao(s){
  s.formacao=s.formacao||[];
  const base=[
  {id:'fm-framework', emoji:'🧭', ordem:10, titulo:'TGT Class Framework',
   resumo:'As quatro etapas de toda aula Togethere.',
   conteudo:`Toda aula segue a mesma espinha dorsal. O tempo de cada etapa varia; a ordem, não.

## 1. Warm-up
Aquecimento: retoma o que já foi visto, ativa o inglês e prepara o clima da aula.

## 2. Development (core)
O coração da aula: onde o conteúdo novo é apresentado, explicado e praticado.

## 3. Task (HW)
A tarefa que consolida o que foi trabalhado — em aula e/ou como tema de casa.

## 4. Wrap-up
Fechamento: retoma o objetivo, confirma o que ficou e dá o gancho para a próxima aula.`},

  {id:'fm-4fs', emoji:'🎯', ordem:20, titulo:'Os 4 Fs',
   resumo:'Focus, Frequency, Fixation, Feedback — a base da metodologia.',
   conteudo:`Os 4 Fs sustentam todas as decisões pedagógicas da escola.

## Focus
Uma aula, um objetivo claro. Se tudo é importante, nada é.

## Frequency
Contato constante com a língua. Aprender inglês é hábito, não evento.

## Fixation
Prática e repetição com variação, até o conteúdo virar automático.

## Feedback
Devolutiva orientada à melhoria — o aluno precisa saber onde está e como avançar.`},

  {id:'fm-preparar', emoji:'📝', ordem:30, titulo:'Preparar uma aula: What / Who / How / How far',
   resumo:'As quatro perguntas antes de planejar qualquer aula.',
   conteudo:`## 1. WHAT — o quê
"Narrow down": escolha o recorte. Grammar, vocabulary, reading, listening, speaking ou writing?
Delimitar vale mais do que cobrir muito.

## 2. WHO — para quem
- Idade
- Sala e número de alunos
- Comportamento do grupo
- Gostos e interesses
- Objetivos de cada aluno
- Nível

## 3. HOW — como
Estratégias e links: por onde entrar, com que atividade, ligando ao que a turma já sabe e ao que interessa a ela.

## 4. HOW FAR — até onde
Até que ponto devo ir? Definir o limite antes evita atropelar o grupo e ajuda a fechar no tempo.`},

  {id:'fm-novotopico', emoji:'💡', ordem:40, titulo:'Como introduzir um tópico novo',
   resumo:'Gap of communication → Explain → Fixation → Feedback.',
   conteudo:`Sequência para apresentar qualquer conteúdo novo. É os 4 Fs em ação.

## 1. Gap of communication
Crie a necessidade antes da explicação: uma situação em que o aluno percebe que falta algo. Apresentar e gerar consciência (raise awareness).

## 2. Explain
Agora sim, explicar. É a hora de "professorar" — claro, direto, com exemplos.

## 3. Fixation
Practice e repetição. O aluno precisa usar várias vezes, em contextos diferentes.

## 4. Feedback
- Orientado à melhoria, não ao erro
- Amigável
- Sempre dar oportunidade de tentar de novo`},

  {id:'fm-daywise', emoji:'🧠', ordem:50, titulo:'Day-wise: o que levar em conta',
   resumo:'PNL, aquisição de memória e MIT no dia a dia.',
   conteudo:`Três coisas que atravessam qualquer aula, independentemente do conteúdo.

## PNL — canais de comunicação
As pessoas entram no conteúdo por canais diferentes (visual, auditivo, cinestésico). Varie a forma de apresentar para alcançar a turma toda.

## Aquisição de memória
O que é revisitado em intervalos fica; o que aparece uma vez só, não. Planeje as retomadas.

## MIT — Most Important Thing
Se o aluno sair da aula lembrando de uma coisa só, qual deve ser? Defina isso antes e garanta que ela apareça no warm-up e no wrap-up.`}
  ,
  {id:'fm-filosofia', emoji:'🎯', ordem:60, titulo:'Filosofia educacional e princípios basais',
   resumo:'Quem somos, como ensinamos e o que não é negociável.',
   conteudo:`A Togethere é mais do que uma escola de inglês: é um espaço de aprendizagem para pessoas de todas as idades com um objetivo em comum — dominar o inglês para estudo, trabalho, viagem ou realização pessoal. Nossa filosofia parte de uma ideia simples: o aprendizado acontece quando a base teórica encontra a aplicação prática, num ambiente engajador e acolhedor.

## Nossa abordagem
Comunicação é o coração do aprendizado. Combinamos abordagens tradicionais e modernas para criar um ambiente plural, o que nos permite:
- criar aulas dinâmicas e focadas em comunicação com sentido
- adaptar o método ao processo de cada aluno
- desenvolver o crescimento individual e coletivo
- aplicar práticas que fortalecem associação e memorização
- manter espontaneidade e leveza no processo

## Os cinco princípios basais
1. Jornada personalizada — a metodologia é estruturada, mas cada aluno tem um caminho; ajustamos a abordagem ao perfil e às necessidades dele.
2. Foco na comunicação — a língua cumpre seu papel quando é usada de verdade. A aula presencial existe para maximizar interação autêntica.
3. Padrões e materiais modernos — currículo alinhado ao CEFR, com material atual e referência internacional.
4. Acompanhamento colaborativo — aluno, professor e coordenação trabalham juntos: definir metas, criar estratégias, acompanhar por avaliação contínua e ajustar a rota.
5. Metodologia flexível — ambiente leve e compreensivo, combinando conceitos tradicionais e modernos conforme a necessidade da turma.`},

  {id:'fm-papel', emoji:'👩‍🏫', ordem:70, titulo:'O papel do professor Togethere',
   resumo:'As quatro frentes de responsabilidade de quem dá aula aqui.',
   conteudo:`## 1. Entrega do currículo
- Planejar e conduzir aulas que atendam a estilos e necessidades diferentes, com objetivos, atividades e avaliação claros.
- Desenvolver materiais interativos, adequados à idade e ao nível.
- Garantir que toda atividade esteja alinhada aos objetivos do currículo, revisando a estratégia conforme o progresso da turma.

## 2. Avaliação do aluno
- Aplicar avaliações formativas e somativas com regularidade, formais e informais.
- Usar instrumentos que meçam de fato as seis habilidades: speaking, writing, listening, reading, grammar e vocabulary.
- Analisar os dados junto com a direção acadêmica e criar intervenções para quem precisa de apoio ou de desafio maior.

## 3. Gestão da sala
- Criar e manter um ambiente positivo e inclusivo, com rotinas e combinados claros desde o primeiro dia.
- Aplicar manejo de comportamento justo e consistente, com reforço positivo e consequências claras.
- Alinhar com os colegas para que o padrão de sala seja o mesmo em toda a escola.

## 4. Desenvolvimento profissional
- Participar das formações, oficinas e treinamentos da escola.
- Manter-se atualizado em metodologia, tecnologia educacional e boas práticas de ESL/EFL.
- Aprender junto: reuniões, observação entre pares e troca de materiais.`},

  {id:'fm-4fs-praticas', emoji:'🛠️', ordem:80, titulo:'Os 4 Fs na prática — dicas por etapa',
   resumo:'O que fazer em aula para cada um dos quatro Fs.',
   conteudo:`Regra de planejamento: se a aula é divertida mas fraca em algum dos 4 Fs, o aprendizado fica raso. Uma boa aula Togethere constrói os quatro de propósito.

## Focus — direcionar a atenção
- Comece com o objetivo em uma frase ("ao final da aula, você consegue…") e retome no fechamento.
- Modele primeiro e guie a percepção: peça que ouçam ou leiam procurando UM detalhe específico.
- Instruções curtas e em etapas: dê um passo, cheque o entendimento, então libere a atividade.
- Use "resets" de atenção quando a energia cair: uma pergunta-checkpoint, um reagrupamento rápido.
- Reduza estímulos concorrentes: menos poluição no quadro e nos slides, principalmente nos níveis baixos.

## Frequency — manter a exposição
- Planeje o caminho de volta de cada conteúdo: ele reaparece na mesma aula, na próxima e mais adiante na unidade.
- Comece a aula com uma retomada curta que reutilize a língua anterior.
- Exija que o conteúdo antigo entre nas tarefas novas (ex.: usar 2 ou 3 estruturas da semana passada no speaking de hoje).
- Revisão com propósito: ela apoia o objetivo de hoje, não é sorteio de curiosidades.
- Fuja da armadilha do conteúdo novo toda aula.

## Fixation — fixar pela recuperação
- Inclua ao menos um momento de recuperação sem consulta em toda aula, nem que sejam 30 a 60 segundos.
- Avance na progressão: controlado, semicontrolado, comunicativo.
- Use micro-writing e micro-speaking: produção curta, com correção e nova tentativa.
- Varie o contexto: mesma estrutura, outra situação, outra pessoa, outro tempo.
- Prefira poucos ciclos de prática bem-feitos a muitas atividades rasas.

## Feedback — alimentar a melhora
- Priorize 1 ou 2 pontos de maior impacto por tarefa, não todos os erros.
- Ajuste o tempo: imediato para forma e pronúncia; adiado em tarefas de fluência.
- Use ciclos de retry e upgrade: o aluno tenta de novo com a forma corrigida.
- Mantenha a linguagem de correção constante ("tenta de novo — olha o verbo").
- Equilibre precisão e incentivo: confirme o que funcionou, depois aponte a melhora.

## Perguntas de planejamento
1. Focus: no que o aluno vai prestar atenção primeiro, e como deixo o alvo evidente?
2. Frequency: quando esse conteúdo reaparece (hoje, na próxima, mais adiante)?
3. Fixation: quando o aluno vai recuperar de memória e produzir sem consulta?
4. Feedback: o que vou corrigir, e como o aluno tenta de novo?`},

  {id:'fm-teorias', emoji:'📖', ordem:90, titulo:'Teorias de ensino de línguas',
   resumo:'As principais correntes, com prós e limites de cada uma.',
   conteudo:`Não defendemos uma teoria única. Conhecer as várias permite escolher com critério o que serve para cada turma e objetivo.

## Behaviorismo
Princípio: a língua se aprende por formação de hábito e reforço.
- A favor: eficaz para padrões e estruturas básicas; método claro; bom para iniciantes e crianças.
- Limites: ignora a criatividade e os processos cognitivos; pode virar mecânico.

## Inatismo
Princípio: existe uma capacidade inata de adquirir língua.
- A favor: explica a aquisição rápida na infância; apoia imersão.
- Limites: subestima o ensino explícito; difícil em sala formal; menos eficaz com adultos.

## Construtivismo
Princípio: o aluno constrói o próprio entendimento pela experiência.
- A favor: aprendizagem ativa, autonomia, pensamento crítico.
- Limites: leva tempo; exige mediação habilidosa.

## Interacionismo social
Princípio: a língua se aprende na interação social.
- A favor: comunicação autêntica, competência cultural, colaboração.
- Limites: desafiador em turma monolíngue; exige boa gestão de grupos.

## Inteligências múltiplas
Princípio: pessoas diferentes aprendem por caminhos diferentes.
- A favor: acolhe estilos variados; ensino inclusivo.
- Limites: complexo de implementar; exige recursos.

## Teoria cognitiva
Princípio: aprender língua envolve processos mentais ativos.
- A favor: compreensão acima da memorização; aprendizagem significativa.
- Limites: pode ser abstrato; exige andaimes bem postos.

## Grammar Translation
Princípio: a língua se aprende por análise e tradução.
- A favor: desenvolve análise; foco em precisão; útil no acadêmico.
- Limites: pouca comunicação; pode desmotivar; não gera fluência.

## Hipótese da interação
Princípio: a aquisição ocorre na interação com sentido.
- A favor: uso natural da língua; motivação.
- Limites: exige monitoramento; imprevisível.`},

  {id:'fm-metodologias', emoji:'🧪', ordem:100, titulo:'Metodologias de ensino',
   resumo:'CLT, TBLT, CLIL, TPR e as demais — o que são e quando usar.',
   conteudo:`## Communicative Language Teaching (CLT)
Foco em comunicação com sentido, material autêntico e integração das habilidades.
Na prática: role-plays, information gap, projetos.
Ganho: competência comunicativa e preparo para o uso real.

## Task-Based Language Teaching (TBLT)
Aprender realizando tarefas com objetivo real.
Na prática: resolução de problemas, projetos, simulações.
Ganho: aprendizagem ativa e integração de várias áreas da língua.

## CLIL — conteúdo e língua integrados
Ensinar conteúdo de outra área em inglês.
Na prática: vocabulário específico, projetos interdisciplinares.
Ganho: contexto com significado e linguagem acadêmica.

## Community Language Learning (CLL)
Centrado no aluno, com o professor como facilitador.
Na prática: rodas de conversa, resolução em grupo, ensino entre pares.
Ganho: reduz ansiedade e constrói confiança.

## Direct Method
Sem uso da língua materna, vocabulário do dia a dia, gramática indutiva.
Na prática: imagens, mímica, pergunta e resposta.
Ganho: desenvolve escuta e o hábito de pensar em inglês.

## Audiolingualismo
Prática de padrões e drills, foco no oral.
Na prática: repetição, substituição, memorização de diálogos.
Ganho: automatismo e pronúncia.

## Total Physical Response (TPR)
Movimento associado à compreensão, com produção oral adiada.
Na prática: comandos com ação, atividades de movimento.
Ganho: engaja vários sentidos e reduz o estresse; ótimo para iniciantes.

## Suggestopedia
Ambiente confortável, música e sugestão positiva.
Na prática: música ao fundo, disposição acolhedora, role-play com outra identidade.
Ganho: reduz ansiedade e favorece a memória.`},

  {id:'fm-integracao', emoji:'🔗', ordem:110, titulo:'Como a Togethere combina as abordagens',
   resumo:'Nenhuma teoria dá conta sozinha — como a gente mistura, e por quê.',
   conteudo:`Nenhuma teoria ou metodologia isolada responde a tudo. Nossa abordagem é eclética, mas com princípio: escolhemos e combinamos conforme o objetivo da aula, o perfil da turma e o contexto.

## Aprendizagem centrada na comunicação
- Interacionismo social: a língua se aprende interagindo de verdade.
- CLT: foco no uso funcional, não só no conhecimento estrutural.
- Task-Based: tarefas autênticas que espelham a vida real.

## Caminhos personalizados
- Inteligências múltiplas: reconhecer e atender estilos diferentes.
- Construtivismo: o aluno constrói sentido; o professor media.
- Teoria cognitiva: a progressão entre níveis respeita os processos de aquisição.

## Padrões modernos
- CLIL: integrar inglês a conteúdos relevantes de outras áreas.
- Hipótese da interação: atividades que geram negociação de sentido.

## Flexibilidade
- Direct Method: quando a exposição direta e autêntica ajuda.
- TPR: sobretudo com os pequenos e nas fases iniciais.
- Suggestopedia: para criar clima leve e reduzir ansiedade.

O objetivo é aproveitar a força de cada abordagem e compensar os limites de todas.`},

  {id:'fm-cefr', emoji:'📊', ordem:120, titulo:'Descritores CEFR — o que o aluno consegue fazer',
   resumo:'De Pré-A1 a C2, em linguagem de can do.',
   conteudo:`O CEFR é a base do nosso currículo e da avaliação. Use os descritores para definir objetivos, criar atividades no nível certo, dar feedback específico e escrever relatórios.

## Pré-A1
- Fala: frases curtas sobre si; cumprimentos; responde a perguntas pessoais simples ditas devagar.
- Escrita: dados pessoais; copia palavras; frases isoladas.
- Escuta: instruções básicas ditas devagar; palavras familiares.
- Leitura: nomes, palavras e frases muito simples em avisos.

## A1
- Fala: interage de forma simples se o outro repetir ou reformular; pergunta e responde sobre necessidades imediatas.
- Escrita: frases isoladas; um cartão-postal simples; preenche formulários.
- Escuta: fala muito lenta e articulada, com pausas.
- Leitura: nomes, palavras e frases muito simples; mensagens curtas.

## A2
- Fala: descreve seu entorno e sua rotina; troca informação em tarefas simples.
- Escrita: bilhetes curtos; frases ligadas por conectores simples; cartas pessoais breves.
- Escuta: pega o ponto principal de mensagens curtas e claras.
- Leitura: textos curtos com vocabulário frequente; encontra informação específica.

## B1
- Fala: lida com a maioria das situações de viagem; entra em conversa sobre temas familiares; conecta ideias para narrar experiências.
- Escrita: textos conectados sobre temas conhecidos; cartas pessoais com experiências e impressões.
- Escuta: pontos principais de fala padrão clara; programas de TV e rádio sobre atualidades.
- Leitura: textos com linguagem cotidiana; argumentos claros sobre temas familiares.

## B2
- Fala: fluência e espontaneidade suficientes para interagir com nativos; explica um ponto de vista com prós e contras.
- Escrita: textos claros e detalhados; ensaios e relatórios argumentando.
- Escuta: palestras e fala longa; maior parte de noticiários e filmes em dialeto padrão.
- Leitura: artigos e reportagens sobre problemas contemporâneos; prosa literária.

## C1
- Fala: expressa-se com fluência e espontaneidade, sem procurar palavras; usa a língua com flexibilidade para fins sociais e profissionais.
- Escrita: textos bem estruturados sobre temas complexos; escolhe o estilo conforme o leitor.
- Escuta: fala longa mesmo sem estrutura clara; programas e filmes sem grande esforço.
- Leitura: textos longos e complexos; artigos especializados fora da própria área.

## C2
- Fala: participa sem esforço de qualquer conversa; expressa-se com precisão e fluidez.
- Escrita: textos fluidos no estilo adequado; relatórios e artigos complexos; resumos e resenhas.
- Escuta: qualquer tipo de fala, inclusive discussões técnicas e uso regional.
- Leitura: praticamente qualquer texto, com percepção de estilo e sentido implícito.

## Como usar
1. No planejamento: definir objetivo, escolher atividade e material do nível.
2. Na avaliação: criar tarefas, avaliar desempenho, escrever relatórios.
3. No feedback: apontar o que melhorar, definir metas alcançáveis, celebrar o avanço.
4. No apoio: dar andaimes, diferenciar a instrução, estimular autonomia.

Trate os descritores como referência flexível, não como camisa de força.`},

  {id:'fm-niveis', emoji:'🪜', ordem:130, titulo:'Sistema de níveis Togethere',
   resumo:'Segmentos por idade e a nomenclatura correta dos níveis.',
   conteudo:`Cada nível dura um ano. O nome do nível combina o CEFR com o segmento — por exemplo, A2 JUNIOR ou B1+ TEENS. Use sempre o nome completo.

## LITTLE ONES — 3 a 5 anos
- LITTLE ONES STARTER, LITTLE ONES A, LITTLE ONES B
- Todos servem como porta de entrada; foco no desenvolvimento infantil e em atividades adequadas à idade.

## KIDS — 6 a 9 anos
- Pré A1 KIDS, Pré A1+ KIDS, A1 KIDS, A1+ KIDS
- Introdução ao estudo estruturado; construção de base; letramento adequado à idade.

## JUNIOR — 10 a 12 anos
- A1 JUNIOR, A1+ JUNIOR, A2 JUNIOR, A2+ JUNIOR
- Estruturas mais complexas; habilidades acadêmicas; todas as competências.

## TEENS — até 18 anos
- A1 TEENS, A2 TEENS, B1 TEENS, B1+ TEENS, B2 TEENS, C1 TEENS, C1+ TEENS
- Desenvolvimento completo; linguagem acadêmica e social; preparo para exames internacionais.

## ADULTS — 18+
- A1 ADULTS, A2 ADULTS, B1 ADULTS, B1+ ADULTS, B2 ADULTS, C1 ADULTS, C1+ ADULTS
- Foco profissional e acadêmico; aplicação prática; abordagem flexível.

## Programas especiais
- C2 Pro: para quem concluiu o C1; domínio avançado.
- VIP: teens e adultos, ensino por objetivo, percurso personalizado.

## Implicações para o ensino
1. Ajuste o método às características do segmento e ao estágio de desenvolvimento.
2. Use sempre o nome completo do nível e mantenha o alinhamento com o CEFR em mente.
3. Considere as opções especiais (C2 Pro e VIP) quando o objetivo do aluno pedir.
4. Prepare a transição de nível e mantenha a coordenação informada.`},

  {id:'fm-avaliacao', emoji:'🏅', ordem:140, titulo:'Sistema de avaliação — as quatro bandas',
   resumo:'DISTINCTION, MERIT, PASS e UNSATISFACTORY nas seis habilidades.',
   conteudo:`Os descritores de desempenho existem para dar um retrato claro do aluno à família e à escola. Avaliamos seis habilidades:
- Gramática: uso correto das estruturas e regras.
- Vocabulário: conhecimento e uso adequado de palavras e expressões.
- Compreensão de Texto (Reading).
- Compreensão Oral (Listening).
- Produção Escrita (Writing).
- Produção Oral (Speaking).

## As quatro bandas
- DISTINCTION: supera as expectativas do nível, com domínio excepcional.
- MERIT: atingiu com excelência os objetivos do nível.
- PASS: alcançou satisfatoriamente os objetivos essenciais do nível.
- UNSATISFACTORY: ainda não atingiu os objetivos mínimos esperados.

## Como ler os descritores
- Cada habilidade tem cinco aspectos avaliados.
- Os descritores são progressivos: cada nível superior inclui o que vem antes.
- As descrições focam em comportamentos observáveis, não em impressões.
- O objetivo é um retrato fiel e compreensível — que a família entenda onde o filho se destaca e onde pode melhorar.
- Avalie também a aplicação prática em situações reais de comunicação, não só o conhecimento técnico.`},

  {id:'fm-sponte', emoji:'💻', ordem:150, titulo:'Sponte — o que registrar e como',
   resumo:'A rotina diária de registro e o padrão dos resumos.',
   conteudo:`O Sponte é o canal com as famílias. Tudo é registrado em português, para comunicação clara com os pais. Cada professor tem login próprio.

## Rotina diária
1. Presença — marque presenças e faltas no início da aula; registre atrasos e saídas antecipadas.
2. Resumo da aula — em português, contendo apenas:
- as páginas trabalhadas (ex.: Student's Book páginas 24-25)
- a tarefa com explicação clara (ex.: TASK: Workbook página 15 - exercícios 3 e 4: praticar o uso de adjetivos comparativos)
3. Tema de casa — registre quem fez, quem não fez e quem fez parcialmente, antes da aula seguinte.

## Boas práticas
- Atualize todo dia; não deixe acumular.
- Reserve um horário fixo para isso.
- Mantenha o padrão: linguagem simples e voltada aos pais, só páginas e tarefa.`},

  {id:'fm-planoaula', emoji:'📝', ordem:160, titulo:'Modelo de plano de aula',
   resumo:'A estrutura padrão de um lesson plan Togethere.',
   conteudo:`Cabeçalho: NÍVEL e TURMA — Aula X — Data.

## Class objectives
Os objetivos da aula: o que o aluno consegue fazer ao final.

## Skills focus
As habilidades trabalhadas (ex.: Reading, Vocabulary).

## Materials needed
O material necessário para a aula.

## Lesson structure
1. Warm-up (x-y minutos)
2. Development (x-y minutos) — descreva cada estágio em detalhe
3. Task assignment
4. Wrap-up (x-y minutos)

## Post class reflection
Depois da aula: o que funcionou, o que não funcionou e o que ajustar na próxima.`}
  ];
  base.forEach(t=>{
    if(s.formacao.some(x=>x.id===t.id)) return;
    s.formacao.push(Object.assign({revisarMeses:6, criadoEm:Date.now(), atualizadoEm:Date.now(), por:'Direção'}, t));
  });
}
