/* =====================================================================
   MÓDULO FINANCEIRO — b136 · SÓ DIREÇÃO
   Separado das Matrículas. Cada lançamento financeiro pertence a uma
   matrícula (matriculaId) e guarda: valores (matrícula, mensalidade,
   desconto), parcelas, dia de vencimento, forma, data de início e o
   carnê de pagamentos (pagos). KPIs, carnê, PDF e planilha.
   Persistência em S.financeiro (MERGE_COLS). Protótipo — sem integração
   bancária (baixa manual das parcelas).
   ===================================================================== */

const FIN_PAGAMENTO=['Boleto','Pix','Cartão de crédito','Cartão de débito','Dinheiro','Transferência'];

function finMatricula(f){ return f?((S.matriculas||[]).find(m=>m.id===f.matriculaId)||null):null; }
function finNome(f){ const m=finMatricula(f); return m?matNome(m):(f&&f.nomeAvulso)||'(matrícula removida)'; }
function finTurma(f){ const m=finMatricula(f); return (m&&m.turmaId)?turmaNome(m.turmaId):''; }
function finStatusMat(f){ const m=finMatricula(f); return m?m.status:'—'; }
function finInicio(f){ if(f&&f.dataInicio) return f.dataInicio; const m=finMatricula(f); return (m&&m.dataInicio)||hoje(); }
function finMensalLiquida(f){ return _matN(f.valorMensalidade)*(1-(_matN(f.descontoPct)/100)); }
function finTotalCurso(f){ const parc=Math.max(0,parseInt(f.parcelas)||0); return _matN(f.valorMatricula)+finMensalLiquida(f)*parc; }
function finParcelas(f){
  const n=Math.max(0,parseInt(f.parcelas)||0); if(!n) return [];
  const val=finMensalLiquida(f);
  const base=new Date(finInicio(f)+'T12:00:00');
  const dia=Math.min(28,Math.max(1,parseInt(f.diaVencimento)||10));
  const out=[]; for(let i=0;i<n;i++){ const d=new Date(base.getFullYear(), base.getMonth()+i, dia); out.push({n:i+1, venc:ymd(d), valor:val}); }
  return out;
}
function finParcelaStatus(f,p){ if((f.pagos||{})[p.n]) return 'paga'; return (p.venc<hoje())?'atrasada':'aberta'; }
function finRecebido(f){ const pg=f.pagos||{}; return finParcelas(f).reduce((s,p)=>s+(pg[p.n]?(+pg[p.n].valor||p.valor):0),0); }
function finAberto(f){ const pg=f.pagos||{}; return finParcelas(f).reduce((s,p)=>s+(pg[p.n]?0:p.valor),0); }
function finAtrasadoV(f){ const pg=f.pagos||{}; return finParcelas(f).reduce((s,p)=>s+((!pg[p.n]&&p.venc<hoje())?p.valor:0),0); }
function _finAtiva(f){ return finStatusMat(f)==='ativa'; }
function _finScope(){ return (S.financeiro||[]).filter(f=>{ const st=finStatusMat(f); return st==='ativa'||st==='trancada'||st==='concluida'; }); }
function finReceitaMensal(){ return (S.financeiro||[]).filter(_finAtiva).reduce((s,f)=>s+finMensalLiquida(f),0); }
function finTotalRecebido(){ return _finScope().reduce((s,f)=>s+finRecebido(f),0); }
function finTotalAberto(){ return _finScope().reduce((s,f)=>s+finAberto(f),0); }
function finTotalAtrasado(){ return _finScope().reduce((s,f)=>s+finAtrasadoV(f),0); }
function finInadimplentes(){ return _finScope().filter(f=>finAtrasadoV(f)>0).length; }

