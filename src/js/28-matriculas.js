/* =====================================================================
   MÓDULO DE MATRÍCULAS (estudo) — b134  · SÓ DIREÇÃO
   Cadastro de matrículas com vínculo ao aluno (existente ou novo),
   turma, dados do responsável e parte financeira (matrícula, mensalidade,
   desconto, dia de vencimento, parcelas) com resumo calculado, carnê de
   vencimentos, KPIs (receita mensal prevista), resumo imprimível e
   exportação em planilha. Persistência em S.matriculas (MERGE_COLS).
   OBS: estudo/protótipo — ainda sem controle de pagamentos recebidos.
   ===================================================================== */

const MAT_STATUS={
  rascunho:{lbl:'Rascunho',   bg:'#eef0f4', cor:'#5a6b86'},
  ativa:   {lbl:'Ativa',      bg:'#eafaf0', cor:'#0A7A3D'},
  trancada:{lbl:'Trancada',   bg:'#fff1e6', cor:'#c2560b'},
  concluida:{lbl:'Concluída', bg:'#eaf3ff', cor:'#005EAF'},
  cancelada:{lbl:'Cancelada', bg:'#fdeaea', cor:'#E52524'},
};
const MAT_PARENTESCO=['Mãe','Pai','Responsável legal','Avó/Avô','O próprio aluno','Outro'];
const MAT_PAGAMENTO=['Boleto','Pix','Cartão de crédito','Cartão de débito','Dinheiro','Transferência'];

