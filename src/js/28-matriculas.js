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
};
const MAT_PARENTESCO=['Mãe','Pai','Responsável legal','Avó/Avô','O próprio aluno','Outro'];

// helpers de dinheiro compartilhados (usados também pelo módulo Financeiro)
function _matN(v){ if(v==null) return 0; const s=String(v).replace(/\./g,'').replace(',','.').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return isNaN(n)?0:n; }
function _moeda(v){ return 'R$ '+(Math.round((+v||0)*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function matNome(m){ if(!m) return '—'; if(m.alunoId){ const a=(S.alunos||[]).find(x=>x.id===m.alunoId); if(a) return a.nome; } return m.alunoNome||'(sem nome)'; }
function matAtivas(){ return (S.matriculas||[]).filter(m=>m.status==='ativa'); }
function matTemFinanceiro(m){ return (S.financeiro||[]).some(f=>f.matriculaId===m.id); }

/* -------------------- VIEW -------------------- */
let _matFiltro='', _matBusca='';
VIEWS.matriculas=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O módulo de matrículas é exclusivo da direção.</div>'; return; }
  const todas=(S.matriculas||[]).slice();
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
        ${tile(ativas.length,'Matrículas ativas','#0A7A3D')}
        ${tile(todas.length,'Total de cadastros','var(--tinta)')}
        ${tile(todas.filter(x=>x.status==='orcamento').length,'Orçamentos abertos','#9333c7')}
        ${tile(semFin,'Ativas sem financeiro',semFin>0?'#c2560b':'var(--tinta)')}
      </div>
      <p class="hint" style="margin:10px 0 0">Para lançar valores e acompanhar o pagamento, abra a matrícula e toque em <b>💰 Financeiro</b> — ou vá no módulo Financeiro.</p>
    </div>
    ${_cardOrcamentos()}
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <button class="btn" onclick="abrirMatricula()">+ Nova matrícula</button>
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
  let lista=(S.matriculas||[]).slice();
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
  const t=m.turmaId?turmaNome(m.turmaId):'';
  const vinc=m.alunoId?'🔗 vinculado':'';
  const temFin=matTemFinanceiro(m);
  return `<div class="check" style="display:block">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;cursor:pointer" onclick="abrirMatricula('${m.id}')">
      <b style="flex:1">${esc(matNome(m))}</b>
      <span class="pill" style="background:${st.bg};color:${st.cor}">${st.lbl}</span>
      <button class="btn ghost sm" onclick="event.stopPropagation();abrirFinanceiroDaMatricula('${m.id}')">💰 ${temFin?'Financeiro':'+ Financeiro'}</button>
    </div>
    <span class="hint" style="cursor:pointer" onclick="abrirMatricula('${m.id}')">${t?('🏫 '+esc(t)):'sem turma'}${m.respNome?(' · resp. '+esc(m.respNome)):''}${m.telefone?(' · '+esc(m.telefone)):''}${vinc?(' · '+vinc):''}${temFin?' · 💰 com plano':''}</span>
  </div>`;
}

/* -------------------- FORM (novo/editar) -------------------- */
function abrirMatricula(id){
  if(S.perfil!=='direcao') return toast('Só a direção acessa matrículas');
  const m=id?((S.matriculas||[]).find(x=>x.id===id)||{}):{};
  const ts=(typeof turmasVisiveis==='function'?turmasVisiveis():(S.turmas||[])).filter(t=>!t.arquivada).sort((a,b)=>a.nome.localeCompare(b.nome));
  const alunos=(S.alunos||[]).filter(a=>!a.arquivado).sort((a,b)=>a.nome.localeCompare(b.nome));
  const optT=`<option value="">— turma —</option>`+ts.map(t=>`<option value="${t.id}" ${m.turmaId===t.id?'selected':''}>${esc(t.nome)}</option>`).join('');
  const optA=`<option value="">— novo aluno (digitar nome) —</option>`+alunos.map(a=>`<option value="${a.id}" ${m.alunoId===a.id?'selected':''}>${esc(a.nome)}${a.turmaId?(' · '+esc(turmaNome(a.turmaId))):''}</option>`).join('');
  const optP=MAT_PARENTESCO.map(p=>`<option ${m.respParentesco===p?'selected':''}>${p}</option>`).join('');
  const optS=Object.keys(MAT_STATUS).map(k=>`<option value="${k}" ${((m.status||'orcamento')===k)?'selected':''}>${MAT_STATUS[k].lbl}</option>`).join('');
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">${id?'✏️ Editar matrícula':'📝 Nova matrícula'}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="field" style="margin-bottom:8px"><label class="lbl">Status</label><select id="mat_status">${optS}</select></div>

    <div style="font-weight:700;color:#0A7A3D;margin:10px 0 4px">👦 Aluno</div>
    <div class="field"><label class="lbl">Vincular a um aluno já cadastrado</label><select id="mat_alunoId" onchange="_matAlunoSel()">${optA}</select></div>
    <div class="field" id="mat_nomeWrap" style="display:${m.alunoId?'none':'block'}"><label class="lbl">Nome do aluno (novo)</label><input type="text" id="mat_alunoNome" value="${escAttr(m.alunoNome||'')}" placeholder="Nome completo"></div>
    <div class="row"><div class="field"><label class="lbl">Nascimento</label><input type="date" id="mat_nascimento" value="${escAttr(m.nascimento||'')}"></div>
      <div class="field"><label class="lbl">Documento do aluno</label><input type="text" id="mat_docAluno" value="${escAttr(m.docAluno||'')}" placeholder="CPF / RG (opcional)"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">👪 Responsável</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Nome do responsável</label><input type="text" id="mat_respNome" value="${escAttr(m.respNome||'')}" placeholder="Quem assina / financeiro"></div>
      <div class="field"><label class="lbl">Parentesco</label><select id="mat_respParentesco"><option value="">—</option>${optP}</select></div></div>
    <div class="row"><div class="field"><label class="lbl">Telefone / WhatsApp</label><input type="text" id="mat_telefone" value="${escAttr(m.telefone||'')}" placeholder="(51) 9…"></div>
      <div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="mat_email" value="${escAttr(m.email||'')}" placeholder="email@exemplo.com"></div></div>
    <div class="field"><label class="lbl">Documento do responsável</label><input type="text" id="mat_respDoc" value="${escAttr(m.respDoc||'')}" placeholder="CPF (opcional)"></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">🏫 Acadêmico</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Turma</label><select id="mat_turmaId">${optT}</select></div>
      <div class="field"><label class="lbl">Início</label><input type="date" id="mat_dataInicio" value="${escAttr(m.dataInicio||hoje())}"></div></div>

    <div class="field" style="margin-top:8px"><label class="lbl">Observações</label><textarea id="mat_obs" style="min-height:60px" placeholder="Combinados, condições especiais…">${escAttr(m.observacoes||'')}</textarea></div>

    ${id&&!m.alunoId?`<div class="card" style="background:#f4f7fb;padding:10px 12px;margin-bottom:12px"><p class="hint" style="margin:0 0 6px">Este cadastro ainda não está vinculado a um aluno do app. Salve primeiro e, quando quiser, crie o aluno na turma:</p><button class="btn ghost sm" onclick="matCriarAlunoEVincular('${id}')">➕ Criar aluno na turma e vincular</button></div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarMatricula('${id||''}')">💾 Salvar</button>
      ${id?`<button class="btn ghost" onclick="abrirFinanceiroDaMatricula('${id}')">💰 Financeiro</button>`:''}
      ${id?`<button class="btn ghost" onclick="verMatricula('${id}')">🖨️ Ficha / PDF</button>`:''}
      ${id&&m.status==='orcamento'?`<button class="btn ghost" style="color:#9333c7" onclick="verOrcamento('${id}')">🧾 Orçamento / PDF</button>`:''}
      ${id?`<button class="btn ghost" onclick="verContratoExemplo('${id}')">📄 Contrato (modelo)</button>`:''}
      ${id?`<button class="btn ghost" style="color:var(--vermelho)" onclick="excluirMatricula('${id}')">🗑 Excluir</button>`:''}
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
}
function _matAlunoSel(){ const sel=document.getElementById('mat_alunoId'); const w=document.getElementById('mat_nomeWrap'); if(w) w.style.display=(sel&&sel.value)?'none':'block'; }
function _matLerForm(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return { status:g('mat_status')||'orcamento', alunoId:g('mat_alunoId'), alunoNome:g('mat_alunoNome').trim(), nascimento:g('mat_nascimento'), docAluno:g('mat_docAluno').trim(),
    respNome:g('mat_respNome').trim(), respParentesco:g('mat_respParentesco'), telefone:g('mat_telefone').trim(), email:g('mat_email').trim(), respDoc:g('mat_respDoc').trim(),
    turmaId:g('mat_turmaId'), dataInicio:g('mat_dataInicio'), observacoes:g('mat_obs').trim() };
}
function salvarMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=_matLerForm();
  if(!m.alunoId && !m.alunoNome) return toast('Vincule a um aluno ou informe o nome');
  S.matriculas=S.matriculas||[];
  if(id){ const ex=S.matriculas.find(x=>x.id===id); if(ex){ Object.assign(ex,m); ex.atualizadoEm=Date.now(); } }
  else { S.matriculas.push(Object.assign({id:uid(), criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now()}, m)); }
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula salva ✓');
}
function excluirMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const temFin=(S.financeiro||[]).some(f=>f.matriculaId===id);
  if(!confirm('Excluir esta matrícula?'+(temFin?' O financeiro ligado a ela também será removido.':'')+' (não mexe no cadastro do aluno)')) return;
  S.matriculas=(S.matriculas||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('matriculas',id);
  (S.financeiro||[]).filter(f=>f.matriculaId===id).forEach(f=>{ if(typeof marcarExcluido==='function') marcarExcluido('financeiro',f.id); });
  S.financeiro=(S.financeiro||[]).filter(f=>f.matriculaId!==id);
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula excluída');
}
function matCriarAlunoEVincular(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
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
<h2>Aluno</h2><table>${linha('Nome',matNome(m))}${linha('Nascimento',m.nascimento?brDate(m.nascimento):'')}${linha('Documento',m.docAluno)}${linha('Turma',t?t.nome:'')}${linha('Início',m.dataInicio?brDate(m.dataInicio):'')}</table>
<h2>Responsável</h2><table>${linha('Nome',m.respNome)}${linha('Parentesco',m.respParentesco)}${linha('Telefone',m.telefone)}${linha('E-mail',m.email)}${linha('Documento',m.respDoc)}</table>
${m.observacoes?`<h2>Observações</h2><p style="font-size:12.5px">${esc(m.observacoes)}</p>`:''}
<p class="foot">As condições financeiras estão no módulo Financeiro. Documento de cadastro — sem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}

/* -------------------- EXPORTAR (planilha) — cadastro -------------------- */
function exportarMatriculasCSV(){
  const lista=(S.matriculas||[]).slice().sort((a,b)=>_normTxt(matNome(a)).localeCompare(_normTxt(matNome(b))));
  if(!lista.length) return toast('Nenhuma matrícula para exportar');
  const rows=[_csvLinha(['Aluno','Status','Turma','Responsável','Parentesco','Telefone','E-mail','Início','Vinculado','Tem financeiro'])];
  lista.forEach(m=>{ rows.push(_csvLinha([matNome(m),(MAT_STATUS[m.status]||{}).lbl||m.status, m.turmaId?turmaNome(m.turmaId):'', m.respNome||'', m.respParentesco||'', m.telefone||'', m.email||'', m.dataInicio?brDate(m.dataInicio):'', m.alunoId?'sim':'não', matTemFinanceiro(m)?'sim':'não'])); });
  _dlArquivo('matriculas-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de matrículas baixada ('+lista.length+')');
}

/* -------------------- ORÇAMENTOS (atalho de venda) -------------------- */
function _cardOrcamentos(){
  const orcs=(S.matriculas||[]).filter(m=>m.status==='orcamento').sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));
  if(!orcs.length) return '';
  const linhas=orcs.map(m=>{ const t=m.turmaId?turmaNome(m.turmaId):'';
    return `<div class="check"><span style="flex:1;cursor:pointer" onclick="abrirMatricula('${m.id}')"><b>${esc(matNome(m))}</b>${t?(' <span class="pill">'+esc(t)+'</span>'):''}${m.respNome?(' · '+esc(m.respNome)):''}</span>
      <button class="btn ghost sm" onclick="verOrcamento('${m.id}')">🧾 PDF</button>
      <button class="btn sm" style="background:#0A7A3D" onclick="converterOrcamento('${m.id}')">✓ Fechar venda</button>
    </div>`; }).join('');
  return `<div class="card" style="border-left:4px solid #9333c7">
    <h3 style="margin:0 0 2px">🧾 Orçamentos em aberto (${orcs.length}) <span class="hint" style="font-weight:400">— atalho de venda</span></h3>
    <p class="hint" style="margin:0 0 4px">Gere o PDF pra apresentar à família; fechou, converta em matrícula ativa.</p>
    ${linhas}</div>`;
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
  const cfg=(typeof _cfgFin==='function')?_cfgFin():{};
  const f=(S.financeiro||[]).find(x=>x.matriculaId===id);
  const taxa=f?_matN(f.valorMatricula):_matN(cfg.taxaMatricula);
  const parcelas=f?(f.parcelas||12):12;
  const mensal=f?(typeof finMensalLiquida==='function'?finMensalLiquida(f):0):(_matN(cfg.valorAnualCurso)/(parcelas||12));
  const material=_matN(cfg.valorMaterial);
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
<p class="validade">Proposta válida por 15 dias. Valores da tabela vigente${f?' (condições já personalizadas para este aluno)':''}.</p>
<p class="foot">Documento de orçamento — não é contrato nem tem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}
/* -------------------- CONTRATO (modelo de exemplo) -------------------- */
function verContratoExemplo(id){
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const t=m.turmaId?(S.turmas||[]).find(x=>x.id===m.turmaId):null;
  const f=(S.financeiro||[]).find(x=>x.matriculaId===id);
  const cfg=(typeof _cfgFin==='function')?_cfgFin():{};
  const mensal=f?(typeof finMensalLiquida==='function'?finMensalLiquida(f):0):0;
  const parcelas=f?(f.parcelas||12):12;
  const taxa=f?_matN(f.valorMatricula):_matN(cfg.taxaMatricula);
  const dado=(v,ph)=> v?esc(String(v)):`<span style="background:#FFF7DA;padding:0 4px">${ph}</span>`;
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato — ${esc(matNome(m))}</title><style>
@page{margin:16mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px;font-size:12.5px;line-height:1.55}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:12px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:19px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:11px}
h2{font-family:'Zilla Slab',Georgia,serif;font-size:13.5px;color:#002B64;margin:14px 0 4px}
.marca{background:#fdeaea;color:#E52524;font-weight:700;display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;margin-bottom:8px}
.ass{margin-top:34px;display:flex;gap:30px}.ass div{flex:1;border-top:1px solid #15233b;padding-top:4px;text-align:center;font-size:11px}
.foot{margin-top:14px;color:#8a97a8;font-size:10px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Contrato de prestação de serviços educacionais</div><div class="per">${brDate(hoje())}</div></div>
<span class="marca">MODELO DE EXEMPLO — texto oficial será fornecido pela direção</span>
<h2>1. Partes</h2>
<p><b>CONTRATADA:</b> TOGETHERE ESCOLA DE IDIOMAS, Gravataí/RS ${dado('','[CNPJ / endereço completo]')}.<br>
<b>CONTRATANTE:</b> ${dado(m.respNome,'[nome do responsável]')}, ${dado(m.respParentesco,'[parentesco]')} do(a) aluno(a), CPF ${dado(m.respDoc,'[CPF]')}, telefone ${dado(m.telefone,'[telefone]')}, e-mail ${dado(m.email,'[e-mail]')}.<br>
<b>ALUNO(A):</b> ${esc(matNome(m))}${m.nascimento?(', nascido(a) em '+brDate(m.nascimento)):''}${m.docAluno?(', documento '+esc(m.docAluno)):''}.</p>
<h2>2. Objeto</h2>
<p>Curso de língua inglesa na turma <b>${t?esc(t.nome):dado('','[turma]')}</b>${t&&t.horario?(', às '+esc(t.horario)):''}, com início em ${m.dataInicio?brDate(m.dataInicio):dado('','[data de início]')}, conforme metodologia e calendário da CONTRATADA.</p>
<h2>3. Valores e forma de pagamento</h2>
<p>Taxa de matrícula de <b>${_moeda(taxa)}</b>; mensalidade de <b>${_moeda(mensal)}</b> em <b>${parcelas}</b> parcelas, com vencimento todo dia ${f?(f.diaVencimento||10):10}${f&&f.formaPagamento?(', via '+esc(f.formaPagamento)):''}. Em caso de atraso incidem multa de ${_matN(cfg.multaPct)||2}% e juros de ${_matN(cfg.jurosMesPct)||1}% ao mês. ${dado('','[demais condições — texto oficial]')}</p>
<h2>4. Disposições gerais</h2>
<p>${dado('','[cláusulas de cancelamento, reposição, uso de imagem, LGPD e foro — texto oficial da direção]')}</p>
<div class="ass"><div>${dado(m.respNome,'[responsável]')}<br>CONTRATANTE</div><div>Togethere Escola de Idiomas<br>CONTRATADA</div></div>
<p class="foot">MODELO DE EXEMPLO gerado pelo app para estudo — sem validade jurídica até substituição pelo texto oficial. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}
