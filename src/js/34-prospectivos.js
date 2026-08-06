/* =====================================================================
   🌱 PROSPECTIVOS — base de novos interessados (b174)
   Do primeiro contato ao encaminhamento para matrícula.
   S.prospectos: {id, alunoNome, paiNome, dataContato, email, telefone,
     trilha:'kids'|'junior'|'teens'|'adults', nivel, horario,
     status:'ativo'|'encaminhado'|'perdido',
     contatos:[{id,data,nota}], encaminhadoMatriculaId, obs,
     criadoPor, criadoEm, atualizadoEm}
   Acesso: secretaria + direção. "Encaminhar p/ matrícula" cria um
   orçamento de matrícula pré-preenchido e liga ao prospectivo.
   ===================================================================== */
const PROSP_STATUS={
  ativo:      {lbl:'🟢 Em prospecção', cor:'#0A7A3D', bg:'#e6f5ec'},
  encaminhado:{lbl:'📝 Encaminhado',   cor:'#005EAF', bg:'#e6f0fb'},
  perdido:    {lbl:'✖ Não seguiu',     cor:'#8a94a6', bg:'#eef0f4'}
};
function podeProspectos(){ return S.perfil==='direcao' || S.perfil==='secretaria'; }
function _prosps(){ return (S.prospectos=S.prospectos||[]); }
function _prospTrilhaLabel(k){ return (typeof TRILHAS!=='undefined' && TRILHAS[k] && TRILHAS[k].label)||''; }
function _prospNivelTxt(p){ return [_prospTrilhaLabel(p.trilha), p.nivel].filter(Boolean).join(' '); }
function _prospUltimoContato(p){
  const cs=(p&&p.contatos)||[]; if(!cs.length) return null;
  return cs.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')))[0];
}
function _prospEncaminhado(p){ return p && p.encaminhadoMatriculaId && (S.matriculas||[]).some(m=>m.id===p.encaminhadoMatriculaId); }

/* ---------- selects de trilha/nível (mesmas trilhas das turmas) ---------- */
function _prospTrilhaOpts(sel){
  const ks=(typeof TRILHAS!=='undefined')?Object.keys(TRILHAS):[];
  return '<option value="">— trilha —</option>'+ks.map(k=>`<option value="${k}" ${sel===k?'selected':''}>${TRILHAS[k].label}</option>`).join('');
}
function _prospNivelOpts(trilha,sel){
  const ns=(typeof TRILHAS!=='undefined' && TRILHAS[trilha] && TRILHAS[trilha].niveis)||[];
  return '<option value="">— nível —</option>'+ns.map(n=>`<option ${sel===n?'selected':''}>${n}</option>`).join('');
}
function _prospNiveis(){
  const t=((document.getElementById('pr_trilha')||{}).value)||'';
  const s=document.getElementById('pr_nivel'); if(s) s.innerHTML=_prospNivelOpts(t,'');
}

/* ---------- leitura do formulário / upsert ---------- */
function _prospLerForm(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return {
    alunoNome:g('pr_alunoNome').trim(), paiNome:g('pr_paiNome').trim(),
    dataContato:g('pr_dataContato'), email:g('pr_email').trim(), telefone:g('pr_telefone').trim(),
    trilha:g('pr_trilha'), nivel:g('pr_nivel'), horario:g('pr_horario').trim(),
    status:g('pr_status')||'ativo', obs:g('pr_obs').trim()
  };
}
function _prospUpsert(id, extra){
  const m=_prospLerForm(); _prosps();
  let rec=id?S.prospectos.find(x=>x.id===id):null;
  if(rec){ Object.assign(rec,m); }
  else { rec=Object.assign({id:uid(), contatos:[], criadoEm:hoje(), criadoPor:S.usuario}, m); S.prospectos.push(rec); }
  if(typeof extra==='function') extra(rec);
  rec.atualizadoEm=Date.now();
  return rec;
}