function _matN(v){ if(v==null) return 0; const s=String(v).replace(/\./g,'').replace(',','.').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return isNaN(n)?0:n; }
function _moeda(v){ return 'R$ '+(Math.round((+v||0)*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function matMensalLiquida(m){ return _matN(m.valorMensalidade)*(1-(_matN(m.descontoPct)/100)); }
function matTotalCurso(m){ const parc=Math.max(0,parseInt(m.parcelas)||0); return _matN(m.valorMatricula)+matMensalLiquida(m)*parc; }
function matReceitaMensal(){ return (S.matriculas||[]).filter(m=>m.status==='ativa').reduce((s,m)=>s+matMensalLiquida(m),0); }
function matAtivas(){ return (S.matriculas||[]).filter(m=>m.status==='ativa'); }
function matNome(m){ if(m.alunoId){ const a=(S.alunos||[]).find(x=>x.id===m.alunoId); if(a) return a.nome; } return m.alunoNome||'(sem nome)'; }
function matParcelas(m){
  const n=Math.max(0,parseInt(m.parcelas)||0); if(!n) return [];
  const val=matMensalLiquida(m);
  const base=m.dataInicio?new Date(m.dataInicio+'T12:00:00'):new Date(hoje()+'T12:00:00');
  const dia=Math.min(28,Math.max(1,parseInt(m.diaVencimento)||10));
  const out=[]; for(let i=0;i<n;i++){ const d=new Date(base.getFullYear(), base.getMonth()+i, dia); out.push({n:i+1, venc:ymd(d), valor:val}); }
  return out;
}
/* --- pagamentos das parcelas (carnê) — estudo --- */
function matParcelaStatus(m,p){ if((m.pagos||{})[p.n]) return 'paga'; return (p.venc<hoje())?'atrasada':'aberta'; }
function matRecebido(m){ const pg=m.pagos||{}; return matParcelas(m).reduce((s,p)=>s+(pg[p.n]?(+pg[p.n].valor||p.valor):0),0); }
function matAberto(m){ const pg=m.pagos||{}; return matParcelas(m).reduce((s,p)=>s+(pg[p.n]?0:p.valor),0); }
function matAtrasadoV(m){ const pg=m.pagos||{}; return matParcelas(m).reduce((s,p)=>s+((!pg[p.n]&&p.venc<hoje())?p.valor:0),0); }
function _matFinScope(){ return (S.matriculas||[]).filter(m=>m.status==='ativa'||m.status==='trancada'||m.status==='concluida'); }
function matTotalRecebido(){ return _matFinScope().reduce((s,m)=>s+matRecebido(m),0); }
function matTotalAberto(){ return _matFinScope().reduce((s,m)=>s+matAberto(m),0); }
function matTotalAtrasado(){ return _matFinScope().reduce((s,m)=>s+matAtrasadoV(m),0); }
function matInadimplentes(){ return _matFinScope().filter(m=>matAtrasadoV(m)>0).length; }
function abrirCarne(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const parc=matParcelas(m);
  if(!parc.length) return toast('Defina mensalidade e parcelas primeiro');
  const chipSt={paga:{t:'paga',bg:'#eafaf0',c:'#0A7A3D'},atrasada:{t:'em atraso',bg:'#fdeaea',c:'#E52524'},aberta:{t:'a vencer',bg:'#eef2f8',c:'#5a6b86'}};
  const linhas=parc.map(p=>{ const st=matParcelaStatus(m,p); const cs=chipSt[st]; const pg=(m.pagos||{})[p.n];
    return `<div class="check" style="display:block">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <b style="min-width:70px">${p.n}/${parc.length}</b>
        <span style="flex:1">venc. ${brDate(p.venc)} · ${_moeda(p.valor)}${pg&&pg.em?` <span class="hint">(pago em ${brDate(pg.em)})</span>`:''}</span>
        <span class="pill" style="background:${cs.bg};color:${cs.c}">${cs.t}</span>
        <button class="btn ghost sm" onclick="matToggleParcela('${id}',${p.n})">${pg?'desfazer':'✓ marcar paga'}</button>
      </div></div>`;
  }).join('');
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">💳 Carnê — ${esc(matNome(m))}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="fx-tiles" style="margin:2px 0 12px">
      <div class="fx-tile"><div class="v" style="color:#0A7A3D">${_moeda(matRecebido(m))}</div><div class="l">Recebido</div></div>
      <div class="fx-tile"><div class="v" style="color:#005EAF">${_moeda(matAberto(m))}</div><div class="l">A receber</div></div>
      <div class="fx-tile"><div class="v" style="color:${matAtrasadoV(m)>0?'var(--vermelho)':'var(--tinta)'}">${_moeda(matAtrasadoV(m))}</div><div class="l">Em atraso</div></div>
    </div>
    ${linhas}
    <p class="hint" style="margin:10px 0 0">Estudo: marcar como paga registra a data de hoje. Ainda sem integração com banco/boleto.</p>`);
}
function matToggleParcela(id,n){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  m.pagos=m.pagos||{};
  if(m.pagos[n]) delete m.pagos[n];
  else { const p=matParcelas(m).find(x=>x.n===n); m.pagos[n]={em:hoje(), valor:p?p.valor:0}; }
  m.atualizadoEm=Date.now(); save(); abrirCarne(id);
}

/* -------------------- VIEW -------------------- */
let _matFiltro='', _matBusca='';
VIEWS.matriculas=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O módulo de matrículas é exclusivo da direção.</div>'; return; }
  const todas=(S.matriculas||[]).slice();
  const ativas=matAtivas();
  const receita=matReceitaMensal();
  const ticket=ativas.length?receita/ativas.length:0;
  const ymAtual=hoje().slice(0,7);
  const noMes=todas.filter(m=>(m.criadoEm||'').slice(0,7)===ymAtual).length;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  const cont=(st)=>todas.filter(m=>m.status===st).length;
  const chip=(id,lbl)=>`<button class="btn ghost sm" style="${_matFiltro===id?'background:var(--azul);color:#fff;border-color:var(--azul)':''}" onclick="_matSetFiltro('${id}')">${lbl}${id&&cont(id)?` (${cont(id)})`:''}</button>`;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#0A7A3D"></span><h2 class="display">📝 Matrículas</h2></div>
    <p class="sub">Estudo do módulo de matrículas — cadastro do aluno e do responsável, turma e condições financeiras. <b>Protótipo</b>: ainda sem baixa de pagamentos recebidos.</p>
    <div class="card">
      <div class="fx-tiles">
        ${tile(ativas.length,'Matrículas ativas','#0A7A3D')}
        ${tile(_moeda(receita),'Receita mensal prevista','#005EAF')}
        ${tile(_moeda(ticket),'Ticket médio','#b8860b')}
        ${tile(noMes,'Novas neste mês','var(--tinta)')}
      </div>
      <p class="hint" style="margin:10px 0 0">Receita mensal prevista = soma das mensalidades (já com desconto) das matrículas <b>ativas</b>.</p>
    </div>
    <div class="card">
      <h3 style="margin:0 0 2px">💳 Situação financeira <span class="hint" style="font-weight:400">(estudo — carnê por matrícula)</span></h3>
      <div class="fx-tiles" style="margin-top:8px">
        ${tile(_moeda(matTotalRecebido()),'Recebido','#0A7A3D')}
        ${tile(_moeda(matTotalAberto()),'A receber (em aberto)','#005EAF')}
        ${tile(_moeda(matTotalAtrasado()),'Em atraso',matTotalAtrasado()>0?'var(--vermelho)':'var(--tinta)')}
        ${tile(matInadimplentes(),'Inadimplentes',matInadimplentes()>0?'var(--vermelho)':'var(--tinta)')}
      </div>
      <p class="hint" style="margin:10px 0 0">Abra uma matrícula e use <b>💳 Carnê</b> para marcar as parcelas pagas. Considera matrículas ativas, trancadas e concluídas.</p>
    </div>
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <button class="btn" onclick="abrirMatricula()">+ Nova matrícula</button>
        <button class="btn ghost sm" onclick="exportarMatriculasCSV()">⬇️ Planilha</button>
        <input type="text" placeholder="Buscar por aluno ou responsável…" value="${escAttr(_matBusca)}" oninput="_matBuscaInput(this.value)" style="flex:1;min-width:180px">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
        ${chip('','Todas')}${chip('rascunho','Rascunho')}${chip('ativa','Ativas')}${chip('trancada','Trancadas')}${chip('concluida','Concluídas')}${chip('cancelada','Canceladas')}
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
  const st=MAT_STATUS[m.status]||MAT_STATUS.rascunho;
  const t=m.turmaId?turmaNome(m.turmaId):'';
  const vinc=m.alunoId?'🔗 vinculado':(m.turmaId?'sem vínculo':'');
  return `<div class="check" style="cursor:pointer;display:block" onclick="abrirMatricula('${m.id}')">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
      <b style="flex:1">${esc(matNome(m))}</b>
      <span class="pill" style="background:${st.bg};color:${st.cor}">${st.lbl}</span>
    </div>
    <span class="hint">${t?('🏫 '+esc(t)+' · '):''}${m.valorMensalidade?('mensalidade '+_moeda(matMensalLiquida(m))+(_matN(m.descontoPct)>0?(' (−'+_matN(m.descontoPct)+'%)'):'')):'sem valor'}${m.respNome?(' · resp. '+esc(m.respNome)):''}${vinc?(' · '+vinc):''}</span>
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
  const optPg=`<option value="">—</option>`+MAT_PAGAMENTO.map(p=>`<option ${m.formaPagamento===p?'selected':''}>${p}</option>`).join('');
  const optS=Object.keys(MAT_STATUS).map(k=>`<option value="${k}" ${((m.status||'rascunho')===k)?'selected':''}>${MAT_STATUS[k].lbl}</option>`).join('');
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">${id?'✏️ Editar matrícula':'📝 Nova matrícula'}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="field" style="margin-bottom:8px"><label class="lbl">Status</label><select id="mat_status">${optS}</select></div>

    <div style="font-weight:700;color:#0A7A3D;margin:10px 0 4px">👦 Aluno</div>
    <div class="field"><label class="lbl">Vincular a um aluno já cadastrado</label><select id="mat_alunoId" onchange="_matAlunoSel()">${optA}</select></div>
    <div class="field" id="mat_nomeWrap" style="display:${m.alunoId?'none':'block'}"><label class="lbl">Nome do aluno (novo)</label><input type="text" id="mat_alunoNome" value="${escAttr(m.alunoNome||'')}" placeholder="Nome completo"></div>
    <div class="row"><div class="field"><label class="lbl">Nascimento</label><input type="date" id="mat_nascimento" value="${escAttr(m.nascimento||'')}"></div>
      <div class="field"><label class="lbl">Documento do aluno</label><input type="text" id="mat_docAluno" value="${escAttr(m.docAluno||'')}" placeholder="CPF / RG (opcional)"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">👪 Responsável</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Nome do responsável</label><input type="text" id="mat_respNome" value="${escAttr(m.respNome||'')}" placeholder="Quem assina/financeiro"></div>
      <div class="field"><label class="lbl">Parentesco</label><select id="mat_respParentesco"><option value="">—</option>${optP}</select></div></div>
    <div class="row"><div class="field"><label class="lbl">Telefone / WhatsApp</label><input type="text" id="mat_telefone" value="${escAttr(m.telefone||'')}" placeholder="(51) 9…"></div>
      <div class="field" style="flex:2"><label class="lbl">E-mail</label><input type="email" id="mat_email" value="${escAttr(m.email||'')}" placeholder="email@exemplo.com"></div></div>
    <div class="field"><label class="lbl">Documento do responsável</label><input type="text" id="mat_respDoc" value="${escAttr(m.respDoc||'')}" placeholder="CPF (opcional)"></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">🏫 Acadêmico</div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Turma</label><select id="mat_turmaId">${optT}</select></div>
      <div class="field"><label class="lbl">Início</label><input type="date" id="mat_dataInicio" value="${escAttr(m.dataInicio||hoje())}"></div></div>

    <div style="font-weight:700;color:#0A7A3D;margin:12px 0 4px">💰 Financeiro <span class="hint" style="font-weight:400">(estudo)</span></div>
    <div class="row"><div class="field"><label class="lbl">Matrícula (R$)</label><input type="number" id="mat_valorMatricula" value="${m.valorMatricula!=null?m.valorMatricula:''}" min="0" step="0.01" placeholder="0,00" oninput="_matResumo()"></div>
      <div class="field"><label class="lbl">Mensalidade (R$)</label><input type="number" id="mat_valorMensalidade" value="${m.valorMensalidade!=null?m.valorMensalidade:''}" min="0" step="0.01" placeholder="0,00" oninput="_matResumo()"></div></div>
    <div class="row"><div class="field"><label class="lbl">Desconto (%)</label><input type="number" id="mat_descontoPct" value="${m.descontoPct!=null?m.descontoPct:''}" min="0" max="100" step="1" placeholder="0" oninput="_matResumo()"></div>
      <div class="field"><label class="lbl">Parcelas (nº)</label><input type="number" id="mat_parcelas" value="${m.parcelas!=null?m.parcelas:12}" min="0" max="48" step="1" oninput="_matResumo()"></div>
      <div class="field"><label class="lbl">Vencimento (dia)</label><input type="number" id="mat_diaVencimento" value="${m.diaVencimento!=null?m.diaVencimento:10}" min="1" max="28" step="1" oninput="_matResumo()"></div></div>
    <div class="field"><label class="lbl">Forma de pagamento</label><select id="mat_formaPagamento">${optPg}</select></div>
    <div class="gen-box" id="mat_resumoBox" style="margin-bottom:12px">—</div>

    <div class="field"><label class="lbl">Observações</label><textarea id="mat_obs" style="min-height:60px" placeholder="Combinados, condições especiais…">${escAttr(m.observacoes||'')}</textarea></div>

    ${id&&!m.alunoId?`<div class="card" style="background:#f4f7fb;padding:10px 12px;margin-bottom:12px"><p class="hint" style="margin:0 0 6px">Este cadastro ainda não está vinculado a um aluno do app. Salve primeiro e, quando quiser, crie o aluno na turma:</p><button class="btn ghost sm" onclick="matCriarAlunoEVincular('${id}')">➕ Criar aluno na turma e vincular</button></div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarMatricula('${id||''}')">💾 Salvar</button>
      ${id?`<button class="btn ghost" onclick="abrirCarne('${id}')">💳 Carnê</button>`:''}
      ${id?`<button class="btn ghost" onclick="verMatricula('${id}')">🖨️ Resumo / PDF</button>`:''}
      ${id?`<button class="btn ghost" style="color:var(--vermelho)" onclick="excluirMatricula('${id}')">🗑 Excluir</button>`:''}
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
    </div>`);
  setTimeout(_matResumo,40);
}
function _matAlunoSel(){ const sel=document.getElementById('mat_alunoId'); const w=document.getElementById('mat_nomeWrap'); if(w) w.style.display=(sel&&sel.value)?'none':'block'; }
function _matLerForm(){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return { status:g('mat_status')||'rascunho', alunoId:g('mat_alunoId'), alunoNome:g('mat_alunoNome').trim(), nascimento:g('mat_nascimento'), docAluno:g('mat_docAluno').trim(),
    respNome:g('mat_respNome').trim(), respParentesco:g('mat_respParentesco'), telefone:g('mat_telefone').trim(), email:g('mat_email').trim(), respDoc:g('mat_respDoc').trim(),
    turmaId:g('mat_turmaId'), dataInicio:g('mat_dataInicio'),
    valorMatricula:_matN(g('mat_valorMatricula')), valorMensalidade:_matN(g('mat_valorMensalidade')), descontoPct:_matN(g('mat_descontoPct')), parcelas:parseInt(g('mat_parcelas'))||0, diaVencimento:parseInt(g('mat_diaVencimento'))||10, formaPagamento:g('mat_formaPagamento'),
    observacoes:g('mat_obs').trim() };
}
function _matResumo(){
  const el=document.getElementById('mat_resumoBox'); if(!el) return;
  const m=_matLerForm();
  const liq=matMensalLiquida(m); const total=matTotalCurso(m);
  const parc=matParcelas(m);
  const prox=parc.slice(0,3).map(p=>brDate(p.venc)).join(', ');
  el.innerHTML=`<b>Mensalidade líquida:</b> ${_moeda(liq)}${_matN(m.descontoPct)>0?` <span class="hint">(de ${_moeda(_matN(m.valorMensalidade))}, −${_matN(m.descontoPct)}%)</span>`:''}
    · <b>Matrícula:</b> ${_moeda(m.valorMatricula)}
    <br><b>Total do curso</b> (matrícula + ${m.parcelas||0}× mensalidade): <b>${_moeda(total)}</b>
    ${parc.length?`<br><span class="hint">Vencimentos (dia ${m.diaVencimento}): ${parc.length} parcela(s), começando em ${brDate(parc[0].venc)}${prox?` · próximas: ${prox}`:''}</span>`:''}`;
}
function salvarMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const m=_matLerForm();
  if(!m.alunoId && !m.alunoNome) return toast('Vincule a um aluno ou informe o nome');
  S.matriculas=S.matriculas||[];
  if(id){ const ex=S.matriculas.find(x=>x.id===id); if(ex){ Object.assign(ex,m); ex.atualizadoEm=Date.now(); } }
  else { S.matriculas.push(Object.assign({id:uid(), criadoEm:new Date(hoje()+'T12:00:00').toISOString().slice(0,10), criadoPor:S.usuario, atualizadoEm:Date.now()}, m)); }
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula salva ✓');
}
function excluirMatricula(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if(!confirm('Excluir esta matrícula? (não mexe no cadastro do aluno)')) return;
  S.matriculas=(S.matriculas||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('matriculas',id);
  save(); fechar(); VIEWS.matriculas(); toast('Matrícula excluída');
}
// cria o aluno na turma e vincula (a partir de um rascunho sem vínculo)
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

/* -------------------- RESUMO / IMPRESSÃO -------------------- */
function verMatricula(id){
  const m=(S.matriculas||[]).find(x=>x.id===id); if(!m) return;
  const st=MAT_STATUS[m.status]||MAT_STATUS.rascunho;
  const t=m.turmaId?(S.turmas||[]).find(x=>x.id===m.turmaId):null;
  const parc=matParcelas(m);
  const _slbl={paga:'paga',atrasada:'em atraso',aberta:'a vencer'};
  const linhaParc=parc.map(p=>{ const s=matParcelaStatus(m,p); return `<tr><td class="c">${p.n}</td><td>${brDate(p.venc)}</td><td class="c">${_moeda(p.valor)}</td><td class="c">${_slbl[s]}</td></tr>`; }).join('');
  const linha=(k,val)=> val?`<tr><td class="k">${k}</td><td>${esc(String(val))}</td></tr>`:'';
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Matrícula — ${esc(matNome(m))}</title><style>
@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:12px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:20px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:12px}
h2{font-family:'Zilla Slab',Georgia,serif;font-size:14px;color:#002B64;margin:14px 0 5px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:4px}
td{border:1px solid #DCE4EC;padding:5px 8px;vertical-align:top}td.k{background:#F0F6FC;color:#002B64;font-weight:700;width:38%}
td.c{text-align:center}
.fin td{border-color:#DCE4EC}.tot{font-weight:700;background:#eafaf0}
.chip{display:inline-block;padding:2px 10px;border-radius:20px;background:${st.bg};color:${st.cor};font-weight:700;font-size:12px}
.foot{margin-top:14px;color:#8a97a8;font-size:10.5px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Ficha de matrícula</div><div class="per">Gerado em ${brDate(hoje())} por ${esc(S.usuario||'')}</div></div>
<p style="margin:0 0 8px"><span class="chip">${st.lbl}</span></p>
<h2>Aluno</h2><table>${linha('Nome',matNome(m))}${linha('Nascimento',m.nascimento?brDate(m.nascimento):'')}${linha('Documento',m.docAluno)}${linha('Turma',t?t.nome:'')}${linha('Início',m.dataInicio?brDate(m.dataInicio):'')}</table>
<h2>Responsável</h2><table>${linha('Nome',m.respNome)}${linha('Parentesco',m.respParentesco)}${linha('Telefone',m.telefone)}${linha('E-mail',m.email)}${linha('Documento',m.respDoc)}</table>
<h2>Condições financeiras</h2><table class="fin">
  <tr><td class="k">Matrícula</td><td>${_moeda(m.valorMatricula)}</td></tr>
  <tr><td class="k">Mensalidade</td><td>${_moeda(_matN(m.valorMensalidade))}${_matN(m.descontoPct)>0?` — desconto ${_matN(m.descontoPct)}% → <b>${_moeda(matMensalLiquida(m))}</b>`:''}</td></tr>
  <tr><td class="k">Parcelas</td><td>${m.parcelas||0}× · vencimento todo dia ${m.diaVencimento||'—'}${m.formaPagamento?(' · '+esc(m.formaPagamento)):''}</td></tr>
  <tr class="tot"><td class="k">Total do curso</td><td>${_moeda(matTotalCurso(m))}</td></tr>
</table>
${parc.length?`<h2>Carnê de vencimentos</h2><p style="font-size:12px;color:#5a6b86;margin:0 0 4px">Recebido: <b>${_moeda(matRecebido(m))}</b> · A receber: <b>${_moeda(matAberto(m))}</b>${matAtrasadoV(m)>0?` · Em atraso: <b style="color:#E52524">${_moeda(matAtrasadoV(m))}</b>`:''}</p><table><tr><td class="k c">Parcela</td><td class="k">Vencimento</td><td class="k c">Valor</td><td class="k c">Situação</td></tr>${linhaParc}</table>`:''}
${m.observacoes?`<h2>Observações</h2><p style="font-size:12.5px">${esc(m.observacoes)}</p>`:''}
<p class="foot">Documento de estudo do módulo de matrículas — sem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}

/* -------------------- EXPORTAR (planilha) -------------------- */
function exportarMatriculasCSV(){
  const lista=(S.matriculas||[]).slice().sort((a,b)=>_normTxt(matNome(a)).localeCompare(_normTxt(matNome(b))));
  if(!lista.length) return toast('Nenhuma matrícula para exportar');
  const rows=[_csvLinha(['Aluno','Status','Turma','Responsável','Telefone','E-mail','Matrícula (R$)','Mensalidade (R$)','Desconto (%)','Mensalidade líquida (R$)','Parcelas','Dia venc.','Total curso (R$)','Início','Vinculado'])];
  const _m=v=>(Math.round((+v||0)*100)/100).toString().replace('.',',');
  lista.forEach(m=>{ rows.push(_csvLinha([matNome(m),(MAT_STATUS[m.status]||{}).lbl||m.status, m.turmaId?turmaNome(m.turmaId):'', m.respNome||'', m.telefone||'', m.email||'', _m(m.valorMatricula), _m(m.valorMensalidade), _matN(m.descontoPct), _m(matMensalLiquida(m)), m.parcelas||0, m.diaVencimento||'', _m(matTotalCurso(m)), m.dataInicio?brDate(m.dataInicio):'', m.alunoId?'sim':'não'])); });
  _dlArquivo('matriculas-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de matrículas baixada ('+lista.length+')');
}
