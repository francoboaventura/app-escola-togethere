/* ---- RESUMO PARA PAIS ---- */
let resTurma=null, resData=hoje(), envTurma=null, resDe=ymd(new Date(Date.now()-30*864e5)), resAte=hoje();
VIEWS.resumo=()=>{
  resTurma=resTurma||primeiraTurma();
  const v=document.getElementById('view');
  const podeComentar = S.perfil!=='secretaria';   // secretaria não edita/adiciona nada
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Relatórios por aluno</h2></div>
    <p class="sub">Gere o relatório completo de um aluno — faltas (com o resumo das aulas perdidas), material esquecido, temas não feitos e comentários — e copie ou imprima para enviar ao responsável.</p>
    <div class="card"><div class="row">
      <div><label class="lbl">Turma</label>${selectTurma('relT',resTurma)}</div>
      <div><label class="lbl">Aluno</label><span id="relAWrap">${alunosSelect('relA',resTurma)}</span></div></div>
      <div class="row" style="margin-top:10px">
        <div><label class="lbl">De</label><input type="date" id="relDe" value="${resDe}" onchange="resDe=this.value"></div>
        <div><label class="lbl">Até</label><input type="date" id="relAte" value="${resAte}" onchange="resAte=this.value"></div></div>
      <p class="hint" style="margin:6px 0 0">O relatório considera apenas o período acima (evita relatórios gigantes).</p>
      <div style="margin-top:12px"><button class="btn" onclick="gerarRelatorioAluno()">📄 Gerar relatório</button></div>
      ${podeComentar?`<div class="field" style="margin-top:16px"><label class="lbl">Adicionar comentário sobre o aluno</label>
        <textarea id="relCom" placeholder="Observação específica sobre este aluno (comportamento, evolução, combinados com a família...)"></textarea>
        <button class="btn ghost sm" style="margin-top:8px" onclick="addComentario()">+ Adicionar comentário</button></div>`:''}
    </div>
    <div class="card"><h3>Relatório gerado</h3><p class="hint">Pré-visualização na identidade Togethere. Imprima/salve em PDF ou copie o texto para enviar ao responsável.</p>
      <iframe id="relFrame" title="Relatório" style="width:100%;height:600px;border:1px solid var(--linha);border-radius:14px;background:#fff;display:none"></iframe>
      <div class="gen-box" id="relVazio">Selecione turma e aluno e clique em “Gerar relatório”.</div>
      <div class="row" style="margin-top:14px"><button class="btn" onclick="imprimirRelatorio()">🖨️ Imprimir / PDF</button>
      <button class="btn amarelo" onclick="copiarRelatorio()">📋 Copiar texto</button></div></div>`;
  document.getElementById('relT').onchange=e=>{resTurma=e.target.value;document.getElementById('relAWrap').innerHTML=alunosSelect('relA',e.target.value);};
};
const ASSINATURA_PADRAO='— Equipe Togethere\ninglês para chegar lá';
function emailsResponsaveis(turmaId){ return alunosDa(turmaId).map(a=>(a.email||'').trim()).filter(e=>e.indexOf('@')>0); }

/* ===== RELATÓRIO DO DIA (professor gera; secretaria/direção enviam em Avisos) ===== */
function corpoRelatorioDia(turmaId,dataAula){
  const turma=S.turmas.find(t=>t.id===turmaId)||{};
  const planos=S.planos.filter(p=>p.turmaId===turmaId && p.data===dataAula);
  const materia=planos.map(p=>p.conteudo||p.titulo).filter(Boolean).join(' · ');
  const feitos=[].concat(...planos.map(p=>(p.itens||[]).filter(i=>i.done).map(i=>i.txt)));
  const temas=S.temas.filter(t=>t.turmaId===turmaId && t.data===dataAula);
  const anota=planos.map(p=>p.anotacoes).filter(Boolean).join(' ');
  let b=`Olá, famílias! 👋\n\nResumo da aula de ${brDate(dataAula)} — turma ${turma.nome}.\n\n`;
  b+=`📖 Matéria do dia: ${materia||'(registrar no plano de aula)'}\n`;
  if(feitos.length) b+=`✅ Trabalhamos: ${feitos.join(', ')}.\n`;
  if(temas.length){ b+=`\n📚 Tema de casa:\n`+temas.map(t=>`• ${t.descricao}${t.dataEntrega?` (entrega ${brDate(t.dataEntrega)})`:''}`).join('\n')+`\n`; }
  else { b+=`\n📚 Tema de casa: sem tema para esta aula\n`; }
  if(anota) b+=`\n📝 Observações: ${anota}\n`;
  b+=`\n${(S.config&&S.config.assinatura)||ASSINATURA_PADRAO}`;
  return b;
}
let relTurma=null, relBuscaRel='';
VIEWS.relatorio=()=>{
  const tid=painelTurma||relTurma||primeiraTurma(); relTurma=tid;
  const v=document.getElementById('view');
  const t=S.turmas.find(x=>x.id===tid)||{};
  const meus=S.relatorios.filter(r=>r.turmaId===tid).sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||'')||b.id.localeCompare(a.id));
  const ultimo=meus[0];
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--vermelho)"></span><h2 class="display">Relatório do dia</h2></div>
    <p class="sub">Gere o resumo da aula. Ele fica disponível para a secretaria/direção <b>enviarem aos pais</b> na aba <b>Avisos</b>.</p>
    <div class="card"><div class="row">
      ${painelTurma?`<div style="flex:1"><label class="lbl">Turma</label><input type="text" value="${escAttr(t.nome||'')}" disabled></div>`:`<div><label class="lbl">Turma</label>${selectTurma('relDiaTurma',tid)}</div>`}
      <div><label class="lbl">Data da aula</label>${selectDataAula('relDiaData',tid,dataAulaPadrao(tid))}</div>
    </div><div style="margin-top:12px"><button class="btn" onclick="gerarRelatorioDia()">🧾 Gerar relatório do dia</button></div></div>
    ${ultimo?`<div class="card"><h3>Último relatório gerado</h3><p class="hint">${brDate(ultimo.data)} · gerado em ${ultimo.criadoEm?brDate(ultimo.criadoEm):''} · ${ultimo.enviado?'<span style="color:var(--ok)">já enviado às famílias</span>':'aguardando envio pela secretaria/direção'}</p>
      <div class="gen-box">${escAttr(ultimo.corpo)}</div>
      <div style="margin-top:10px"><button class="btn amarelo" onclick="copiarRelatorioFamilia('${ultimo.id}')">📋 Copiar texto</button></div></div>`:'<div class="card empty"><div class="big">🧾</div>Nenhum relatório gerado ainda para esta turma.</div>'}
    <div class="card"><h3>Relatórios anteriores</h3><input type="text" id="relBuscaRel" placeholder="🔎 Buscar por data (ex.: 10/06)" value="${escAttr(relBuscaRel)}" oninput="relBuscaRel=this.value;renderRelHist()"><div id="relHist" style="margin-top:8px"></div></div>`;
  const sel=document.getElementById('relDiaTurma'); if(sel) sel.onchange=e=>{relTurma=e.target.value;VIEWS.relatorio();};
  renderRelHist();
};
function renderRelHist(){
  const box=document.getElementById('relHist'); if(!box)return;
  let rs=S.relatorios.filter(r=>r.turmaId===relTurma).sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||'')||b.id.localeCompare(a.id));
  const q=(relBuscaRel||'').trim();
  if(q) rs=rs.filter(r=>r.data.includes(q)||brDate(r.data).includes(q)); else rs=rs.slice(1,13);
  if(!rs.length){ box.innerHTML='<p class="hint">'+(q?'Nenhum relatório encontrado.':'Nenhum relatório anterior.')+'</p>'; return; }
  box.innerHTML=rs.map(r=>`<div class="check"><span>${brDate(r.data)}${r.enviado?' <span class="pill" style="background:#e7f6ef;color:var(--ok)">enviado</span>':''}</span><button class="btn ghost sm" style="margin-left:auto" onclick="verRelatorio('${r.id}')">ver</button></div>`).join('');
}
function verRelatorio(id){const r=S.relatorios.find(x=>x.id===id);if(!r)return;modal(`<h3>Relatório · ${brDate(r.data)} <button class="close" onclick="fechar()">×</button></h3><div class="gen-box">${escAttr(r.corpo)}</div><div class="row" style="margin-top:10px;gap:8px"><button class="btn amarelo" onclick="copiarRelatorioFamilia('${r.id}')">📋 Copiar</button><button class="btn ghost" style="color:var(--vermelho)" onclick="delRelatorio('${r.id}')">🗑 Apagar relatório</button></div>`);}
function delRelatorio(id){
  if(!confirm('Apagar este relatório? Ele será removido de TODOS os lugares (Avisos e histórico) e não dá para desfazer.'))return;
  S.relatorios=S.relatorios.filter(r=>r.id!==id);
  marcarExcluido('relatorios',id);
  save(); try{fechar();}catch(e){}
  if(typeof rota!=='undefined' && VIEWS[rota]) VIEWS[rota]();
  toast('Relatório apagado');
}
function upsertRelatorio(turmaId,data,corpo){
  let r=S.relatorios.find(x=>x.turmaId===turmaId && x.data===data);
  if(r){ r.corpo=corpo; r.criadoEm=hoje(); r.criadoPor=S.usuario; r.atualizadoEm=Date.now(); }   // mesma aula: atualiza, mantém status de enviado
  else { r={id:uid(),turmaId,data,corpo,criadoEm:hoje(),criadoPor:S.usuario,enviado:false,atualizadoEm:Date.now()}; S.relatorios.push(r); }
  return r;
}
function gerarRelatorioDia(){
  const tid=relTurma;
  const data=(document.getElementById('relDiaData')||{}).value;
  if(!data) return toast('Selecione a data da aula');
  upsertRelatorio(tid,data,corpoRelatorioDia(tid,data));
  save(); VIEWS.relatorio(); toast('Relatório gerado — disponível para a secretaria em Avisos');
}
/* ----- Avisos: enviar/copiar relatórios (secretaria/direção) ----- */
function setRelCorpo(id,val){const r=S.relatorios.find(x=>x.id===id);if(r){r.corpo=val;save();}}
function copiarTexto(txt, msg){
  txt=String(txt||'');
  if(!txt) return toast('Nada para copiar');
  const ok=()=>toast(msg||'Copiado!');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(ok, ()=>fallbackCopia(txt,msg));
  } else { fallbackCopia(txt,msg); }
}
function fallbackCopia(txt,msg){
  try{
    const ta=document.createElement('textarea');
    ta.value=txt; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length);
    const sucesso=document.execCommand('copy');
    document.body.removeChild(ta);
    toast(sucesso ? (msg||'Copiado!') : 'Não foi possível copiar — selecione manualmente');
  }catch(e){ toast('Não foi possível copiar — selecione manualmente'); }
}
function copiarRelatorioFamilia(id){
  const r=S.relatorios.find(x=>x.id===id); if(!r)return;
  const corpo=(document.getElementById('relc_'+id)||{}).value||r.corpo;
  copiarTexto(corpo,'Copiado! Cole no WhatsApp');
}
async function enviarRelatorioFamilia(id){
  const r=S.relatorios.find(x=>x.id===id); if(!r)return;
  const emails=emailsResponsaveis(r.turmaId);
  if(!emails.length) return toast('Sem e-mails nesta turma ainda — use "Copiar" para enviar pelo WhatsApp. Os e-mails são cadastrados em Turmas e alunos.');
  const corpo=(document.getElementById('relc_'+id)||{}).value||r.corpo;
  const t=S.turmas.find(x=>x.id===r.turmaId)||{};
  const assunto=`Resumo da aula de ${brDate(r.data)} — ${t.nome} · Togethere`;
  if(!confirm('Enviar o relatório por e-mail para '+emails.length+' responsável(is) da turma '+t.nome+'?')) return;
  toast('Enviando…');
  const res=await cloudEmail(emails,assunto,corpo);
  if(res && res.ok){ r.enviado=true; r.enviadoEm=hoje(); r.enviadoQtd=emails.length; r.corpo=corpo; r.corpoEnviado=corpo; r.atualizadoEm=Date.now(); r.enviadoTs=Date.now(); save(); VIEWS.alertas(); toast('Relatório enviado a '+emails.length+' responsável(is) ✅'); }
  else toast('Não foi possível enviar'+(res&&res.erro?': '+res.erro:''));
}
function renderAvisoRelatorios(v){
  let pend=S.relatorios.filter(r=>!r.enviado).sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||'')||b.id.localeCompare(a.id));
  // garante 1 por (turma, data) — se houver duplicatas antigas, mostra a mais recente
  const vistos={}; pend=pend.filter(r=>{const k=r.turmaId+'|'+r.data; if(vistos[k])return false; vistos[k]=true; return true;});
  const wrap=el('<div class="card" style="border-top:3px solid var(--ok)"><h3>📨 Relatórios de aula para enviar</h3><p class="hint">Caem aqui quando o professor realiza a aula. Envie por <b>e-mail</b> (quando houver e-mails cadastrados) ou clique em <b>Copiar</b> e cole no grupo de WhatsApp da turma — some daqui quando enviado. Somente leitura — o histórico fica em <b>Relatórios por turma</b>.</p><div id="avRelBox"></div></div>');
  v.appendChild(wrap);
  const box=wrap.querySelector('#avRelBox');
  if(!pend.length){ box.innerHTML='<p class="hint">Nenhum relatório pendente. Tudo enviado! ✅</p>'; return; }
  box.innerHTML=pend.map(r=>{
    const t=S.turmas.find(x=>x.id===r.turmaId)||{};
    const nEmail=emailsResponsaveis(r.turmaId).length, nAl=alunosDa(r.turmaId).length;
    return `<div class="card" style="background:#f8fbff">
      <h4 style="margin:0 0 6px">${t.nome||'—'} · ${brDate(r.data)}${(Date.now()-(r.atualizadoEm||_ymdToTs(r.criadoEm))>=PEND_PRAZO_SECR)?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">⏱ +24h sem enviar</span>':''}</h4>
      <div class="gen-box">${escAttr(r.corpo)}</div>
      <div class="row" style="margin-top:10px;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn" onclick="enviarRelatorioFamilia('${r.id}')">✉️ Enviar por e-mail</button>
        <button class="btn amarelo" onclick="copiarRelatorioFamilia('${r.id}')">📋 Copiar (WhatsApp)</button>
        <button class="btn ghost" onclick="marcarRelatorioEnviado('${r.id}')">✓ Marcar como enviado</button>
        <button class="btn ghost" style="color:var(--vermelho)" onclick="delRelatorio('${r.id}')">🗑 Apagar</button>
        <span class="hint">✉️ ${nEmail}/${nAl} com e-mail</span>
      </div></div>`;
  }).join('');
}
function refreshRelViews(){ if(rota==='alertas') VIEWS.alertas(); else if(rota==='relturma') renderRelTurmaHist(); }
function marcarRelatorioEnviado(id){ const r=S.relatorios.find(x=>x.id===id); if(!r)return; r.enviado=true; r.enviadoEm=hoje(); if(!r.corpoEnviado) r.corpoEnviado=r.corpo; r.atualizadoEm=Date.now(); r.enviadoTs=Date.now(); save(); refreshRelViews(); toast('Relatório marcado como enviado'); }
function reabrirRelatorio(id){ const r=S.relatorios.find(x=>x.id===id); if(!r)return; r.enviado=false; r.enviadoEm=null; r.atualizadoEm=Date.now(); r.enviadoTs=Date.now(); save(); refreshRelViews(); }