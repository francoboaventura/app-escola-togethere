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
function finMensalLiquida(f){
  if(f && f.negociacao && f.negociacao.mensalidade!=null) return Math.max(0,_matN(f.negociacao.mensalidade));   // valor negociado prevalece
  return Math.max(0, _matN(f.valorMensalidade)*(1-(_matN(f.descontoPct)/100)) - _matN(f.descontoValor));
}
function finTotalCurso(f){ const parc=Math.max(0,parseInt(f.parcelas)||0); return _matN(f.valorMatricula)+finMensalLiquida(f)*parc; }
function finParcelas(f){
  const n=Math.max(0,parseInt(f.parcelas)||0); if(!n) return [];
  const val=finMensalLiquida(f);
  const base=new Date(finInicio(f)+'T12:00:00');
  const dia=Math.min(28,Math.max(1,parseInt(f.diaVencimento)||10));
  const shift=(dia<base.getDate())?1:0;   // 1ª parcela não nasce vencida: se o dia já passou no mês de início, começa no mês seguinte
  const out=[]; for(let i=0;i<n;i++){ const d=new Date(base.getFullYear(), base.getMonth()+i+shift, dia); out.push({n:i+1, venc:ymd(d), valor:val}); }
  return out;
}
function finParcelaStatus(f,p){ if((f.pagos||{})[p.n]) return 'paga'; if(finStatusMat(f)==='trancada') return 'aberta'; return (p.venc<hoje())?'atrasada':'aberta'; }   // trancada não entra em atraso
// Recebido = o que foi REGISTRADO como pago (snapshot), mesmo que as parcelas mudem depois
function finRecebido(f){ const pg=f.pagos||{}; const parc=finParcelas(f);
  return Object.keys(pg).reduce((s,n)=>{ const e=pg[n]; if(!e) return s;
    const v=(e&&e.valor!=null)?_matN(e.valor):(((parc.find(p=>p.n==+n)||{}).valor)||finMensalLiquida(f));
    return s+v; },0);
}
function finAberto(f){ const pg=f.pagos||{}; return finParcelas(f).reduce((s,p)=>s+(pg[p.n]?0:p.valor),0); }
function finAtrasadoV(f){ const pg=f.pagos||{}; return finParcelas(f).reduce((s,p)=>s+((!pg[p.n]&&p.venc<hoje())?p.valor:0),0); }
function _finAtiva(f){ return finStatusMat(f)==='ativa'; }
function _finScope(){ return (S.financeiro||[]).filter(f=>{ const st=finStatusMat(f); return st==='ativa'||st==='trancada'||st==='concluida'; }); }
function finReceitaMensal(){ return (S.financeiro||[]).filter(_finAtiva).reduce((s,f)=>s+finMensalLiquida(f),0); }
function finTotalRecebido(){ return (S.financeiro||[]).reduce((s,f)=>s+finRecebido(f)+finExtrasRecebido(f),0); }   // dinheiro recebido não some ao cancelar/editar
function finTotalAberto(){ return _finScope().reduce((s,f)=>s+finAberto(f)+finExtrasAberto(f),0); }
function finTotalAtrasado(){ return _finScope().filter(f=>finStatusMat(f)!=='trancada').reduce((s,f)=>s+finAtrasadoV(f),0); }
function finInadimplentes(){ return _finScope().filter(f=>finStatusMat(f)!=='trancada' && finAtrasadoV(f)>0).length; }
/* --- cobranças extras (ex.: material didático), ligadas ao plano --- */
function finExtras(f){ return (f&&f.extras)||[]; }
function finExtrasAberto(f){ return finExtras(f).filter(e=>!e.pago).reduce((s,e)=>s+_matN(e.valor),0); }
function finExtrasRecebido(f){ return finExtras(f).filter(e=>e.pago).reduce((s,e)=>s+_matN(e.valor),0); }
function addExtraFinanceiro(finId, nome, valor, origem){
  const f=(S.financeiro||[]).find(x=>x.id===finId); if(!f) return null;
  f.extras=f.extras||[];
  const e={id:uid(), nome:nome||'Cobrança extra', valor:_matN(valor), em:hoje(), origem:origem||'manual', pago:null};
  f.extras.push(e); f.atualizadoEm=Date.now(); save(); return e;
}
function togglePagoExtra(finId, extraId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===finId); if(!f) return;
  const e=(f.extras||[]).find(x=>x.id===extraId); if(!e) return;
  e.pago=e.pago?null:{em:hoje(), forma:f.formaPagamento||''};
  f.atualizadoEm=Date.now(); save(); abrirFinanceiro(finId);
}
function removerExtra(finId, extraId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===finId); if(!f) return;
  if(!confirm('Remover esta cobrança extra?')) return;
  f.extras=(f.extras||[]).filter(x=>x.id!==extraId); f.atualizadoEm=Date.now(); save(); abrirFinanceiro(finId);
}
function abrirExtraManual(finId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const nome=prompt('Nome da cobrança (ex.: Material didático, Taxa de prova):'); if(nome==null||!nome.trim()) return;
  const v=prompt('Valor (R$):'); if(v==null) return;
  const val=_matN(v); if(!val) return toast('Valor inválido');
  addExtraFinanceiro(finId, nome.trim(), val, 'manual'); toast('Cobrança adicionada'); abrirFinanceiro(finId);
}