/* -------------------- VIEW -------------------- */
let _finBusca='';
VIEWS.financeiro=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O módulo financeiro é exclusivo da direção.</div>'; return; }
  const ativas=(S.financeiro||[]).filter(_finAtiva);
  const ticket=ativas.length?finReceitaMensal()/ativas.length:0;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  const semMat=(S.matriculas||[]).filter(m=>m.status!=='cancelada' && !(S.financeiro||[]).some(f=>f.matriculaId===m.id));
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#005EAF"></span><h2 class="display">💰 Financeiro</h2></div>
    <p class="sub">Mensalidades e pagamentos, ligados às matrículas. <b>Protótipo</b>: baixa manual das parcelas, sem integração com banco/boleto.</p>
    <div class="card">
      <div class="fx-tiles">
        ${tile(_moeda(finReceitaMensal()),'Receita mensal prevista','#005EAF')}
        ${tile(_moeda(ticket),'Ticket médio','#b8860b')}
        ${tile(ativas.length,'Planos ativos','#0A7A3D')}
        ${tile(semMat.length,'Matrículas sem plano',semMat.length>0?'#c2560b':'var(--tinta)')}
      </div>
      <p class="hint" style="margin:10px 0 0">Receita mensal prevista = soma das mensalidades (com desconto) dos planos cujas matrículas estão <b>ativas</b>.</p>
    </div>
    <div class="card">
      <h3 style="margin:0 0 2px">💳 Situação de pagamentos</h3>
      <div class="fx-tiles" style="margin-top:8px">
        ${tile(_moeda(finTotalRecebido()),'Recebido','#0A7A3D')}
        ${tile(_moeda(finTotalAberto()),'A receber (em aberto)','#005EAF')}
        ${tile(_moeda(finTotalAtrasado()),'Em atraso',finTotalAtrasado()>0?'var(--vermelho)':'var(--tinta)')}
        ${tile(finInadimplentes(),'Inadimplentes',finInadimplentes()>0?'var(--vermelho)':'var(--tinta)')}
      </div>
    </div>
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <button class="btn" onclick="novoFinanceiro()">+ Novo lançamento</button>
        <button class="btn ghost sm" onclick="exportarFinanceiroCSV()">⬇️ Planilha</button>
        <input type="text" placeholder="Buscar por aluno…" value="${escAttr(_finBusca)}" oninput="_finBuscaInput(this.value)" style="flex:1;min-width:180px">
      </div>
      <div id="finListaBox"></div>
    </div>`;
  _finRenderLista();
};
function _finRenderLista(){
  const box=document.getElementById('finListaBox'); if(!box) return;
  let lista=(S.financeiro||[]).slice();
  const q=_normTxt(_finBusca||'').trim();
  if(q) lista=lista.filter(f=>_normTxt(finNome(f)).includes(q));
  lista.sort((a,b)=>_normTxt(finNome(a)).localeCompare(_normTxt(finNome(b))));
  box.innerHTML = lista.length?lista.map(_finLinha).join(''):`<p class="hint" style="margin:12px 0 0">${(S.financeiro||[]).length?'Nada encontrado.':'Nenhum lançamento. Clique em “+ Novo lançamento” e escolha uma matrícula.'}</p>`;
}
function _finBuscaInput(q){ _finBusca=q; clearTimeout(window._finBuscaTO); window._finBuscaTO=setTimeout(_finRenderLista,180); }
function _finLinha(f){
  const atras=finAtrasadoV(f); const stMat=finStatusMat(f);
  const chipMat=(MAT_STATUS[stMat]||{lbl:stMat,bg:'#eef0f4',cor:'#5a6b86'});
  const t=finTurma(f);
  const barCor=atras>0?'var(--vermelho)':(finAberto(f)>0?'#005EAF':'#0A7A3D');
  return `<div class="check" style="display:block;cursor:pointer" onclick="abrirFinanceiro('${f.id}')">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <b style="flex:1">${esc(finNome(f))}</b>
      <span class="pill" style="background:${chipMat.bg};color:${chipMat.cor}">${chipMat.lbl}</span>
      ${atras>0?`<span class="pill" style="background:#fdeaea;color:var(--vermelho)">em atraso ${_moeda(atras)}</span>`:''}
    </div>
    <span class="hint">${t?('🏫 '+esc(t)+' · '):''}mensalidade ${_moeda(finMensalLiquida(f))}${_matN(f.descontoPct)>0?(' (−'+_matN(f.descontoPct)+'%)'):''} · recebido ${_moeda(finRecebido(f))} / total ${_moeda(finTotalCurso(f))}</span>
    <div style="height:6px;background:#eef1f6;border-radius:4px;overflow:hidden;margin-top:5px"><div style="height:100%;width:${finTotalCurso(f)>0?Math.min(100,Math.round(finRecebido(f)/finTotalCurso(f)*100)):0}%;background:${barCor}"></div></div>
  </div>`;
}

/* -------------------- criar / abrir -------------------- */
function novoFinanceiro(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const elig=(S.matriculas||[]).filter(m=>m.status!=='cancelada' && !(S.financeiro||[]).some(f=>f.matriculaId===m.id)).sort((a,b)=>_normTxt(matNome(a)).localeCompare(_normTxt(matNome(b))));
  if(!elig.length) return toast('Todas as matrículas já têm plano financeiro. Crie a matrícula primeiro.');
  const opt=elig.map(m=>`<option value="${m.id}">${esc(matNome(m))}${m.turmaId?(' · '+esc(turmaNome(m.turmaId))):''}</option>`).join('');
  modal(`<h3>💰 Novo lançamento financeiro <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">Escolha a matrícula para lançar as condições financeiras.</p>
    <div class="field"><label class="lbl">Matrícula</label><select id="fin_novoMat">${opt}</select></div>
    <button class="btn block" onclick="abrirFinanceiroDaMatricula(document.getElementById('fin_novoMat').value)">Continuar</button>`);
}
// abre o financeiro de uma matrícula (cria um rascunho ligado se ainda não existir)
function abrirFinanceiroDaMatricula(matId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if(!matId) return;
  const m=(S.matriculas||[]).find(x=>x.id===matId); if(!m) return toast('Matrícula não encontrada');
  let f=(S.financeiro||[]).find(x=>x.matriculaId===matId);
  if(!f){ f={ id:uid(), matriculaId:matId, criadoEm:hoje(), criadoPor:S.usuario, atualizadoEm:Date.now(), valorMatricula:0, valorMensalidade:0, descontoPct:0, parcelas:12, diaVencimento:10, formaPagamento:'', dataInicio:m.dataInicio||hoje(), pagos:{}, observacoes:'' };
    S.financeiro=S.financeiro||[]; S.financeiro.push(f); save(); }
  abrirFinanceiro(f.id);
}
function abrirFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const optPg=`<option value="">—</option>`+FIN_PAGAMENTO.map(p=>`<option ${f.formaPagamento===p?'selected':''}>${p}</option>`).join('');
  const t=finTurma(f);
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">💰 Financeiro — ${esc(finNome(f))}</h3><button class="close" onclick="fechar()">×</button></div>
    <p class="hint" style="margin:0 0 10px">${t?('🏫 '+esc(t)+' · '):''}matrícula ${MAT_STATUS[finStatusMat(f)]?MAT_STATUS[finStatusMat(f)].lbl:finStatusMat(f)}</p>
    <div class="row"><div class="field"><label class="lbl">Matrícula (R$)</label><input type="number" id="fin_valorMatricula" value="${f.valorMatricula!=null?f.valorMatricula:''}" min="0" step="0.01" placeholder="0,00" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Mensalidade (R$)</label><input type="number" id="fin_valorMensalidade" value="${f.valorMensalidade!=null?f.valorMensalidade:''}" min="0" step="0.01" placeholder="0,00" oninput="_finResumo()"></div></div>
    <div class="row"><div class="field"><label class="lbl">Desconto (%)</label><input type="number" id="fin_descontoPct" value="${f.descontoPct!=null?f.descontoPct:''}" min="0" max="100" step="1" placeholder="0" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Parcelas (nº)</label><input type="number" id="fin_parcelas" value="${f.parcelas!=null?f.parcelas:12}" min="0" max="48" step="1" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Vencimento (dia)</label><input type="number" id="fin_diaVencimento" value="${f.diaVencimento!=null?f.diaVencimento:10}" min="1" max="28" step="1" oninput="_finResumo()"></div></div>
    <div class="row"><div class="field" style="flex:2"><label class="lbl">Forma de pagamento</label><select id="fin_formaPagamento">${optPg}</select></div>
      <div class="field"><label class="lbl">Início da cobrança</label><input type="date" id="fin_dataInicio" value="${escAttr(f.dataInicio||hoje())}" onchange="_finResumo()"></div></div>
    <div class="gen-box" id="fin_resumoBox" style="margin-bottom:12px">—</div>
    <div class="field"><label class="lbl">Observações</label><textarea id="fin_obs" style="min-height:56px" placeholder="Combinados de pagamento…">${escAttr(f.observacoes||'')}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarFinanceiro('${id}')">💾 Salvar</button>
      <button class="btn ghost" onclick="abrirCarne('${id}')">💳 Carnê</button>
      <button class="btn ghost" onclick="verFinanceiro('${id}')">🖨️ PDF</button>
      <button class="btn ghost" style="color:var(--vermelho)" onclick="excluirFinanceiro('${id}')">🗑 Excluir</button>
      <button class="btn ghost" onclick="fechar()">Fechar</button>
    </div>`);
  setTimeout(_finResumo,40);
}
function _finLerForm(f){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return Object.assign({}, f, { valorMatricula:_matN(g('fin_valorMatricula')), valorMensalidade:_matN(g('fin_valorMensalidade')), descontoPct:_matN(g('fin_descontoPct')), parcelas:parseInt(g('fin_parcelas'))||0, diaVencimento:parseInt(g('fin_diaVencimento'))||10, formaPagamento:g('fin_formaPagamento'), dataInicio:g('fin_dataInicio')||f.dataInicio, observacoes:g('fin_obs').trim() });
}
function _finResumo(){
  const el=document.getElementById('fin_resumoBox'); if(!el) return;
  const f=_finLerForm({}); const liq=finMensalLiquida(f); const total=finTotalCurso(f); const parc=finParcelas(f);
  el.innerHTML=`<b>Mensalidade líquida:</b> ${_moeda(liq)}${_matN(f.descontoPct)>0?` <span class="hint">(de ${_moeda(_matN(f.valorMensalidade))}, −${_matN(f.descontoPct)}%)</span>`:''} · <b>Matrícula:</b> ${_moeda(f.valorMatricula)}
    <br><b>Total do curso</b> (matrícula + ${f.parcelas||0}× mensalidade): <b>${_moeda(total)}</b>
    ${parc.length?`<br><span class="hint">${parc.length} parcela(s), venc. dia ${f.diaVencimento}, começando ${brDate(parc[0].venc)}</span>`:''}`;
}
function salvarFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const ex=(S.financeiro||[]).find(x=>x.id===id); if(!ex) return;
  Object.assign(ex, _finLerForm(ex)); ex.atualizadoEm=Date.now();
  save(); fechar(); if(rota==='financeiro') VIEWS.financeiro(); else if(rota==='matriculas') VIEWS.matriculas(); toast('Financeiro salvo ✓');
}
function excluirFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if(!confirm('Excluir este lançamento financeiro? (a matrícula continua)')) return;
  S.financeiro=(S.financeiro||[]).filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('financeiro',id);
  save(); fechar(); if(rota==='financeiro') VIEWS.financeiro(); else if(rota==='matriculas') VIEWS.matriculas(); toast('Lançamento excluído');
}

