/* ===== Ciclo de vida da turma (b45) ===== */
const TSTATUS={aberta:{lbl:'ABERTA',cor:'#1a8a4a',bg:'#eafaf0'},formacao:{lbl:'EM FORMAÇÃO',cor:'#b88600',bg:'#fff8e0'},encerrada:{lbl:'ENCERRADA',cor:'#888',bg:'#eeeeee'}};
let _amBusca='';
function turmaStatus(t){ if(!t) return 'aberta'; return t.status || (t.arquivada?'encerrada':'aberta'); }
function turmaTrancada(tid){ const t=(S.turmas||[]).find(x=>x.id===tid); return turmaStatus(t)==='encerrada'; }
function statusPill(t){ const s=TSTATUS[turmaStatus(t)]||TSTATUS.aberta; return `<span class="pill" style="background:${s.bg};color:${s.cor}">${s.lbl}</span>`; }
function encerrarTurma(id){
  if(ehProfessor()) return toast('Sem permissão');
  const t=(S.turmas||[]).find(x=>x.id===id); if(!t) return;
  if(turmaStatus(t)==='encerrada') return toast('Esta turma já está encerrada');
  const als=(S.alunos||[]).filter(a=>a.turmaId===id && !a.arquivado);
  if(!confirm('Encerrar a turma "'+t.nome+'"?\n\nEla vai para o ARQUIVO MORTO guardando os '+als.length+' aluno(s) atuais. Depois de encerrada, NADA nela poderá ser editado.\n\nOs alunos continuam no app e podem ser rematriculados em outra turma pelo "+ Aluno".')) return;
  t.alunosSnapshot=als.map(a=>({id:a.id,nome:a.nome}));
  t.status='encerrada'; t.arquivada=true; t.encerradaEm=hoje();
  if(painelTurma===id) painelTurma=null;
  save(); montarNav(); if(rota==='gturmas') VIEWS.gturmas(); toast('Turma encerrada e arquivada');
}
function iniciarTurma(id){
  if(ehProfessor()) return toast('Sem permissão');
  const t=(S.turmas||[]).find(x=>x.id===id); if(!t) return;
  t.status='aberta'; t.arquivada=false;
  save(); montarNav(); if(rota==='gturmas') VIEWS.gturmas(); toast('Turma aberta');
}
/* ---- + Aluno: buscar existente (unicidade) ou criar novo ---- */
function abrirAddAluno(turmaId){
  if(soLeitura()) return toast('Somente leitura — a secretaria não edita turmas');
  if(ehProfessor()) return toast('Sem permissão');
  if(turmaTrancada(turmaId)) return toast('Turma encerrada — não dá para adicionar alunos');
  modal(`<h3>+ Aluno <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:10px">Procure pelo nome. Se o aluno já existe no app, reaproveite (mantém a ficha e o histórico). Se for novo na escola, crie um novo.</p>
    <div class="field"><input type="text" id="aaBusca" placeholder="Digite o nome do aluno" oninput="renderAddAlunoBusca('${turmaId}')" autocomplete="off"></div>
    <div id="aaResult"><p class="hint">Comece a digitar…</p></div>`);
  setTimeout(()=>{const i=document.getElementById('aaBusca');if(i)i.focus();},60);
}
function renderAddAlunoBusca(turmaId){
  const inp=document.getElementById('aaBusca'); const box=document.getElementById('aaResult'); if(!inp||!box) return;
  const txt=(inp.value||'').trim(); const q=_normTxt(txt);
  if(!q){ box.innerHTML='<p class="hint">Comece a digitar…</p>'; return; }
  const achados=(S.alunos||[]).filter(a=>_normTxt(a.nome).includes(q)).slice(0,8);
  let h='';
  if(achados.length){
    h+='<p class="hint" style="margin:6px 0 4px"><b>Já no app</b> — toque em Adicionar para reaproveitar:</p>';
    achados.forEach(a=>{
      const mesma=a.turmaId===turmaId;
      h+=`<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--linha);padding:7px 0"><span style="flex:1">${escAttr(a.nome)}<br><span class="hint">${a.turmaId?('atual: '+escAttr(_turmaNomePorId(a.turmaId))):'sem turma'}${a.arquivado?' · arquivado':''}</span></span>${mesma?'<span class="pill">já nesta turma</span>':`<button class="btn ghost sm" onclick="reusarAluno('${a.id}','${turmaId}')">Adicionar</button>`}</div>`;
    });
  } else { h+='<p class="hint" style="margin:6px 0">Nenhum aluno com esse nome no app.</p>'; }
  h+=`<button class="btn block" style="margin-top:10px" onclick="criarAlunoNovo('${turmaId}')">➕ Criar aluno novo: "${escAttr(txt)}"</button>`;
  box.innerHTML=h;
}
function reusarAluno(aid,turmaId){
  if(ehProfessor()) return toast('Sem permissão');
  if(turmaTrancada(turmaId)) return toast('Turma encerrada');
  const a=(S.alunos||[]).find(x=>x.id===aid); if(!a) return;
  const antiga=a.turmaId;
  if(antiga===turmaId){ fechar(); return toast('Este aluno já está nesta turma'); }
  if(antiga && !turmaTrancada(antiga)){
    if(!confirm(a.nome+' está na turma "'+_turmaNomePorId(antiga)+'". Mover para esta turma?')) return;
  }
  a.turmaId=turmaId; if(a.arquivado) a.arquivado=false;
  save(); fechar(); _refreshTurmas(); montarNav(); toast(a.nome+' adicionado(a)');
}
function criarAlunoNovo(turmaId){
  if(ehProfessor()) return toast('Sem permissão');
  if(turmaTrancada(turmaId)) return toast('Turma encerrada');
  const inp=document.getElementById('aaBusca'); const txt=((inp&&inp.value)||'').trim();
  if(!txt) return toast('Digite o nome');
  const exato=(S.alunos||[]).find(a=>_normTxt(a.nome)===_normTxt(txt));
  if(exato){ if(!confirm('Já existe "'+exato.nome+'" no app (turma: '+_turmaNomePorId(exato.turmaId)+').\n\nCriar mesmo assim um aluno novo? Isso pode gerar duplicidade.')) return; }
  S.alunos.push({id:uid(),nome:txt,turmaId});
  save(); fechar(); _refreshTurmas(); montarNav(); toast('Aluno criado');
}
function renderArquivoMorto(){
  const box=document.getElementById('gtArquivo'); if(!box) return;
  const q=_normTxt(_amBusca);
  let encs=(S.turmas||[]).filter(t=>turmaStatus(t)==='encerrada');
  if(q) encs=encs.filter(t=>_normTxt(t.nome).includes(q) || (t.alunosSnapshot||[]).some(a=>_normTxt(a.nome).includes(q)));
  if(!encs.length){ box.innerHTML='<p class="hint" style="margin:8px 0 0">'+( _amBusca?'Nada encontrado no arquivo.':'Nenhuma turma encerrada ainda.')+'</p>'; return; }
  box.innerHTML=encs.sort((a,b)=>(b.encerradaEm||'').localeCompare(a.encerradaEm||'')).map(t=>{
    const snap=t.alunosSnapshot||[];
    return `<div class="card" style="padding:12px 14px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="flex:1">${escAttr(t.nome)}</b>${statusPill(t)}</div>
      <p class="hint" style="margin:4px 0 6px">${escAttr(t.horario||'')}${t.encerradaEm?(' · encerrada em '+brDate(t.encerradaEm)):''} · ${snap.length} aluno(s)</p>
      ${snap.length?('<div class="hint" style="line-height:1.6">'+snap.map(a=>escAttr(a.nome)).join(' · ')+'</div>'):'<p class="hint">(sem alunos registrados)</p>'}
      <p class="hint" style="margin:8px 0 0;color:#aaa">🔒 Arquivo morto — somente leitura.</p></div>`;
  }).join('');
}
function setAmBusca(v){ _amBusca=v; renderArquivoMorto(); }