/* -------------------- VIEW -------------------- */
let _finBusca='';
VIEWS.financeiro=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O módulo financeiro é exclusivo da direção.</div>'; return; }
  const ativas=(S.financeiro||[]).filter(_finAtiva);
  const ticket=ativas.length?finReceitaMensal()/ativas.length:0;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  const semMat=(S.matriculas||[]).filter(m=>m.status!=='cancelada' && !(S.financeiro||[]).some(f=>f.matriculaId===m.id));
  const _pendLiv=(typeof livrosCobrancaPendente==='function')?livrosCobrancaPendente():[];
  const pendLivCard=_pendLiv.length?('<div class="card" style="border-left:4px solid #c2560b"><h3 style="margin:0 0 2px">\ud83d\udcda Materiais entregues sem cobran\u00e7a ('+_pendLiv.length+')</h3><p class="hint" style="margin:0 0 4px">Entregues pela secretaria \u2014 decida se cobra no plano do aluno.</p>'+_pendLiv.map(p=>'<div class="check"><span style="flex:1"><b>'+esc(_lpNome(p))+'</b> \u2014 '+esc(p.titulo)+'<span class="hint"> \u00b7 entregue em '+brDate(p.entregueEm)+'</span></span><button class="btn sm" onclick="faturarLivroPendente(\''+p.id+'\')">\u2713 cobrar</button><button class="btn ghost sm" onclick="dispensarCobrancaLivro(\''+p.id+'\')">dispensar</button></div>').join('')+'</div>'):'';
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
    ${pendLivCard}
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
    <span class="hint">${t?('🏫 '+esc(t)+' · '):''}mensalidade ${_moeda(finMensalLiquida(f))}${_matN(f.descontoPct)>0?(' (−'+_matN(f.descontoPct)+'%)'):''} · recebido ${_moeda(finRecebido(f)+finExtrasRecebido(f))} / total ${_moeda(finTotalCurso(f)+finExtras(f).reduce((x,e)=>x+_matN(e.valor),0))}${finExtrasAberto(f)>0?` · extras em aberto ${_moeda(finExtrasAberto(f))}`:''}</span>
    <div style="height:6px;background:#eef1f6;border-radius:4px;overflow:hidden;margin-top:5px"><div style="height:100%;width:${finTotalCurso(f)>0?Math.min(100,Math.round(finRecebido(f)/finTotalCurso(f)*100)):0}%;background:${barCor}"></div></div>
  </div>`;
}

/* -------------------- criar / abrir -------------------- */
let _finDraft=null, _finAbertoId=null;   // rascunho em memória: só entra em S.financeiro no 1º Salvar
function _finById(id){ return (S.financeiro||[]).find(x=>x.id===id) || ((_finDraft&&_finDraft.id===id)?_finDraft:null); }
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
    _finDraft=f; }   // NÃO grava ainda — fechar sem salvar não cria plano zerado
  abrirFinanceiro(f.id);
}
function abrirFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=_finById(id); if(!f) return;
  _finAbertoId=id;
  const optPg=`<option value="">—</option>`+FIN_PAGAMENTO.map(p=>`<option ${f.formaPagamento===p?'selected':''}>${p}</option>`).join('');
  const t=finTurma(f);
  modal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h3 style="flex:1;margin:0">💰 Financeiro — ${esc(finNome(f))}</h3><button class="close" onclick="fechar()">×</button></div>
    <p class="hint" style="margin:0 0 10px">${t?('🏫 '+esc(t)+' · '):''}matrícula ${MAT_STATUS[finStatusMat(f)]?MAT_STATUS[finStatusMat(f)].lbl:finStatusMat(f)}</p>
    <div class="row"><div class="field"><label class="lbl">Matrícula (R$)</label><input type="number" id="fin_valorMatricula" value="${f.valorMatricula!=null?f.valorMatricula:''}" min="0" step="0.01" placeholder="0,00" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Mensalidade (R$)</label><input type="number" id="fin_valorMensalidade" value="${f.valorMensalidade!=null?f.valorMensalidade:''}" min="0" step="0.01" placeholder="0,00" oninput="_finResumo()"></div></div>
    <div class="row"><div class="field"><label class="lbl">Desconto (%)</label><input type="number" id="fin_descontoPct" value="${f.descontoPct!=null?f.descontoPct:''}" min="0" max="100" step="1" placeholder="0" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Desconto (R$)</label><input type="number" id="fin_descontoValor" value="${f.descontoValor!=null?f.descontoValor:''}" min="0" step="0.01" placeholder="0,00" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Parcelas (nº)</label><input type="number" id="fin_parcelas" value="${f.parcelas!=null?f.parcelas:12}" min="0" max="48" step="1" oninput="_finResumo()"></div>
      <div class="field"><label class="lbl">Vencimento (dia)</label><input type="number" id="fin_diaVencimento" value="${f.diaVencimento!=null?f.diaVencimento:10}" min="1" max="28" step="1" oninput="_finResumo()"></div></div>
    ${f.negociacao?`<div class="card box-amarela" style="margin-bottom:10px"><b style="color:#b88600">🤝 Valor negociado:</b> <span class="hint">mensalidade ${_moeda(f.negociacao.mensalidade)} · por ${escAttr(f.negociacao.por||'')} em ${brDate(f.negociacao.em||hoje())}${f.negociacao.obs?(' · '+escAttr(f.negociacao.obs)):''} <button class="btn ghost sm" style="color:var(--vermelho)" onclick="removerNegociacao('${f.id}')">remover</button></span></div>`:''}
    <div class="row" style="align-items:flex-end"><div class="field" style="flex:2"><label class="lbl">Forma de pagamento</label><select id="fin_formaPagamento">${optPg}</select></div>
      <button class="btn ghost sm" style="margin-bottom:14px" onclick="aplicarTabelaPrecos('${id}')" title="Preenche com a tabela de preços">📋 Usar tabela</button>
      <div class="field"><label class="lbl">Início da cobrança</label><input type="date" id="fin_dataInicio" value="${escAttr(f.dataInicio||hoje())}" onchange="_finResumo()"></div></div>
    <div class="gen-box" id="fin_resumoBox" style="margin-bottom:12px">—</div>
    <div class="card box-suave" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:.92rem">🧾 Cobranças extras (material, taxas…)</b><button class="btn ghost sm" onclick="abrirExtraManual('${id}')">+ extra</button></div>
      ${finExtras(f).length?finExtras(f).map(e=>`<div class="check"><span style="flex:1">${esc(e.nome)} · <b>${_moeda(e.valor)}</b><span class="hint"> · ${brDate(e.em)}${e.pago?(' · pago '+brDate(e.pago.em)):''}</span></span>
        <span class="pill" style="background:${e.pago?'#eafaf0':'#fff1e6'};color:${e.pago?'#0A7A3D':'#c2560b'}">${e.pago?'pago':'em aberto'}</span>
        ${e.pago?`<button class="btn ghost sm" title="Imprimir recibo" onclick="reciboExtra('${id}','${e.id}')">🖨️</button>`:''}
        <button class="btn ghost sm" onclick="togglePagoExtra('${id}','${e.id}')">${e.pago?'desfazer':'✓ receber'}</button>
        <button class="btn ghost sm" style="color:var(--vermelho)" onclick="removerExtra('${id}','${e.id}')">×</button></div>`).join(''):'<p class="hint" style="margin:6px 0 0">Nenhuma. A entrega de livro no Estoque pode lançar o material aqui automaticamente.</p>'}
    </div>
    <div class="field"><label class="lbl">Observações</label><textarea id="fin_obs" style="min-height:56px" placeholder="Combinados de pagamento…">${escAttr(f.observacoes||'')}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="salvarFinanceiro('${id}')">💾 Salvar</button>
      <button class="btn ghost" onclick="abrirCarne('${id}')">💳 Carnê</button>
      <button class="btn ghost" onclick="verFinanceiro('${id}')">🖨️ PDF</button>
      <button class="btn ghost" style="color:#b88600" onclick="abrirNegociacao('${id}')">🤝 Negociar</button>
      <button class="btn ghost" style="color:var(--vermelho)" onclick="excluirFinanceiro('${id}')">🗑 Excluir</button>
      <button class="btn ghost" onclick="fechar()">Fechar</button>
    </div>`);
  setTimeout(_finResumo,40);
}
function _finLerForm(f){
  const g=id=>{ const e=document.getElementById(id); return e?e.value:''; };
  return Object.assign({}, f, { valorMatricula:_matN(g('fin_valorMatricula')), valorMensalidade:_matN(g('fin_valorMensalidade')), descontoPct:_matN(g('fin_descontoPct')), descontoValor:_matN(g('fin_descontoValor')), parcelas:parseInt(g('fin_parcelas'))||0, diaVencimento:parseInt(g('fin_diaVencimento'))||10, formaPagamento:g('fin_formaPagamento'), dataInicio:g('fin_dataInicio')||f.dataInicio, observacoes:g('fin_obs').trim() });
}
function _finResumo(){
  const el=document.getElementById('fin_resumoBox'); if(!el) return;
  const f=_finLerForm(_finById(_finAbertoId)||{});   // inclui negociação no resumo ao vivo
  const liq=finMensalLiquida(f); const total=finTotalCurso(f); const parc=finParcelas(f);
  el.innerHTML=`<b>Mensalidade líquida:</b> ${_moeda(liq)}${(_matN(f.descontoPct)>0||_matN(f.descontoValor)>0)?` <span class="hint">(de ${_moeda(_matN(f.valorMensalidade))}${_matN(f.descontoPct)>0?', −'+_matN(f.descontoPct)+'%':''}${_matN(f.descontoValor)>0?', −'+_moeda(_matN(f.descontoValor)):''})</span>`:''} · <b>Matrícula:</b> ${_moeda(f.valorMatricula)}
    <br><b>Total do curso</b> (matrícula + ${f.parcelas||0}× mensalidade): <b>${_moeda(total)}</b>
    ${parc.length?`<br><span class="hint">${parc.length} parcela(s), venc. dia ${f.diaVencimento}, começando ${brDate(parc[0].venc)}</span>`:''}`;
}
function salvarFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const ex=_finById(id); if(!ex) return;
  const novo=(_finDraft && _finDraft.id===id);
  Object.assign(ex, _finLerForm(ex)); ex.atualizadoEm=Date.now();
  if(novo){ S.financeiro=S.financeiro||[]; S.financeiro.push(ex); _finDraft=null; }
  save(); fechar(); if(rota==='financeiro') VIEWS.financeiro(); else if(rota==='matriculas') VIEWS.matriculas(); toast('Financeiro salvo ✓');
}
function excluirFinanceiro(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if(_finDraft && _finDraft.id===id){ _finDraft=null; fechar(); return; }   // rascunho não salvo: só descarta
  const _f=(S.financeiro||[]).find(x=>x.id===id);
  if(_f && (finRecebido(_f)>0 || finExtrasRecebido(_f)>0)) return toast('Este plano tem pagamentos recebidos — use o status da matrícula (ex.: cancelada) em vez de excluir');
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
    const atualizado=(st==='atrasada')?finValorAtualizado(p):null;
    return `<div class="check" style="display:block"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <b style="min-width:66px">${p.n}/${parc.length}</b>
      <span style="flex:1">venc. ${brDate(p.venc)} · ${_moeda(p.valor)}${atualizado&&atualizado.total>p.valor?` <b style="color:var(--vermelho)">→ ${_moeda(atualizado.total)}</b> <span class="hint">(multa+juros)</span>`:''}${pg&&pg.em?` <span class="hint">(pago ${brDate(pg.em)}${pg.forma?(' · '+escAttr(pg.forma)):''})</span>`:''}</span>
      <span class="pill" style="background:${cs.bg};color:${cs.c}">${cs.t}</span>
      ${!pg?`<button class="btn ghost sm" title="Boleto (simulação)" onclick="gerarBoletoSim('${id}',${p.n})">🧾</button>
      <button class="btn ghost sm" title="Cartão de crédito" onclick="pagarCartaoStub('${id}',${p.n})">💳</button>`:`<button class="btn ghost sm" title="Imprimir recibo" onclick="reciboParcela('${id}',${p.n})">🖨️ recibo</button>`}
      <button class="btn ghost sm" onclick="finToggleParcela('${id}',${p.n})">${pg?'desfazer':'✓ receber'}</button>
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
  else { const p=finParcelas(f).find(x=>x.n===n);
    const at=(p&&finParcelaStatus(f,p)==='atrasada')?finValorAtualizado(p):null;   // recebe COM multa/juros quando atrasada
    f.pagos[n]={em:hoje(), valor:at?at.total:(p?p.valor:0), forma:f.formaPagamento||''}; }
  f.atualizadoEm=Date.now(); save(); abrirCarne(id);
}

/* -------------------- PDF -------------------- */
function verFinanceiro(id){
  const f=_finById(id); if(!f) return;
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
${finExtras(f).length?`<h2>Cobranças extras</h2><table>${finExtras(f).map(e=>`<tr><td>${esc(e.nome)} (${brDate(e.em)})</td><td class="c">${_moeda(e.valor)}</td><td class="c">${e.pago?('pago '+brDate(e.pago.em)):'em aberto'}</td></tr>`).join('')}</table>`:''}
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
  const rows=[_csvLinha(['Aluno','Turma','Status matrícula','Matrícula (R$)','Mensalidade (R$)','Desconto (%)','Desconto (R$)','Negociada (R$)','Mensalidade líquida (R$)','Parcelas','Dia venc.','Total curso (R$)','Recebido (R$)','A receber (R$)','Em atraso (R$)','Extras recebidos (R$)','Extras em aberto (R$)','Início'])];
  lista.forEach(f=>{ rows.push(_csvLinha([finNome(f), finTurma(f), (MAT_STATUS[finStatusMat(f)]||{}).lbl||finStatusMat(f), _m(f.valorMatricula), _m(f.valorMensalidade), _matN(f.descontoPct), _m(f.descontoValor), f.negociacao?_m(f.negociacao.mensalidade):'', _m(finMensalLiquida(f)), f.parcelas||0, f.diaVencimento||'', _m(finTotalCurso(f)), _m(finRecebido(f)), _m(finAberto(f)), _m(finAtrasadoV(f)), _m(finExtrasRecebido(f)), _m(finExtrasAberto(f)), brDate(finInicio(f))])); });
  _dlArquivo('financeiro-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha financeira baixada ('+lista.length+')');
}

/* =====================================================================
   CONFIG FINANCEIRA (direção): tabela de preços + multa/juros por atraso
   Guardada em S.configFin=[{id:'fin', ...}] (sincroniza via MERGE_COLS).
   ===================================================================== */
function _cfgFin(){ return ((S.configFin||[]).find(c=>c.id==='fin'))||{}; }
const SEGMENTOS_FIN=[['kids','Kids'],['junior','Junior'],['teens','Teens'],['adults','Adults']];
function _slugSeg(nome){ return (nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24); }
function segmentosFin(){ const c=_cfgFin(); const ex=(c.segExtra||[]).map(s=>[s.key, s.nome]); return SEGMENTOS_FIN.concat(ex); }   // base + cadastrados pela direção
function segmentoLabel(k){ const p=segmentosFin().find(x=>x[0]===k); return p?p[1]:(k||''); }
function cefrTodos(){ const c=_cfgFin(); return CEFR_ORDEM.concat((c.cefrExtra||[]).filter(x=>CEFR_ORDEM.indexOf(x)<0)); }
function colecoesTodas(){ const c=_cfgFin(); const base=(typeof TG_COLECOES_TODAS!=='undefined')?TG_COLECOES_TODAS:[]; return base.concat((c.materiais||[]).filter(x=>base.indexOf(x)<0)); }
// preços do segmento, com fallback para os campos antigos (tabela única) se o segmento não estiver preenchido
function precosSegmento(seg){
  const c=_cfgFin(); const s=(c.seg||{})[seg]||{};
  return {
    taxa:    _matN(s.taxa)    || _matN(c.taxaMatricula),
    anual:   _matN(s.anual)   || _matN(c.valorAnualCurso),
    material:_matN(s.material)|| _matN(c.valorMaterial),
  };
}
function _segDaMatricula(m){ if(!m||!m.turmaId) return ''; const t=(S.turmas||[]).find(x=>x.id===m.turmaId); return (t&&t.nivel)||''; }
function _cfgFinSet(campos){
  S.configFin=S.configFin||[];
  let c=S.configFin.find(x=>x.id==='fin');
  if(!c){ c={id:'fin'}; S.configFin.push(c); }
  Object.assign(c,campos); c.atualizadoEm=Date.now(); save();
}
VIEWS.configfin=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>Configuração financeira é exclusiva da direção.</div>'; return; }
  const c=_cfgFin();
  const div=(c.diversos||[]);
  const linhasDiv=div.map((d,i)=>`<div class="check"><span style="flex:1">${esc(d.nome||'—')} · <b>${_moeda(d.valor)}</b></span><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delCobrancaDiversa(${i})">remover</button></div>`).join('');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#b88600"></span><h2 class="display">⚙️ Config. financeira</h2></div>
    <p class="sub">Espaço exclusivo da direção: tabela de preços dos produtos e regras de multa/juros por atraso. Tudo aqui alimenta orçamentos, contratos e o carnê.</p>
    <div class="card"><h3>📋 Tabela de preços por segmento</h3>
      <p class="hint" style="margin:0 0 8px">Cada segmento tem seus valores. Orçamento, contrato e o botão "📋 Usar tabela" do Financeiro puxam pelo segmento da turma do aluno.</p>
      <div style="overflow-x:auto"><table style="min-width:520px">
        <thead><tr><th>Segmento</th><th>Taxa de matrícula (R$)</th><th>Valor anual do curso (R$)</th><th>Material (R$)</th></tr></thead>
        <tbody>
        ${segmentosFin().map(([k,lbl])=>{ const sg=(c.seg||{})[k]||{}; return `<tr>
          <td style="font-weight:700">${esc(lbl)}${SEGMENTOS_FIN.some(x=>x[0]===k)?'':` <button class="btn ghost sm" style="color:var(--vermelho)" title="Remover segmento" onclick="delSegmento('${k}')">×</button>`}</td>
          <td><input type="number" id="cf_${k}_taxa" value="${sg.taxa!=null?sg.taxa:''}" min="0" step="0.01" placeholder="${_matN(c.taxaMatricula)||'0,00'}" style="min-width:110px"></td>
          <td><input type="number" id="cf_${k}_anual" value="${sg.anual!=null?sg.anual:''}" min="0" step="0.01" placeholder="${_matN(c.valorAnualCurso)||'0,00'}" style="min-width:110px"></td>
          <td><input type="number" id="cf_${k}_material" value="${sg.material!=null?sg.material:''}" min="0" step="0.01" placeholder="${_matN(c.valorMaterial)||'0,00'}" style="min-width:100px"></td>
        </tr>`; }).join('')}
        </tbody></table></div>
      <div class="row" style="margin-top:10px;flex-wrap:wrap"><div class="field" style="max-width:220px"><label class="lbl">Hora-aula VIP (renovação, R$)</label><input type="number" id="cf_horaVip" value="${c.valorHoraVip!=null?c.valorHoraVip:''}" min="0" step="0.01" placeholder="0,00" title="Valor da hora para renovação de pacote"></div>
        <div class="field" style="max-width:220px"><label class="lbl">Hora-aula VIP (aluno novo, R$)</label><input type="number" id="cf_horaVipNovo" value="${c.valorHoraVipNovo!=null?c.valorHoraVipNovo:''}" min="0" step="0.01" placeholder="0,00" title="Valor da hora no primeiro pacote de um aluno novo"></div>
        <div class="field" style="max-width:220px"><label class="lbl">👥 Hora-aula VIP em dupla (R$)</label><input type="number" id="cf_horaVipDupla" value="${c.valorHoraVipDupla!=null?c.valorHoraVipDupla:''}" min="0" step="0.01" placeholder="0,00" title="Valor por aluno quando a aula é em dupla"></div></div>
      <p class="hint" style="margin:4px 0 0">Dupla: valor <b>por aluno</b>. Marque "👥 aula em dupla" na ficha do VIP para o app usar este valor.</p>
      <p class="hint" style="margin:4px 0 10px">Mensalidade sugerida = valor anual do segmento ÷ nº de parcelas. Campo vazio usa o valor geral antigo (se houver).</p>
      <div class="field" style="margin:0 0 10px"><label class="lbl">Política de descontos (sai no orçamento)</label><input type="text" id="cf_descontos" value="${escAttr(c.descontosTxt||'')}" placeholder="Ex: família 5% + à vista 5%, acumuláveis"></div>
      <div style="border-top:1px solid var(--linha);padding-top:10px"><b style="font-size:.92rem">Cobranças diversas</b>
        ${linhasDiv||'<p class="hint" style="margin:6px 0 0">Nenhuma. Ex.: taxa de prova, 2ª via de material, evento…</p>'}
        <div class="row" style="margin-top:8px;align-items:flex-end"><div class="field" style="flex:2;margin:0"><label class="lbl">Nome</label><input type="text" id="cf_divNome" placeholder="Ex: Taxa de prova Cambridge"></div>
          <div class="field" style="margin:0"><label class="lbl">Valor (R$)</label><input type="number" id="cf_divValor" min="0" step="0.01" placeholder="0,00"></div>
          <button class="btn ghost sm" style="margin-bottom:2px" onclick="addCobrancaDiversa()">+ Adicionar</button></div>
      </div>
      <button class="btn" style="margin-top:14px" onclick="salvarTabelaPrecos()">💾 Salvar tabela</button>
    </div>
    <div class="card"><h3>🧩 Produtos — segmentos, níveis e materiais</h3>
      <p class="hint" style="margin:0 0 8px">Cadastre aqui produtos novos: eles passam a aparecer na tabela de preços, no cadastro de turmas e nos pedidos de livros.</p>
      <div style="border-top:1px solid var(--linha);padding-top:8px"><b style="font-size:.92rem">Segmentos</b>
        <p class="hint" style="margin:2px 0 6px">Padrão: ${SEGMENTOS_FIN.map(s=>s[1]).join(', ')}.${(c.segExtra||[]).length?' Cadastrados: '+(c.segExtra||[]).map(s=>esc(s.nome)).join(', ')+'.':''}</p>
        <div class="row" style="align-items:flex-end"><div class="field" style="flex:2;margin:0"><label class="lbl">Novo segmento</label><input type="text" id="cf_novoSeg" placeholder="Ex: Conversation Club, In-Company"></div>
          <button class="btn ghost sm" style="margin-bottom:2px" onclick="addSegmento()">+ Adicionar</button></div>
      </div>
      <div style="border-top:1px solid var(--linha);padding-top:8px;margin-top:10px"><b style="font-size:.92rem">Níveis (CEFR)</b>
        <p class="hint" style="margin:2px 0 6px">Padrão: ${CEFR_ORDEM.join(', ')}.${(c.cefrExtra||[]).length?' Cadastrados: '+(c.cefrExtra||[]).map(x=>`${esc(x)} <button class="btn ghost sm" style="color:var(--vermelho)" onclick="delNivelExtra('${escAttr(escJs(x))}')">×</button>`).join(' '):''}</p>
        <div class="row" style="align-items:flex-end"><div class="field" style="flex:2;margin:0"><label class="lbl">Novo nível</label><input type="text" id="cf_novoCefr" placeholder="Ex: PRE-A1, PROF"></div>
          <button class="btn ghost sm" style="margin-bottom:2px" onclick="addNivelExtra()">+ Adicionar</button></div>
      </div>
      <div style="border-top:1px solid var(--linha);padding-top:8px;margin-top:10px"><b style="font-size:.92rem">Materiais / coleções</b>
        <p class="hint" style="margin:2px 0 6px">${(c.materiais||[]).length?('Cadastrados: '+(c.materiais||[]).map(x=>`${esc(x)} <button class="btn ghost sm" style="color:var(--vermelho)" onclick="delMaterialExtra('${escAttr(escJs(x))}')">×</button>`).join(' ')):'Nenhum além da lista padrão das coleções.'}</p>
        <div class="row" style="align-items:flex-end"><div class="field" style="flex:2;margin:0"><label class="lbl">Novo material</label><input type="text" id="cf_novoMat" placeholder="Ex: Evolve 1, apostila própria"></div>
          <button class="btn ghost sm" style="margin-bottom:2px" onclick="addMaterialExtra()">+ Adicionar</button></div>
      </div>
    </div>
    <div class="card"><h3>⏰ Multa e juros por atraso</h3>
      <div class="row">
        <div class="field"><label class="lbl">Multa (% sobre a parcela)</label><input type="number" id="cf_multa" value="${c.multaPct!=null?c.multaPct:2}" min="0" max="20" step="0.5"></div>
        <div class="field"><label class="lbl">Juros (% ao mês)</label><input type="number" id="cf_juros" value="${c.jurosMesPct!=null?c.jurosMesPct:1}" min="0" max="20" step="0.1"></div>
      </div>
      <p class="hint" style="margin:0 0 10px">Aplicados sobre parcelas em atraso no carnê: multa fixa + juros proporcionais aos dias (base 30 dias). Padrão do mercado: 2% + 1% a.m.</p>
      <button class="btn" onclick="salvarMultaJuros()">💾 Salvar multa/juros</button>
    </div>`;
};
function salvarTabelaPrecos(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const g=id=>{ const e=document.getElementById(id); if(!e) return null; const v=(e.value||'').trim(); return v===''?null:_matN(v); };
  const seg={};
  segmentosFin().forEach(([k])=>{ const o={}; const t=g('cf_'+k+'_taxa'), a=g('cf_'+k+'_anual'), m=g('cf_'+k+'_material');
    if(t!=null)o.taxa=t; if(a!=null)o.anual=a; if(m!=null)o.material=m; if(Object.keys(o).length)seg[k]=o; });
  const dtx=(document.getElementById('cf_descontos')||{value:''}).value.trim();
  _cfgFinSet({ seg, valorHoraVip:g('cf_horaVip')||0, valorHoraVipNovo:g('cf_horaVipNovo')||0, valorHoraVipDupla:g('cf_horaVipDupla')||0, descontosTxt:dtx });
  toast('Tabela de preços salva ✓ (por segmento)');
}
function salvarMultaJuros(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const g=id=>_matN((document.getElementById(id)||{}).value);
  _cfgFinSet({ multaPct:g('cf_multa'), jurosMesPct:g('cf_juros') });
  toast('Multa e juros salvos ✓');
}
function addCobrancaDiversa(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const nome=((document.getElementById('cf_divNome')||{}).value||'').trim();
  const valor=_matN((document.getElementById('cf_divValor')||{}).value);
  if(!nome) return toast('Dê um nome à cobrança');
  const c=_cfgFin(); const div=(c.diversos||[]).slice(); div.push({nome,valor});
  _cfgFinSet({diversos:div}); VIEWS.configfin(); toast('Cobrança adicionada');
}
function delCobrancaDiversa(i){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const c=_cfgFin(); const div=(c.diversos||[]).slice(); div.splice(i,1);
  _cfgFinSet({diversos:div}); VIEWS.configfin(); toast('Cobrança removida');
}
function addSegmento(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const nome=((document.getElementById('cf_novoSeg')||{}).value||'').trim(); if(!nome) return toast('Dê um nome ao segmento');
  const key=_slugSeg(nome); if(!key) return toast('Nome inválido');
  if(segmentosFin().some(([k])=>k===key)) return toast('Já existe um segmento com esse nome');
  const c=_cfgFin(); const ex=(c.segExtra||[]).slice(); ex.push({key,nome});
  _cfgFinSet({segExtra:ex}); VIEWS.configfin(); toast('Segmento "'+nome+'" criado — preencha os preços dele na tabela');
}
function delSegmento(key){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if((S.turmas||[]).some(t=>t.nivel===key && !t.arquivada)) return toast('Há turmas ativas usando este segmento — mude o segmento delas antes');
  if(!confirm('Remover este segmento da lista? (os preços dele também saem da tabela)')) return;
  const c=_cfgFin(); const seg=Object.assign({},c.seg||{}); delete seg[key];
  _cfgFinSet({segExtra:(c.segExtra||[]).filter(s=>s.key!==key), seg}); VIEWS.configfin(); toast('Segmento removido');
}
function addNivelExtra(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const v=((document.getElementById('cf_novoCefr')||{}).value||'').trim().toUpperCase(); if(!v) return toast('Informe o nível');
  if(cefrTodos().indexOf(v)>=0) return toast('Esse nível já existe');
  const c=_cfgFin(); _cfgFinSet({cefrExtra:(c.cefrExtra||[]).concat([v])}); VIEWS.configfin(); toast('Nível '+v+' criado');
}
function delNivelExtra(v){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if((S.turmas||[]).some(t=>t.cefr===v && !t.arquivada)) return toast('Há turmas ativas usando este nível');
  const c=_cfgFin(); _cfgFinSet({cefrExtra:(c.cefrExtra||[]).filter(x=>x!==v)}); VIEWS.configfin(); toast('Nível removido');
}
function addMaterialExtra(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const v=((document.getElementById('cf_novoMat')||{}).value||'').trim(); if(!v) return toast('Informe o material');
  if(colecoesTodas().indexOf(v)>=0) return toast('Esse material já existe');
  const c=_cfgFin(); _cfgFinSet({materiais:(c.materiais||[]).concat([v])}); VIEWS.configfin(); toast('Material "'+v+'" criado');
}
function delMaterialExtra(v){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const c=_cfgFin(); _cfgFinSet({materiais:(c.materiais||[]).filter(x=>x!==v)}); VIEWS.configfin(); toast('Material removido');
}
// preenche o plano com a tabela: taxa + mensalidade = anual/parcelas
function aplicarTabelaPrecos(id){
  const f=_finById(id);
  const seg=_segDaMatricula(finMatricula(f));
  const p=precosSegmento(seg);
  if(!p.taxa && !p.anual) return toast(seg?('Cadastre os valores do segmento '+seg.toUpperCase()+' em ⚙️ Config. financeira'):'Vincule a matrícula a uma turma (para saber o segmento) ou cadastre a tabela');
  const par=parseInt((document.getElementById('fin_parcelas')||{}).value)||12;
  const eT=document.getElementById('fin_valorMatricula'); if(eT) eT.value=p.taxa||'';
  const eM=document.getElementById('fin_valorMensalidade'); if(eM) eM.value=par>0?Math.round(p.anual/par*100)/100:'';
  _finResumo(); toast('Tabela '+(seg?seg.toUpperCase():'geral')+' aplicada ('+par+'x)');
}

/* ---------- avisos de mensalidade vencida (central de Avisos) ---------- */
// Lista planos em atraso ainda não contatados desde a ÚLTIMA parcela que venceu.
// "✓ Contatei" registra contato tipo 'financeiro'; se OUTRA parcela vencer depois, volta a avisar.
function avisosFinanceiro(){
  if(S.perfil!=='direcao' && S.perfil!=='secretaria') return [];
  const out=[];
  (S.financeiro||[]).forEach(f=>{
    const st=finStatusMat(f); if(st!=='ativa' && st!=='concluida') return;
    const atras=finAtrasadoV(f); if(!(atras>0)) return;
    const m=finMatricula(f); const alunoId=(m&&m.alunoId)||('fin:'+f.id);
    const vencidas=finParcelas(f).filter(p=>finParcelaStatus(f,p)==='atrasada');
    if(!vencidas.length) return;
    const ultVenc=vencidas[vencidas.length-1].venc;
    const ult=(typeof _ultimoContato==='function')?_ultimoContato(alunoId,'financeiro'):'';
    if(ult && ult>=ultVenc) return;
    out.push({finId:f.id, alunoId, nome:finNome(f), turma:finTurma(f), valor:atras, n:vencidas.length, desde:vencidas[0].venc});
  });
  return out.sort((a,b)=>b.valor-a.valor);
}
/* ---------- multa/juros sobre parcela atrasada ---------- */
function finValorAtualizado(p){
  const c=_cfgFin();
  const multaPct=(c.multaPct!=null)?_matN(c.multaPct):2;
  const jurosMes=(c.jurosMesPct!=null)?_matN(c.jurosMesPct):1;
  const dias=Math.max(0,Math.round((new Date(hoje()+'T12:00:00')-new Date(p.venc+'T12:00:00'))/864e5));
  if(dias<=0) return {total:p.valor,dias:0,multa:0,juros:0};
  const multa=p.valor*multaPct/100;
  const juros=p.valor*(jurosMes/100)*(dias/30);
  return { total: Math.round((p.valor+multa+juros)*100)/100, dias, multa, juros };
}

/* ---------- recibo de pagamento (parcela ou extra) ---------- */
function _reciboHTML(f, o){   // o: {ref, valor, em, forma}
  const m=finMatricula(f); const t=finTurma(f);
  const pagador=(m&&m.respNome)||finNome(f);
  const num=(f.id||'').slice(-6).toUpperCase()+'-'+String(o.numRef||'').padStart(2,'0');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Recibo — ${esc(finNome(f))}</title><style>
@page{margin:16mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px;font-size:13.5px;line-height:1.6}
.top{display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:6px;margin-bottom:16px}
h1{font-family:'Zilla Slab',Georgia,serif;color:#005EAF;font-size:20px;margin:0}.per{margin-left:auto;color:#5a6b86;font-size:12px}
.valor{font-size:22px;font-weight:800;color:#0A7A3D;background:#eafaf0;display:inline-block;padding:6px 16px;border-radius:10px;margin:8px 0}
.ass{margin-top:44px;display:flex;gap:30px}.ass div{flex:1;border-top:1px solid #15233b;padding-top:4px;text-align:center;font-size:11px}
.foot{margin-top:18px;color:#8a97a8;font-size:10.5px;border-top:1px solid #DCE4EC;padding-top:6px}
</style></head><body>
<div class="top"><h1>Togethere</h1><div style="font-weight:700">Recibo de pagamento</div><div class="per">Nº ${esc(num)} · ${brDate(o.em||hoje())}</div></div>
<p>Recebemos de <b>${esc(pagador)}</b>${(m&&m.respNome&&m.respNome!==finNome(f))?(', responsável por <b>'+esc(finNome(f))+'</b>,'):''} a importância de</p>
<div class="valor">${_moeda(o.valor)}</div>
<p>referente a <b>${esc(o.ref)}</b>${t?(' — turma <b>'+esc(t)+'</b>'):''}${o.forma?(', paga via <b>'+esc(o.forma)+'</b>'):''}.</p>
<div class="ass"><div>Togethere Escola de Idiomas<br>Gravataí/RS</div><div>${esc(pagador)}</div></div>
<p class="foot">Recibo emitido pelo app Togethere em ${brDate(hoje())} por ${esc(S.usuario||'')} — documento simples de quitação, sem valor fiscal.</p>
</body></html>`;
}
function reciboParcela(id,n){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const pg=(f.pagos||{})[n]; if(!pg) return toast('Esta parcela ainda não foi recebida');
  const p=finParcelas(f).find(x=>x.n===+n);
  const mesRef=p?_nomeMes(p.venc.slice(0,7)):'';
  imprimirDoc(_reciboHTML(f,{ref:'parcela '+n+'/'+(f.parcelas||'')+(mesRef?(' (mensalidade de '+mesRef+')'):''), valor:(pg.valor!=null?pg.valor:(p?p.valor:0)), em:pg.em, forma:pg.forma, numRef:n}));
}
function reciboExtra(id,extraId){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const e=(f.extras||[]).find(x=>x.id===extraId); if(!e||!e.pago) return toast('Esta cobrança ainda não foi recebida');
  imprimirDoc(_reciboHTML(f,{ref:e.nome, valor:e.valor, em:e.pago.em, forma:e.pago.forma, numRef:'EX'}));
}
/* ---------- boleto (SIMULAÇÃO) e cartão (stub) ---------- */
function gerarBoletoSim(id,n){
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const p=finParcelas(f).find(x=>x.n===n); if(!p) return;
  const at=finParcelaStatus(f,p)==='atrasada'?finValorAtualizado(p):null;
  const valor=at?at.total:p.valor;
  const linhaDigitavel='00000.00000 00000.000000 00000.000000 0 '+String(p.venc.replace(/-/g,''))+String(Math.round(valor*100)).padStart(10,'0');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Boleto (simulação)</title><style>
@page{margin:12mm}body{font-family:'Urbanist',system-ui,Arial,sans-serif;color:#15233b;padding:6px;font-size:12.5px}
.sim{background:#fdeaea;color:#E52524;font-weight:800;text-align:center;padding:8px;border:2px dashed #E52524;border-radius:8px;margin-bottom:12px;font-size:14px}
.bol{border:1px solid #15233b;border-radius:6px;padding:14px}
.bol .l{display:flex;justify-content:space-between;border-bottom:1px dashed #ccc;padding:7px 0}
.dig{font-family:monospace;font-size:13px;letter-spacing:.5px;margin:10px 0;text-align:center;background:#f4f6fb;padding:8px;border-radius:6px}
.barra{height:52px;background:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 5px,#000 5px 6px,#fff 6px 10px);margin-top:10px;border-radius:2px}
.foot{margin-top:10px;color:#8a97a8;font-size:10px}</style></head><body>
<div class="sim">⚠️ SIMULAÇÃO — SEM REGISTRO BANCÁRIO · NÃO PAGÁVEL</div>
<div class="bol">
  <div class="l"><span><b>Beneficiário:</b> Togethere Escola de Idiomas</span><span><b>Vencimento:</b> ${brDate(p.venc)}</span></div>
  <div class="l"><span><b>Pagador:</b> ${esc(finNome(f))}</span><span><b>Parcela:</b> ${p.n}/${f.parcelas}</span></div>
  <div class="l"><span><b>Valor do documento:</b> ${_moeda(p.valor)}</span><span>${at&&at.total>p.valor?('<b>Valor c/ multa e juros:</b> '+_moeda(at.total)+' ('+at.dias+'d)'):''}</span></div>
  <div class="dig">${linhaDigitavel}</div>
  <div class="barra"></div>
</div>
<p class="foot">Documento de teste do módulo financeiro. A geração de boletos reais depende da integração bancária (API), a ser contratada.</p>
</body></html>`;
  imprimirDoc(html);
}
function pagarCartaoStub(id,n){
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const p=finParcelas(f).find(x=>x.n===n); if(!p) return;
  modal(`<h3>💳 Cartão de crédito <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">A cobrança automática por cartão depende de integração com uma operadora (API) — <b>ainda não contratada</b>. Por enquanto, se a família pagou no cartão pela maquininha/link externo, registre aqui:</p>
    <div class="card box-suave"><b>${esc(finNome(f))}</b> · parcela ${p.n}/${f.parcelas} · ${_moeda(p.valor)} · venc. ${brDate(p.venc)}</div>
    <button class="btn block" onclick="registrarPagoCartao('${id}',${n})">✓ Registrar como pago no cartão</button>
    <button class="btn ghost block" style="margin-top:8px" onclick="fechar()">Cancelar</button>`);
}
function registrarPagoCartao(id,n){
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const p=finParcelas(f).find(x=>x.n===n);
  f.pagos=f.pagos||{};
  { const at=(p&&finParcelaStatus(f,p)==='atrasada')?finValorAtualizado(p):null;
    f.pagos[n]={em:hoje(), valor:at?at.total:(p?p.valor:0), forma:'Cartão de crédito'}; }
  f.atualizadoEm=Date.now(); save(); abrirCarne(id); toast('Parcela registrada como paga no cartão ✓');
}

/* ---------- negociação de valores (exige senha da direção) ---------- */
function abrirNegociacao(id){
  if(S.perfil!=='direcao') return toast('Só a direção negocia valores');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  modal(`<h3>🤝 Negociação de valores <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">Define uma <b>mensalidade negociada</b> que passa por cima da tabela e dos descontos. Exige a senha de um(a) diretor(a) e fica registrado quem negociou.</p>
    <div class="card box-suave" style="margin-bottom:10px"><b>${esc(finNome(f))}</b> · mensalidade atual: <b>${_moeda(finMensalLiquida(f))}</b></div>
    <div class="row"><div class="field"><label class="lbl">Mensalidade negociada (R$)</label><input type="number" id="ng_valor" min="0" step="0.01" value="${f.negociacao?f.negociacao.mensalidade:''}" placeholder="0,00"></div></div>
    <div class="field"><label class="lbl">Justificativa</label><input type="text" id="ng_obs" value="${escAttr((f.negociacao&&f.negociacao.obs)||'')}" placeholder="Ex: 2 irmãos na escola; acordo anual à vista"></div>
    <div class="field"><label class="lbl">Senha da direção</label><input type="password" id="ng_senha" placeholder="sua senha"></div>
    <button class="btn block" onclick="salvarNegociacao('${id}')">Confirmar negociação</button>`);
  setTimeout(()=>{const i=document.getElementById('ng_valor'); if(i)i.focus();},60);
}
async function salvarNegociacao(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  const valor=_matN((document.getElementById('ng_valor')||{}).value);
  const obs=((document.getElementById('ng_obs')||{}).value||'').trim();
  const senha=((document.getElementById('ng_senha')||{}).value||'');
  if(!valor) return toast('Informe o valor negociado');
  if(!senha) return toast('Digite a senha da direção');
  const b=document.querySelector('#modal .btn.block'); if(b){ b.disabled=true; b.textContent='Verificando senha…'; }
  let ok=false;
  try{ ok=await verificarSenha(S.usuario, senha); }catch(e){ ok=false; }
  if(!ok){ if(b){ b.disabled=false; b.textContent='Confirmar negociação'; } return toast('Senha incorreta'); }
  f.negociacao={ mensalidade:valor, obs, por:S.usuario, em:hoje() };
  f.atualizadoEm=Date.now(); save(); fechar();
  if(rota==='financeiro') VIEWS.financeiro();
  toast('Negociação registrada — mensalidade '+_moeda(valor));
}
function removerNegociacao(id){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  const f=(S.financeiro||[]).find(x=>x.id===id); if(!f) return;
  if(!confirm('Remover o valor negociado? Volta a valer tabela + descontos.')) return;
  delete f.negociacao; f.atualizadoEm=Date.now(); save(); fechar(); abrirFinanceiro(id); toast('Negociação removida');
}