/* -------------------- CARNÊ (pagamentos) -------------------- */
function abrirCarne(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const parc=finParcelas(f);
  if(!parc.length) return toast('Defina mensalidade e parcelas primeiro');
  const chipSt={paga:{t:'paga',bg:'#eafaf0',c:'#0A7A3D'},atrasada:{t:'em atraso',bg:'#fdeaea',c:'#E52524'},aberta:{t:'a vencer',bg:'#eef2f8',c:'#5a6b86'}};
  const linhas=parc.map(p=>{ const st=finParcelaStatus(f,p); const cs=chipSt[st]; const pg=(f.pagos||{})[p.n];
    return `<div class="check" style="display:block"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <b style="min-width:66px">${p.n}/${parc.length}</b>
      <span style="flex:1">venc. ${brDate(p.venc)} · ${_moeda(p.valor)}${pg&&pg.em?` <span class="hint">(pago ${brDate(pg.em)})</span>`:''}</span>
      <span class="pill" style="background:${cs.bg};color:${cs.c}">${cs.t}</span>
      <button class="btn ghost sm" onclick="finToggleParcela('${id}',${p.n})">${pg?'desfazer':'✓ marcar paga'}</button>
    </div></div>`;
  }).join('');
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">💳 Carnê — ${esc(finNome(f))}</h3><button class="close" onclick="fechar()">×</button></div>
    <div class="fx-tiles" style="margin:2px 0 12px">
      <div class="fx-tile"><div class="v" style="color:#0A7A3D">${_moeda(finRecebido(f))}</div><div class="l">Recebido</div></div>
      <div class="fx-tile"><div class="v" style="color:#005EAF">${_moeda(finAberto(f))}</div><div class="l">A receber</div></div>
      <div class="fx-tile"><div class="v" style="color:${finAtrasadoV(f)>0?'var(--vermelho)':'var(--tinta)'}">${_moeda(finAtrasadoV(f))}</div><div class="l">Em atraso</div></div>
    </div>${linhas}
    <p class="hint" style="margin:10px 0 0">Marcar como paga registra a data de hoje. Protótipo — sem integração com banco/boleto.</p>`);
}
function finToggleParcela(id,n){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  f.pagos=f.pagos||{};
  if(f.pagos[n]) delete f.pagos[n];
  else { const p=finParcelas(f).find(x=>x.n===n); f.pagos[n]={em:hoje(), valor:p?p.valor:0}; }
  f.atualizadoEm=Date.now(); save(); abrirCarne(id);
}

/* -------------------- PDF -------------------- */
function verFinanceiro(id){
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const m=finMatricula(f); const t=finTurma(f);
  const parc=finParcelas(f); const _slbl={paga:'paga',atrasada:'em atraso',aberta:'a vencer'};
  const linhaParc=parc.map(p=>{ const s=finParcelaStatus(f,p); return `<tr><td class="c">${p.n}</td><td>${brDate(p.venc)}</td><td class="c">${_moeda(p.valor)}</td><td class="c">${_slbl[s]}</td></tr>`; }).join('');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Financeiro — ${esc(finNome(f))}</title><style>
@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:12px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:20px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:12px}
h2{font-family:'Zilla Slab',Georgia,serif;font-size:14px;color:#002B64;margin:14px 0 5px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:4px}
td{border:1px solid #DCE4EC;padding:5px 8px}td.k{background:#F0F6FC;color:#002B64;font-weight:700;width:38%}td.c{text-align:center}
.tot{font-weight:700;background:#eafaf0}.foot{margin-top:14px;color:#8a97a8;font-size:10.5px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Financeiro do aluno</div><div class="per">Gerado em ${brDate(hoje())} por ${esc(S.usuario||'')}</div></div>
<h2>${esc(finNome(f))}${t?(' · '+esc(t)):''}</h2>
<table>
  <tr><td class="k">Matrícula</td><td>${_moeda(f.valorMatricula)}</td></tr>
  <tr><td class="k">Mensalidade</td><td>${_moeda(_matN(f.valorMensalidade))}${_matN(f.descontoPct)>0?` — desconto ${_matN(f.descontoPct)}% → <b>${_moeda(finMensalLiquida(f))}</b>`:''}</td></tr>
  <tr><td class="k">Parcelas</td><td>${f.parcelas||0}× · venc. dia ${f.diaVencimento||'—'}${f.formaPagamento?(' · '+esc(f.formaPagamento)):''} · início ${brDate(finInicio(f))}</td></tr>
  <tr class="tot"><td class="k">Total do curso</td><td>${_moeda(finTotalCurso(f))}</td></tr>
</table>
${parc.length?`<h2>Carnê de vencimentos</h2><p style="font-size:12px;color:#5a6b86;margin:0 0 4px">Recebido: <b>${_moeda(finRecebido(f))}</b> · A receber: <b>${_moeda(finAberto(f))}</b>${finAtrasadoV(f)>0?` · Em atraso: <b style="color:#E52524">${_moeda(finAtrasadoV(f))}</b>`:''}</p><table><tr><td class="k c">Parcela</td><td class="k">Vencimento</td><td class="k c">Valor</td><td class="k c">Situação</td></tr>${linhaParc}</table>`:''}
${f.observacoes?`<h2>Observações</h2><p style="font-size:12.5px">${esc(f.observacoes)}</p>`:''}
<p class="foot">Documento de estudo do módulo financeiro — sem valor fiscal. Togethere · inglês para chegar lá.</p>
</body></html>`;
  imprimirDoc(html);
}