VIEWS.gturmas=()=>{
  const v=document.getElementById('view');
  if(ehProfessor()){ v.innerHTML='<p class="sub">Sem permissão.</p>'; return; }
  const ativas=(S.turmas||[]).filter(t=>turmaStatus(t)!=='encerrada').sort((a,b)=>a.nome.localeCompare(b.nome));
  const linhasAtivas=ativas.map(t=>{
    const st=turmaStatus(t), n=(S.alunos||[]).filter(a=>a.turmaId===t.id && !a.arquivado).length;
    return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--linha);padding:8px 0">
      <div style="flex:1;min-width:150px"><b>${escAttr(t.nome)}</b> ${statusPill(t)}<br><span class="hint">${escAttr(t.horario||'')} · ${n} aluno(s)</span></div>
      ${st==='formacao'?`<button class="btn ghost sm" style="color:var(--azul)" onclick="iniciarTurma('${t.id}')">Abrir turma</button>`:''}
      <button class="btn ghost sm" style="color:var(--vermelho)" onclick="encerrarTurma('${t.id}')">Encerrar</button>
    </div>`;
  }).join('')||'<p class="hint">Nenhuma turma ativa.</p>';
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Trocar / criar turma</h2></div>
    <p class="sub">Gerencie o ciclo de vida das turmas: criar a próxima, encerrar as que terminaram (vão para o arquivo morto) e mover alunos.</p>
    <div class="card"><h3>➕ Criar próxima turma</h3>
      <p class="hint">A nova turma nasce <b>vazia</b> e <b>EM FORMAÇÃO</b>. Os alunos são adicionados conforme se matriculam, pelo "+ Aluno" da turma.</p>
      <button class="btn" onclick="abrirCriarProxima()">Criar próxima turma</button>
    </div>
    <div class="card"><h3>🏫 Turmas ativas</h3>
      <p class="hint" style="margin:0 0 4px">EM FORMAÇÃO vira ABERTA quando você inicia. Encerrar manda para o arquivo morto (travada).</p>
      ${linhasAtivas}
    </div>
    <div class="card"><h3>🔄 Trocar aluno de turma</h3>
      <div class="field"><label class="lbl">Turma de origem</label><select id="gtOrigem" onchange="preencherGtAlunos()">${_selTurmasOpts()}</select></div>
      <div class="field"><label class="lbl">Aluno</label><select id="gtAluno"></select></div>
      <div class="field"><label class="lbl">Turma de destino</label><select id="gtDestino">${_selTurmasOpts()}</select></div>
      <button class="btn" onclick="moverAluno()">Mover aluno</button>
    </div>
    <div class="card"><h3>🗄️ Arquivo morto (turmas encerradas)</h3>
      <p class="hint" style="margin:0 0 8px">Pesquisável por nome da turma ou do aluno. Somente leitura.</p>
      <input type="text" id="gtArqBusca" placeholder="🔎 Buscar turma ou aluno encerrado" value="${escAttr(_amBusca)}" oninput="setAmBusca(this.value)">
      <div id="gtArquivo" style="margin-top:8px"></div>
    </div>`;
  preencherGtAlunos();
  renderArquivoMorto();
};
function preencherGtAlunos(){
  const o=document.getElementById('gtOrigem'); const sel=document.getElementById('gtAluno'); if(!o||!sel)return;
  const als=alunosDa(o.value).slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  sel.innerHTML=als.length?als.map(a=>`<option value="${a.id}">${a.nome}</option>`).join(''):'<option value="">(turma sem alunos)</option>';
}
function moverAluno(){
  if(ehProfessor())return toast('Sem permissão');
  const aid=document.getElementById('gtAluno').value, dest=document.getElementById('gtDestino').value, orig=document.getElementById('gtOrigem').value;
  if(!aid)return toast('Selecione um aluno');
  if(!dest)return toast('Selecione a turma de destino');
  if(dest===orig)return toast('Origem e destino são a mesma turma');
  const a=S.alunos.find(x=>x.id===aid); if(!a)return;
  const td=S.turmas.find(x=>x.id===dest);
  a.turmaId=dest; save(); montarNav(); VIEWS.gturmas();
  toast(`${a.nome} movido para ${td?td.nome:'a turma'}`);
}
function abrirCriarProxima(){
  if(ehProfessor())return toast('Sem permissão');
  const ts=turmasVisiveis().slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  modal(`<h3>➕ Criar próxima turma <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Trilha</label><select id="cpTrilha" onchange="_cpNiveis()">${Object.keys(TRILHAS).map(k=>`<option value="${k}">${TRILHAS[k].label}</option>`).join('')}</select></div>
    <div class="field"><label class="lbl">Nível</label><select id="cpNivel"></select></div>
    <div class="field"><label class="lbl">Nome da turma</label><input type="text" id="cpNome" placeholder="Ex: A2 JUNIOR TARDINHA (2026)"></div>
    <div class="row"><div style="flex:2"><label class="lbl">Professor (opcional)</label><input type="text" id="cpProf" placeholder="Nome do professor"></div>
      <div style="flex:1"><label class="lbl">Horário</label><input type="text" id="cpHor" placeholder="18:15–19:30"></div></div>
    <div class="field" style="margin-top:8px"><label class="lbl">Dias de aula</label><div style="display:flex;flex-wrap:wrap;gap:6px">${[1,2,3,4,5,6].map(d=>`<label style="display:flex;align-items:center;gap:5px;font-size:.88rem;border:1px solid var(--linha);border-radius:9px;padding:6px 10px;cursor:pointer"><input type="checkbox" class="cpDia" value="${d}"> ${DIAS_SEMANA[d]}</label>`).join('')}</div></div>
    <button class="btn block" onclick="criarProximaTurma()" style="margin-top:12px">Criar turma</button>`);
  _cpNiveis();
}
function _cpNiveis(){ const k=document.getElementById('cpTrilha').value; const sel=document.getElementById('cpNivel'); if(sel) sel.innerHTML=TRILHAS[k].niveis.map(n=>`<option value="${n}">${n}</option>`).join(''); }
function criarProximaTurma(){
  if(ehProfessor())return toast('Sem permissão');
  const trilha=document.getElementById('cpTrilha').value;
  const cefr=document.getElementById('cpNivel').value;
  const nome=(document.getElementById('cpNome').value||'').trim();
  if(!nome)return toast('Dê um nome à turma');
  const dias=[...document.querySelectorAll('.cpDia:checked')].map(c=>+c.value).sort((a,b)=>a-b);
  if(!dias.length)return toast('Selecione ao menos um dia de aula');
  const prof=(document.getElementById('cpProf').value||'').trim();
  const hor=(document.getElementById('cpHor').value||'').trim();
  const nivel = trilha==='avancado' ? 'adults' : trilha;
  const t={id:uid(),nome,nivel,cefr,horario:hor,dias,vezesSemana:dias.length,arquivada:false,status:'formacao'};
  if(prof) t.professor=prof;
  S.turmas.push(t);
  save(); fechar(); montarNav();
  if(rota==='gturmas') VIEWS.gturmas(); else ir('gturmas');
  toast('Turma criada (EM FORMAÇÃO). Adicione os alunos pelo "+ Aluno".');
}