/* =====================================================================
   📚 ESTOQUE DE LIVROS + ENTREGAS (b141) — direção e secretaria
   Livro-razão de movimentos em S.estoqueMov (append-only; sincroniza):
   {id, titulo, tipo:'entrada'|'ajuste'|'entrega', qtd(+/-), alunoId?, vip?,
    por, em, obs, atualizadoEm}. Saldo por título = soma dos movimentos.
   Entrega = movimento -1 ligado ao aluno (turma ou VIP). Pendências por
   turma comparam alunos x coleção da turma. Ações da secretaria são
   controláveis em 🔐 Permissões (sec_estoque).
   ===================================================================== */
function _estPode(){ return S.perfil==='direcao' || (S.perfil==='secretaria' && perm('sec_estoque')); }
function _movs(){ return S.estoqueMov||[]; }
function titulosEstoque(){
  const base=(typeof TG_COLECOES_TODAS!=='undefined')?TG_COLECOES_TODAS.slice():[];
  _movs().forEach(m=>{ if(m.titulo && base.indexOf(m.titulo)<0) base.push(m.titulo); });
  return base;
}
function saldoLivro(t){ return _movs().filter(m=>m.titulo===t).reduce((s,m)=>s+(+m.qtd||0),0); }
function entregasDoAluno(id){ return _movs().filter(m=>m.tipo==='entrega' && m.alunoId===id); }
function alunoRecebeu(id,titulo){ return _movs().some(m=>m.tipo==='entrega' && m.alunoId===id && m.titulo===titulo); }
function _estPush(mov){
  S.estoqueMov=S.estoqueMov||[];
  S.estoqueMov.push(Object.assign({id:uid(), por:S.usuario, em:hoje(), atualizadoEm:Date.now()}, mov));
  save();
}

