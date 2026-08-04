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
        <button class="btn" style="background:#0A7A3D" onclick="abrirFecharVenda()">⚡ Fechar venda</button>
        <button class="btn ghost" onclick="abrirMatricula()">+ Nova matrícula</button>
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
    <div class="row"><div class="field"><label class="lbl">Nascimento</label><input type="date" min="1900-01-01" max="${hoje()}" id="mat_nascimento" value="${escAttr(m.nascimento||'')}"></div>
      <div class="field"><label class="lbl">Documento do aluno</label><input type="text" id="mat_docAluno" value="${escAttr(m.docAluno||'')}" placeholder="CPF / RG (opcional)"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">👪 Responsável</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Nome do responsável</label><input type="text" id="mat_respNome" value="${escAttr(m.respNome||'')}" placeholder="Quem assina / financeiro"></div>
      <div class="field"><label class="lbl">Parentesco</label><select id="mat_respParentesco"><option value="">—</option>${optP}</select></div></div>
    <div class="row"><div class="field"><label class="lbl">Telefone / WhatsApp</label><input type="text" id="mat_telefone" value="${escAttr(m.telefone||'')}" placeholder="(51) 9…"></div>
      <div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="mat_email" value="${escAttr(m.email||'')}" placeholder="email@exemplo.com"></div></div>
    <div class="field"><label class="lbl">Documento do responsável</label><input type="text" id="mat_respDoc" value="${escAttr(m.respDoc||'')}" placeholder="CPF (opcional)"></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Endereço (rua e número) — entra no contrato</label><input type="text" id="mat_endereco" value="${escAttr(m.endereco||'')}" placeholder="Rua …, n. …"></div>
      <div class="field"><label class="lbl">Cidade</label><input type="text" id="mat_cidade" value="${escAttr(m.cidade||'Gravataí, RS')}"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">🏫 Acadêmico</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Turma</label><select id="mat_turmaId">${optT}</select></div>
      <div class="field"><label class="lbl">Início</label><input type="date" id="mat_dataInicio" value="${escAttr(m.dataInicio||hoje())}"></div></div>
    <div class="row"><div class="field"><label class="lbl">Fim do período (contrato)</label><input type="date" id="mat_fimPeriodo" value="${escAttr(m.fimPeriodo||'')}" title="Se vazio, o contrato usa 31/12 do ano de início"></div>
      <div class="field"><label class="lbl">Modalidade</label><select id="mat_modalidade">${['Presencial','On-line','Híbrida'].map(o=>`<option ${(m.modalidade||'Presencial')===o?'selected':''}>${o}</option>`).join('')}</select></div></div>

    <div class="field" style="margin-top:8px"><label class="lbl">Observações</label><textarea id="mat_obs" style="min-height:60px" placeholder="Combinados, condições especiais…">${escAttr(m.observacoes||'')}</textarea></div>

    ${id&&!m.alunoId?`<div class="card box-suave" style="margin-bottom:12px"><p class="hint" style="margin:0 0 6px">Este cadastro ainda não está vinculado a um aluno do app. Salve primeiro e, quando quiser, crie o aluno na turma:</p><button class="btn ghost sm" onclick="matCriarAlunoEVincular('${id}')">➕ Criar aluno na turma e vincular</button></div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarMatricula('${id||''}')">💾 Salvar</button>
      ${id?`<button class="btn ghost" onclick="abrirFinanceiroDaMatricula('${id}')">💰 Financeiro</button>`:''}
      ${id?`<button class="btn ghost" onclick="verMatricula('${id}')">🖨️ Ficha / PDF</button>`:''}
      ${id&&m.status==='orcamento'?`<button class="btn ghost" style="color:#9333c7" onclick="verOrcamento('${id}')">🧾 Orçamento / PDF</button>`:''}
      ${id?`<button class="btn ghost" onclick="verContratoOficial('${id}')">📄 Contrato oficial</button>`:''}
      ${id?`<button class="btn ghost" style="color:var(--vermelho)" onclick="excluirMatricula('${id}')">🗑 Excluir</button>`:''}
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
}
function _matAlunoSel(){ const sel=document.getElementById('mat_alunoId'); const w=document.getElementById('mat_nomeWrap'); if(w) w.style.display=(sel&&sel.value)?'none':'block'; }
function _matLerForm(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return { status:g('mat_status')||'orcamento', alunoId:g('mat_alunoId'), alunoNome:g('mat_alunoNome').trim(), nascimento:g('mat_nascimento'), docAluno:g('mat_docAluno').trim(),
    respNome:g('mat_respNome').trim(), respParentesco:g('mat_respParentesco'), telefone:g('mat_telefone').trim(), email:g('mat_email').trim(), respDoc:g('mat_respDoc').trim(),
    endereco:g('mat_endereco').trim(), cidade:g('mat_cidade').trim(), fimPeriodo:g('mat_fimPeriodo'), modalidade:g('mat_modalidade'),
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
  const rows=[_csvLinha(['Aluno','Status','Turma','Responsável','Parentesco','Telefone','E-mail','Início','Vinculado','Tem financeiro','Motivo (não fechou)'])];
  lista.forEach(m=>{ rows.push(_csvLinha([matNome(m),(MAT_STATUS[m.status]||{}).lbl||m.status, m.turmaId?turmaNome(m.turmaId):'', m.respNome||'', m.respParentesco||'', m.telefone||'', m.email||'', m.dataInicio?brDate(m.dataInicio):'', m.alunoId?'sim':'não', matTemFinanceiro(m)?'sim':'não', (m.negada&&m.negada.motivo)||''])); });
  _dlArquivo('matriculas-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de matrículas baixada ('+lista.length+')');
}

/* -------------------- ⚡ WIZARD FECHAR VENDA (b158) --------------------
   A venda inteira numa sequência só: aluno+turma → valores → confirmar.
   Cria: aluno na turma, matrícula ATIVA, plano financeiro e pedido do livro. */
let _fv={};
function abrirFecharVenda(){
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