/* -------------------- EXPORTAR (planilha) -------------------- */
function exportarFinanceiroCSV(){
  const lista=(S.financeiro||[]).slice().sort((a,b)=>_normTxt(finNome(a)).localeCompare(_normTxt(finNome(b))));
  if(!lista.length) return toast('Nenhum lançamento para exportar');
  const _m=v=>(Math.round((+v||0)*100)/100).toString().replace('.',',');
  const rows=[_csvLinha(['Aluno','Turma','Status matrícula','Matrícula (R$)','Mensalidade (R$)','Desconto (%)','Mensalidade líquida (R$)','Parcelas','Dia venc.','Total curso (R$)','Recebido (R$)','A receber (R$)','Em atraso (R$)','Início'])];
  lista.forEach(f=>{ rows.push(_csvLinha([finNome(f), finTurma(f), (MAT_STATUS[finStatusMat(f)]||{}).lbl||finStatusMat(f), _m(f.valorMatricula), _m(f.valorMensalidade), _matN(f.descontoPct), _m(finMensalLiquida(f)), f.parcelas||0, f.diaVencimento||'', _m(finTotalCurso(f)), _m(finRecebido(f)), _m(finAberto(f)), _m(finAtrasadoV(f)), brDate(finInicio(f))])); });
  _dlArquivo('financeiro-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha financeira baixada ('+lista.length+')');
}