/* ---------- tela ---------- */
let _prospFiltro='ativos';
function _prospSetFiltro(f){ _prospFiltro=f; VIEWS.prospectos(); }
function _prospCard(p){
  const st=PROSP_STATUS[p.status||'ativo']||PROSP_STATUS.ativo;
  const uc=_prospUltimoContato(p);
  const nivelTxt=_prospNivelTxt(p);
  const jaEnc=_prospEncaminhado(p);
  const contato=[
    p.paiNome?('👪 '+esc(p.paiNome)):'',
    p.telefone?('📱 '+esc(p.telefone)):'',
    p.email?('✉️ '+esc(p.email)):''
  ].filter(Boolean).join(' · ');
  const nContatos=((p.contatos)||[]).length;
  return `<div class="card" style="border-left:4px solid ${st.cor}">
    <div style="display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap">
      <b style="flex:1;min-width:160px;font-size:1.02rem">${esc(p.alunoNome||'(sem nome)')}</b>
      <span class="pill" style="background:${st.bg};color:${st.cor};border:0">${st.lbl}</span>
    </div>
    ${nivelTxt?`<div style="margin:5px 0 0"><span class="pill">${esc(nivelTxt)}</span></div>`:''}
    ${contato?`<p class="hint" style="margin:6px 0 0">${contato}</p>`:''}
    <p class="hint" style="margin:4px 0 0">${p.horario?('🕐 '+esc(p.horario)+' · '):''}📅 contato em ${p.dataContato?brDate(p.dataContato):'—'}</p>
    ${uc?`<p class="hint" style="margin:6px 0 0;padding:6px 8px;background:#f6f8fb;border-radius:8px">☎️ <b>Último registro ${brDate(uc.data)}:</b> ${esc(uc.nota)}${nContatos>1?` <span style="opacity:.55">(+${nContatos-1})</span>`:''}</p>`:''}
    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:8px">
      <button class="btn ghost sm" onclick="abrirProspecto('${p.id}')">✏️ editar</button>
      <button class="btn ghost sm" onclick="registrarContatoProspecto('${p.id}')">☎️ registrar contato</button>
      ${jaEnc
        ? `<button class="btn ghost sm" style="color:#005EAF" onclick="encaminharProspecto('${p.id}')">📝 ver matrícula</button>`
        : `<button class="btn sm" onclick="encaminharProspecto('${p.id}')">📝 encaminhar p/ matrícula</button>`}
      <button class="btn ghost sm" style="color:var(--vermelho)" onclick="excluirProspecto('${p.id}')">🗑</button>
    </div>
  </div>`;
}
VIEWS.prospectos=()=>{
  const v=document.getElementById('view');
  if(!podeProspectos()){ v.innerHTML='<p class="hint">Sem acesso a esta área.</p>'; return; }
  const todos=_prosps().slice();
  const cont={
    ativos:todos.filter(p=>(p.status||'ativo')==='ativo').length,
    encaminhados:todos.filter(p=>p.status==='encaminhado').length,
    perdidos:todos.filter(p=>p.status==='perdido').length,
    todos:todos.length
  };
  let lista;
  if(_prospFiltro==='encaminhados') lista=todos.filter(p=>p.status==='encaminhado');
  else if(_prospFiltro==='perdidos') lista=todos.filter(p=>p.status==='perdido');
  else if(_prospFiltro==='todos') lista=todos;
  else lista=todos.filter(p=>(p.status||'ativo')==='ativo');
  lista.sort((a,b)=>{
    const ua=_prospUltimoContato(a), ub=_prospUltimoContato(b);
    const da=(ua&&ua.data)||a.dataContato||'', db=(ub&&ub.data)||b.dataContato||'';
    return String(db).localeCompare(String(da)) || _normTxt(a.alunoNome||'').localeCompare(_normTxt(b.alunoNome||''));
  });
  const seg=(f,lbl,n)=>`<button class="btn ${_prospFiltro===f?'':'ghost'} sm" onclick="_prospSetFiltro('${f}')">${lbl} (${n})</button>`;
  v.innerHTML=`
    <div class="section-title"><span class="feijao fj" style="background:#0A7A3D"></span><h2 class="display">Prospectivos</h2></div>
    <p class="sub">Novos interessados — do primeiro contato ao encaminhamento para matrícula.</p>
    <div style="margin-bottom:10px"><button class="btn" onclick="abrirProspecto('')">＋ Novo prospectivo</button></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      ${seg('ativos','🟢 Em prospecção',cont.ativos)}
      ${seg('encaminhados','📝 Encaminhados',cont.encaminhados)}
      ${seg('perdidos','✖ Não seguiram',cont.perdidos)}
      ${seg('todos','Todos',cont.todos)}
    </div>
    <div id="prospLista"></div>`;
  const box=document.getElementById('prospLista');
  box.innerHTML=lista.length
    ? lista.map(_prospCard).join('')
    : `<p class="hint" style="margin:12px 0 0">${todos.length?'Nenhum prospectivo neste filtro.':'Nenhum prospectivo ainda. Clique em “＋ Novo prospectivo”.'}</p>`;
};

