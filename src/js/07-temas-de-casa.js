/* ---- TEMAS DE CASA ---- */
let temaTurma=null, _buscaTema='';
VIEWS.temas=()=>{
  temaTurma=temaTurma||primeiraTurma();
  const v=document.getElementById('view');
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--rosa)"></span><h2 class="display">Temas de casa</h2></div>
    <p class="sub">Crie, consulte e edite os temas de casa da turma. Mostra os recentes; use a busca para anteriores.</p>
    <div class="card"><div class="row">
      <div style="flex:2"><label class="lbl">Turma</label>${selectTurma('tT',temaTurma)}</div>
      <div style="display:flex;align-items:flex-end"><button class="btn" onclick="modalTema(temaTurma,'',hoje(),'extra')">+ Novo tema</button></div>
    </div>
    <input type="text" id="buscaTema" placeholder="🔎 Buscar tema (descrição ou data)" value="${escAttr(_buscaTema)}" oninput="_buscaTema=this.value;renderTemas()" style="margin-top:12px"></div>
    <div id="tList"></div>`;
  document.getElementById('tT').onchange=e=>{temaTurma=e.target.value;renderTemas();};
  renderTemas();
};
function escAttr(s){return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function esc(s){return (s==null?'':s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escJs(s){return (s==null?'':s+'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");}   // p/ strings JS dentro de onclick="f('...')" — use escAttr(escJs(x))
function modalTema(turmaId,descricao,data,origem){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const als=alunosDa(turmaId);
  const orig=data||hoje();
  modal(`<h3>📩 Tema de casa <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Descrição do tema</label><input type="text" id="mtDesc" value="${escAttr(descricao)}" placeholder="Ex: Workbook pág. 30, ex. 1 a 4"></div>
    <p class="hint" style="margin:-6px 0 10px">${origem==='plano'?'Vinculado ao plano de aula de':'Criado em'} <b>${brDate(orig)}</b>.</p>
    <div class="row"><div class="field"><label class="lbl">Data de entrega</label>${selectDataAula('mtEntrega',turmaId,proximaEntrega(turmaId,orig))}</div>
    <div class="field"><label class="lbl">Para quem?</label><select id="mtAlvo" onchange="document.getElementById('mtAlunos').style.display=this.value==='alguns'?'block':'none'">
      <option value="todos">Turma toda</option><option value="alguns">Escolher alunos</option></select></div></div>
    <div id="mtAlunos" style="display:none;max-height:230px;overflow:auto;border:1px solid var(--linha);border-radius:10px;padding:4px 12px;margin-bottom:14px">
      ${als.map(a=>`<label class="check" style="cursor:pointer"><input type="checkbox" class="mtChk" value="${a.id}"><span>${a.nome}</span></label>`).join('')||'<p class="hint">Turma sem alunos.</p>'}
    </div>
    <input type="hidden" id="mtOrig" value="${orig}">
    <button class="btn block" onclick="criarTema('${turmaId}','${origem||'extra'}')">Criar tema</button>`);
  setTimeout(()=>{const i=document.getElementById('mtDesc'); if(i&&!i.value) i.focus();},60);
}
function criarTema(turmaId,origem){
  const desc=document.getElementById('mtDesc').value.trim();
  if(!desc)return toast('Descreva o tema');
  const data=document.getElementById('mtOrig').value||hoje();
  const entrega=(document.getElementById('mtEntrega')||{}).value||proximaEntrega(turmaId,data);
  let alvos;
  if(document.getElementById('mtAlvo').value==='alguns'){
    alvos=[...document.querySelectorAll('.mtChk:checked')].map(c=>c.value);
    if(!alvos.length)return toast('Selecione ao menos um aluno');
  }else{
    alvos=alunosDa(turmaId).map(a=>a.id);
  }
  const ent={}; alvos.forEach(id=>ent[id]=true);   // padrão: todos entregaram (marca-se quem NÃO entregou)
  const id=uid();
  S.temas.push({id,turmaId,data,dataEntrega:entrega,descricao:desc,entregas:ent,origem:origem||'extra',atualizadoEm:Date.now()});
  if(origem==='plano' && _temaPlanoRef){
    const p=S.planos.find(x=>x.id===_temaPlanoRef.pid);
    if(p && p.itens[_temaPlanoRef.i]){ p.itens[_temaPlanoRef.i].virouTema=true; p.itens[_temaPlanoRef.i].temaId=id; }
  }
  _temaPlanoRef=null;
  save(); fechar(); toast('Tema de casa criado');
  if(rota==='temas'){ temaTurma=turmaId; VIEWS.temas(); }
  else if(rota==='planos'){ renderPlanos(); }
  else if(rota==='presenca'){ renderTemaChamada(); }
}
let _temaPlanoRef=null;
function temaDoPlano(pid,i){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); const p=S.planos.find(p=>p.id===pid); if(!p)return; _temaPlanoRef={pid,i}; modalTema(p.turmaId,p.itens[i].txt,p.data,'plano'); }
function desfazerTemaDoPlano(pid,i){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const p=S.planos.find(p=>p.id===pid); if(!p||!p.itens[i])return;
  if(!confirm('Desfazer o tema deste item? O item volta a fazer parte do plano e o tema criado é apagado.'))return;
  const it=p.itens[i];
  if(it.temaId){ S.temas=S.temas.filter(t=>t.id!==it.temaId); marcarExcluido('temas',it.temaId); }
  it.virouTema=false; delete it.temaId;
  save(); renderPlanos(); toast('Tema desfeito — item voltou ao plano');
}
function temaExtraDoPlano(pid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); const p=S.planos.find(p=>p.id===pid); if(!p)return; _temaPlanoRef=null; modalTema(p.turmaId,'',p.data,'extra'); }
function renderTemas(){
  const list=document.getElementById('tList');
  let ts=S.temas.filter(t=>t.turmaId===temaTurma);
  const raw=(_buscaTema||'').trim(), q=_normTxt(raw);
  if(q){ ts=ts.filter(t=>_normTxt(t.descricao).includes(q)||t.data.includes(raw)||brDate(t.data).includes(raw)); }
  else { const lim=diasAtras(7); ts=ts.filter(t=>t.data>=lim); }
  ts.sort((a,b)=>b.data.localeCompare(a.data));
  if(!ts.length){list.innerHTML=`<div class="card empty"><div class="big">📚</div>${raw?'Nenhum tema encontrado.':'Nenhum tema extra na última semana para esta turma.'}</div>`;return;}
  const totalTurma=alunosDa(temaTurma).length;
  list.innerHTML=ts.map(t=>{
    const alvos=Object.keys(t.entregas);
    const naoFeito=alvos.filter(aid=>t.entregas[aid]===false).length;
    const parcial=alvos.filter(aid=>t.entregas[aid]==='parcial').length;
    const alvoLabel=(totalTurma>0 && alvos.length>=totalTurma)?'Turma toda':alvos.length+' aluno(s)';
    const badge=t.origem==='plano'?'<span class="pill" style="background:#e6f0fb;color:var(--azul)">do plano</span>':'<span class="pill">extra</span>';
    return `<div class="card"><div style="display:flex;align-items:flex-start;gap:8px"><div style="flex:1"><h3 style="margin:0">${t.descricao}</h3>
      <p class="hint" style="margin:4px 0 0">${t.origem==='plano'?'Aula':'Criado'} ${brDate(t.data)}${t.dataEntrega?` · 📅 entrega ${brDate(t.dataEntrega)}`:''} · ${alvoLabel} · ${naoFeito} não feito${parcial?` · ${parcial} parcial`:''} &nbsp;${badge}</p></div>
      <button class="btn ghost sm" onclick="trocarEntregaTema('${t.id}')">📅 entrega</button><button class="btn ghost sm" onclick="editarTema('${t.id}')">✏️ editar</button></div>
      <p class="hint" style="margin:8px 0 8px">Padrão: <b>feito</b>. Marque quem fez <b>parcialmente</b> ou <b>não fez</b>.</p>
      <button class="btn ghost sm" style="margin-bottom:6px" onclick="todosEntregaram('${t.id}')">✓ Todos feito</button>
      ${alvos.map(aid=>{const a=S.alunos.find(x=>x.id===aid);const st=t.entregas[aid];
        return `<div class="check"><span style="flex:1">${a?a.nome:'—'}${st==='atrasado'?' <span class="pill" style="background:#fff0e6;color:var(--laranja)">⏰ atrasado</span>':''}</span>
          <div class="seg"><button class="${st===true?'on-ok':''}" onclick="setTema('${t.id}','${aid}',true)">feito</button>
          <button class="${st==='parcial'?'on-mid':''}" onclick="setTema('${t.id}','${aid}','parcial')">parcial</button>
          <button class="${st===false?'on-no':''}" onclick="setTema('${t.id}','${aid}',false)">não feito</button></div></div>`;}).join('')}
      ${soLeitura()?'':`<button class="btn ghost sm" style="margin-top:12px;color:var(--vermelho)" onclick="delTema('${t.id}')">🗑️ Remover tema</button>`}</div>`;
  }).join('');
}
function refreshTemaCtx(){ if(document.getElementById('tList')) renderTemas(); else if(document.getElementById('pTema')) renderTemaChamada(); else if(document.getElementById('plList')) renderPlanos(); }
function faltouNoDia(rec, aid){
  if(!rec) return false;
  const s1=(rec.registros||{})[aid]||'presente';
  if(rec.registros2){ const s2=rec.registros2[aid]||'presente'; return s1==='falta' && s2==='falta'; }
  return s1==='falta';
}
// Entregas de tema que devem aparecer numa aula com data `dataAula`:
//  - temas com entrega NESTE dia (todos os alunos do tema)
//  - temas de entrega passada com alunos marcados 'atrasado' (só esses, como pendência que segue até resolver)
function temasEntregaDaAula(turmaId, dataAula){
  const res=[];
  S.temas.filter(t=>t.turmaId===turmaId).forEach(t=>{
    const ent=t.dataEntrega||t.data;
    if(ent===dataAula){ const aids=Object.keys(t.entregas||{}); if(aids.length) res.push({tema:t,aids,entregaEra:ent,atrasada:false}); }
    else if(ent<dataAula){ const aids=Object.keys(t.entregas||{}).filter(aid=>t.entregas[aid]==='atrasado'); if(aids.length) res.push({tema:t,aids,entregaEra:ent,atrasada:true}); }
  });
  return res;
}
function setTema(tid,aid,val){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const t=S.temas.find(t=>t.id===tid);t.entregas[aid]=val;t.atualizadoEm=Date.now();save();refreshTemaCtx();}
function todosEntregaram(tid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const t=S.temas.find(t=>t.id===tid);if(!t)return;Object.keys(t.entregas).forEach(k=>t.entregas[k]=true);t.atualizadoEm=Date.now();save();refreshTemaCtx();toast('Todos marcados como feito');}
function delTema(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');if(confirm('Remover este tema de casa?')){S.temas=S.temas.filter(t=>t.id!==id);marcarExcluido('temas',id);save();refreshTemaCtx();toast('Tema removido');}}
function editarTema(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const t=S.temas.find(x=>x.id===id); if(!t)return;
  modal(`<h3>✏️ Editar tema <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Descrição</label><input type="text" id="etDesc" value="${escAttr(t.descricao)}"></div>
    <div class="row"><div class="field"><label class="lbl">Data da aula/origem</label><input type="date" id="etData" value="${t.data}"></div>
    <div class="field"><label class="lbl">Data de entrega</label>${selectDataAula('etEntrega',t.turmaId,t.dataEntrega||proximaEntrega(t.turmaId,t.data))}</div></div>
    <button class="btn block" onclick="salvarEdicaoTema('${id}')">Salvar alterações</button>`);
  setTimeout(()=>{const i=document.getElementById('etDesc'); if(i)i.focus();},60);
}
function salvarEdicaoTema(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const t=S.temas.find(x=>x.id===id); if(!t)return;
  const d=document.getElementById('etDesc').value.trim(); if(!d)return toast('Descreva o tema');
  t.descricao=d; t.data=document.getElementById('etData').value;
  const en=(document.getElementById('etEntrega')||{}).value; if(en) t.dataEntrega=en;
  t.atualizadoEm=Date.now(); save(); fechar(); refreshTemaCtx(); toast('Tema atualizado');
}
function trocarEntregaTema(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const t=S.temas.find(x=>x.id===id); if(!t)return;
  modal(`<h3>📅 Trocar data de entrega <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:-4px 0 10px">Tema: <b>${escAttr(t.descricao)}</b><br>Entrega atual: ${brDate(t.dataEntrega||t.data)}</p>
    <div class="field"><label class="lbl">Nova data de entrega</label>${selectDataAula('teEntrega',t.turmaId,t.dataEntrega||t.data)}</div>
    <button class="btn block" onclick="salvarEntregaTema('${id}')">Salvar</button>`);
}
function salvarEntregaTema(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const t=S.temas.find(x=>x.id===id); if(!t)return;
  const en=(document.getElementById('teEntrega')||{}).value; if(!en)return toast('Selecione a data de entrega');
  t.dataEntrega=en; t.atualizadoEm=Date.now(); save(); fechar(); refreshTemaCtx(); toast('Data de entrega atualizada');
}
function abrirTemasHub(turmaId, planoData){
  const ts=S.temas.filter(t=>t.turmaId===turmaId).sort((a,b)=>(b.dataEntrega||b.data).localeCompare(a.dataEntrega||a.data)).slice(0,40);
  modal(`<h3>📚 Temas — ${turmaNome(turmaId)} <button class="close" onclick="fechar()">×</button></h3>
    <button class="btn block" onclick="modalTema('${turmaId}','','${planoData}','extra')">+ Passar tema nesta aula (${brDate(planoData)})</button>
    <p class="hint" style="margin:12px 0 6px">Temas recentes — toque para editar a descrição/datas ou trocar a entrega:</p>
    <div style="max-height:44vh;overflow:auto">
    ${ts.length?ts.map(t=>`<div class="check"><span style="flex:1">${escAttr(t.descricao)}<br><span class="hint">passado ${brDate(t.data)} · entrega ${brDate(t.dataEntrega||t.data)}</span></span>
      <button class="btn ghost sm" title="Trocar entrega" onclick="trocarEntregaTema('${t.id}')">📅</button>
      <button class="btn ghost sm" onclick="editarTema('${t.id}')">✏️</button></div>`).join(''):'<p class="hint">Nenhum tema ainda nesta turma.</p>'}
    </div>
    <button class="btn ghost block" style="margin-top:10px" onclick="fechar();ir('temas')">Ver todos na aba Temas</button>`);
}
