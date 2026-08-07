/* =====================================================================
   🎯 TAREFAS INTERNAS — matriz de Eisenhower (b148)
   Quadrantes: FAZER AGORA (urgente+importante) · AGENDAR (importante) ·
   STANDBY (urgente, no lugar de "delegar") · ELIMINAR (nem um nem outro).
   S.tarefas: {id, titulo, obs, quadrante:'fazer'|'agendar'|'standby'|'eliminar',
   responsavel, prazo, feita, feitaEm, criadoPor, criadoEm, atualizadoEm}.
   Equipe toda vê e cria; concluir é de todos; excluir: direção ou quem criou.
   ===================================================================== */
const TAR_QUAD={
  fazer:   {lbl:'✅ Fazer agora',  hint:'Urgente e importante',        cor:'#E52524', bg:'#fdeaea'},
  agendar: {lbl:'📅 Agendar',     hint:'Importante, sem pressa',      cor:'#005EAF', bg:'#e6f0fb'},
  standby: {lbl:'⏸️ Standby',     hint:'Urgente, mas não importante', cor:'#b8860b', bg:'#fff8e0'},
  eliminar:{lbl:'🗑️ Eliminar',    hint:'Nem urgente, nem importante', cor:'#5a6b86', bg:'#eef0f4'}
};
const TAR_SETORES=[['direcao','👑 Direção'],['secretaria','🗂️ Secretaria'],['professor','👩‍🏫 Professores']];
function _tarSetorLabel(k){ const s=TAR_SETORES.find(x=>x[0]===k); return s?s[1]:''; }
let _tarVerFeitas=false, _tarSoMinhas=false;
function _tars(){ return S.tarefas||[]; }
// b180: cada um vê as próprias (criadas por, responsável ou encaminhadas ao seu setor).
// A direção acompanha todas (pode filtrar "só as minhas").
function _tarVisivel(t){
  const meu=S.usuario;
  const minha = t.criadoPor===meu || t.responsavel===meu || (t.setor && t.setor===S.perfil);
  if(S.perfil==='direcao') return _tarSoMinhas ? minha : true;
  return minha;
}
function tarefasAbertas(){ return _tars().filter(t=>!t.feita && _tarVisivel(t)).length; }
VIEWS.tarefas=()=>{
  const v=document.getElementById('view');
  const ehDir=S.perfil==='direcao';
  const visiveis=_tars().filter(_tarVisivel);
  const abertas=visiveis.filter(t=>!t.feita);
  const feitas=visiveis.filter(t=>t.feita).sort((a,b)=>(b.feitaEm||'').localeCompare(a.feitaEm||''));
  const hj=hoje();
  const linha=t=>{
    const atrasada=!t.feita && t.prazo && t.prazo<hj;
    const dono=(ehDir||t.criadoPor===S.usuario);
    return `<div class="check" style="align-items:flex-start">
      <input type="checkbox" ${t.feita?'checked':''} onchange="tarToggle('${t.id}')" title="${t.feita?'reabrir':'concluir'}">
      <span style="flex:1;${t.feita?'text-decoration:line-through;opacity:.6':''}">
        <b>${esc(t.titulo)}</b>${t.obs?`<br><span class="hint">${esc(t.obs)}</span>`:''}
        <br><span class="hint">${t.setor?('🏷️ '+esc(_tarSetorLabel(t.setor))+' · '):''}${t.responsavel?('👤 '+esc(t.responsavel)+' · '):''}${t.prazo?('📅 '+brDate(t.prazo)+(atrasada?' <b style="color:var(--vermelho)">atrasada</b>':'')+' · '):''}por ${esc(t.criadoPor||'')}${t.feita&&t.feitaEm?(' · ✓ '+brDate(t.feitaEm)):''}</span>
      </span>
      <button class="btn ghost sm" onclick="tarEditar('${t.id}')">✏️</button>
      ${dono?`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="tarExcluir('${t.id}')">×</button>`:''}
    </div>`;
  };
  const quad=k=>{
    const q=TAR_QUAD[k]; const ts=abertas.filter(t=>(t.quadrante||'fazer')===k).sort((a,b)=>(a.prazo||'9999').localeCompare(b.prazo||'9999'));
    return `<div class="card" style="border-top:4px solid ${q.cor};min-width:0">
      <div style="display:flex;align-items:center;gap:8px"><h3 style="margin:0;flex:1">${q.lbl} (${ts.length})</h3>
        <button class="btn ghost sm" onclick="tarNova('${k}')">+</button></div>
      <p class="hint" style="margin:2px 0 6px">${q.hint}</p>
      ${ts.map(linha).join('')||'<p class="hint">Nada aqui. 👍</p>'}
    </div>`;
  };
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#E52524"></span><h2 class="display">🎯 Tarefas internas</h2></div>
    <p class="sub">Cada um vê as <b>suas</b> tarefas. ${ehDir?'Como direção, você <b>acompanha as de todos</b> e pode <b>delegar</b>.':'Encaminhe para um <b>setor</b> quando a tarefa for de outra área.'} ${abertas.length} aberta(s).</p>
    ${ehDir?`<div class="card" style="padding:10px 14px"><label style="display:inline-flex;gap:8px;align-items:center;margin:0;cursor:pointer"><input type="checkbox" ${_tarSoMinhas?'checked':''} onchange="_tarSoMinhas=this.checked;VIEWS.tarefas()"> 👤 Ver só as minhas</label></div>`:''}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px">
      ${quad('fazer')}${quad('agendar')}${quad('standby')}${quad('eliminar')}
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px"><h3 style="margin:0;flex:1">✓ Concluídas (${feitas.length})</h3>
        ${feitas.length?`<button class="btn ghost sm" onclick="_tarVerFeitas=!_tarVerFeitas;VIEWS.tarefas()">${_tarVerFeitas?'esconder':'mostrar'}</button>`:''}</div>
      ${_tarVerFeitas?feitas.slice(0,30).map(linha).join(''):''}
    </div>`;
};
function tarNova(quadrante){ _tarModal(null, quadrante||'fazer'); }
function tarEditar(id){ const t=_tars().find(x=>x.id===id); if(t) _tarModal(t, t.quadrante); }
function _tarModal(t, quadrante){
  const ehDir=S.perfil==='direcao';
  const nomes=[...new Set((S.usuarios||[]).map(u=>u.nome))];
  modal(`<h3>${t?'Editar tarefa':'Nova tarefa'} <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">O que precisa ser feito</label><input type="text" id="tf_titulo" value="${t?escAttr(t.titulo):''}" placeholder="Ex: Encomendar livros da turma nova"></div>
    <div class="field"><label class="lbl">Detalhes (opcional)</label><textarea id="tf_obs" style="min-height:56px">${t?esc(t.obs||''):''}</textarea></div>
    <div class="row">
      <div class="field" style="flex:2"><label class="lbl">Quadrante</label><select id="tf_quad">${Object.keys(TAR_QUAD).map(k=>`<option value="${k}" ${((t?t.quadrante:quadrante)===k)?'selected':''}>${TAR_QUAD[k].lbl} — ${TAR_QUAD[k].hint}</option>`).join('')}</select></div>
    </div>
    <div class="row">
      <div class="field" style="flex:1"><label class="lbl">Encaminhar para o setor</label><select id="tf_setor"><option value="">— eu mesmo —</option>${TAR_SETORES.map(s=>`<option value="${s[0]}" ${((t&&t.setor)===s[0])?'selected':''}>${s[1]}</option>`).join('')}</select></div>
      ${ehDir?`<div class="field" style="flex:1"><label class="lbl">Delegar a (pessoa)</label><select id="tf_resp"><option value="">— alguém da equipe —</option>${nomes.map(n=>`<option ${((t&&t.responsavel)===n)?'selected':''}>${esc(n)}</option>`).join('')}</select></div>`:''}
      <div class="field"><label class="lbl">Prazo (opcional)</label><input type="date" id="tf_prazo" value="${t?escAttr(t.prazo||''):''}"></div>
    </div>
    <button class="btn block" onclick="tarSalvar('${t?t.id:''}')">Salvar</button>`);
  setTimeout(()=>{const i=document.getElementById('tf_titulo'); if(i)i.focus();},60);
}
function tarSalvar(id){
  const titulo=((document.getElementById('tf_titulo')||{}).value||'').trim();
  if(!titulo) return toast('Descreva a tarefa');
  const dados={ titulo, obs:((document.getElementById('tf_obs')||{}).value||'').trim(),
    quadrante:(document.getElementById('tf_quad')||{}).value||'fazer',
    setor:(document.getElementById('tf_setor')||{}).value||'',
    prazo:(document.getElementById('tf_prazo')||{}).value||'' };
  const respEl=document.getElementById('tf_resp'); if(respEl) dados.responsavel=respEl.value||'';   // só a direção delega a uma pessoa
  S.tarefas=S.tarefas||[];
  if(id){ const t=_tars().find(x=>x.id===id); if(!t) return; Object.assign(t,dados); t.atualizadoEm=Date.now(); }
  else S.tarefas.push(Object.assign({id:uid(), feita:false, criadoPor:S.usuario||'', criadoEm:hoje(), atualizadoEm:Date.now()}, dados));
  save(); fechar(); VIEWS.tarefas(); toast('Tarefa salva ✓');
}
function tarToggle(id){
  const t=_tars().find(x=>x.id===id); if(!t) return;
  t.feita=!t.feita; t.feitaEm=t.feita?hoje():''; t.atualizadoEm=Date.now();
  save(); VIEWS.tarefas();
}
function tarExcluir(id){
  const t=_tars().find(x=>x.id===id); if(!t) return;
  if(!(S.perfil==='direcao'||t.criadoPor===S.usuario)) return toast('Só a direção ou quem criou pode excluir');
  if(!confirm('Excluir esta tarefa?')) return;
  marcarExcluido('tarefas',id);
  S.tarefas=_tars().filter(x=>x.id!==id);
  save(); VIEWS.tarefas(); toast('Tarefa excluída');
}
