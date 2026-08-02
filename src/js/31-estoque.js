/* =====================================================================
   📚 LIVROS — compra, recepção e entrega (b143) · secretaria + direção
   A escola NÃO mantém estoque: compra conforme as matrículas. Fluxo por
   aluno: 🛒 PEDIDO (comprado) → 📦 RECEBIDO (chegou na escola) → ✅ ENTREGUE.
   S.livroPedidos: {id, alunoId, vip, titulo, status, pedidoEm, recebidoEm,
   entregueEm, por, obs, atualizadoEm}. Ações da secretaria controláveis
   em 🔐 Permissões (sec_estoque).
   ===================================================================== */
function _estPode(){ return S.perfil==='direcao' || (S.perfil==='secretaria' && perm('sec_estoque')); }
function _lps(){ return S.livroPedidos||[]; }
function pedidoDoAluno(pid,titulo){ return _lps().find(p=>p.alunoId===pid && p.titulo===titulo && p.status!=='cancelado'); }
function alunoRecebeu(pid,titulo){ const p=pedidoDoAluno(pid,titulo); return !!(p&&p.status==='entregue'); }
function entregasDoAluno(pid){ return _lps().filter(p=>p.alunoId===pid && p.status!=='cancelado'); }
function _lpNome(p){ if(p.vip){ const x=(S.vipAlunos||[]).find(z=>z.id===p.alunoId); return x?x.nome+' 👑':'—'; } const a=(S.alunos||[]).find(z=>z.id===p.alunoId); return a?(a.nome+(a.turmaId?(' ('+turmaNome(a.turmaId)+')'):'')):'—'; }
// quem precisa de livro e ainda não tem pedido (turmas com coleção + VIPs com material)
function _livrosAPedir(){
  const out=[];
  (S.turmas||[]).filter(t=>!t.arquivada && (typeof turmaStatus!=='function'||turmaStatus(t)!=='encerrada')).forEach(t=>{
    const col=(typeof planColecaoDe==='function')?planColecaoDe(t):null; if(!col) return;
    alunosDa(t.id).forEach(a=>{ if(!pedidoDoAluno(a.id,col)) out.push({pid:a.id, nome:a.nome, vip:false, titulo:col, grupo:t.nome}); });
  });
  (S.vipAlunos||[]).filter(x=>!x.arquivado && x.material).forEach(x=>{ if(!pedidoDoAluno(x.id,x.material)) out.push({pid:x.id, nome:x.nome+' 👑', vip:true, titulo:x.material, grupo:'Alunos VIP'}); });
  return out;
}

