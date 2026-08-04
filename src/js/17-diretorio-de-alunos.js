/* ===== Diretório de Alunos (b51) ===== */
let _alDirBusca='';
function _alunosDirLista(){
  let ts=(typeof turmasVisiveis==='function'?turmasVisiveis():(S.turmas||[]));
  ts=ts.filter(t=>turmaStatus(t)!=='encerrada');
  const tids=ts.map(t=>t.id);
  const q=_normTxt(_alDirBusca||'').trim();
  let arr=(S.alunos||[]).filter(a=>!a.arquivado && tids.indexOf(a.turmaId)>=0);
  if(q) arr=arr.filter(a=>_normTxt(a.nome).includes(q));
  return arr.sort((a,b)=>a.nome.localeCompare(b.nome));
}
function renderAlunosDir(){
  const box=document.getElementById('alDirList'); if(!box) return;
  const arr=_alunosDirLista();
  if(!arr.length){ box.innerHTML='<p class="hint" style="margin:8px 0 0">'+(_alDirBusca?'Nenhum aluno encontrado.':'Nenhum aluno por aqui.')+'</p>'; return; }
  box.innerHTML='<div class="card"><h3>'+arr.length+' aluno(s)</h3>'+arr.map(a=>{
    const t=(S.turmas||[]).find(x=>x.id===a.turmaId);
    return `<div class="check" style="border-top:1px solid var(--linha)"><span style="flex:1;cursor:pointer;color:var(--azul)" onclick="abrirFicha('${a.id}')" title="Abrir ficha">${escAttr(a.nome)}${t?` <span class="pill">${escAttr(t.nome)}</span>`:''}</span><button class="btn ghost sm" onclick="abrirFicha('${a.id}')">📇 Ficha</button>${t?`<button class="btn ghost sm" onclick="abrirTurma('${t.id}')">🏫 Turma</button>`:''}</div>`;
  }).join('')+'</div>';
}
function setAlDir(v){ _alDirBusca=v; renderAlunosDir(); }
VIEWS.alunos=()=>{
  const v=document.getElementById('view');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Alunos</h2></div>
  <p class="sub">Diretório de alunos. Toque no nome (ou em 📇 Ficha) para abrir a ficha completa.</p>
  <div class="card" style="padding:14px 18px"><input type="text" id="alDirBusca" placeholder="🔎 Buscar aluno pelo nome" value="${escAttr(_alDirBusca)}" oninput="setAlDir(this.value)"></div>
  <div id="alDirList"></div>`;
  renderAlunosDir();
};

VIEWS.turmas=()=>{
  painelTurma=null;
  const v=document.getElementById('view');
  const ehProf=ehProfessor()||soLeitura();   // esconde o que é de sala/direção
  const podeCriar=(typeof podeCadastro==='function')?podeCadastro():(S.perfil==='direcao');   // direção + secretaria criam turmas
  const ehDir=S.perfil==='direcao';
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Turmas e alunos</h2></div>
    <p class="sub">${soLeitura()?'Todas as turmas da escola. Você <b>gerencia o cadastro</b> (criar/editar turmas e alunos, e-mails, arquivar); as ações de sala (chamada, planos, testes, temas) ficam com os professores.':ehProfessor()?'Suas turmas. Toque numa turma para abrir o painel (chamada, plano, material, temas, testes).':'Todas as turmas da escola. Toque numa turma para abrir o painel; ou cadastre uma nova.'}</p>
    ${ehDir?`<div style="margin-bottom:12px"><button class="btn" onclick="ir('gestaoturmas')">🔁 Gestão rápida — trocar professor / promover nível</button></div>`:''}
    ${!podeCriar?'':`<div class="card"><h3>➕ Nova turma</h3><div class="row">
      <div style="flex:2"><label class="lbl">Nome da turma</label><input type="text" id="nT" placeholder="Ex: B2 TEENS NOITE"></div>
      <div><label class="lbl">Categoria</label><select id="nN">${((typeof segmentosFin==='function')?segmentosFin():[['kids','Kids'],['junior','Junior'],['teens','Teens'],['adults','Adults'],['talking','Talking']]).map(([k,lbl])=>`<option value="${k}" ${k==='teens'?'selected':''}>${esc(lbl)}</option>`).join('')}</select></div>
      <div><label class="lbl">Nível CEFR</label><select id="nC"><option value="">—</option>${((typeof cefrTodos==='function')?cefrTodos():CEFR_ORDEM).map(c=>`<option value="${escAttr(c)}">${esc(c)}</option>`).join('')}</select></div>
      <div style="flex:1"><label class="lbl">Horário (opcional)</label><input type="text" id="nHor" placeholder="Ex: 18:15–19:30"></div>
    </div>
    <div class="field" style="margin-top:10px"><label class="lbl">Dias de aula</label><div style="display:flex;flex-wrap:wrap;gap:6px">
      ${[1,2,3,4,5,6].map(d=>`<label style="display:flex;align-items:center;gap:5px;font-size:.88rem;border:1px solid var(--linha);border-radius:9px;padding:6px 10px;cursor:pointer"><input type="checkbox" class="nDia" value="${d}"> ${DIAS_SEMANA[d]}</label>`).join('')}
    </div><p class="hint" style="margin:6px 0 0">A chamada e os planos só permitirão datas nesses dias. Aulas 1x/semana contam falta em dobro. <b>Aluno VIP</b> (aula avulsa) é registrado dentro da turma, em "👑 Aulas VIP".</p></div>
    <div style="margin-top:12px"><button class="btn" onclick="addTurma()">+ Criar turma</button></div></div>`}
    ${ehProfessor()?'':`<div class="card" style="padding:12px 18px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn ghost sm" onclick="toggleVerArquivadas()">${_verArquivadas?'Ocultar arquivados':'Mostrar arquivados'}</button></div>`}
    <div class="card" style="padding:14px 18px"><input type="text" id="buscaAluno" placeholder="🔎 Buscar aluno pelo nome (em todas as turmas)" value="${_buscaAluno||''}" oninput="filtrarAlunos(this.value)"></div>
    <div id="turmaList"></div>
    ${!ehDir?'':`<div class="card" style="border-color:#fdd"><h3 style="color:var(--vermelho)">Zona de risco</h3><p class="hint">Apaga <b>todos os dados</b> (chamadas, temas, planos, testes…) e volta às turmas iniciais. Exige a <b>senha de um(a) diretor(a)</b> e baixa um <b>backup automático</b> antes de apagar.</p>
      <button class="btn red sm" onclick="resetarSeguro()">Restaurar dados originais</button></div>`}`;
  renderTurmaList();
};
let _buscaAluno='';
function filtrarAlunos(v){ _buscaAluno=v; renderTurmaList(); }
function addTurma(){if(!podeCadastro())return toast('Sem permissão para criar turmas');
  if(ehProfessor())return toast('Sem permissão');
  const nome=document.getElementById('nT').value.trim();
  if(!nome)return toast('Dê um nome à turma');
  const dias=[...document.querySelectorAll('.nDia:checked')].map(c=>+c.value).sort((a,b)=>a-b);
  if(!dias.length)return toast('Selecione ao menos um dia de aula');
  const hor=(document.getElementById('nHor').value||'').trim();
  const cefr=(document.getElementById('nC')||{}).value||cefrFromNome(nome);
  const t={id:uid(),nome,nivel:document.getElementById('nN').value,cefr,horario:hor,dias,vezesSemana:dias.length};
  if(S.perfil==='professor'){const u=S.usuarios.find(u=>u.nome===S.usuario);t.professor=u&&u.ensina;}
  S.turmas.push(t);
  save();VIEWS.turmas();toast('Turma criada');
}
let _fSeg='', _fPer='', _fDia='', _fProf='', _filtroAberto=false;
function toggleFiltroTurma(){ _filtroAberto=!_filtroAberto; renderTurmaList(); }
const PERIODOS=[['manha','Manhã'],['tarde','Tarde'],['tardinha','Tardinha'],['noite','Noite']];
function _minHHMM(s){ const m=String(s||'').match(/(\d{1,2}):(\d{2})/); return m? (+m[1]*60 + +m[2]) : null; }
function _horaIniTurma(t){ const m=String((t&&t.horario)||'').match(/(\d{1,2}):(\d{2})/g); if(m&&m.length){ const p=m[0].split(':'); return +p[0]*60 + +p[1]; } return null; }
function podeVerTodos(){ return S.perfil==='direcao'||S.perfil==='secretaria'; }
function periodoTurma(t){ const s=_horaIniTurma(t); if(s==null)return ''; if(s<720)return 'manha'; if(s<1020)return 'tarde'; if(s<1140)return 'tardinha'; return 'noite'; }
function turmaPassaFiltro(t){
  if(_fSeg && t.nivel!==_fSeg) return false;
  if(_fPer && periodoTurma(t)!==_fPer) return false;
  if(_fDia && diasTurmaLabel(t)!==_fDia) return false;
  if(_fProf && _normTxt(t.professor||'')!==_normTxt(_fProf)) return false;
  return true;
}
function _filtroTurmaAtivo(){ return _fSeg||_fPer||_fDia||_fProf; }
function setFiltroTurma(campo,val){ if(campo==='seg')_fSeg=val; else if(campo==='per')_fPer=val; else if(campo==='dia')_fDia=val; else if(campo==='prof')_fProf=val; renderTurmaList(); }
function limparFiltrosTurma(){ _fSeg=_fPer=_fDia=_fProf=''; renderTurmaList(); }
function renderFiltrosTurma(base){
  const ativos=[_fSeg,_fPer,_fDia,_fProf].filter(Boolean).length;
  if(!_filtroAberto){   // recolhido: lista aparece como antes, com um botão discreto
    let resumo='';
    if(ativos){
      const partes=[]; if(_fSeg)partes.push(_fSeg); if(_fPer)partes.push((PERIODOS.find(p=>p[0]===_fPer)||[])[1]||_fPer); if(_fDia)partes.push(_fDia); if(_fProf)partes.push(_fProf);
      resumo=` <span class="hint">${partes.join(' · ')}</span> <button class="btn ghost sm" onclick="limparFiltrosTurma()">limpar</button>`;
    }
    return `<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="btn ghost sm" onclick="toggleFiltroTurma()">🔎 Filtrar${ativos?` (${ativos})`:''}</button>${resumo}</div>`;
  }
  const segs=[...new Set(base.map(t=>t.nivel).filter(Boolean))].sort();
  const dias=[...new Set(base.map(t=>diasTurmaLabel(t)).filter(Boolean))].sort();
  const profs=[...new Set(base.map(t=>t.professor).filter(Boolean))].sort();
  const opt=(val,cur,lbl)=>`<option value="${escAttr(val)}" ${cur===val?'selected':''}>${escAttr(lbl)}</option>`;
  const sel=(campo,cur,ph,items)=>`<select onchange="setFiltroTurma('${campo}',this.value)" style="flex:1;min-width:130px">${opt('',cur,ph)}${items.map(it=>opt(it[0],cur,it[1])).join('')}</select>`;
  return `<div class="card" style="padding:12px 14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <b>Filtrar turmas e alunos</b>
      <button class="btn ghost sm" onclick="toggleFiltroTurma()">ocultar ▲</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${sel('seg',_fSeg,'Todos os segmentos',segs.map(s=>[s,s]))}
      ${sel('per',_fPer,'Todos os horários',PERIODOS.filter(p=>base.some(t=>periodoTurma(t)===p[0])))}
      ${sel('dia',_fDia,'Todos os dias',dias.map(d=>[d,d]))}
      ${sel('prof',_fProf,'Todos os professores',profs.map(p=>[p,p]))}
      ${_filtroTurmaAtivo()?`<button class="btn ghost sm" onclick="limparFiltrosTurma()">limpar</button>`:''}
    </div></div>`;
}
function renderTurmaList(){
  const list=document.getElementById('turmaList');
  let ts=turmasVisiveis();
  const base=ts.slice();
  if(!base.length){list.innerHTML='<div class="card empty"><div class="big">👥</div>Nenhuma turma. Crie a primeira!</div>';return;}
  const bar = podeVerTodos()? renderFiltrosTurma(base) : '';
  if(podeVerTodos()) ts=ts.filter(turmaPassaFiltro);
  const f=_normTxt(_buscaAluno||'').trim();
  if(f){   // modo busca: lista achatada de alunos que batem (respeitando os filtros)
    const res=[];
    ts.forEach(t=>alunosDa(t.id).forEach(a=>{ if(_normTxt(a.nome).includes(f)) res.push({a,t}); }));
    list.innerHTML = bar + (res.length
      ? `<div class="card"><h3>${res.length} aluno(s) encontrado(s)</h3>`+
        res.map(r=>`<div class="check"><span style="flex:1">${esc(r.a.nome)} <span class="pill">${esc(r.t.nome)}</span></span>
          <button class="btn ghost sm" onclick="abrirTurma('${r.t.id}')">🏫 Turma</button>
          <button class="btn ghost sm" onclick="abrirFicha('${r.a.id}')">📇 Ficha</button>
          ${podeCadastro()?`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="delAluno('${r.a.id}')">remover</button>`:''}</div>`).join('')+`</div>`
      : `<div class="card empty"><div class="big">🔎</div>Nenhum aluno encontrado para “${_buscaAluno}”${_filtroTurmaAtivo()?' com esses filtros':''}.</div>`);
    return;
  }
  if(!ts.length){ list.innerHTML = bar + '<div class="card empty"><div class="big">🔎</div>Nenhuma turma com esses filtros.</div>'; return; }
  list.innerHTML = bar + ts.map(t=>{
    const als=alunosDa(t.id);
    const pend=pendenciasDaTurmaParaMim(t.id);
    const selo=pend.length?`<span class="pill" style="background:#fdeaea;color:var(--vermelho)" title="Pendências nesta turma">⚠️ ${pend.length}</span>`:'';
    const prof=t.professor?` · Prof. ${t.professor}`:'';
    const hor=t.horario?` · ${t.horario}`:'';
    const freq=` · ${diasTurmaLabel(t)||((t.vezesSemana===1)?'1x/sem':'2x/sem')}${t.vezesSemana===1?' (falta dupla)':''}`;
    const _col=(typeof planColecaoDe==='function')?(planColecaoDe(t)||''):'';
    const mat=_col?` · 📘 ${esc(_col)}`:'';
    return `<div class="card" style="cursor:pointer" onclick="abrirTurma('${t.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><h3 style="margin:0">${esc(t.nome)} ${nivelTag(t.nivel)}${t.cefr?` <span class="tag teens">${esc(t.cefr)}</span>`:''} ${selo}</h3>
          <p class="hint" style="margin:4px 0 0">${als.length} aluno(s)${prof}${hor}${freq}${mat}</p></div>
        <span style="font-size:1.7rem;color:var(--azul);line-height:1">›</span>
      </div></div>`;
  }).join('');
}
let painelTurma=null;
function abrirTurma(id){ painelTurma=id; presTurma=matTurma=temaTurma=testeTurma=id; renderPainelTurma(); }
function voltarTurmas(){ painelTurma=null; VIEWS.turmas(); }
function voltarPainel(){ if(painelTurma) renderPainelTurma(); else ir('turmas'); }
function btnVoltaPainel(){ const t=painelTurma&&S.turmas.find(x=>x.id===painelTurma); return t?`<button class="btn ghost sm" onclick="voltarPainel()" style="margin-bottom:10px">‹ Voltar para ${t.nome}</button>`:''; }
function paAcao(destino){
  const id=painelTurma; presTurma=matTurma=temaTurma=testeTurma=id;   // mantém painelTurma para o botão Voltar
  ir(destino);
}
function renderPainelTurma(){
  const id=painelTurma, t=S.turmas.find(x=>x.id===id);
  if(!t){ painelTurma=null; return VIEWS.turmas(); }
  const als=alunosDa(id);
  const freq=(t.vezesSemana===1)?'1x por semana (cada falta conta em dobro)':'2x por semana';
  // ---- métricas do dashboard ----
  const pendentes=S.planos.filter(p=>p.turmaId===id && !p.realizado);
  const prox=pendentes.slice().sort((a,b)=>a.data.localeCompare(b.data))[0];
  const chamadas=S.presencas.filter(p=>p.turmaId===id).sort((a,b)=>b.data.localeCompare(a.data));
  const ult=chamadas[0];
  const ultTxt=ult?`${brDate(ult.data)} — ${Object.values(ult.registros).filter(s=>s==='falta').length} falta(s)`:'nenhuma ainda';
  const alertasN=alertasFaltas().filter(o=>{const a=S.alunos.find(x=>x.id===o.alunoId);return a&&a.turmaId===id;}).length;
  const temasPend=S.temas.filter(x=>x.turmaId===id && Object.values(x.entregas).some(v=>v===false||v==='parcial')).length;
  const btn=(cor,acao,emoji,titulo,sub)=>`<button class="ta-tile" style="--c:${cor}" onclick="paAcao('${acao}')"><div class="ta-em">${emoji}</div><div class="ta-lb">${titulo}</div><div class="ta-hint">${sub}</div></button>`;
  const btnFn=(cor,js,emoji,titulo,sub)=>`<button class="ta-tile" style="--c:${cor}" onclick="${js}"><div class="ta-em">${emoji}</div><div class="ta-lb">${titulo}</div><div class="ta-hint">${sub}</div></button>`;
  const v=document.getElementById('view');
  const podeCadastrar=podeCadastro();
  v.innerHTML=`<button class="btn ghost sm" onclick="voltarTurmas()">‹ Voltar para turmas</button>
    <div class="section-title" style="margin-top:10px"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">${t.nome}</h2></div>
    <p class="sub">${nivelTag(t.nivel)}${t.cefr?` <span class="tag teens">${t.cefr}</span>`:''} · ${als.length} aluno(s)${t.professor?' · Prof. '+t.professor:''}${diasTurmaLabel(t)?' · '+diasTurmaLabel(t):''}${t.horario?' · '+t.horario:''} · ${freq}</p>
    ${bannerPendTurma(id)}
    <div class="card"><h3>Visão geral</h3>
      <div class="dash-grid">
        <div class="stat"><div class="n">${als.length}</div><div class="l">alunos</div></div>
        <div class="stat"><div class="n">${pendentes.length}</div><div class="l">plano(s) pendente(s)</div></div>
        <div class="stat"><div class="n">${alertasN}</div><div class="l">alerta(s) de falta</div></div>
        <div class="stat"><div class="n">${temasPend}</div><div class="l">tema(s) com pendência</div></div>
      </div>
      <p class="hint" style="margin:2px 0 0">Última chamada: ${ultTxt}${prox?` · Próximo plano: <b>${prox.titulo}</b> (${brDate(prox.data)})`:''}</p>
    </div>
    <div class="card"><h3>O que você quer fazer?</h3>${soLeitura()?'<p class="hint" style="margin:-2px 0 8px;color:var(--azul)">👁️ As ações de <b>sala de aula</b> abaixo (chamada, planos, testes, temas) são <b>somente leitura</b> para a secretaria — mas o <b>cadastro de alunos e da turma</b> (mais abaixo) você edita normalmente.</p>':''}
      <div class="ta-grid">
      ${btn('var(--azul)','presenca','📋','Chamada do dia','presença, atraso, material e tema')}
      ${btn('var(--azul)','planos','🗒️','Planos de aula','ver pendente · marcar feito · criar')}
      ${btn('var(--roxo)','testes','✏️','Testes','lançar as notas da turma')}
      ${btnFn('var(--ok)',`abrirTimelineTurma('${id}')`,'📅','Linha do tempo',`onde a turma está · ${planColecaoDe(t)||'coleção a definir'}`)}
      ${soLeitura()?'':btnFn('var(--rosa)',`temaExtraTurma('${id}')`,'📩','Tema extra','para a turma toda ou alunos')}
      ${btn('var(--vermelho)','relatorio','🧾','Relatório do dia','resumo da aula para as famílias')}
      ${btnFn('#0A7A3D',`abrirRelatorioMensal('${id}')`,'📄','Relatório do mês','frequência e temas · PDF/planilha')}
      </div>
    </div>
    <div class="card"><h3>Alunos (${als.length})</h3>
      ${podeCadastrar?'<p class="hint" style="margin:0 0 8px">E-mail do responsável e nascimento ficam na 📇 ficha do aluno.</p>':''}
      ${als.map(a=>`<div style="padding:8px 0;border-bottom:1px dashed var(--linha)"><div style="display:flex;align-items:center;gap:8px">${avatarFoto('av-sm', a.foto, ((a.nome||'·').trim()[0]||'·').toUpperCase(), '')}<span style="flex:1;cursor:pointer;color:var(--azul)" onclick="abrirFicha('${a.id}')" title="Abrir ficha do aluno">${esc(a.nome)}${idadeDe(a.nascimento)!=null?` <span class="pill">${idadeDe(a.nascimento)} anos</span>`:''}${a.arquivado?' <span class="pill" style="background:#eee;color:#888">arquivado</span>':''}</span><button class="btn ghost sm" onclick="abrirFicha('${a.id}')">📇 Ficha</button>${!ehProfessor()?`<button class="btn ghost sm" onclick="abrirTrocarTurma('${a.id}')">🔄 Turma</button><button class="btn ghost sm" onclick="alunoParaVip('${a.id}')">⭐ VIP</button>`:''}${podeCadastrar?`<button class="btn ghost sm" onclick="toggleArquivarAluno('${a.id}')">${a.arquivado?'reativar':'arquivar'}</button><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delAluno('${a.id}')">remover</button>`:''}</div>
        ${a.saldo?`<p class="hint" style="margin:4px 0 0">saldo inicial: ${a.saldo.dadas} aula(s) · ${a.saldo.presencas} presença(s) · ${a.saldo.faltas} falta(s)</p>`:''}
        ${faltasRetroLinha(a)}</div>`).join('')||'<p class="hint">Sem alunos ainda.</p>'}
      ${podeCadastrar?`<button class="btn ghost" style="margin-top:12px" onclick="abrirAddAluno('${id}')">+ Aluno</button>`:''}</div>
    ${!ehProfessor()?`<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn ghost sm" onclick="abrirEditarTurma('${id}')">✏️ Editar dados da turma</button>${podeCadastrar?`<button class="btn ghost sm" onclick="toggleArquivarTurma('${id}')">${t.arquivada?'Reativar turma':'Arquivar turma'}</button><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delTurma('${id}')">Excluir turma</button>`:''}</div>`:''}`;
  window.scrollTo(0,0);
}
function _refreshTurmas(){ if(painelTurma) renderPainelTurma(); else renderTurmaList(); }
function setAlunoEmail(id,val){if(ehProfessor())return;const a=S.alunos.find(x=>x.id===id);if(!a)return;a.email=(val||'').trim();a.atualizadoEm=Date.now();save();}
function setAlunoNascimento(id,val){if(ehProfessor())return; const a=S.alunos.find(x=>x.id===id); if(!a)return; a.nascimento=(val||'').trim(); a.atualizadoEm=Date.now(); save(); _refreshTurmas(); }
function setFaltasRetro(id,val){
  if(S.perfil!=='direcao')return toast('Só a direção edita as faltas retroativas');
  const a=S.alunos.find(x=>x.id===id); if(!a)return;
  a.faltasRetro=Math.max(0,Math.round(+val||0)); a.atualizadoEm=Date.now(); save(); _refreshTurmas();
}
function faltasRetroLinha(a){ return ''; }   /* barra manual removida — faltas retroativas vêm do Sponte */
function toggleArquivarAluno(id){if(ehProfessor())return toast('Sem permissão'); const a=S.alunos.find(x=>x.id===id); if(!a)return; a.arquivado=!a.arquivado; a.atualizadoEm=Date.now(); save(); _refreshTurmas(); montarNav(); toast(a.arquivado?'Aluno arquivado':'Aluno reativado'); }
function toggleArquivarTurma(id){if(!podeCadastro())return toast('Sem permissão'); const t=S.turmas.find(x=>x.id===id); if(!t)return; t.arquivada=!t.arquivada; t.atualizadoEm=Date.now(); if(t.arquivada && painelTurma===id) painelTurma=null; save(); VIEWS.turmas(); montarNav(); toast(t.arquivada?'Turma arquivada':'Turma reativada'); }
// ---- Editar dados de uma turma já existente (só direção) ----
function abrirEditarTurma(id){
  if(!podeCadastro()) return toast('Sem permissão para editar a turma');
  const t=S.turmas.find(x=>x.id===id); if(!t) return;
  const cats=(typeof segmentosFin==='function')?segmentosFin().map(x=>x[0]):['kids','junior','teens','adults','talking'];
  const cefrs=[''].concat((typeof cefrTodos==='function')?cefrTodos():CEFR_ORDEM);
  const profs=[...new Set((S.usuarios||[]).filter(u=>u.ensina).map(u=>u.ensina).filter(Boolean))];
  if(t.professor && profs.indexOf(t.professor)<0) profs.push(t.professor);   // preserva nome legado
  const dias=Array.isArray(t.dias)?t.dias:[];
  modal(`<h3>Editar turma <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Nome da turma</label><input type="text" id="etNome" value="${escAttr(t.nome||'')}"></div>
    <div class="row" style="margin-top:10px">
      <div><label class="lbl">Categoria</label><select id="etCat">${cats.map(c=>`<option value="${c}" ${t.nivel===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div><label class="lbl">Nível CEFR</label><select id="etCefr">${cefrs.map(c=>`<option value="${c}" ${(t.cefr||'')===c?'selected':''}>${c||'—'}</option>`).join('')}</select></div>
      <div style="flex:1"><label class="lbl">Horário</label><input type="text" id="etHor" value="${escAttr(t.horario||'')}" placeholder="Ex: 18:15–19:30"></div>
    </div>
    <div class="field" style="margin-top:10px"><label class="lbl">Professor(a)</label>
      <select id="etProf"><option value="">— sem professor</option>${profs.map(p=>`<option value="${escAttr(p)}" ${t.professor===p?'selected':''}>${esc(p)}</option>`).join('')}</select></div>
    ${(function(){const cols=(typeof colecoesTodas==='function')?colecoesTodas():((typeof TG_COLECOES_TODAS!=='undefined')?TG_COLECOES_TODAS:[]);if(!cols.length)return '';const colAtual=(typeof planColecaoDe==='function')?(planColecaoDe(t)||''):(t.material||'');return `<div class="field" style="margin-top:10px"><label class="lbl">Material / coleção</label>
      <select id="etMaterial"><option value="">— sem material</option>${cols.map(c=>`<option value="${escAttr(c)}" ${colAtual===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
      <p class="hint" style="margin:6px 0 0">Define o material usado pela turma. Trocar aqui <b>não apaga</b> o avanço do plano — para reiniciar a linha do tempo, use a tela Planejamento.</p></div>`;})()}
    <div class="field" style="margin-top:10px"><label class="lbl">Dias de aula</label><div style="display:flex;flex-wrap:wrap;gap:6px">
      ${[1,2,3,4,5,6].map(d=>`<label style="display:flex;align-items:center;gap:5px;font-size:.88rem;border:1px solid var(--linha);border-radius:9px;padding:6px 10px;cursor:pointer"><input type="checkbox" class="etDia" value="${d}" ${dias.indexOf(d)>=0?'checked':''}> ${DIAS_SEMANA[d]}</label>`).join('')}
    </div><p class="hint" style="margin:6px 0 0">Mudar os dias afeta só as <b>próximas</b> chamadas e planos — os registros já feitos continuam intactos.</p></div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn" onclick="salvarEdicaoTurma('${id}')">Salvar alterações</button><button class="btn ghost" onclick="fechar()">Cancelar</button></div>`);
}
function salvarEdicaoTurma(id){
  if(!podeCadastro()) return toast('Sem permissão para editar a turma');
  const t=S.turmas.find(x=>x.id===id); if(!t) return;
  const nome=(document.getElementById('etNome').value||'').trim();
  if(!nome) return toast('Dê um nome à turma');
  const dias=[...document.querySelectorAll('.etDia:checked')].map(c=>+c.value).sort((a,b)=>a-b);
  if(!dias.length) return toast('Selecione ao menos um dia de aula');
  t.nome=nome;
  t.nivel=document.getElementById('etCat').value;
  t.cefr=document.getElementById('etCefr').value;
  t.horario=(document.getElementById('etHor').value||'').trim();
  t.professor=(document.getElementById('etProf').value||'').trim();
  t.dias=dias; t.vezesSemana=dias.length;
  t.atualizadoEm=Date.now();
  const _mat=document.getElementById('etMaterial');
  if(_mat && typeof _planUpsert==='function'){ const mat=_mat.value||''; const rec=_planUpsert(id); if((rec.colecao||'')!==mat){ rec.colecao=mat; rec.atualizadoEm=Date.now(); } }
  save(); fechar(); renderPainelTurma(); montarNav(); toast('Turma atualizada');
}
function toggleVerArquivadas(){ _verArquivadas=!_verArquivadas; if(painelTurma) renderPainelTurma(); else VIEWS.turmas(); }
function addAluno(turmaId){if(!podeCadastro())return toast('Sem permissão');
  const inp=document.getElementById('al_'+turmaId);
  const nome=inp.value.trim();if(!nome)return toast('Digite o nome');
  S.alunos.push({id:uid(),nome,turmaId});save();_refreshTurmas();montarNav();toast('Aluno adicionado');
}
function delAluno(id){if(!podeCadastro())return toast('Sem permissão');if(confirm('Remover este aluno?')){S.alunos=S.alunos.filter(a=>a.id!==id);marcarExcluido('alunos',id);save();_refreshTurmas();montarNav();}}
function delTurma(id){if(!podeCadastro())return toast('Sem permissão');if(confirm('Excluir turma e seus alunos?')){S.alunos.filter(a=>a.turmaId===id).forEach(a=>marcarExcluido('alunos',a.id));marcarExcluido('turmas',id);S.turmas=S.turmas.filter(t=>t.id!==id);S.alunos=S.alunos.filter(a=>a.turmaId!==id);painelTurma=null;save();VIEWS.turmas();montarNav();toast('Turma excluída');}}
function resetarSeguro(){
  modal(`<h3>⚠️ Restaurar dados originais <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:12px">Isto <b>apaga todos os dados atuais</b> (chamadas, temas, planos, testes, comentários…) e volta à base inicial de turmas. Um <b>backup será baixado automaticamente</b> antes de apagar.</p>
    <div class="field"><label class="lbl">Senha de um(a) diretor(a)</label><input type="password" id="resetSenha" placeholder="senha da direção"></div>
    <button class="btn block red" onclick="confirmarReset()">Baixar backup e restaurar</button>`);
  setTimeout(()=>{const i=document.getElementById('resetSenha');if(i)i.focus();},60);
}
async function confirmarReset(){
  const senha=(document.getElementById('resetSenha').value||'');
  if(!senha){ toast('Digite sua senha'); return; }
  const ok=await verificarSenha(S.usuario, senha);   // confirma a senha SEM trocar a sessão do app
  if(!ok){ toast('Senha incorreta'); return; }
  exportarBackup();                        // baixa o estado atual antes de apagar
  S=seed(); S.usuario=null; S.perfil=null;
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
  fechar(); toast('Restaurando…');
  cloudPut(true).finally(()=>setTimeout(()=>location.reload(), 800));
}
function trocarMinhaSenha(){
  modal(`<h3>🔑 Trocar minha senha <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:12px">Defina uma nova senha pessoal (mínimo 4 caracteres).</p>
    <div class="field"><label class="lbl">Nova senha</label><input type="password" id="ms1" placeholder="nova senha"></div>
    <div class="field"><label class="lbl">Repita a nova senha</label><input type="password" id="ms2" placeholder="repita a senha"></div>
    <button class="btn block" onclick="confirmarTrocaSenha()">Salvar nova senha</button>`);
  setTimeout(()=>{const i=document.getElementById('ms1');if(i)i.focus();},60);
}
async function confirmarTrocaSenha(){
  const a=(document.getElementById('ms1').value||'');
  const b=(document.getElementById('ms2').value||'');
  if(a.length<4){ toast('A senha precisa ter ao menos 4 caracteres'); return; }
  if(a!==b){ toast('As senhas não conferem'); return; }
  const r=await cloudTrocarSenha(a);
  if(r && r.ok){ fechar(); toast('Senha alterada ✓'); }
  else if(r && r.erro==='sessao'){ toast('Sessão expirada. Saia e entre novamente.'); }
  else if(r && r.erro==='curta'){ toast('A senha precisa ter ao menos 4 caracteres'); }
  else { toast('Não foi possível alterar agora. Tente de novo.'); }
}
