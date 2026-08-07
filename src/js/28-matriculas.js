/* =====================================================================
   MÓDULO DE MATRÍCULAS (cadastro) — b136 · SÓ DIREÇÃO
   Cadastro do aluno + responsável + turma + status. SEM parte financeira:
   o dinheiro (mensalidade, carnê, pagamentos) fica no módulo FINANCEIRO
   (arquivo 29), ligado à matrícula por matriculaId.
   Persistência em S.matriculas (MERGE_COLS).
   ===================================================================== */

const MAT_STATUS={
  orcamento:{lbl:'Orçamento', bg:'#f4ecff', cor:'#9333c7'},
  ativa:   {lbl:'Ativa',      bg:'#eafaf0', cor:'#0A7A3D'},
  trancada:{lbl:'Trancada',   bg:'#fff1e6', cor:'#c2560b'},
  concluida:{lbl:'Concluída', bg:'#eaf3ff', cor:'#005EAF'},
  cancelada:{lbl:'Cancelada', bg:'#fdeaea', cor:'#E52524'},
  negada:  {lbl:'Não fechou', bg:'#eef0f4', cor:'#5a6b86'},
  rascunho:{lbl:'Rascunho',   bg:'#fff8e1', cor:'#b8860b'},   // trilha de matrícula em andamento (b176)
};
const MAT_PARENTESCO=['Mãe','Pai','Responsável legal','Avó/Avô','O próprio aluno','Outro'];