/* -------------------- VIEW -------------------- */
VIEWS.estoque=()=>{
  const v=document.getElementById('view');
  if(ehProfessor()){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>O estoque é gerenciado pela secretaria e direção.</div>'; return; }
  const tits=titulosEstoque();
  const total=tits.reduce((s,t)=>s+Math.max(0,saldoLivro(t)),0);
  const zerados=tits.filter(t=>saldoLivro(t)<=0 && _movs().some(m=>m.titulo===t)).length;
  const ym=hoje().slice(0,7);
  const entregasMes=_movs().filter(m=>m.tipo==='entrega' && (m.em||'').slice(0,7)===ym).length;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  const podeAgir=_estPode();
  const linhas=tits.map(t=>{
    const s=saldoLivro(t); const temMov=_movs().some(m=>m.titulo===t);
    const cor=s<=0?(temMov?'var(--vermelho)':'var(--tinta-suave)'):(s<3?'#c2560b':'var(--ok)');
    return `<div class="check"><span style="flex:1">${esc(t)}</span>
      <b style="min-width:44px;text-align:right;color:${cor}">${s}</b>
      ${podeAgir?`<button class="btn ghost sm" onclick="abrirEntradaEstoque('${escAttr(t)}')">+ entrada</button>
      <button class="btn ghost sm" onclick="abrirAjusteEstoque('${escAttr(t)}')">ajuste</button>`:''}
    </div>`;
  }).join('');
  const ultimas=_movs().filter(m=>m.tipo==='entrega').sort((a,b)=>(b.em||'').localeCompare(a.em||'')||((b.atualizadoEm||0)-(a.atualizadoEm||0))).slice(0,12);
  const nomeEnt=m=>{ if(m.vip){ const x=(S.vipAlunos||[]).find(z=>z.id===m.alunoId); return x?x.nome+' 👑':'—'; } const a=(S.alunos||[]).find(z=>z.id===m.alunoId); return a?(a.nome+(a.turmaId?(' ('+turmaNome(a.turmaId)+')'):'')):'—'; };
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#9333c7"></span><h2 class="display">📚 Estoque de livros</h2></div>
    <p class="sub">Entradas, saldo por título e o controle de quem já recebeu o livro. Cada entrega baixa 1 do estoque.</p>
    <div class="card"><div class="fx-tiles">
      ${tile(total,'Livros em estoque','#005EAF')}
      ${tile(entregasMes,'Entregas neste mês','#0A7A3D')}
      ${tile(zerados,'Títulos zerados',zerados>0?'var(--vermelho)':'var(--tinta)')}
      ${tile(tits.length,'Títulos','var(--tinta)')}
    </div></div>
    ${podeAgir?`<div class="card" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="abrirEntregaLivro()">📦 Registrar entrega</button>
      <button class="btn ghost" onclick="abrirEntradaEstoque('')">+ Entrada no estoque</button>
      <button class="btn ghost sm" onclick="exportarEstoqueCSV()">⬇️ Planilha</button>
    </div>`:'<p class="hint">Somente leitura — a direção desativou suas ações de estoque.</p>'}
    ${_cardPendenciasLivro()}
    <div class="card"><h3>📦 Estoque por título</h3>${linhas||'<p class="hint">Nenhum título.</p>'}</div>
    <div class="card"><h3>🧾 Últimas entregas</h3>
      ${ultimas.length?ultimas.map(m=>`<div class="check"><span style="flex:1">${brDate(m.em)} · <b>${esc(nomeEnt(m))}</b> — ${esc(m.titulo)}${m.obs?(' · '+esc(m.obs)):''}<span class="hint"> · por ${esc(m.por||'')}</span></span>
        ${(S.perfil==='direcao'||m.por===S.usuario)&&podeAgir?`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="desfazerMovEstoque('${m.id}')">desfazer</button>`:''}</div>`).join(''):'<p class="hint">Nenhuma entrega registrada ainda.</p>'}
    </div>`;
};
// pendências: por turma ativa com coleção definida, quem ainda não recebeu
function _cardPendenciasLivro(){
  const ts=(S.turmas||[]).filter(t=>!t.arquivada && (typeof turmaStatus!=='function'||turmaStatus(t)!=='encerrada'));
  const blocos=[];
  ts.forEach(t=>{
    const col=(typeof planColecaoDe==='function')?planColecaoDe(t):null; if(!col) return;
    const als=alunosDa(t.id); if(!als.length) return;
    const falta=als.filter(a=>!alunoRecebeu(a.id,col));
    blocos.push({t,col,tot:als.length,falta});
  });
  if(!blocos.length) return '';
  const pend=blocos.filter(b=>b.falta.length);
  const podeAgir=_estPode();
  return `<div class="card" style="border-left:4px solid ${pend.length?'var(--laranja)':'var(--ok)'}">
    <h3 style="margin:0 0 4px">📋 Livros por turma</h3>
    <p class="hint" style="margin:0 0 6px">Compara os alunos de cada turma com a coleção definida no Planejamento.</p>
    ${blocos.map(b=>{ const ok=b.tot-b.falta.length;
      return `<div style="margin-top:8px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <b style="flex:1">${esc(b.t.nome)}</b><span class="pill">${esc(b.col)}</span>
        <span class="pill" style="background:${b.falta.length?'#fff1e6':'#eafaf0'};color:${b.falta.length?'#c2560b':'#0A7A3D'}">${ok}/${b.tot} entregues</span></div>
        ${b.falta.length?`<div style="margin-top:4px">${b.falta.map(a=>`<div class="check"><span style="flex:1">${esc(a.nome)}</span>${podeAgir?`<button class="btn ghost sm" onclick="entregarRapido('${a.id}','${escAttr(b.col)}')">✓ entregar</button>`:''}</div>`).join('')}</div>`:''}
      </div>`; }).join('')}
  </div>`;
}

/* -------------------- ações -------------------- */
function abrirEntradaEstoque(titulo){
  if(!_estPode()) return toast('Sem permissão no estoque');
  const opts=titulosEstoque().map(t=>`<option ${t===titulo?'selected':''}>${esc(t)}</option>`).join('');
  modal(`<h3>+ Entrada no estoque <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Título</label><select id="ee_titulo">${opts}<option value="__outro__">— Outro (digitar) —</option></select></div>
    <div class="field" id="ee_outroWrap" style="display:none"><label class="lbl">Novo título</label><input type="text" id="ee_outro" placeholder="Nome do livro/material"></div>
    <div class="row"><div class="field"><label class="lbl">Quantidade</label><input type="number" id="ee_qtd" value="10" min="1" step="1"></div></div>
    <div class="field"><label class="lbl">Observação (opcional)</label><input type="text" id="ee_obs" placeholder="Ex: pedido Cambridge jul/26"></div>
    <button class="btn block" onclick="salvarEntradaEstoque()">Registrar entrada</button>`);
  const sel=document.getElementById('ee_titulo'); if(sel) sel.onchange=()=>{ document.getElementById('ee_outroWrap').style.display=(sel.value==='__outro__')?'block':'none'; };
}
function salvarEntradaEstoque(){
  if(!_estPode()) return toast('Sem permissão');
  let titulo=(document.getElementById('ee_titulo')||{}).value||'';
  if(titulo==='__outro__') titulo=((document.getElementById('ee_outro')||{}).value||'').trim();
  const qtd=parseInt((document.getElementById('ee_qtd')||{}).value)||0;
  if(!titulo) return toast('Informe o título');
  if(qtd<1) return toast('Quantidade inválida');
  _estPush({tipo:'entrada', titulo, qtd, obs:((document.getElementById('ee_obs')||{}).value||'').trim()});
  fechar(); VIEWS.estoque(); toast(qtd+' × '+titulo+' no estoque ✓');
}
function abrirAjusteEstoque(titulo){
  if(!_estPode()) return toast('Sem permissão no estoque');
  modal(`<h3>Ajuste de estoque <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px"><b>${esc(titulo)}</b> · saldo atual: <b>${saldoLivro(titulo)}</b>. Use positivo para acrescentar e negativo para baixar (inventário, extravio, devolução…).</p>
    <div class="row"><div class="field"><label class="lbl">Ajuste (+/−)</label><input type="number" id="aj_qtd" value="-1" step="1"></div></div>
    <div class="field"><label class="lbl">Motivo</label><input type="text" id="aj_obs" placeholder="Ex: inventário; livro danificado"></div>
    <button class="btn block" onclick="salvarAjusteEstoque('${escAttr(titulo)}')">Registrar ajuste</button>`);
}
function salvarAjusteEstoque(titulo){
  if(!_estPode()) return toast('Sem permissão');
  const qtd=parseInt((document.getElementById('aj_qtd')||{}).value)||0;
  if(!qtd) return toast('Informe um valor diferente de zero');
  _estPush({tipo:'ajuste', titulo, qtd, obs:((document.getElementById('aj_obs')||{}).value||'').trim()});
  fechar(); VIEWS.estoque(); toast('Ajuste registrado ('+(qtd>0?'+':'')+qtd+')');
}
function abrirEntregaLivro(pre){
  if(!_estPode()) return toast('Sem permissão no estoque');
  pre=pre||{};
  const ts=(S.turmas||[]).filter(t=>!t.arquivada);
  let opts='<option value="">— escolha o aluno —</option>';
  ts.forEach(t=>{ const als=alunosDa(t.id); if(!als.length) return;
    opts+=`<optgroup label="${escAttr(t.nome)}">`+als.map(a=>`<option value="a:${a.id}" ${pre.alunoId===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')+'</optgroup>'; });
  const vips=(S.vipAlunos||[]).filter(x=>!x.arquivado);
  if(vips.length) opts+='<optgroup label="👑 Alunos VIP">'+vips.map(x=>`<option value="v:${x.id}">${esc(x.nome)}</option>`).join('')+'</optgroup>';
  const tOpts=titulosEstoque().map(t=>`<option ${pre.titulo===t?'selected':''}>${esc(t)}</option>`).join('');
  modal(`<h3>📦 Registrar entrega de livro <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Aluno</label><select id="el_aluno" onchange="_elSugereTitulo()">${opts}</select></div>
    <div class="field"><label class="lbl">Livro</label><select id="el_titulo">${tOpts}</select></div>
    <div class="field"><label class="lbl">Observação (opcional)</label><input type="text" id="el_obs" placeholder="Ex: pago junto da matrícula"></div>
    <button class="btn block" onclick="salvarEntregaLivro()">✓ Entregar (baixa 1 do estoque)</button>`);
}
function _elSugereTitulo(){
  const val=(document.getElementById('el_aluno')||{}).value||''; const sel=document.getElementById('el_titulo'); if(!sel||!val) return;
  let sug='';
  if(val.startsWith('a:')){ const a=(S.alunos||[]).find(x=>x.id===val.slice(2)); const t=a&&(S.turmas||[]).find(x=>x.id===a.turmaId); if(t&&typeof planColecaoDe==='function') sug=planColecaoDe(t)||''; }
  else if(val.startsWith('v:')){ const vv=(S.vipAlunos||[]).find(x=>x.id===val.slice(2)); sug=(vv&&vv.material)||''; }
  if(sug){ [...sel.options].forEach(o=>{ if(o.value===sug||o.textContent===sug) sel.value=o.value||o.textContent; }); }
}
function salvarEntregaLivro(){
  if(!_estPode()) return toast('Sem permissão');
  const val=(document.getElementById('el_aluno')||{}).value||''; if(!val) return toast('Escolha o aluno');
  const titulo=(document.getElementById('el_titulo')||{}).value||''; if(!titulo) return toast('Escolha o livro');
  const vip=val.startsWith('v:'); const alunoId=val.slice(2);
  if(alunoRecebeu(alunoId,titulo) && !confirm('Este aluno já tem uma entrega deste livro registrada. Registrar outra?')) return;
  const s=saldoLivro(titulo);
  if(s<=0 && !confirm('O estoque de "'+titulo+'" está em '+s+'. Registrar a entrega mesmo assim (saldo ficará negativo)?')) return;
  _estPush({tipo:'entrega', titulo, qtd:-1, alunoId, vip, obs:((document.getElementById('el_obs')||{}).value||'').trim()});
  fechar(); VIEWS.estoque(); toast('Entrega registrada ✓');
}
function entregarRapido(alunoId,titulo){
  if(!_estPode()) return toast('Sem permissão');
  const a=(S.alunos||[]).find(x=>x.id===alunoId);
  const s=saldoLivro(titulo);
  if(!confirm('Entregar "'+titulo+'" para '+(a?a.nome:'o aluno')+'?'+(s<=0?('\n\nAtenção: saldo atual é '+s+' (vai ficar negativo).'):''))) return;
  _estPush({tipo:'entrega', titulo, qtd:-1, alunoId, vip:false});
  VIEWS.estoque(); toast('Entrega registrada ✓');
}
function desfazerMovEstoque(id){
  const m=_movs().find(x=>x.id===id); if(!m) return;
  if(!(S.perfil==='direcao' || (m.por===S.usuario && _estPode()))) return toast('Sem permissão');
  if(!confirm('Desfazer este movimento? O saldo volta ao que era.')) return;
  S.estoqueMov=_movs().filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('estoqueMov',id);
  save(); VIEWS.estoque(); toast('Movimento desfeito');
}
function exportarEstoqueCSV(){
  const tits=titulosEstoque().filter(t=>_movs().some(m=>m.titulo===t)||saldoLivro(t)!==0);
  const rows=[_csvLinha(['Título','Saldo em estoque','Entradas','Entregas','Ajustes'])];
  titulosEstoque().forEach(t=>{ const ms=_movs().filter(m=>m.titulo===t); if(!ms.length) return;
    rows.push(_csvLinha([t, saldoLivro(t), ms.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.qtd,0), ms.filter(m=>m.tipo==='entrega').length, ms.filter(m=>m.tipo==='ajuste').reduce((s,m)=>s+m.qtd,0)])); });
  rows.push(_csvLinha([]));
  rows.push(_csvLinha(['Data','Aluno','Livro','Tipo','Qtd','Por','Obs']));
  _movs().slice().sort((a,b)=>(b.em||'').localeCompare(a.em||'')).forEach(m=>{
    const nome=m.alunoId?(((m.vip?(S.vipAlunos||[]):(S.alunos||[])).find(x=>x.id===m.alunoId)||{}).nome||''):'';
    rows.push(_csvLinha([brDate(m.em), nome, m.titulo, m.tipo, m.qtd, m.por||'', m.obs||''])); });
  _dlArquivo('estoque-livros-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha do estoque baixada');
}