/* ---------- formulário ---------- */
function abrirProspecto(id){
  if(!podeProspectos()) return toast('Sem permissão');
  _prosps();
  const p=id?(S.prospectos.find(x=>x.id===id)||{}):{};
  const trilha=p.trilha||'';
  const optSt=Object.keys(PROSP_STATUS).map(k=>`<option value="${k}" ${((p.status||'ativo')===k)?'selected':''}>${PROSP_STATUS[k].lbl}</option>`).join('');
  const contatos=((p.contatos)||[]).slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  const histHTML = id
    ? (contatos.length
        ? contatos.map(c=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid var(--linha)">
             <span style="flex:1"><b>${brDate(c.data)}</b> — ${esc(c.nota)}</span>
             <button class="btn ghost sm" style="color:var(--vermelho)" onclick="removerContatoProspecto('${id}','${c.id}')">✕</button></div>`).join('')
        : '<p class="hint" style="margin:6px 0 0">Nenhum contato registrado ainda.</p>')
    : '<p class="hint" style="margin:6px 0 0">Salve o prospectivo para começar o histórico de contatos.</p>';
  const jaEnc=_prospEncaminhado(p);
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">${id?'✏️ Editar prospectivo':'🌱 Novo prospectivo'}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="field"><label class="lbl">Nome do aluno *</label><input type="text" id="pr_alunoNome" value="${escAttr(p.alunoNome||'')}" placeholder="Nome do interessado"></div>
    <div class="field"><label class="lbl">Nome do pai / responsável</label><input type="text" id="pr_paiNome" value="${escAttr(p.paiNome||'')}" placeholder="Quem procurou a escola"></div>
    <div class="row">
      <div class="field"><label class="lbl">Telefone / WhatsApp</label><input type="text" id="pr_telefone" value="${escAttr(p.telefone||'')}" placeholder="(51) 9…"></div>
      <div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="pr_email" value="${escAttr(p.email||'')}" placeholder="email@exemplo.com"></div>
    </div>
    <div class="row">
      <div class="field"><label class="lbl">Data do contato</label><input type="date" id="pr_dataContato" max="${hoje()}" value="${escAttr(p.dataContato||hoje())}"></div>
      <div class="field"><label class="lbl">Situação</label><select id="pr_status">${optSt}</select></div>
    </div>
    <div class="row">
      <div class="field"><label class="lbl">Trilha sugerida</label><select id="pr_trilha" onchange="_prospNiveis()">${_prospTrilhaOpts(trilha)}</select></div>
      <div class="field"><label class="lbl">Nível indicado</label><select id="pr_nivel">${_prospNivelOpts(trilha,p.nivel||'')}</select></div>
    </div>
    <div class="field"><label class="lbl">Horário disponível</label><input type="text" id="pr_horario" value="${escAttr(p.horario||'')}" placeholder="Ex: manhãs · ou ter/qui após as 18h"></div>
    <div class="field"><label class="lbl">Observações</label><textarea id="pr_obs" style="min-height:56px" placeholder="Como conheceu a escola, interesses, etc.">${escAttr(p.obs||'')}</textarea></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">☎️ Histórico de contatos</div>
    ${histHTML}
    ${id?`<div class="row" style="margin-top:8px;align-items:flex-end">
      <div class="field" style="max-width:150px"><label class="lbl">Data</label><input type="date" id="pr_cont_data" max="${hoje()}" value="${hoje()}"></div>
      <div class="field" style="flex:2"><label class="lbl">Novo registro</label><input type="text" id="pr_cont_nota" placeholder="O que foi conversado"></div>
      <button class="btn ghost" onclick="addContatoInline('${id}')">＋ Adicionar</button>
    </div>`:''}

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn" onclick="salvarProspecto('${id||''}')">💾 Salvar</button>
      <button class="btn ghost" style="color:#005EAF" onclick="encaminharProspecto('${id||''}')">📝 ${jaEnc?'Ver matrícula':'Encaminhar p/ matrícula'}</button>
      ${id?`<button class="btn ghost" style="color:var(--vermelho)" onclick="excluirProspecto('${id}')">🗑 Excluir</button>`:''}
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
}
function salvarProspecto(id){
  if(!podeProspectos()) return toast('Sem permissão');
  if(!((document.getElementById('pr_alunoNome')||{}).value||'').trim()) return toast('Informe o nome do aluno');
  _prospUpsert(id||''); save(); fechar(); if(VIEWS.prospectos) VIEWS.prospectos(); toast('Prospectivo salvo ✓');
}
function excluirProspecto(id){
  if(!podeProspectos()) return toast('Sem permissão');
  if(!confirm('Excluir este prospectivo? (não mexe em matrículas já criadas)')) return;
  S.prospectos=(S.prospectos||[]).filter(x=>x.id!==id);
  if(typeof marcarExcluido==='function') marcarExcluido('prospectos',id);
  save(); fechar(); if(VIEWS.prospectos) VIEWS.prospectos(); toast('Prospectivo excluído');
}

/* ---------- histórico de contatos ---------- */
function addContatoInline(id){
  if(!podeProspectos()) return toast('Sem permissão');
  if(!((document.getElementById('pr_alunoNome')||{}).value||'').trim()) return toast('Informe o nome do aluno primeiro');
  const d=((document.getElementById('pr_cont_data')||{}).value)||hoje();
  const nota=((document.getElementById('pr_cont_nota')||{}).value||'').trim();
  if(!nota) return toast('Escreva a anotação do contato');
  const rec=_prospUpsert(id||'', r=>{ r.contatos=r.contatos||[]; r.contatos.push({id:uid(), data:d, nota}); });
  save(); abrirProspecto(rec.id); toast('Contato registrado ✓');
}
function removerContatoProspecto(pid,cid){
  if(!podeProspectos()) return toast('Sem permissão');
  const p=(S.prospectos||[]).find(x=>x.id===pid); if(!p) return;
  p.contatos=(p.contatos||[]).filter(c=>c.id!==cid); p.atualizadoEm=Date.now();
  save(); abrirProspecto(pid);
}
function registrarContatoProspecto(id){
  if(!podeProspectos()) return toast('Sem permissão');
  const p=(S.prospectos||[]).find(x=>x.id===id); if(!p) return;
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">☎️ Registrar contato</h3><button class="close" onclick="fechar()">×</button></div>
    <p class="hint" style="margin:0 0 8px">${esc(p.alunoNome||'')}</p>
    <div class="field" style="max-width:180px"><label class="lbl">Data</label><input type="date" id="qc_data" max="${hoje()}" value="${hoje()}"></div>
    <div class="field"><label class="lbl">O que foi conversado</label><textarea id="qc_nota" style="min-height:72px" placeholder="Ex: ligamos; a mãe pediu para retornar na próxima semana"></textarea></div>
    <button class="btn block" onclick="salvarContatoRapido('${id}')">Salvar contato</button>`);
}
function salvarContatoRapido(id){
  if(!podeProspectos()) return toast('Sem permissão');
  const p=(S.prospectos||[]).find(x=>x.id===id); if(!p) return;
  const d=((document.getElementById('qc_data')||{}).value)||hoje();
  const nota=((document.getElementById('qc_nota')||{}).value||'').trim();
  if(!nota) return toast('Escreva o que foi conversado');
  p.contatos=p.contatos||[]; p.contatos.push({id:uid(), data:d, nota}); p.atualizadoEm=Date.now();
  save(); fechar(); if(VIEWS.prospectos) VIEWS.prospectos(); toast('Contato registrado ✓');
}

/* ---------- encaminhar para matrícula ---------- */
function encaminharProspecto(id){
  if(!podeProspectos()) return toast('Sem permissão');
  let p;
  if(document.getElementById('pr_alunoNome')){                 // chamado de dentro do formulário → grava as edições
    if(!((document.getElementById('pr_alunoNome').value||'').trim())) return toast('Informe o nome do aluno');
    p=_prospUpsert(id||'');
  } else {
    p=(S.prospectos||[]).find(x=>x.id===id);
  }
  if(!p) return;
  // já encaminhado antes → apenas reabre a matrícula ligada (direção) / avisa (secretaria)
  if(_prospEncaminhado(p)){
    p.status='encaminhado'; p.atualizadoEm=Date.now(); save();
    if(S.perfil==='direcao'){ fechar(); ir('matriculas'); return abrirMatricula(p.encaminhadoMatriculaId); }
    fechar(); if(VIEWS.prospectos) VIEWS.prospectos();
    return toast('Já encaminhado — a direção conclui em Matrículas');
  }
  const nivelTxt=_prospNivelTxt(p);
  const obs=['Origem: prospectivo.'];
  if(nivelTxt) obs.push('Nível sugerido: '+nivelTxt+'.');
  if(p.horario) obs.push('Horário disponível: '+p.horario+'.');
  if(p.obs) obs.push(p.obs);
  const mat={ id:uid(), status:'orcamento', tipo:'turma',
    alunoNome:p.alunoNome||'', respNome:p.paiNome||'', telefone:p.telefone||'', email:p.email||'',
    dataInicio:hoje(), observacoes:obs.join(' '),
    prospectoId:p.id, criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now() };
  S.matriculas=S.matriculas||[]; S.matriculas.push(mat);
  p.encaminhadoMatriculaId=mat.id; p.status='encaminhado'; p.atualizadoEm=Date.now();
  save();
  if(S.perfil==='direcao'){
    fechar(); if(typeof montarNav==='function') montarNav();
    ir('matriculas'); abrirMatricula(mat.id);
    toast('Encaminhado — complete a matrícula ✓');
  } else {
    fechar(); if(VIEWS.prospectos) VIEWS.prospectos();
    toast('Encaminhado para Matrículas ✓ — a direção conclui o cadastro');
  }
}