// helpers de dinheiro compartilhados (usados também pelo módulo Financeiro)
function _matN(v){ if(v==null) return 0; const s=String(v).replace(/\./g,'').replace(',','.').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return isNaN(n)?0:n; }
function _moeda(v){ return 'R$ '+(Math.round((+v||0)*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function matNome(m){ if(!m) return '—';
  if(m.tipo==='vip' && m.vipId){ const v=(S.vipAlunos||[]).find(x=>x.id===m.vipId); if(v) return v.nome; }
  if(m.alunoId){ const a=(S.alunos||[]).find(x=>x.id===m.alunoId); if(a) return a.nome; } return m.alunoNome||'(sem nome)'; }
function matEhVip(m){ return !!(m && m.tipo==='vip'); }
function matLocal(m){ if(!m) return ''; if(m.tipo==='vip') return '👑 VIP'+(m.professor?(' · '+m.professor):''); return m.turmaId?('🏫 '+turmaNome(m.turmaId)):''; }
function matAtivas(){ return (S.matriculas||[]).filter(m=>m.status==='ativa'); }
// b178: alunos realmente ativos = em turma (não arquivados) + VIPs com saldo de horas.
// Independe de ter passado pela trilha — pega também os cadastros antigos.
function alunosAtivosReais(){
  const emTurma=(S.alunos||[]).filter(a=>!a.arquivado && a.turmaId &&
    (S.turmas||[]).some(t=>t.id===a.turmaId && !t.arquivada)).length;
  const vipComHoras=(S.vipAlunos||[]).filter(v=>!v.arquivado &&
    (typeof vipContratadoMin==='function') && (vipContratadoMin(v.id)-vipConsumoMin(v.id))>0).length;
  return emTurma+vipComHoras;
}
function matTemFinanceiro(m){ return (S.financeiro||[]).some(f=>f.matriculaId===m.id); }
// b178: liga um aluno (cadastro antigo, sem matrícula) a uma matrícula e abre o pagamento na hora.
function criarMatriculaDaFicha(alunoId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return toast('Aluno não encontrado');
  S.matriculas=S.matriculas||[];
  let m=(S.matriculas||[]).find(x=>x.alunoId===alunoId && x.status!=='rascunho');
  if(!m){ m={id:uid(), status:'ativa', tipo:'turma', origem:'ficha', alunoId:alunoId, alunoNome:a.nome,
      turmaId:a.turmaId||'', nascimento:a.nascimento||'', email:a.email||'', telefone:a.telefone||'', endereco:a.endereco||'',
      dataInicio:hoje(), criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now()};
    S.matriculas.push(m); save(); }
  if(typeof abrirFinanceiroDaMatricula==='function') abrirFinanceiroDaMatricula(m.id);
}

/* -------------------- VIEW -------------------- */
let _matFiltro='', _matBusca='';
VIEWS.matriculas=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O módulo de matrículas é exclusivo da direção.</div>'; return; }
  const todas=(S.matriculas||[]).filter(x=>x.status!=='rascunho');   // rascunhos têm card próprio (b176)
  const ativas=matAtivas();
  const ymAtual=hoje().slice(0,7);
  const noMes=todas.filter(m=>(m.criadoEm||'').slice(0,7)===ymAtual).length;
  const semFin=ativas.filter(m=>!matTemFinanceiro(m)).length;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  const cont=(st)=>todas.filter(m=>m.status===st).length;
  const chip=(id,lbl)=>`<button class="btn ghost sm" style="${_matFiltro===id?'background:var(--azul);color:#fff;border-color:var(--azul)':''}" onclick="_matSetFiltro('${id}')">${lbl}${id&&cont(id)?` (${cont(id)})`:''}</button>`;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#0A7A3D"></span><h2 class="display">📝 Matrículas</h2></div>
    <p class="sub">Cadastro do aluno, do responsável e da turma. O dinheiro (mensalidade, carnê e pagamentos) fica em <b>💰 Financeiro</b>, ligado à matrícula.</p>
    <div class="card">
      <div class="fx-tiles">
        ${tile(alunosAtivosReais(),'Alunos ativos','#0A7A3D')}
        ${tile(todas.length,'Total de cadastros','var(--tinta)')}
        ${tile(todas.filter(x=>x.status==='orcamento').length,'Orçamentos abertos','#9333c7')}
        ${tile(semFin,'Ativas sem financeiro',semFin>0?'#c2560b':'var(--tinta)')}
      </div>
      <p class="hint" style="margin:10px 0 0"><b>Alunos ativos</b> conta todos os que estão em turma ou com horas VIP a usar. O pagamento fica na <b>ficha do aluno</b> (ou aqui, abrindo a matrícula).</p>
    </div>
    ${_cardTrilhas()}
    ${_cardOrcamentos()}
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <button class="btn" style="background:#0A7A3D" onclick="abrirTrilhaMatricula()">🧭 Nova matrícula</button>
        <button class="btn ghost" onclick="abrirMatricula()" title="Formulário completo numa tela só — bom para editar cadastros antigos">✏️ Cadastro avançado</button>
        <button class="btn ghost sm" onclick="exportarMatriculasCSV()">⬇️ Planilha</button>
        <input type="text" placeholder="Buscar por aluno ou responsável…" value="${escAttr(_matBusca)}" oninput="_matBuscaInput(this.value)" style="flex:1;min-width:180px">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
        ${chip('','Todas')}${chip('orcamento','Orçamentos')}${chip('ativa','Ativas')}${chip('trancada','Trancadas')}${chip('concluida','Concluídas')}${chip('cancelada','Canceladas')}
      </div>
      <div id="matListaBox"></div>
    </div>`;
  _matRenderLista();
};
function _matRenderLista(){
  const box=document.getElementById('matListaBox'); if(!box) return;
  let lista=(S.matriculas||[]).filter(x=>x.status!=='rascunho');
  if(_matFiltro) lista=lista.filter(m=>m.status===_matFiltro);
  const q=_normTxt(_matBusca||'').trim();
  if(q) lista=lista.filter(m=>_normTxt(matNome(m)).includes(q) || _normTxt(m.respNome||'').includes(q));
  lista.sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));
  box.innerHTML = lista.length?lista.map(_matLinha).join(''):`<p class="hint" style="margin:12px 0 0">${(S.matriculas||[]).length?'Nenhuma matrícula com esse filtro.':'Nenhuma matrícula ainda. Clique em “+ Nova matrícula”.'}</p>`;
}
function _matSetFiltro(id){ _matFiltro=id; VIEWS.matriculas(); }
function _matBuscaInput(q){ _matBusca=q; clearTimeout(window._matBuscaTO); window._matBuscaTO=setTimeout(_matRenderLista,180); }
function _matLinha(m){
  const st=MAT_STATUS[m.status]||MAT_STATUS.orcamento;
  const loc=matLocal(m);
  const vinc=(m.alunoId||m.vipId)?'🔗 vinculado':'';
  const temFin=matTemFinanceiro(m);
  return `<div class="check" style="display:block">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;cursor:pointer" onclick="abrirMatricula('${m.id}')">
      <b style="flex:1">${esc(matNome(m))}</b>
      <span class="pill" style="background:${st.bg};color:${st.cor}">${st.lbl}</span>
      ${matEhVip(m)?'':`<button class="btn ghost sm" onclick="event.stopPropagation();abrirFinanceiroDaMatricula('${m.id}')">💰 ${temFin?'Financeiro':'+ Financeiro'}</button>`}
    </div>
    <span class="hint" style="cursor:pointer" onclick="abrirMatricula('${m.id}')">${loc?esc(loc):'sem turma'}${m.respNome?(' · resp. '+esc(m.respNome)):''}${m.telefone?(' · '+esc(m.telefone)):''}${vinc?(' · '+vinc):''}${temFin?' · 💰 com plano':''}</span>
  </div>`;
}

/* -------------------- FORM (novo/editar) -------------------- */
function abrirMatricula(id){
  if(S.perfil!=='direcao') return toast('Só a direção acessa matrículas');
  const m=id?((S.matriculas||[]).find(x=>x.id===id)||{}):{};
  const ts=(typeof turmasVisiveis==='function'?turmasVisiveis():(S.turmas||[])).filter(t=>!t.arquivada).sort((a,b)=>a.nome.localeCompare(b.nome));
  const alunos=(S.alunos||[]).filter(a=>!a.arquivado).sort((a,b)=>a.nome.localeCompare(b.nome));
  const optT=`<option value="">— turma —</option>`+ts.map(t=>`<option value="${t.id}" ${m.turmaId===t.id?'selected':''}>${esc(t.nome)}</option>`).join('');
  const optA=`<option value="">— não vincular (aluno novo) —</option>`+alunos.map(a=>`<option value="${a.id}" ${m.alunoId===a.id?'selected':''}>${esc(a.nome)}${a.turmaId?(' · '+esc(turmaNome(a.turmaId))):''}</option>`).join('');
  const optP=MAT_PARENTESCO.map(p=>`<option ${m.respParentesco===p?'selected':''}>${p}</option>`).join('');
  const optS=Object.keys(MAT_STATUS).map(k=>`<option value="${k}" ${((m.status||'orcamento')===k)?'selected':''}>${MAT_STATUS[k].lbl}</option>`).join('');
  const tipo=m.tipo||'turma';
  const profs=[...new Set((S.usuarios||[]).filter(u=>u.ensina).map(u=>u.ensina).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const optProf=`<option value="">— professor(a) —</option>`+profs.map(p=>`<option value="${escAttr(p)}" ${m.professor===p?'selected':''}>${esc(p)}</option>`).join('');
  const vips=(S.vipAlunos||[]).filter(v=>!v.arquivado).sort((a,b)=>a.nome.localeCompare(b.nome));
  const optV=`<option value="">— não vincular (aluno novo) —</option>`+vips.map(v=>`<option value="${v.id}" ${m.vipId===v.id?'selected':''}>${esc(v.nome)}${v.professor?(' · '+esc(v.professor)):''}</option>`).join('');
  const ehAdulto=(idadeDe(m.nascimento)!=null && idadeDe(m.nascimento)>=18);
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">${id?'✏️ Editar matrícula':'📝 Nova matrícula'}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="row"><div class="field"><label class="lbl">Status</label><select id="mat_status">${optS}</select></div>
      <div class="field"><label class="lbl">Tipo de matrícula</label><select id="mat_tipo" onchange="_matTipoSel()"><option value="turma" ${tipo==='turma'?'selected':''}>🏫 Turma</option><option value="vip" ${tipo==='vip'?'selected':''}>👑 VIP (particular)</option></select></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:10px 0 4px">👦 Aluno</div>
    <div class="field" id="mat_nomeWrap" style="display:${(m.alunoId||m.vipId)?'none':'block'}"><label class="lbl">Nome do aluno</label><input type="text" id="mat_alunoNome" value="${escAttr(m.alunoNome||'')}" placeholder="Digite o nome completo do aluno"></div>
    <div class="field" id="mat_wrapAlunoTurma" style="display:${tipo==='vip'?'none':'block'}"><label class="lbl">…ou vincule a um aluno de turma já cadastrado <span class="hint">(opcional)</span></label><select id="mat_alunoId" onchange="_matAlunoSel()">${optA}</select></div>
    <div class="field" id="mat_wrapAlunoVip" style="display:${tipo==='vip'?'block':'none'}"><label class="lbl">…ou vincule a um aluno VIP já cadastrado <span class="hint">(opcional)</span></label><select id="mat_vipId" onchange="_matAlunoSel()">${optV}</select></div>
    <div class="row"><div class="field"><label class="lbl">Nascimento</label><input type="date" min="1900-01-01" max="${hoje()}" id="mat_nascimento" value="${escAttr(m.nascimento||'')}" oninput="_matIdadeHint()"></div>
      <div class="field"><label class="lbl">Documento do aluno</label><input type="text" id="mat_docAluno" value="${escAttr(m.docAluno||'')}" placeholder="CPF / RG (opcional)"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">👪 Responsável <span id="mat_respOpc" class="hint" style="font-weight:400;color:var(--azul);display:${ehAdulto?'inline':'none'}">— opcional (aluno maior de 18)</span></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Nome do responsável</label><input type="text" id="mat_respNome" value="${escAttr(m.respNome||'')}" placeholder="Quem assina / financeiro"></div>
      <div class="field"><label class="lbl">Parentesco</label><select id="mat_respParentesco"><option value="">—</option>${optP}</select></div></div>
    <div class="row"><div class="field"><label class="lbl">Telefone / WhatsApp</label><input type="text" id="mat_telefone" value="${escAttr(m.telefone||'')}" placeholder="(51) 9…"></div>
      <div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="mat_email" value="${escAttr(m.email||'')}" placeholder="email@exemplo.com"></div></div>
    <div class="field"><label class="lbl">Documento do responsável</label><input type="text" id="mat_respDoc" value="${escAttr(m.respDoc||'')}" placeholder="CPF (opcional)"></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Endereço (rua e número) — entra no contrato</label><input type="text" id="mat_endereco" value="${escAttr(m.endereco||'')}" placeholder="Rua …, n. …"></div>
      <div class="field"><label class="lbl">Cidade</label><input type="text" id="mat_cidade" value="${escAttr(m.cidade||'Gravataí, RS')}"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">🏫 Acadêmico</div>
    <div class="row"><div class="field" id="mat_wrapTurma" style="flex:2;display:${tipo==='vip'?'none':'block'}"><label class="lbl">Turma</label><select id="mat_turmaId">${optT}</select></div>
      <div class="field" id="mat_wrapProf" style="flex:2;display:${tipo==='vip'?'block':'none'}"><label class="lbl">Professor(a) responsável</label><select id="mat_professor">${optProf}</select></div>
      <div class="field"><label class="lbl">Início</label><input type="date" id="mat_dataInicio" value="${escAttr(m.dataInicio||hoje())}"></div></div>
    <div class="row"><div class="field"><label class="lbl">Fim do período (contrato)</label><input type="date" id="mat_fimPeriodo" value="${escAttr(m.fimPeriodo||'')}" title="Se vazio, o contrato usa 31/12 do ano de início"></div>
      <div class="field"><label class="lbl">Modalidade</label><select id="mat_modalidade">${['Presencial','On-line','Híbrida'].map(o=>`<option ${(m.modalidade||'Presencial')===o?'selected':''}>${o}</option>`).join('')}</select></div></div>

    <div class="field" style="margin-top:8px"><label class="lbl">Observações</label><textarea id="mat_obs" style="min-height:60px" placeholder="Combinados, condições especiais…">${escAttr(m.observacoes||'')}</textarea></div>

    ${id&&m.tipo==='vip'&&!m.vipId?`<div class="card box-suave" style="margin-bottom:12px"><p class="hint" style="margin:0 0 6px">Ainda não vinculado a um aluno VIP. Salve primeiro e crie o aluno em 👑 Alunos VIP:</p><button class="btn ghost sm" onclick="matCriarAlunoEVincular('${id}')">➕ Criar aluno VIP e vincular</button></div>`:''}
    ${id&&m.tipo!=='vip'&&!m.alunoId?`<div class="card box-suave" style="margin-bottom:12px"><p class="hint" style="margin:0 0 6px">Este cadastro ainda não está vinculado a um aluno do app. Salve primeiro e, quando quiser, crie o aluno na turma:</p><button class="btn ghost sm" onclick="matCriarAlunoEVincular('${id}')">➕ Criar aluno na turma e vincular</button></div>`:''}
    ${id&&m.tipo==='vip'?`<div class="card box-suave" style="margin-bottom:12px"><p class="hint" style="margin:0">💡 O <b>pacote de horas</b> e os valores do VIP ficam na tela <b>👑 Alunos VIP</b> (depois de criar/vincular o aluno). O contrato VIP usa os dados preenchidos na ficha do aluno VIP.</p></div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarMatricula('${id||''}')">💾 Salvar</button>
      ${id&&m.tipo!=='vip'?`<button class="btn ghost" onclick="abrirFinanceiroDaMatricula('${id}')">💰 Financeiro</button>`:''}
      ${id?`<button class="btn ghost" onclick="verMatricula('${id}')">🖨️ Ficha / PDF</button>`:''}
      ${id&&m.tipo!=='vip'&&m.status==='orcamento'?`<button class="btn ghost" style="color:#9333c7" onclick="verOrcamento('${id}')">🧾 Orçamento / PDF</button>`:''}
      ${id&&m.tipo==='vip'?`<button class="btn ghost" onclick="${m.vipId?`verContratoVip('${m.vipId}')`:`toast('Crie/vincule o aluno VIP e preencha o contrato na ficha do VIP primeiro')`}">📄 Contrato VIP</button>`:(id?`<button class="btn ghost" onclick="verContratoOficial('${id}')">📄 Contrato oficial</button>`:'')}
      ${id?`<button class="btn ghost" style="color:var(--vermelho)" onclick="excluirMatricula('${id}')">🗑 Excluir</button>`:''}
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
}
function _matTipoSel(){
  const tp=((document.getElementById('mat_tipo')||{}).value)||'turma'; const vip=tp==='vip';
  const show=(id,on)=>{ const e=document.getElementById(id); if(e) e.style.display=on?'block':'none'; };
  show('mat_wrapAlunoTurma',!vip); show('mat_wrapAlunoVip',vip);
  show('mat_wrapTurma',!vip); show('mat_wrapProf',vip);
  _matAlunoSel();
}
function _matAlunoSel(){
  const tp=((document.getElementById('mat_tipo')||{}).value)||'turma';
  const sel=document.getElementById(tp==='vip'?'mat_vipId':'mat_alunoId');
  const w=document.getElementById('mat_nomeWrap'); if(w) w.style.display=(sel&&sel.value)?'none':'block';
}
function _matIdadeHint(){
  const v=((document.getElementById('mat_nascimento')||{}).value)||'';
  const el=document.getElementById('mat_respOpc'); if(!el) return;
  el.style.display=(idadeDe(v)!=null && idadeDe(v)>=18)?'inline':'none';
}
function _matLerForm(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  const tipo=g('mat_tipo')||'turma'; const vip=tipo==='vip';
  return { status:g('mat_status')||'orcamento', tipo, alunoId:vip?'':g('mat_alunoId'), vipId:vip?g('mat_vipId'):'', professor:vip?g('mat_professor'):'',
    alunoNome:g('mat_alunoNome').trim(), nascimento:g('mat_nascimento'), docAluno:g('mat_docAluno').trim(),
    respNome:g('mat_respNome').trim(), respParentesco:g('mat_respParentesco'), telefone:g('mat_telefone').trim(), email:g('mat_email').trim(), respDoc:g('mat_respDoc').trim(),
    endereco:g('mat_endereco').trim(), cidade:g('mat_cidade').trim(), fimPeriodo:g('mat_fimPeriodo'), modalidade:g('mat_modalidade'),
    turmaId:vip?'':g('mat_turmaId'), dataInicio:g('mat_dataInicio'), observacoes:g('mat_obs').trim() };
}
function salvarMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=_matLerForm();
  if(!m.alunoId && !m.vipId && !m.alunoNome) return toast('Vincule a um aluno ou informe o nome');
  S.matriculas=S.matriculas||[];
  if(id){ const ex=S.matriculas.find(x=>x.id===id); if(ex){ Object.assign(ex,m); ex.atualizadoEm=Date.now(); } }
  else { S.matriculas.push(Object.assign({id:uid(), criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now()}, m)); }
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula salva ✓');
}
function excluirMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const fins=(S.financeiro||[]).filter(f=>f.matriculaId===id);
  if(fins.some(f=>finRecebido(f)>0 || finExtrasRecebido(f)>0)) return toast('Esta matrícula tem pagamentos recebidos — mude o status para "cancelada" em vez de excluir');
  const temFin=fins.length>0;
  if(!confirm('Excluir esta matrícula?'+(temFin?' O financeiro ligado a ela também será removido.':'')+' (não mexe no cadastro do aluno)')) return;
  S.matriculas=(S.matriculas||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('matriculas',id);
  (S.financeiro||[]).filter(f=>f.matriculaId===id).forEach(f=>{ if(typeof marcarExcluido==='function') marcarExcluido('financeiro',f.id); });
  S.financeiro=(S.financeiro||[]).filter(f=>f.matriculaId!==id);
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula excluída');
}
function matCriarAlunoEVincular(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  if(m.tipo==='vip'){
    if(m.vipId) return toast('Já vinculado a um aluno VIP');
    if(!m.alunoNome) return toast('Informe o nome do aluno');
    if(!m.professor) return toast('Escolha o professor(a) responsável na matrícula primeiro');
    const nv={ id:uid(), nome:m.alunoNome, professor:m.professor, email:m.email||'', nascimento:m.nascimento||'', atualizadoEm:Date.now() };
    S.vipAlunos=S.vipAlunos||[]; S.vipAlunos.push(nv); m.vipId=nv.id; m.atualizadoEm=Date.now();
    save(); if(typeof montarNav==='function') montarNav(); VIEWS.matriculas(); toast('Aluno VIP criado e vinculado ✓'); return;
  }
  if(m.alunoId) return toast('Já está vinculado a um aluno');
  if(!m.turmaId) return toast('Escolha a turma na matrícula primeiro');
  if(!m.alunoNome) return toast('Informe o nome do aluno');
  const novo={ id:uid(), nome:m.alunoNome, turmaId:m.turmaId, email:m.email||'', atualizadoEm:Date.now() };
  S.alunos.push(novo); m.alunoId=novo.id; m.atualizadoEm=Date.now();
  save(); if(typeof montarNav==='function') montarNav(); VIEWS.matriculas(); toast('Aluno criado na turma e vinculado ✓');
}

/* -------------------- FICHA (PDF) — só cadastro -------------------- */
function verMatricula(id){
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const st=MAT_STATUS[m.status]||MAT_STATUS.orcamento;
  const t=m.turmaId?(S.turmas||[]).find(x=>x.id===m.turmaId):null;
  const linha=(k,val)=> val?`<tr><td class="k">${k}</td><td>${esc(String(val))}</td></tr>`:'';
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Matrícula — ${esc(matNome(m))}</title><style>
@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:12px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:20px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:12px}
h2{font-family:'Zilla Slab',Georgia,serif;font-size:14px;color:#002B64;margin:14px 0 5px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:4px}
td{border:1px solid #DCE4EC;padding:5px 8px;vertical-align:top}td.k{background:#F0F6FC;color:#002B64;font-weight:700;width:38%}
.chip{display:inline-block;padding:2px 10px;border-radius:20px;background:${st.bg};color:${st.cor};font-weight:700;font-size:12px}
.foot{margin-top:14px;color:#8a97a8;font-size:10.5px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Ficha de matrícula</div><div class="per">Gerado em ${brDate(hoje())} por ${esc(S.usuario||'')}</div></div>
<p style="margin:0 0 8px"><span class="chip">${st.lbl}</span></p>
<h2>Aluno</h2><table>${linha('Nome',matNome(m))}${linha('Nascimento',m.nascimento?brDate(m.nascimento):'')}${linha('Documento',m.docAluno)}${m.tipo==='vip'?linha('Modalidade','VIP — aulas particulares'+(m.professor?(' · prof. '+m.professor):'')):linha('Turma',t?t.nome:'')}${linha('Início',m.dataInicio?brDate(m.dataInicio):'')}</table>
<h2>Responsável</h2><table>${linha('Nome',m.respNome)}${linha('Parentesco',m.respParentesco)}${linha('Telefone',m.telefone)}${linha('E-mail',m.email)}${linha('Documento',m.respDoc)}</table>
${m.observacoes?`<h2>Observações</h2><p style="font-size:12.5px">${esc(m.observacoes)}</p>`:''}
<p class="foot">As condições financeiras estão no módulo Financeiro. Documento de cadastro — sem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}

/* -------------------- EXPORTAR (planilha) — cadastro -------------------- */
function exportarMatriculasCSV(){
  const lista=(S.matriculas||[]).filter(x=>x.status!=='rascunho').sort((a,b)=>_normTxt(matNome(a)).localeCompare(_normTxt(matNome(b))));
  if(!lista.length) return toast('Nenhuma matrícula para exportar');
  const rows=[_csvLinha(['Aluno','Status','Tipo','Turma / Professor','Responsável','Parentesco','Telefone','E-mail','Início','Vinculado','Tem financeiro','Motivo (não fechou)'])];
  lista.forEach(m=>{ rows.push(_csvLinha([matNome(m),(MAT_STATUS[m.status]||{}).lbl||m.status, m.tipo==='vip'?'VIP':'Turma', m.tipo==='vip'?(m.professor||''):(m.turmaId?turmaNome(m.turmaId):''), m.respNome||'', m.respParentesco||'', m.telefone||'', m.email||'', m.dataInicio?brDate(m.dataInicio):'', (m.alunoId||m.vipId)?'sim':'não', matTemFinanceiro(m)?'sim':'não', (m.negada&&m.negada.motivo)||''])); });
  _dlArquivo('matriculas-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de matrículas baixada ('+lista.length+')');
}

/* -------------------- ⚡ WIZARD FECHAR VENDA (b158) --------------------
   A venda inteira numa sequência só: aluno+turma → valores → confirmar.
   Cria: aluno na turma, matrícula ATIVA, plano financeiro e pedido do livro. */
let _fv={};
function abrirFecharVenda(){ abrirTrilhaMatricula(); }   // b176: a trilha substituiu o wizard antigo
function _abrirFecharVendaAntigo(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  _fv={passo:1, parcelas:12, diaVenc:10, descPct:0, descVal:0, forma:'', inicio:hoje(), pedirLivro:true};
  _fvRender();
}
function _fvTurmas(){ return (S.turmas||[]).filter(t=>!t.arquivada).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')); }
function _fvTurma(){ return (S.turmas||[]).find(t=>t.id===_fv.turmaId)||null; }
function _fvPrecos(){ const t=_fvTurma(); return (typeof precosSegmento==='function')?precosSegmento((t&&t.nivel)||''):{taxa:0,anual:0,material:0}; }
function _fvMensal(){ const base=_matN(_fv.mensal); return Math.max(0, base*(1-(_matN(_fv.descPct)/100)) - _matN(_fv.descVal)); }
function _fvLerPasso(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  if(_fv.passo===1){ _fv.aluno=(g('fv_aluno')||'').trim(); _fv.resp=(g('fv_resp')||'').trim(); _fv.tel=(g('fv_tel')||'').trim(); _fv.email=(g('fv_email')||'').trim(); _fv.turmaId=g('fv_turma'); _fv.inicio=g('fv_inicio')||hoje(); }
  if(_fv.passo===2){ _fv.taxa=_matN(g('fv_taxa')); _fv.mensal=_matN(g('fv_mensal')); _fv.parcelas=parseInt(g('fv_parcelas'))||12; _fv.diaVenc=parseInt(g('fv_dia'))||10; _fv.descPct=_matN(g('fv_descpct')); _fv.descVal=_matN(g('fv_descval')); _fv.forma=g('fv_forma'); }
}
function fvIr(passo){
  _fvLerPasso();
  if(passo>=2 && _fv.passo===1){
    if(!_fv.aluno) return toast('Informe o nome do aluno');
    if(!_fv.turmaId) return toast('Escolha a turma');
    if(passo===2 && _fv.taxa==null){ const p=_fvPrecos(); _fv.taxa=p.taxa; _fv.mensal=(p.anual&&_fv.parcelas)?Math.round(p.anual/_fv.parcelas*100)/100:0; }
  }
  _fv.passo=passo; _fvRender();
}
function fvResumoLive(){ _fvLerPasso(); const el=document.getElementById('fv_resumo'); if(!el) return;
  el.innerHTML=`<b>Mensalidade líquida:</b> ${_moeda(_fvMensal())} · <b>Taxa:</b> ${_moeda(_fv.taxa)} · <b>Total do curso:</b> <b>${_moeda(_matN(_fv.taxa)+_fvMensal()*(_fv.parcelas||0))}</b>`;
}
function _fvRender(){
  const t=_fvTurma(); const p=_fvPrecos();
  const passoTag=n=>`<span class="pill" style="background:${_fv.passo===n?'#0A7A3D':'#eef0f4'};color:${_fv.passo===n?'#fff':'#5a6b86'}">${n}</span>`;
  const cab=`<h3>⚡ Fechar venda <button class="close" onclick="fechar()">×</button></h3>
    <div style="display:flex;gap:6px;align-items:center;margin:0 0 12px">${passoTag(1)} Aluno e turma ${passoTag(2)} Valores ${passoTag(3)} Confirmar</div>`;
  if(_fv.passo===1){
    const opts=_fvTurmas().map(x=>`<option value="${x.id}" ${x.id===_fv.turmaId?'selected':''}>${esc(x.nome)}${turmaStatus(x)==='formacao'?' · EM FORMAÇÃO':''}</option>`).join('');
    modal(cab+`
      <div class="field"><label class="lbl">Nome do aluno</label><input type="text" id="fv_aluno" value="${escAttr(_fv.aluno||'')}" placeholder="Nome completo"></div>
      <div class="row"><div class="field" style="flex:2"><label class="lbl">Responsável</label><input type="text" id="fv_resp" value="${escAttr(_fv.resp||'')}"></div>
        <div class="field"><label class="lbl">Telefone</label><input type="text" id="fv_tel" value="${escAttr(_fv.tel||'')}"></div></div>
      <div class="field"><label class="lbl">E-mail do responsável</label><input type="email" id="fv_email" value="${escAttr(_fv.email||'')}"></div>
      <div class="row"><div class="field" style="flex:2"><label class="lbl">Turma</label><select id="fv_turma"><option value="">— escolha —</option>${opts}</select></div>
        <div class="field"><label class="lbl">Início</label><input type="date" id="fv_inicio" value="${escAttr(_fv.inicio||hoje())}"></div></div>
      <button class="btn block" style="background:#0A7A3D" onclick="fvIr(2)">Avançar →</button>`);
  } else if(_fv.passo===2){
    modal(cab+`
      <p class="hint" style="margin:0 0 8px">🏫 <b>${t?esc(t.nome):''}</b> — valores da tabela ${t&&t.nivel?('do segmento '+esc((typeof segmentoLabel==='function')?segmentoLabel(t.nivel):t.nivel).toUpperCase()):''} já preenchidos; ajuste se precisar.</p>
      <div class="row"><div class="field"><label class="lbl">Taxa de matrícula (R$)</label><input type="number" id="fv_taxa" value="${_fv.taxa!=null?_fv.taxa:p.taxa}" min="0" step="0.01" oninput="fvResumoLive()"></div>
        <div class="field"><label class="lbl">Mensalidade (R$)</label><input type="number" id="fv_mensal" value="${_fv.mensal!=null?_fv.mensal:''}" min="0" step="0.01" oninput="fvResumoLive()"></div></div>
      <div class="row"><div class="field"><label class="lbl">Parcelas</label><input type="number" id="fv_parcelas" value="${_fv.parcelas}" min="1" max="48" oninput="fvResumoLive()"></div>
        <div class="field"><label class="lbl">Vencimento (dia)</label><input type="number" id="fv_dia" value="${_fv.diaVenc}" min="1" max="28"></div>
        <div class="field"><label class="lbl">Desconto (%)</label><input type="number" id="fv_descpct" value="${_fv.descPct||''}" min="0" max="100" oninput="fvResumoLive()"></div>
        <div class="field"><label class="lbl">Desconto (R$)</label><input type="number" id="fv_descval" value="${_fv.descVal||''}" min="0" step="0.01" oninput="fvResumoLive()"></div></div>
      <div class="field"><label class="lbl">Forma de pagamento</label><select id="fv_forma"><option value="">—</option>${FIN_PAGAMENTO.map(x=>`<option ${_fv.forma===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="gen-box" id="fv_resumo" style="margin-bottom:12px">—</div>
      <div class="row" style="gap:8px"><button class="btn ghost" onclick="fvIr(1)">← Voltar</button><button class="btn" style="flex:1;background:#0A7A3D" onclick="fvIr(3)">Avançar →</button></div>`);
    setTimeout(fvResumoLive,40);
  } else {
    const col=(t&&typeof planColecaoDe==='function')?(planColecaoDe(t)||''):'';
    const matPreco=p.material||0;
    modal(cab+`
      <div class="card box-suave" style="margin-bottom:10px">
        <p style="margin:0"><b>${esc(_fv.aluno)}</b>${_fv.resp?(' · resp. '+esc(_fv.resp)):''}<br>
        🏫 ${t?esc(t.nome):''} · início ${brDate(_fv.inicio)}<br>
        💰 taxa ${_moeda(_fv.taxa)} + <b>${_fv.parcelas}×</b> de <b>${_moeda(_fvMensal())}</b> (venc. dia ${_fv.diaVenc})${_fv.forma?(' · '+esc(_fv.forma)):''}<br>
        <b>Total do curso: ${_moeda(_matN(_fv.taxa)+_fvMensal()*_fv.parcelas)}</b>${col?('<br>📚 material: '+esc(col)+(matPreco?(' ('+_moeda(matPreco)+')'):'')):''}</p>
      </div>
      ${col?`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:0 0 12px"><input type="checkbox" id="fv_livro" ${_fv.pedirLivro?'checked':''}> 🛒 Já registrar o pedido do livro <b>${esc(col)}</b></label>`:''}
      <div class="row" style="gap:8px"><button class="btn ghost" onclick="fvIr(2)">← Voltar</button><button class="btn" style="flex:1;background:#0A7A3D" onclick="fvConcluir()">✅ Fechar a venda</button></div>`);
  }
}
function fvConcluir(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const chk=document.getElementById('fv_livro'); if(chk) _fv.pedirLivro=chk.checked;
  const t=_fvTurma(); if(!t) return toast('Turma inválida');
  const jaExiste=(S.alunos||[]).find(a=>_normTxt(a.nome)===_normTxt(_fv.aluno) && !a.arquivado);
  if(jaExiste && !confirm('Já existe um aluno chamado "'+jaExiste.nome+'" ('+turmaNome(jaExiste.turmaId)+').\n\nCriar mesmo assim um cadastro novo?')) return;
  // 1) aluno na turma
  const aluno={id:uid(), nome:_fv.aluno, turmaId:t.id, email:_fv.email||'', atualizadoEm:Date.now()};
  S.alunos.push(aluno);
  // 2) matrícula ATIVA
  const m={id:uid(), status:'ativa', alunoId:aluno.id, turmaId:t.id, respNome:_fv.resp||'', telefone:_fv.tel||'', email:_fv.email||'', dataInicio:_fv.inicio||hoje(), criadoEm:hoje(), criadoPor:S.usuario, origem:'venda-rapida', atualizadoEm:Date.now()};
  S.matriculas=S.matriculas||[]; S.matriculas.push(m);
  // 3) plano financeiro
  const f={id:'fin_'+m.id, matriculaId:m.id, criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now(),
    valorMatricula:_matN(_fv.taxa), valorMensalidade:_matN(_fv.mensal), descontoPct:_matN(_fv.descPct), descontoValor:_matN(_fv.descVal),
    parcelas:_fv.parcelas||12, diaVencimento:_fv.diaVenc||10, formaPagamento:_fv.forma||'', dataInicio:_fv.inicio||hoje(), pagos:{}, observacoes:'' };
  S.financeiro=S.financeiro||[]; S.financeiro.push(f);
  // 4) pedido do livro
  const col=(typeof planColecaoDe==='function')?(planColecaoDe(t)||''):'';
  if(_fv.pedirLivro && col && !(typeof pedidoDoAluno==='function' && pedidoDoAluno(aluno.id,col))){
    S.livroPedidos=S.livroPedidos||[];
    S.livroPedidos.push({id:uid(), alunoId:aluno.id, vip:false, titulo:col, status:'pedido', pedidoEm:hoje(), por:S.usuario, atualizadoEm:Date.now()});
  }
  save(); fechar(); if(rota==='matriculas') VIEWS.matriculas();
  toast('Venda fechada — bem-vindo(a), '+_fv.aluno+'! 🎉');
  modal(`<h3>🎉 Venda fechada! <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 12px"><b>${esc(_fv.aluno)}</b> está na turma <b>${esc(t.nome)}</b>, com matrícula ativa, plano financeiro criado${_fv.pedirLivro&&col?' e o livro já pedido':''}.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="fechar();verContratoOficial('${m.id}')">📄 Contrato</button>
      <button class="btn ghost" onclick="fechar();abrirCarne('${f.id}')">💳 Carnê</button>
      <button class="btn ghost" onclick="fechar();abrirFicha('${aluno.id}')">📇 Ficha do aluno</button>
      <button class="btn ghost" onclick="fechar()">Fechar</button>
    </div>`);
}
/* -------------------- ORÇAMENTOS (atalho de venda) -------------------- */
let _negVerLista=false;
function _cardOrcamentos(){
  const orcs=(S.matriculas||[]).filter(m=>m.status==='orcamento').sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));
  const negs=(S.matriculas||[]).filter(m=>m.status==='negada').sort((a,b)=>((b.negada&&b.negada.em)||'').localeCompare((a.negada&&a.negada.em)||''));
  if(!orcs.length && !negs.length) return '';
  const linhas=orcs.map(m=>{ const t=m.turmaId?turmaNome(m.turmaId):'';
    return `<div class="check"><span style="flex:1;cursor:pointer" onclick="abrirMatricula('${m.id}')"><b>${esc(matNome(m))}</b>${t?(' <span class="pill">'+esc(t)+'</span>'):''}${m.respNome?(' · '+esc(m.respNome)):''}</span>
      <button class="btn ghost sm" onclick="verOrcamento('${m.id}')">🧾 PDF</button>
      <button class="btn sm" style="background:#0A7A3D" onclick="converterOrcamento('${m.id}')">✓ Fechar venda</button>
      <button class="btn ghost sm" style="color:#5a6b86" title="Venda não realizada — registra o motivo" onclick="abrirNegarOrcamento('${m.id}')">✖ não fechou</button>
      <button class="btn ghost sm" style="color:var(--vermelho)" title="Excluir orçamento" onclick="excluirOrcamento('${m.id}')">🗑</button>
    </div>`; }).join('');
  const linhasNeg=negs.map(m=>{ const t=m.turmaId?turmaNome(m.turmaId):''; const n=m.negada||{};
    return `<div class="check"><span style="flex:1"><b>${esc(matNome(m))}</b>${t?(' <span class="pill">'+esc(t)+'</span>'):''}<br><span class="hint">✖ ${esc(n.motivo||'sem motivo registrado')} · ${n.em?brDate(n.em):''}${n.por?(' · por '+esc(n.por)):''}</span></span>
      <button class="btn ghost sm" title="Voltar para orçamento em aberto" onclick="reabrirOrcamento('${m.id}')">↩︎ reabrir</button>
      <button class="btn ghost sm" style="color:var(--vermelho)" onclick="excluirOrcamento('${m.id}')">🗑</button>
    </div>`; }).join('');
  return `<div class="card" style="border-left:4px solid #9333c7">
    <h3 style="margin:0 0 2px">🧾 Orçamentos em aberto (${orcs.length}) <span class="hint" style="font-weight:400">— atalho de venda</span></h3>
    <p class="hint" style="margin:0 0 4px">Gere o PDF pra apresentar à família; fechou, converta em matrícula ativa. Não fechou? Registre o motivo — vira aprendizado comercial.</p>
    ${linhas||'<p class="hint">Nenhum orçamento em aberto.</p>'}
    ${negs.length?`<div style="border-top:1px solid var(--linha);margin-top:10px;padding-top:8px"><div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:.92rem">✖ Vendas não fechadas (${negs.length})</b><button class="btn ghost sm" onclick="_negVerLista=!_negVerLista;VIEWS.matriculas()">${_negVerLista?'esconder':'ver motivos'}</button></div>${_negVerLista?linhasNeg:''}</div>`:''}
  </div>`;
}
function abrirNegarOrcamento(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  modal(`<h3>✖ Venda não fechada <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px"><b>${esc(matNome(m))}</b> — o orçamento sai da lista de abertos e o motivo fica registrado (dá para reabrir depois).</p>
    <div class="field"><label class="lbl">Motivo (obrigatório)</label><input type="text" id="ng_motivo" placeholder="Ex: achou caro; escolheu outra escola; horário não fechou"></div>
    <button class="btn block" onclick="negarOrcamento('${id}')">Registrar</button>`);
  setTimeout(()=>{const i=document.getElementById('ng_motivo'); if(i)i.focus();},60);
}
function negarOrcamento(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const motivo=((document.getElementById('ng_motivo')||{}).value||'').trim();
  if(!motivo) return toast('Informe o motivo — é ele que ensina a próxima venda');
  m.status='negada'; m.negada={motivo, por:S.usuario||'', em:hoje()}; m.atualizadoEm=Date.now();
  save(); fechar(); VIEWS.matriculas(); toast('Registrado — venda não fechada');
}
function reabrirOrcamento(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  m.status='orcamento'; delete m.negada; m.atualizadoEm=Date.now();
  save(); VIEWS.matriculas(); toast('Orçamento reaberto');
}
function excluirOrcamento(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  if(m.status!=='orcamento' && m.status!=='negada') return toast('Só orçamentos (abertos ou não fechados) podem ser excluídos por aqui');
  const fins=(S.financeiro||[]).filter(f=>f.matriculaId===id);
  if(fins.some(f=>finRecebido(f)>0 || finExtrasRecebido(f)>0)) return toast('Há pagamentos recebidos neste orçamento — não dá para excluir');
  if(!confirm('Excluir o orçamento de '+matNome(m)+'? Isso remove também o rascunho financeiro ligado a ele.')) return;
  S.matriculas=(S.matriculas||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('matriculas',id);
  fins.forEach(f=>{ if(typeof marcarExcluido==='function') marcarExcluido('financeiro',f.id); });
  S.financeiro=(S.financeiro||[]).filter(f=>f.matriculaId!==id);
  save(); VIEWS.matriculas(); toast('Orçamento excluído');
}
function converterOrcamento(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  if(!confirm('Fechar a venda e tornar esta matrícula ATIVA?')) return;
  m.status='ativa'; m.atualizadoEm=Date.now(); save(); VIEWS.matriculas(); toast('Venda fechada — matrícula ativa 🎉');
}
// PDF do orçamento: proposta comercial puxando tabela de preços + financeiro (se houver)
function verOrcamento(id){
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const t=m.turmaId?(S.turmas||[]).find(x=>x.id===m.turmaId):null;
  const segOrc=(t&&t.nivel)||'';
  const pSeg=(typeof precosSegmento==='function')?precosSegmento(segOrc):{taxa:0,anual:0,material:0};
  const f=(S.financeiro||[]).find(x=>x.matriculaId===id);
  const temFinReal=!!(f && (finMensalLiquida(f)>0 || _matN(f.valorMatricula)>0));   // plano zerado não vale como personalização
  let taxa=temFinReal?_matN(f.valorMatricula):pSeg.taxa;
  let parcelas=f?(f.parcelas||12):12;
  let mensal=temFinReal?finMensalLiquida(f):(parcelas>0?pSeg.anual/parcelas:0);
  let material=pSeg.material;
  // proposta em aberto não muda sozinha: congela os valores na 1ª geração (refeito se personalizar o financeiro)
  if(m.status==='orcamento'){
    if(temFinReal || !m.orcSnap){ m.orcSnap={taxa, mensal:Math.round(mensal*100)/100, material, parcelas, em:hoje()}; m.atualizadoEm=Date.now(); save(); }
    taxa=m.orcSnap.taxa; mensal=m.orcSnap.mensal; material=m.orcSnap.material; parcelas=m.orcSnap.parcelas;
  }
  const totalCurso=taxa+mensal*parcelas;
  const linha=(k,val)=>`<tr><td class="k">${k}</td><td>${val}</td></tr>`;
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento — ${esc(matNome(m))}</title><style>
@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:12px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:20px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:12px}
h2{font-family:'Zilla Slab',Georgia,serif;font-size:14px;color:#002B64;margin:14px 0 5px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:4px}
td{border:1px solid #DCE4EC;padding:6px 9px}td.k{background:#F0F6FC;color:#002B64;font-weight:700;width:44%}
.tot{font-weight:700;background:#f4ecff}.validade{margin-top:10px;font-size:12px;color:#5a6b86}
.foot{margin-top:14px;color:#8a97a8;font-size:10.5px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Orçamento</div><div class="per">${brDate(hoje())} · por ${esc(S.usuario||'')}</div></div>
<h2>Proposta para ${esc(matNome(m))}</h2>
<table>${t?linha('Turma',esc(t.nome)):''}${m.respNome?linha('Responsável',esc(m.respNome)):''}${m.dataInicio?linha('Início previsto',brDate(m.dataInicio)):''}</table>
<h2>Investimento</h2>
<table>
  ${linha('Taxa de matrícula',_moeda(taxa))}
  ${linha('Mensalidade ('+parcelas+'x)',_moeda(mensal))}
  ${material>0?linha('Material didático',_moeda(material)):''}
  <tr class="tot"><td class="k">Total do curso (matrícula + ${parcelas}× mensalidade)</td><td>${_moeda(totalCurso)}${material>0?(' + material '+_moeda(material)):''}</td></tr>
</table>
<p class="validade">Proposta válida por 15 dias. Valores da tabela ${segOrc?('do segmento '+segOrc.toUpperCase()):'vigente'}${f?' (condições já personalizadas para este aluno)':''}.${(typeof _cfgFin==='function'&&(_cfgFin().descontosTxt||'').trim())?('<br>Descontos: '+esc(_cfgFin().descontosTxt)):''}</p>
<p class="foot">Documento de orçamento — não é contrato nem tem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}
/* Contrato oficial: verContrato() vive em 33-contratos-oficiais.js (verContratoExemplo é alias de compatibilidade) */

/* =====================================================================
   🧭 TRILHA DE MATRÍCULA (b176) — 5 passos:
   1 Aluno → 2 Responsável → 3 Pedagógico (Turma/VIP) → 4 Pagamento → 5 Contrato
   · VIP: cria o aluno VIP + pacote de horas e deixa o contrato pronto.
   · Turma: cria aluno na turma + matrícula + plano financeiro + pedido do livro.
   · Rascunho: cada avanço salva em S.matriculas (status 'rascunho') —
     sincroniza entre aparelhos e qualquer pessoa com acesso à tela continua.
   ===================================================================== */
let _tr=null;
const _TR_PASSOS=['Aluno','Responsável','Pedagógico','Pagamento','Contrato'];
function _trNovo(){ return {id:uid(), passo:1, tipo:'turma',
  aluno:{nome:'',nasc:'',doc:'',email:'',tel:'',endereco:'',cidade:'Gravataí, RS'},
  resp:{temResp:null,mesmo:true,nome:'',parentesco:'',tel:'',email:'',doc:'',endereco:'',cidade:'Gravataí, RS'},
  ped:{turmaId:'',inicio:hoje(),fimPeriodo:'',modalidade:'Presencial',material:'',matDestino:'encomendar', professor:'',dupla:false,horas:'',vigIni:hoje(),vigFim:'',nivel:''},
  pag:{taxa:null,mensal:null,parcelas:12,diaVenc:10,descPct:0,descVal:0,forma:'', vipDesc:0,vipParcelas:1}}; }
// b178: responsável resolvido — se não houver responsável separado, o próprio aluno é o responsável.
function _trRespFinal(p){
  const adulto=(idadeDe(p.aluno.nasc)!=null && idadeDe(p.aluno.nasc)>=18);
  const temResp = p.resp.temResp==null ? !adulto : !!p.resp.temResp;
  if(!temResp) return {temResp:false, nome:p.aluno.nome, parentesco:'O próprio aluno', doc:p.aluno.doc||'',
    email:p.aluno.email||'', tel:p.aluno.tel||'', endereco:p.aluno.endereco||'', cidade:p.aluno.cidade||''};
  const mesmo=p.resp.mesmo!==false;
  return {temResp:true, nome:p.resp.nome, parentesco:p.resp.parentesco||'', doc:p.resp.doc||'', email:p.resp.email||'',
    tel:mesmo?(p.aluno.tel||''):(p.resp.tel||''), endereco:mesmo?(p.aluno.endereco||''):(p.resp.endereco||''),
    cidade:mesmo?(p.aluno.cidade||''):(p.resp.cidade||'')};
}
function _trTemResp(p){ const ad=(idadeDe(p.aluno.nasc)!=null && idadeDe(p.aluno.nasc)>=18); return p.resp.temResp==null?!ad:!!p.resp.temResp; }
// b178: registra o material no módulo Livros conforme o destino escolhido
function _trRegistrarMaterial(alunoId, vip, material, destino){
  const col=(material||'').trim(); if(!col || destino==='tem') return;
  if(typeof pedidoDoAluno==='function' && pedidoDoAluno(alunoId,col)) return;   // já há pedido ativo desse título
  S.livroPedidos=S.livroPedidos||[];
  const reg={id:uid(), alunoId, vip:!!vip, titulo:col, por:S.usuario, pedidoEm:hoje(), atualizadoEm:Date.now()};
  if(destino==='estoque'){ reg.status='recebido'; reg.recebidoEm=hoje(); }   // já em mãos → aparece como "a entregar"
  else { reg.status='pedido'; }                                              // encomendar
  S.livroPedidos.push(reg);
}
// b178: material sugerido pela turma e troca de turma refaz a sugestão
function _trTurmaChange(){ _trLer(); const t=_trTurma();
  _tr.ped.material=(t && typeof planColecaoSugerida==='function')?(planColecaoSugerida(t)||planColecaoDe(t)||''):''; _trRender(); }
function _trMaterialHTML(p){
  const cols=(typeof colecoesTodas==='function')?colecoesTodas():[]; if(!cols.length) return '';
  const t=(p.tipo!=='vip')?_trTurma():null;
  const sug=(t && typeof planColecaoSugerida==='function')?(planColecaoSugerida(t)||planColecaoDe(t)||''):'';
  const atual=p.ped.material||sug||''; const dest=p.ped.matDestino||'encomendar';
  const opt=(v,txt)=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:2px 0"><input type="radio" name="tr3_matdest" value="${v}" ${dest===v?'checked':''}> ${txt}</label>`;
  return `<div class="card box-suave" style="margin:4px 0 10px;padding:12px">
    <div class="field" style="margin:0 0 8px"><label class="lbl">📚 Material / coleção${sug?(' <span class="hint">sugerido: '+esc(sug)+'</span>'):''}</label>
      <select id="tr3_material"><option value="">— sem material —</option>${cols.map(c=>`<option ${atual===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
    <label class="lbl">O que fazer com o material?</label>
    ${opt('encomendar','🛒 <b>Encomendar</b> agora <span class="hint">— cria o pedido em 📚 Livros (secretaria acompanha)</span>')}
    ${opt('estoque','📦 <b>Já temos</b> no estoque <span class="hint">— entra em Livros como "a entregar"</span>')}
    ${opt('tem','✋ Aluno <b>já tem</b> / não precisa')}
  </div>`;
}
function abrirTrilhaMatricula(rascId){
  if(S.perfil!=='direcao') return toast('Só a direção realiza matrículas');
  if(rascId){ const r=(S.matriculas||[]).find(x=>x.id===rascId && x.status==='rascunho');
    if(!r) return toast('Rascunho não encontrado');
    _tr=JSON.parse(JSON.stringify(r.trilha||{})); _tr.id=r.id; _tr.passo=_tr.passo||1;
  } else _tr=_trNovo();
  _trRender();
}
function _trG(id){ const e=document.getElementById(id); return e?e.value:null; }
function _trChk(id){ const e=document.getElementById(id); return e?!!e.checked:null; }
function _trLer(){   // lê só o que estiver na tela (cada passo tem seus campos)
  const p=_tr; const g=_trG, c=_trChk; const set=(o,k,v)=>{ if(v!==null) o[k]=v; };
  if(g('tr1_nome')!==null) p.aluno.nome=g('tr1_nome').trim();
  set(p.aluno,'nasc',g('tr1_nasc')); set(p.aluno,'doc',g('tr1_doc')); set(p.aluno,'email',g('tr1_email'));
  set(p.aluno,'tel',g('tr1_tel')); set(p.aluno,'endereco',g('tr1_endereco')); set(p.aluno,'cidade',g('tr1_cidade'));
  if(c('tr2_temResp')!==null) p.resp.temResp=c('tr2_temResp');
  if(c('tr2_mesmo')!==null) p.resp.mesmo=c('tr2_mesmo');
  ['nome','parentesco','tel','email','doc','endereco','cidade'].forEach(k=>set(p.resp,k,g('tr2_'+k)));
  if(g('tr3_tipo')!==null) p.tipo=g('tr3_tipo')||'turma';
  set(p.ped,'turmaId',g('tr3_turma')); set(p.ped,'inicio',g('tr3_inicio')); set(p.ped,'fimPeriodo',g('tr3_fim'));
  set(p.ped,'modalidade',g('tr3_mod')); set(p.ped,'professor',g('tr3_prof')); set(p.ped,'nivel',g('tr3_nivel'));
  set(p.ped,'horas',g('tr3_horas')); set(p.ped,'vigIni',g('tr3_vigini')); set(p.ped,'vigFim',g('tr3_vigfim'));
  set(p.ped,'material',g('tr3_material'));
  const _md=(typeof document!=='undefined')&&document.querySelector('input[name="tr3_matdest"]:checked'); if(_md) p.ped.matDestino=_md.value;
  if(c('tr3_dupla')!==null) p.ped.dupla=c('tr3_dupla');
  ['taxa','mensal','descPct','descVal','vipDesc'].forEach(k=>{ if(g('tr4_'+k)!==null) p.pag[k]=_matN(g('tr4_'+k)); });
  if(g('tr4_parcelas')!==null) p.pag.parcelas=parseInt(g('tr4_parcelas'))||12;
  if(g('tr4_vipParcelas')!==null) p.pag.vipParcelas=parseInt(g('tr4_vipParcelas'))||1;
  if(g('tr4_diaVenc')!==null) p.pag.diaVenc=parseInt(g('tr4_diaVenc'))||10;
  if(g('tr4_forma')!==null) p.pag.forma=g('tr4_forma');
}
function _trSalvarRascunho(msg){
  if(!_tr) return;
  S.matriculas=S.matriculas||[];
  let r=S.matriculas.find(x=>x.id===_tr.id);
  if(!r){ r={id:_tr.id, status:'rascunho', criadoEm:hoje(), criadoPor:S.usuario}; S.matriculas.push(r); }
  r.status='rascunho'; r.trilha=JSON.parse(JSON.stringify(_tr));
  r.alunoNome=_tr.aluno.nome||'(sem nome)'; r.tipo=_tr.tipo; r.atualizadoEm=Date.now();
  save();
  if(msg) toast(msg);
}
function trSairSalvando(){ _trLer(); _trSalvarRascunho('Rascunho salvo — continue quando quiser 💾'); fechar(); if(rota==='matriculas') VIEWS.matriculas(); }
function trIr(n){
  _trLer();
  const p=_tr;
  if(n>1 && p.passo===1 && !p.aluno.nome) return toast('Informe o nome do aluno');
  if(n>2 && p.passo===2){
    if(_trTemResp(p) && !p.resp.nome) return toast('Informe o nome do responsável');
  }
  if(n>3 && p.passo===3){
    if(p.tipo==='vip'){ if(!p.ped.professor) return toast('Escolha o professor(a) do VIP');
      if(!(_matN(p.ped.horas)>0)) return toast('Informe as horas contratadas do pacote'); }
    else if(!p.ped.turmaId) return toast('Escolha a turma');
    if(n===4){ // pré-preenche o pagamento a partir da tabela
      if(p.tipo!=='vip' && p.pag.taxa==null){ const pr=(typeof precosSegmento==='function')?precosSegmento(_trNivelTurma()):{taxa:0,anual:0};
        p.pag.taxa=pr.taxa; p.pag.mensal=(pr.anual&&p.pag.parcelas)?Math.round(pr.anual/p.pag.parcelas*100)/100:0; }
    }
  }
  p.passo=n; _trSalvarRascunho(); _trRender();
}
function _trTurma(){ return (S.turmas||[]).find(t=>t.id===_tr.ped.turmaId)||null; }
function _trNivelTurma(){ const t=_trTurma(); return (t&&t.nivel)||''; }
function _trHoraVip(){ const c=(typeof _cfgFin==='function')?_cfgFin():{};
  return _tr.ped.dupla ? (_matN(c.valorHoraVipDupla)||_matN(c.valorHoraVip)||0) : (_matN(c.valorHoraVip)||0); }
function _trTotalVip(){ return Math.max(0, _matN(_tr.ped.horas)*_trHoraVip() - _matN(_tr.pag.vipDesc)); }
function _trMensalLiq(){ const b=_matN(_tr.pag.mensal); return Math.max(0, b*(1-(_matN(_tr.pag.descPct)/100)) - _matN(_tr.pag.descVal)); }
function _trParcelasVip(total,n,inicio,dia){
  n=Math.max(1,parseInt(n)||1); const out=[];
  const d0=inicio?new Date(inicio+'T12:00:00'):new Date();
  const base=Math.floor(total/n*100)/100;
  for(let i=0;i<n;i++){
    const d=new Date(d0.getFullYear(), d0.getMonth()+i, Math.min(parseInt(dia)||10,28));
    const val=(i===n-1)?(Math.round((total-base*(n-1))*100)/100):base;
    out.push({venc:d.toLocaleDateString('pt-BR'), valor:_moeda(val)});
  }
  return out;
}
function trResumoLive(){ _trLer(); const el=document.getElementById('tr4_resumo'); if(!el) return;
  if(_tr.tipo==='vip'){ const tot=_trTotalVip(), n=_tr.pag.vipParcelas||1;
    el.innerHTML=`⏱ <b>${_matN(_tr.ped.horas)}h</b> × ${_moeda(_trHoraVip())}/h${_tr.ped.dupla?' (dupla, por aluno)':''}${_matN(_tr.pag.vipDesc)?(' − desconto '+_moeda(_tr.pag.vipDesc)):''} = <b>${_moeda(tot)}</b> em <b>${n}×</b> de <b>${_moeda(tot/(n||1))}</b>`;
  } else {
    el.innerHTML=`<b>Mensalidade líquida:</b> ${_moeda(_trMensalLiq())} · <b>Taxa:</b> ${_moeda(_matN(_tr.pag.taxa))} · <b>Total do curso:</b> <b>${_moeda(_matN(_tr.pag.taxa)+_trMensalLiq()*(_tr.pag.parcelas||0))}</b>`;
  }
}
function _trRender(){
  const p=_tr; const F=(l,inner)=>`<div class="field"><label class="lbl">${l}</label>${inner}</div>`;
  const chips=_TR_PASSOS.map((lbl,i)=>{ const n=i+1; const on=p.passo===n, feito=p.passo>n;
    return `<span class="pill" style="background:${on?'#0A7A3D':(feito?'#eafaf0':'#eef0f4')};color:${on?'#fff':(feito?'#0A7A3D':'#5a6b86')}" title="${lbl}">${feito?'✓':n} ${lbl}</span>`; }).join(' ');
  const cab=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px"><h3 style="flex:1;margin:0">🧭 Nova matrícula</h3>
      <button class="btn ghost sm" onclick="trSairSalvando()" title="Salva o rascunho e fecha — qualquer pessoa da direção continua depois">💾 salvar e sair</button>
      <button class="close" onclick="trSairSalvando()">×</button></div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin:0 0 12px">${chips}</div>`;
  const nav=(volta,avanca,txt)=>`<div class="row" style="gap:8px;margin-top:4px">${volta?`<button class="btn ghost" onclick="trIr(${volta})">← Voltar</button>`:''}<button class="btn" style="flex:1;background:#0A7A3D" onclick="trIr(${avanca})">${txt||'Avançar →'}</button></div>`;
  let h='';
  if(p.passo===1){
    h=F('Nome do aluno',`<input type="text" id="tr1_nome" value="${escAttr(p.aluno.nome)}" placeholder="Nome completo">`)
     +`<div class="row">`+F('Nascimento',`<input type="date" id="tr1_nasc" min="1900-01-01" max="${hoje()}" value="${escAttr(p.aluno.nasc)}">`)
     +F('Documento (CPF/RG) <span class="hint">opcional</span>',`<input type="text" id="tr1_doc" value="${escAttr(p.aluno.doc)}">`)+`</div>`
     +F('E-mail do aluno <span class="hint">vira o acesso ao portal</span>',`<input type="email" id="tr1_email" value="${escAttr(p.aluno.email)}" placeholder="email@exemplo.com">`)
     +`<div class="row">`+F('📞 Telefone / WhatsApp',`<input type="text" id="tr1_tel" value="${escAttr(p.aluno.tel||'')}" placeholder="(51) 9…">`)
     +F('Cidade',`<input type="text" id="tr1_cidade" value="${escAttr(p.aluno.cidade||'')}">`)+`</div>`
     +F('🏠 Endereço (rua e nº) — entra no contrato',`<input type="text" id="tr1_endereco" value="${escAttr(p.aluno.endereco||'')}">`)
     +nav(0,2);
  } else if(p.passo===2){
    const adulto=(idadeDe(p.aluno.nasc)!=null && idadeDe(p.aluno.nasc)>=18);
    const temResp=_trTemResp(p), mesmo=p.resp.mesmo!==false;
    const optP=MAT_PARENTESCO.map(x=>`<option ${p.resp.parentesco===x?'selected':''}>${x}</option>`).join('');
    h=(adulto?`<p class="hint" style="margin:0 0 8px">✅ <b>${esc(p.aluno.nome)}</b> é maior de 18 — o responsável é opcional.</p>`:'')
     +`<label class="check" style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:.94rem;padding:11px 13px;border:1px solid var(--linha);border-radius:11px;background:${temResp?'#eafaf0':'var(--bg,#f4f6fb)'};margin:0 0 12px">
        <input type="checkbox" id="tr2_temResp" ${temResp?'checked':''} onchange="trIr(2)" style="width:17px;height:17px"> 👪 Este aluno tem um <b>responsável</b> <span class="hint">(quem assina / financeiro)</span></label>`
     +(temResp
       ?(`<div class="row">`+F('Nome do responsável',`<input type="text" id="tr2_nome" value="${escAttr(p.resp.nome)}" placeholder="Quem assina / financeiro">`)
          +F('Parentesco',`<select id="tr2_parentesco"><option value="">—</option>${optP}</select>`)+`</div>`
          +`<div class="row">`+F('CPF do responsável',`<input type="text" id="tr2_doc" value="${escAttr(p.resp.doc)}">`)
          +F('E-mail',`<input type="email" id="tr2_email" value="${escAttr(p.resp.email)}">`)+`</div>`
          +`<label class="check" style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:.9rem;padding:9px 12px;border:1px solid var(--linha);border-radius:10px;background:${mesmo?'#eafaf0':'var(--bg,#f4f6fb)'};margin:2px 0 10px">
             <input type="checkbox" id="tr2_mesmo" ${mesmo?'checked':''} onchange="trIr(2)" style="width:16px;height:16px"> 🏠 Endereço e telefone <b>iguais aos do aluno</b></label>`
          +(mesmo?`<p class="hint" style="margin:0 0 6px">Usando o endereço e o telefone do passo do aluno.</p>`
             :(`<div class="row">`+F('Telefone do responsável',`<input type="text" id="tr2_tel" value="${escAttr(p.resp.tel)}" placeholder="(51) 9…">`)
                +F('Cidade',`<input type="text" id="tr2_cidade" value="${escAttr(p.resp.cidade)}">`)+`</div>`
                +F('Endereço do responsável',`<input type="text" id="tr2_endereco" value="${escAttr(p.resp.endereco)}">`))))
       :`<div class="card box-suave" style="padding:11px 13px;margin:0 0 6px"><b style="color:#0A7A3D">✅ Sem responsável separado</b> <span class="hint">— o próprio aluno é o responsável no contrato (usa os dados do passo anterior).</span></div>`)
     +nav(1,3);
  } else if(p.passo===3){
    const ts=(S.turmas||[]).filter(t=>!t.arquivada).sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
    const optT=`<option value="">— escolha —</option>`+ts.map(t=>`<option value="${t.id}" ${p.ped.turmaId===t.id?'selected':''}>${esc(t.nome)}${(typeof turmaStatus==='function'&&turmaStatus(t)==='formacao')?' · EM FORMAÇÃO':''}</option>`).join('');
    const profs=[...new Set((S.usuarios||[]).filter(u=>u.ensina).map(u=>u.ensina).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const optProf=`<option value="">— professor(a) —</option>`+profs.map(x=>`<option value="${escAttr(x)}" ${p.ped.professor===x?'selected':''}>${esc(x)}</option>`).join('');
    const vip=p.tipo==='vip'; const vHora=_trHoraVip();
    h=F('Tipo de matrícula',`<select id="tr3_tipo" onchange="trIr(3)"><option value="turma" ${!vip?'selected':''}>🏫 Turma</option><option value="vip" ${vip?'selected':''}>👑 VIP (aulas particulares)</option></select>`)
     +(vip
       ?(`<div class="row">`+F('Professor(a) responsável',`<select id="tr3_prof">${optProf}</select>`)
         +F('Nível <span class="hint">p/ o contrato</span>',`<input type="text" id="tr3_nivel" value="${escAttr(p.ped.nivel)}" placeholder="Ex: B1">`)+`</div>`
         +`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:2px 0 10px"><input type="checkbox" id="tr3_dupla" ${p.ped.dupla?'checked':''} onchange="trIr(3)"> 👥 Aula em dupla <span class="hint">(hora-aula de dupla, por aluno${vHora?(' — '+_moeda(vHora)+'/h'):''})</span></label>`
         +`<div class="row">`+F('⏱ Horas contratadas',`<input type="number" id="tr3_horas" value="${escAttr(String(p.ped.horas||''))}" min="1" step="1" placeholder="Ex: 20">`)
         +F('Vigência — início',`<input type="date" id="tr3_vigini" value="${escAttr(p.ped.vigIni)}">`)
         +F('Vigência — fim <span class="hint">vazio = sem prazo</span>',`<input type="date" id="tr3_vigfim" value="${escAttr(p.ped.vigFim)}">`)+`</div>`
         +`<p class="hint" style="margin:0 0 8px">💡 O pacote de horas é criado automaticamente ao concluir; os horários semanais das aulas você define depois na tela 👑 Alunos VIP.</p>`
         +_trMaterialHTML(p))
       :(`<div class="row">`+F('Turma',`<select id="tr3_turma" onchange="_trTurmaChange()">${optT}</select>`)
         +F('Início',`<input type="date" id="tr3_inicio" value="${escAttr(p.ped.inicio)}">`)+`</div>`
         +`<div class="row">`+F('Fim do período (contrato) <span class="hint">vazio = 31/12</span>',`<input type="date" id="tr3_fim" value="${escAttr(p.ped.fimPeriodo)}">`)
         +F('Modalidade',`<select id="tr3_mod">${['Presencial','On-line','Híbrida'].map(x=>`<option ${p.ped.modalidade===x?'selected':''}>${x}</option>`).join('')}</select>`)+`</div>`
         +_trMaterialHTML(p)))
     +nav(2,4);
  } else if(p.passo===4){
    const vip=p.tipo==='vip';
    const optF=`<option value="">—</option>`+FIN_PAGAMENTO.map(x=>`<option ${p.pag.forma===x?'selected':''}>${x}</option>`).join('');
    if(vip){ const vHora=_trHoraVip();
      h=`<p class="hint" style="margin:0 0 8px">👑 <b>${_matN(p.ped.horas)}h</b> × <b>${_moeda(vHora)}</b>/h${p.ped.dupla?' (dupla, por aluno)':''} — tabela vigente. Desconto é caso a caso.</p>`
       +`<div class="row">`+F('Desconto (R$) <span class="hint">opcional</span>',`<input type="number" id="tr4_vipDesc" value="${p.pag.vipDesc||''}" min="0" step="0.01" oninput="trResumoLive()">`)
       +F('Parcelas',`<input type="number" id="tr4_vipParcelas" value="${p.pag.vipParcelas||1}" min="1" max="12" oninput="trResumoLive()">`)
       +F('Vencimento (dia)',`<input type="number" id="tr4_diaVenc" value="${p.pag.diaVenc}" min="1" max="28">`)+`</div>`
       +F('Forma de pagamento',`<select id="tr4_forma">${optF}</select>`);
    } else {
      h=`<p class="hint" style="margin:0 0 8px">🏫 Valores da tabela${_trNivelTurma()?(' do segmento <b>'+esc(String((typeof segmentoLabel==='function')?segmentoLabel(_trNivelTurma()):_trNivelTurma()).toUpperCase())+'</b>'):''} já preenchidos — ajuste se precisar. Desconto é caso a caso.</p>`
       +`<div class="row">`+F('Taxa de matrícula (R$)',`<input type="number" id="tr4_taxa" value="${p.pag.taxa!=null?p.pag.taxa:''}" min="0" step="0.01" oninput="trResumoLive()">`)
       +F('Mensalidade (R$)',`<input type="number" id="tr4_mensal" value="${p.pag.mensal!=null?p.pag.mensal:''}" min="0" step="0.01" oninput="trResumoLive()">`)+`</div>`
       +`<div class="row">`+F('Parcelas',`<input type="number" id="tr4_parcelas" value="${p.pag.parcelas}" min="1" max="48" oninput="trResumoLive()">`)
       +F('Vencimento (dia)',`<input type="number" id="tr4_diaVenc" value="${p.pag.diaVenc}" min="1" max="28">`)
       +F('Desconto (%)',`<input type="number" id="tr4_descPct" value="${p.pag.descPct||''}" min="0" max="100" oninput="trResumoLive()">`)
       +F('Desconto (R$)',`<input type="number" id="tr4_descVal" value="${p.pag.descVal||''}" min="0" step="0.01" oninput="trResumoLive()">`)+`</div>`
       +F('Forma de pagamento',`<select id="tr4_forma">${optF}</select>`);
    }
    h+=`<div class="gen-box" id="tr4_resumo" style="margin-bottom:12px">—</div>`+nav(3,5);
  } else {
    const vip=p.tipo==='vip'; const t=_trTurma();
    const R=_trRespFinal(p);
    const mat=p.ped.material||((!vip && t && typeof planColecaoDe==='function')?(planColecaoDe(t)||''):'');
    const destLbl={encomendar:'🛒 encomendar',estoque:'📦 do estoque',tem:'✋ já tem'}[p.ped.matDestino||'encomendar'];
    const tot=vip?_trTotalVip():(_matN(p.pag.taxa)+_trMensalLiq()*(p.pag.parcelas||0));
    h=`<div class="card box-suave" style="margin-bottom:10px"><p style="margin:0">
        <b>${esc(p.aluno.nome)}</b>${p.aluno.nasc?(' · '+brDate(p.aluno.nasc)):''}${p.aluno.tel?(' · 📞 '+esc(p.aluno.tel)):''}
        <br>👪 ${R.temResp?(esc(R.nome||'—')+(R.parentesco?(' ('+esc(R.parentesco)+')'):'')+(R.tel?(' · '+esc(R.tel)):'')):'<span class="hint">o próprio aluno é o responsável</span>'}
        <br>${vip?('👑 VIP · prof. '+esc(p.ped.professor)+(p.ped.dupla?' · 👥 dupla':'')+' · <b>'+_matN(p.ped.horas)+'h</b>'+(p.ped.vigFim?(' até '+brDate(p.ped.vigFim)):' (sem prazo)')):('🏫 '+(t?esc(t.nome):'')+' · início '+brDate(p.ped.inicio))}
        <br>💰 ${vip?('<b>'+_moeda(tot)+'</b> em '+(p.pag.vipParcelas||1)+'× (venc. dia '+p.pag.diaVenc+')'):('taxa '+_moeda(_matN(p.pag.taxa))+' + <b>'+p.pag.parcelas+'×</b> de <b>'+_moeda(_trMensalLiq())+'</b> (venc. dia '+p.pag.diaVenc+')')}${p.pag.forma?(' · '+esc(p.pag.forma)):''}
        ${vip?'':('<br><b>Total do curso: '+_moeda(tot)+'</b>')}${mat?('<br>📚 material: '+esc(mat)+' · '+destLbl):''}</p></div>`
     +`<p class="hint" style="margin:0 0 10px">📄 Ao concluir, o contrato ${vip?'VIP sai preenchido (partes, horas e parcelas)':'oficial fica disponível'} na tela final${mat&&(p.ped.matDestino!=='tem')?' e o livro entra em 📚 Livros':''}.</p>`
     +`<div class="row" style="gap:8px"><button class="btn ghost" onclick="trIr(4)">← Voltar</button>
        ${vip?'':`<button class="btn ghost" style="color:#9333c7" onclick="trConcluir('orcamento')" title="Guarda como proposta — gere o PDF do orçamento e feche a venda depois">🧾 Salvar como orçamento</button>`}
        <button class="btn" style="flex:1;background:#0A7A3D" onclick="trConcluir('ativa')">✅ Concluir matrícula</button></div>`;
  }
  modal(cab+h);
  if(p.passo===4) setTimeout(trResumoLive,40);
}
function trConcluir(statusFinal){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  _trLer(); const p=_tr;
  if(!p.aluno.nome) return toast('Informe o nome do aluno');
  const vip=p.tipo==='vip';
  if(vip && statusFinal!=='ativa') return toast('Matrícula VIP conclui como ativa');
  // reaproveita o registro do rascunho como matrícula definitiva (mesmo id → sync limpo)
  S.matriculas=S.matriculas||[];
  let m=S.matriculas.find(x=>x.id===p.id);
  if(!m){ m={id:p.id, criadoEm:hoje(), criadoPor:S.usuario}; S.matriculas.push(m); }
  delete m.trilha;
  const R=_trRespFinal(p);
  Object.assign(m,{ status:statusFinal, tipo:p.tipo, origem:'trilha',
    alunoNome:p.aluno.nome, nascimento:p.aluno.nasc, docAluno:p.aluno.doc, email:R.email||p.aluno.email,
    alunoTelefone:p.aluno.tel||'', alunoEndereco:p.aluno.endereco||'',
    temResponsavel:R.temResp, respNome:R.nome, respParentesco:R.parentesco, telefone:R.tel, respDoc:R.doc,
    endereco:R.endereco, cidade:R.cidade, modalidade:p.ped.modalidade,
    dataInicio:vip?(p.ped.vigIni||hoje()):(p.ped.inicio||hoje()), fimPeriodo:vip?(p.ped.vigFim||''):(p.ped.fimPeriodo||''),
    atualizadoEm:Date.now() });
  if(vip){
    // 1) aluno VIP
    const nv={id:uid(), nome:p.aluno.nome, professor:p.ped.professor, dupla:!!p.ped.dupla,
      email:p.aluno.email||'', nascimento:p.aluno.nasc||'', telefone:p.aluno.tel||'', endereco:p.aluno.endereco||'',
      cefr:p.ped.nivel||'', atualizadoEm:Date.now()};
    S.vipAlunos=S.vipAlunos||[]; S.vipAlunos.push(nv);
    m.vipId=nv.id; m.professor=p.ped.professor;
    // 2) pacote de horas
    S.pacotesVip=S.pacotesVip||[];
    S.pacotesVip.push({id:uid(), vipId:nv.id, horas:_matN(p.ped.horas), inicio:p.ped.vigIni||hoje(), fim:p.ped.vigFim||'', obs:'Trilha de matrícula', atualizadoEm:Date.now()});
    // 3) contrato VIP pronto: partes + parcelas (responsável = aluno se não houver outro)
    const tot=_trTotalVip();
    nv.contratoDados={ contratante:R.nome||p.aluno.nome, cpf:R.doc||'', cidade:R.cidade||'', endereco:R.endereco||'',
      email:R.email||p.aluno.email||'', wpp:R.tel||'', alunoCpf:p.aluno.doc||'',
      ini:p.ped.vigIni||hoje(), fim:p.ped.vigFim||'', horas:String(_matN(p.ped.horas)), nivel:p.ped.nivel||'',
      parcelas:_trParcelasVip(tot, p.pag.vipParcelas||1, p.ped.vigIni||hoje(), p.pag.diaVenc),
      obs:(p.pag.forma?('Pagamento: '+p.pag.forma):'')+(_matN(p.pag.vipDesc)?((p.pag.forma?' · ':'')+'desconto de '+_moeda(p.pag.vipDesc)+' aplicado'):'') };
    // 4) material do VIP (se escolhido)
    _trRegistrarMaterial(nv.id, true, p.ped.material, p.ped.matDestino);
    save(); fechar(); if(typeof montarNav==='function') montarNav(); if(rota==='matriculas') VIEWS.matriculas();
    toast('Matrícula VIP concluída — bem-vindo(a), '+p.aluno.nome+'! 🎉');
    modal(`<h3>🎉 Matrícula VIP concluída! <button class="close" onclick="fechar()">×</button></h3>
      <p class="hint" style="margin:0 0 12px"><b>${esc(p.aluno.nome)}</b> está em 👑 Alunos VIP com prof. <b>${esc(p.ped.professor)}</b>, pacote de <b>${_matN(p.ped.horas)}h</b> criado e contrato preenchido.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" onclick="fechar();verContratoVip('${nv.id}')">📄 Contrato VIP</button>
        <button class="btn ghost" onclick="fechar();ir('vip');selecionarVip('${nv.id}')">👑 Abrir o aluno</button>
        <button class="btn ghost" onclick="fechar()">Fechar</button>
      </div>`);
    _tr=null; return;
  }
  // ---- turma ----
  const t=_trTurma(); if(!t) return toast('Turma inválida');
  let aluno=null;
  if(statusFinal==='ativa'){
    const jaExiste=(S.alunos||[]).find(a=>_normTxt(a.nome)===_normTxt(p.aluno.nome) && !a.arquivado);
    if(jaExiste && !confirm('Já existe um aluno chamado "'+jaExiste.nome+'" ('+turmaNome(jaExiste.turmaId)+').\n\nCriar mesmo assim um cadastro novo?')) return;
    aluno={id:uid(), nome:p.aluno.nome, turmaId:t.id, email:p.aluno.email||'',
      telefone:p.aluno.tel||'', endereco:p.aluno.endereco||'', nascimento:p.aluno.nasc||'', doc:p.aluno.doc||'', atualizadoEm:Date.now()};
    S.alunos.push(aluno); m.alunoId=aluno.id;
  }
  m.turmaId=t.id;
  const f={id:'fin_'+m.id, matriculaId:m.id, criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now(),
    valorMatricula:_matN(p.pag.taxa), valorMensalidade:_matN(p.pag.mensal), descontoPct:_matN(p.pag.descPct), descontoValor:_matN(p.pag.descVal),
    parcelas:p.pag.parcelas||12, diaVencimento:p.pag.diaVenc||10, formaPagamento:p.pag.forma||'', dataInicio:p.ped.inicio||hoje(), pagos:{}, observacoes:''};
  S.financeiro=S.financeiro||[];
  if(!S.financeiro.some(x=>x.matriculaId===m.id)) S.financeiro.push(f);
  const col=p.ped.material||((typeof planColecaoDe==='function')?(planColecaoDe(t)||''):'');
  if(statusFinal==='ativa' && aluno) _trRegistrarMaterial(aluno.id, false, col, p.ped.matDestino);
  save(); fechar(); if(typeof montarNav==='function') montarNav(); if(rota==='matriculas') VIEWS.matriculas();
  if(statusFinal==='orcamento'){ toast('Orçamento salvo — gere o PDF e apresente à família 🧾'); _tr=null; return; }
  toast('Matrícula concluída — bem-vindo(a), '+p.aluno.nome+'! 🎉');
  modal(`<h3>🎉 Matrícula concluída! <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 12px"><b>${esc(p.aluno.nome)}</b> está na turma <b>${esc(t.nome)}</b>, com matrícula ativa, plano financeiro criado${col&&p.ped.matDestino!=='tem'?(' e o material ('+esc(col)+') registrado em 📚 Livros'):''}.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="fechar();verContratoOficial('${m.id}')">📄 Contrato</button>
      <button class="btn ghost" onclick="fechar();abrirCarne('fin_${m.id}')">💳 Carnê</button>
      ${aluno?`<button class="btn ghost" onclick="fechar();abrirFicha('${aluno.id}')">📇 Ficha do aluno</button>`:''}
      <button class="btn ghost" onclick="fechar()">Fechar</button>
    </div>`);
  _tr=null;
}
/* ---- card "trilhas em andamento" (rascunhos, visíveis a todos com acesso) ---- */
function _cardTrilhas(){
  const rs=(S.matriculas||[]).filter(x=>x.status==='rascunho').sort((a,b)=>(b.atualizadoEm||0)-(a.atualizadoEm||0));
  if(!rs.length) return '';
  const linhas=rs.map(r=>{ const tr=r.trilha||{}; const passo=tr.passo||1;
    return `<div class="check"><span style="flex:1"><b>${esc(r.alunoNome||'(sem nome)')}</b> <span class="pill" style="background:${r.tipo==='vip'?'#fdf3d7':'#eaf3ff'};color:${r.tipo==='vip'?'#b8860b':'#005EAF'}">${r.tipo==='vip'?'👑 VIP':'🏫 Turma'}</span><br>
      <span class="hint">parou no passo ${passo} (${_TR_PASSOS[passo-1]||''}) · por ${esc(r.criadoPor||'')}${r.atualizadoEm?(' · '+brDate(new Date(r.atualizadoEm).toISOString().slice(0,10))):''}</span></span>
      <button class="btn sm" style="background:#b8860b" onclick="abrirTrilhaMatricula('${r.id}')">▶ continuar</button>
      <button class="btn ghost sm" style="color:var(--vermelho)" onclick="trilhaDescartar('${r.id}')">🗑</button>
    </div>`; }).join('');
  return `<div class="card" style="border-left:4px solid #b8860b">
    <h3 style="margin:0 0 2px">🧭 Matrículas em andamento (${rs.length})</h3>
    <p class="hint" style="margin:0 0 4px">Trilhas salvas no meio do caminho — qualquer pessoa da direção pode continuar de onde parou.</p>
    ${linhas}</div>`;
}
function trilhaDescartar(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const r=(S.matriculas||[]).find(x=>x.id===id && x.status==='rascunho'); if(!r) return;
  if(!confirm('Descartar o rascunho de '+(r.alunoNome||'(sem nome)')+'? Nada foi criado ainda.')) return;
  S.matriculas=(S.matriculas||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('matriculas',id);
  save(); VIEWS.matriculas(); toast('Rascunho descartado');
}