VIEWS.estoque=()=>{
  const v=document.getElementById('view');
  if(ehProfessor()){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>Os livros são gerenciados pela secretaria e direção.</div>'; return; }
  const podeAgir=_estPode();
  const aPedir=_livrosAPedir();
  const pedidos=_lps().filter(p=>p.status==='pedido').sort((a,b)=>(a.pedidoEm||'').localeCompare(b.pedidoEm||''));
  const recebidos=_lps().filter(p=>p.status==='recebido').sort((a,b)=>(a.recebidoEm||'').localeCompare(b.recebidoEm||''));
  const ym=hoje().slice(0,7);
  const entMes=_lps().filter(p=>p.status==='entregue' && (p.entregueEm||'').slice(0,7)===ym).length;
  const tile=(val,lbl,cor)=>`<div class="fx-tile"><div class="v" style="color:${cor}">${val}</div><div class="l">${lbl}</div></div>`;
  // A PEDIR agrupado
  const grupos={}; aPedir.forEach(x=>{ (grupos[x.grupo]=grupos[x.grupo]||[]).push(x); });
  const blocosPedir=Object.keys(grupos).map(g=>{
    const xs=grupos[g];
    return `<div style="margin-top:8px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1">${esc(g)}</b><span class="pill">${esc(xs[0].titulo)}</span>
      ${podeAgir&&xs.length>1?`<button class="btn ghost sm" onclick="pedirTodos('${escAttr(escJs(g))}')">🛒 pedir todos (${xs.length})</button>`:''}</div>
      ${xs.map(x=>`<div class="check"><span style="flex:1">${esc(x.nome)}</span>${podeAgir?`<button class="btn ghost sm" onclick="criarPedidoLivro('${x.pid}',${x.vip},'${escAttr(escJs(x.titulo))}')">🛒 pedir</button>`:''}</div>`).join('')}
    </div>`; }).join('');
  const ultimas=_lps().filter(p=>p.status==='entregue').sort((a,b)=>(b.entregueEm||'').localeCompare(a.entregueEm||'')||((b.atualizadoEm||0)-(a.atualizadoEm||0))).slice(0,12);
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#9333c7"></span><h2 class="display">📚 Livros</h2></div>
    <p class="sub">Compra sob demanda, do jeito da escola: <b>🛒 pedir → 📦 chegou → ✅ entregue ao aluno</b>. Sem estoque parado.</p>
    <div class="card"><div class="fx-tiles">
      ${tile(aPedir.length,'A pedir',aPedir.length?'#c2560b':'var(--ok)')}
      ${tile(pedidos.length,'Aguardando chegada',pedidos.length?'#005EAF':'var(--tinta)')}
      ${tile(recebidos.length,'Na escola, a entregar',recebidos.length?'#9333c7':'var(--tinta)')}
      ${tile(entMes,'Entregues no mês','#0A7A3D')}
    </div>
    ${podeAgir?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn ghost sm" onclick="abrirPedidoAvulso()">+ Pedido avulso</button><button class="btn ghost sm" onclick="exportarLivrosCSV()">⬇️ Planilha</button></div>`:'<p class="hint" style="margin:10px 0 0">Somente leitura — a direção desativou suas ações de livros.</p>'}
    </div>
    <div class="card" style="border-left:4px solid ${aPedir.length?'#c2560b':'var(--ok)'}"><h3 style="margin:0 0 2px">🛒 A pedir (${aPedir.length})</h3>
      <p class="hint" style="margin:0 0 4px">Alunos cuja turma tem coleção definida (ou VIPs com material) e ainda não têm pedido.</p>
      ${blocosPedir||'<p class="hint">✅ Ninguém aguardando pedido.</p>'}
    </div>
    <div class="card" style="border-left:4px solid #005EAF"><h3 style="margin:0 0 2px">📦 Aguardando chegada (${pedidos.length})</h3>
      ${pedidos.length?pedidos.map(p=>`<div class="check"><span style="flex:1"><b>${esc(_lpNome(p))}</b> — ${esc(p.titulo)}<span class="hint"> · pedido em ${brDate(p.pedidoEm)}${p.por?(' por '+esc(p.por)):''}</span></span>
        ${podeAgir?`<button class="btn sm" style="background:#005EAF" onclick="marcarLivroRecebido('${p.id}')">📦 chegou</button>
        <button class="btn ghost sm" style="color:var(--vermelho)" onclick="cancelarPedidoLivro('${p.id}')">cancelar</button>`:''}</div>`).join(''):'<p class="hint">Nenhum pedido aguardando.</p>'}
    </div>
    <div class="card" style="border-left:4px solid #9333c7"><h3 style="margin:0 0 2px">🏫 Na escola, a entregar (${recebidos.length})</h3>
      ${recebidos.length?recebidos.map(p=>`<div class="check"><span style="flex:1"><b>${esc(_lpNome(p))}</b> — ${esc(p.titulo)}<span class="hint"> · chegou em ${brDate(p.recebidoEm)}</span></span>
        ${podeAgir?`<button class="btn sm" style="background:#0A7A3D" onclick="marcarLivroEntregue('${p.id}')">✅ entregar</button>`:''}</div>`).join(''):'<p class="hint">Nada aguardando entrega.</p>'}
    </div>
    <div class="card"><h3>✅ Últimas entregas</h3>
      ${ultimas.length?ultimas.map(p=>`<div class="check"><span style="flex:1">${brDate(p.entregueEm)} · <b>${esc(_lpNome(p))}</b> — ${esc(p.titulo)}${p.obs?(' · '+esc(p.obs)):''}<span class="hint"> · por ${esc(p.por||'')}</span></span>
        ${(S.perfil==='direcao'||p.por===S.usuario)&&podeAgir?`<button class="btn ghost sm" onclick="desfazerEntregaLivro('${p.id}')">desfazer</button>`:''}</div>`).join(''):'<p class="hint">Nenhuma entrega ainda.</p>'}
    </div>`;
};

/* -------------------- ações do fluxo -------------------- */
function criarPedidoLivro(pid, vip, titulo){
  if(!_estPode()) return toast('Sem permissão');
  if(pedidoDoAluno(pid,titulo)) return toast('Já existe pedido deste livro para este aluno');
  S.livroPedidos=S.livroPedidos||[];
  S.livroPedidos.push({id:uid(), alunoId:pid, vip:!!vip, titulo, status:'pedido', pedidoEm:hoje(), por:S.usuario, atualizadoEm:Date.now()});
  save(); if(rota==='estoque') VIEWS.estoque(); else if(rota==='ficha'&&VIEWS.ficha) VIEWS.ficha();
  toast('Pedido registrado 🛒');
}
function pedirTodos(grupo){
  if(!_estPode()) return toast('Sem permissão');
  const xs=_livrosAPedir().filter(x=>x.grupo===grupo);
  if(!xs.length) return;
  if(!confirm('Registrar pedido de '+xs.length+' livro(s) — '+grupo+'?')) return;
  xs.forEach(x=>{ S.livroPedidos=S.livroPedidos||[]; S.livroPedidos.push({id:uid(), alunoId:x.pid, vip:x.vip, titulo:x.titulo, status:'pedido', pedidoEm:hoje(), por:S.usuario, atualizadoEm:Date.now()}); });
  save(); VIEWS.estoque(); toast(xs.length+' pedido(s) registrados 🛒');
}
function marcarLivroRecebido(id){
  if(!_estPode()) return toast('Sem permissão');
  const p=_lps().find(x=>x.id===id); if(!p) return;
  p.status='recebido'; p.recebidoEm=hoje(); p.atualizadoEm=Date.now();
  save(); if(rota==='estoque') VIEWS.estoque(); toast('Livro recebido na escola 📦');
}
function marcarLivroEntregue(id){
  if(!_estPode()) return toast('Sem permissão');
  const p=_lps().find(x=>x.id===id); if(!p) return;
  p.status='entregue'; p.entregueEm=hoje(); p.por=S.usuario; p.atualizadoEm=Date.now();
  // cobrança do material (aluno de turma com plano)
  if(!p.vip){
    const f=_finDoAluno(p.alunoId); const preco=_precoMaterialDoAluno(p.alunoId);
    const jaCobrado=f&&(f.extras||[]).some(e=>e.nome==='Material — '+p.titulo);
    if(f && preco>0 && !jaCobrado){
      if(S.perfil==='direcao'){
        if(confirm('Cobrar o material ('+_moeda(preco)+') no financeiro do aluno?')) { addExtraFinanceiro(f.id,'Material — '+p.titulo,preco,'livros'); toast('Material lançado no financeiro'); }
        else p.cobrancaDispensada=true;
      } else { p.cobrancaPendente=true; toast('Entregue — a cobrança do material ficou pendente para a direção'); }
    }
  }
  save(); if(rota==='estoque') VIEWS.estoque(); else if(rota==='ficha'&&VIEWS.ficha) VIEWS.ficha();
  toast('Entregue ao aluno ✅');
}
function cancelarPedidoLivro(id){
  if(!_estPode()) return toast('Sem permissão');
  const p=_lps().find(x=>x.id===id); if(!p) return;
  if(!confirm('Cancelar este pedido?')) return;
  S.livroPedidos=_lps().filter(x=>x.id!==id); if(typeof marcarExcluido==='function') marcarExcluido('livroPedidos',id);
  save(); VIEWS.estoque(); toast('Pedido cancelado');
}
function desfazerEntregaLivro(id){
  const p=_lps().find(x=>x.id===id); if(!p) return;
  if(!(S.perfil==='direcao' || (p.por===S.usuario && _estPode()))) return toast('Sem permissão');
  if(!p.vip && S.perfil==='direcao'){   // estorno do extra ainda não pago
    const f=_finDoAluno(p.alunoId);
    const e=f&&(f.extras||[]).find(x=>x.nome==='Material — '+p.titulo && !x.pago);
    if(e && confirm('Remover também a cobrança do material ('+_moeda(e.valor)+') que estava em aberto no financeiro?')){ f.extras=f.extras.filter(x=>x.id!==e.id); f.atualizadoEm=Date.now(); }
  }
  delete p.cobrancaPendente; delete p.cobrancaDispensada;
  p.status='recebido'; delete p.entregueEm; p.atualizadoEm=Date.now();
  save(); VIEWS.estoque(); toast('Entrega desfeita — livro volta para "a entregar"');
}
// pedido avulso (qualquer aluno/título, ex.: reposição)
function abrirPedidoAvulso(){
  if(!_estPode()) return toast('Sem permissão');
  const ts=(S.turmas||[]).filter(t=>!t.arquivada);
  let opts='<option value="">— escolha o aluno —</option>';
  ts.forEach(t=>{ const als=alunosDa(t.id); if(!als.length) return;
    opts+=`<optgroup label="${escAttr(t.nome)}">`+als.map(a=>`<option value="a:${a.id}">${esc(a.nome)}</option>`).join('')+'</optgroup>'; });
  const vips=(S.vipAlunos||[]).filter(x=>!x.arquivado);
  if(vips.length) opts+='<optgroup label="👑 Alunos VIP">'+vips.map(x=>`<option value="v:${x.id}">${esc(x.nome)}</option>`).join('')+'</optgroup>';
  const cols=(typeof TG_COLECOES_TODAS!=='undefined')?TG_COLECOES_TODAS:[];
  modal(`<h3>🛒 Pedido avulso <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Aluno</label><select id="pa_aluno">${opts}</select></div>
    <div class="field"><label class="lbl">Livro</label><select id="pa_titulo">${cols.map(c=>`<option>${esc(c)}</option>`).join('')}<option value="__outro__">— Outro (digitar) —</option></select></div>
    <div class="field" id="pa_outroWrap" style="display:none"><label class="lbl">Título</label><input type="text" id="pa_outro" placeholder="Nome do livro/material"></div>
    <button class="btn block" onclick="salvarPedidoAvulso()">Registrar pedido</button>`);
  const sel=document.getElementById('pa_titulo'); if(sel) sel.onchange=()=>{ document.getElementById('pa_outroWrap').style.display=(sel.value==='__outro__')?'block':'none'; };
}
function salvarPedidoAvulso(){
  if(!_estPode()) return toast('Sem permissão');
  const val=(document.getElementById('pa_aluno')||{}).value||''; if(!val) return toast('Escolha o aluno');
  let titulo=(document.getElementById('pa_titulo')||{}).value||'';
  if(titulo==='__outro__') titulo=((document.getElementById('pa_outro')||{}).value||'').trim();
  if(!titulo) return toast('Informe o livro');
  criarPedidoLivro(val.slice(2), val.startsWith('v:'), titulo);
  fechar(); VIEWS.estoque();
}

/* -------------------- integrações -------------------- */
// materiais entregues pela secretaria ainda sem cobrança (a direção fatura no Financeiro)
function livrosCobrancaPendente(){
  return _lps().filter(p=>p.status==='entregue' && !p.vip && p.cobrancaPendente && !p.cobrancaDispensada)
    .filter(p=>{ const f=_finDoAluno(p.alunoId); return f && !(f.extras||[]).some(e=>e.nome==='Material — '+p.titulo); });
}
function faturarLivroPendente(id){
  if(S.perfil!=='direcao') return toast('Só a direção fatura');
  const p=_lps().find(x=>x.id===id); if(!p) return;
  const f=_finDoAluno(p.alunoId); const preco=_precoMaterialDoAluno(p.alunoId);
  if(!f || !(preco>0)) return toast('Aluno sem plano financeiro ou segmento sem preço de material');
  if(!(f.extras||[]).some(e=>e.nome==='Material — '+p.titulo)) addExtraFinanceiro(f.id,'Material — '+p.titulo,preco,'livros');
  delete p.cobrancaPendente; p.atualizadoEm=Date.now(); save();
  if(rota==='financeiro') VIEWS.financeiro(); toast('Material lançado no financeiro ✓');
}
function dispensarCobrancaLivro(id){
  if(S.perfil!=='direcao') return toast('Só a direção');
  const p=_lps().find(x=>x.id===id); if(!p) return;
  p.cobrancaDispensada=true; delete p.cobrancaPendente; p.atualizadoEm=Date.now(); save();
  if(rota==='financeiro') VIEWS.financeiro(); toast('Cobrança dispensada');
}
function _finDoAluno(alunoId){
  const ms=(S.matriculas||[]).filter(x=>x.alunoId===alunoId);
  const m=ms.find(x=>x.status==='ativa')||ms.find(x=>x.status==='trancada')||ms.find(x=>x.status==='concluida');   // nunca orçamento
  if(!m) return null;
  return (S.financeiro||[]).find(f=>f.matriculaId===m.id)||null;
}
function _precoMaterialDoAluno(alunoId){
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return 0;
  const t=(S.turmas||[]).find(x=>x.id===a.turmaId);
  if(!t||typeof precosSegmento!=='function') return 0;
  return precosSegmento(t.nivel||'').material||0;
}
// card "Livros" da ficha (aluno de turma e VIP): mostra o fluxo e a próxima ação
function _cardLivrosAluno(pid, ehVip){
  const regs=entregasDoAluno(pid).sort((a,b)=>(b.atualizadoEm||0)-(a.atualizadoEm||0));
  // o que este aluno deveria ter
  let alvo='';
  if(!ehVip){ const a=(S.alunos||[]).find(x=>x.id===pid); const t=a&&(S.turmas||[]).find(x=>x.id===a.turmaId); alvo=(t&&typeof planColecaoDe==='function')?(planColecaoDe(t)||''):''; }
  else { const vv=(S.vipAlunos||[]).find(x=>x.id===pid); alvo=(vv&&vv.material)||''; }
  const reg=alvo?pedidoDoAluno(pid,alvo):null;
  let acao='';
  if(alvo && !reg) acao=`<p class="hint" style="margin:6px 0 0;color:#c2560b">⚠️ <b>${esc(alvo)}</b> ainda não foi pedido.${_estPode()?` <button class="btn ghost sm" onclick="criarPedidoLivro('${pid}',${!!ehVip},'${escAttr(escJs(alvo))}')">🛒 pedir agora</button>`:''}</p>`;
  else if(reg && reg.status==='pedido') acao=`<p class="hint" style="margin:6px 0 0;color:#005EAF">🛒 <b>${esc(alvo)}</b> pedido em ${brDate(reg.pedidoEm)} — aguardando chegar.${_estPode()?` <button class="btn ghost sm" onclick="marcarLivroRecebido('${reg.id}')">📦 chegou</button>`:''}</p>`;
  else if(reg && reg.status==='recebido') acao=`<p class="hint" style="margin:6px 0 0;color:#9333c7">📦 <b>${esc(alvo)}</b> está na escola desde ${brDate(reg.recebidoEm)}.${_estPode()?` <button class="btn ghost sm" onclick="marcarLivroEntregue('${reg.id}')">✅ entregar agora</button>`:''}</p>`;
  const entregues=regs.filter(r=>r.status==='entregue');
  if(!entregues.length && !acao) return '';
  return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 6px;font-size:1rem">📚 Livros</h3>
    ${entregues.map(r=>`<p class="hint" style="margin:2px 0 0">✅ <b>${esc(r.titulo)}</b> — entregue em ${brDate(r.entregueEm)}${r.por?(' por '+esc(r.por)):''}</p>`).join('')}
    ${acao}
  </div>`;
}
function exportarLivrosCSV(){
  const lista=_lps().slice().sort((a,b)=>(a.pedidoEm||'').localeCompare(b.pedidoEm||''));
  if(!lista.length) return toast('Nenhum registro de livros ainda');
  const stl={pedido:'Aguardando chegada',recebido:'Na escola',entregue:'Entregue'};
  const rows=[_csvLinha(['Aluno','Livro','Situação','Pedido em','Chegou em','Entregue em','Por','Obs'])];
  lista.forEach(p=>rows.push(_csvLinha([_lpNome(p), p.titulo, stl[p.status]||p.status, p.pedidoEm?brDate(p.pedidoEm):'', p.recebidoEm?brDate(p.recebidoEm):'', p.entregueEm?brDate(p.entregueEm):'', p.por||'', p.obs||''])));
  _dlArquivo('livros-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de livros baixada');
}
