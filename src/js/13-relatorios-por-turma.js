/* ===== RELATÓRIOS POR TURMA (gerar por aula específica + histórico) ===== */
let relturmaTurma=null, relturmaData='', relturmaBusca='';
VIEWS.relturma=()=>{
  relturmaTurma=relturmaTurma||primeiraTurma();
  const v=document.getElementById('view');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Relatórios por turma</h2></div>
    <p class="sub">Gere ou consulte o relatório de uma <b>aula específica</b> (turma + data) e copie para enviar no grupo. Todos ficam pesquisáveis por data abaixo.</p>
    <div class="card"><h3>Gerar relatório de uma aula</h3><div class="row">
      <div><label class="lbl">Turma</label>${selectTurma('rtT',relturmaTurma)}</div>
      <div><label class="lbl">Data da aula</label><span id="rtDWrap">${selectDataAula('rtD',relturmaTurma,relturmaData||dataAulaPadrao(relturmaTurma))}</span></div></div>
      <div style="margin-top:12px"><button class="btn" onclick="gerarRelTurma()">📄 Gerar relatório</button></div>
      <div class="gen-box" id="rtOut" style="margin-top:14px">Selecione turma e data e clique em “Gerar relatório”.</div>
      <div style="margin-top:12px"><button class="btn amarelo" onclick="copiarRelTurma()">📋 Copiar</button></div></div>
    <div class="card"><h3>Histórico — todos os relatórios</h3>
      <input type="text" id="rtBusca" placeholder="🔎 Buscar por data (ex.: 10/06) ou turma" value="${escAttr(relturmaBusca)}" oninput="relturmaBusca=this.value;renderRelTurmaHist()">
      <div id="rtHist" style="margin-top:10px"></div></div>`;
  const s=document.getElementById('rtT'); if(s) s.onchange=e=>{relturmaTurma=e.target.value;relturmaData='';document.getElementById('rtDWrap').innerHTML=selectDataAula('rtD',relturmaTurma,dataAulaPadrao(relturmaTurma));};
  renderRelTurmaHist();
};
function gerarRelTurma(){
  const tid=document.getElementById('rtT').value;
  const data=(document.getElementById('rtD')||{}).value;
  if(!data)return toast('Selecione a data da aula');
  relturmaTurma=tid; relturmaData=data;
  document.getElementById('rtOut').textContent=corpoRelatorioDia(tid,data);
}
function copiarRelTurma(){
  const t=document.getElementById('rtOut').textContent;
  if(!t||t.startsWith('Selecione'))return toast('Gere o relatório primeiro');
  copiarTexto(t,'Relatório copiado!');
}
function renderRelTurmaHist(){
  const box=document.getElementById('rtHist'); if(!box)return;
  const q=(relturmaBusca||'').trim(), qn=_normTxt(q);
  let rs=S.relatorios.slice().sort((a,b)=>b.data.localeCompare(a.data)||(b.criadoEm||'').localeCompare(a.criadoEm||''));
  if(q) rs=rs.filter(r=> r.data.includes(q) || brDate(r.data).includes(q) || _normTxt(turmaNome(r.turmaId)).includes(qn));
  if(!rs.length){ box.innerHTML='<p class="hint">'+(q?'Nenhum relatório encontrado.':'Nenhum relatório gerado ainda.')+'</p>'; return; }
  box.innerHTML=rs.map(r=>{const t=S.turmas.find(x=>x.id===r.turmaId)||{};
    return `<div class="check"><span style="flex:1">${brDate(r.data)} · ${t.nome||'—'} ${r.enviado?'<span class="pill" style="background:#e7f6ef;color:var(--ok)">enviado</span>':'<span class="pill" style="background:#fff7e6;color:var(--laranja)">pendente</span>'}</span>
      <button class="btn ghost sm" onclick="verRelTurma('${r.id}')">ver</button>
      <button class="btn ghost sm" onclick="copiarRelatorioFamilia('${r.id}')">📋 copiar</button>
      <button class="btn ghost sm" style="color:var(--vermelho)" onclick="delRelatorio('${r.id}')">🗑</button></div>`;}).join('');
}
let _arqBusca='';
const ARQ_LIMITE=20;
function _turmasComAluno(qn){ const ids=new Set(); S.alunos.forEach(a=>{ if(_normTxt(a.nome).includes(qn)) ids.add(a.turmaId); }); return ids; }
// Lista unificada de relatórios ENVIADOS (aula por turma + ficha por aluno), ordenada pela data de envio (mais recentes em cima).
function _arquivoItens(){
  const out=[];
  (S.relatorios||[]).forEach(r=>{
    if(!r.enviado) return;
    out.push({ tipo:'aula', id:r.id, ts:(r.enviadoTs||_ymdToTs(r.enviadoEm||r.data)), em:(r.enviadoEm||r.data),
      turmaId:r.turmaId, titulo:turmaNome(r.turmaId), dataAula:r.data, por:r.criadoPor||'' });
  });
  (S.alunos||[]).forEach(a=>{
    (Array.isArray(a.relatoriosEnviados)?a.relatoriosEnviados:[]).forEach(e=>{
      out.push({ tipo:'aluno', id:a.id+'@'+(e.ts||e.em), ts:(e.ts||_ymdToTs(e.em)), em:e.em,
        turmaId:a.turmaId, alunoId:a.id, titulo:a.nome, via:(e.via||''), por:(e.por||'') });
    });
  });
  out.sort((x,y)=>(y.ts||0)-(x.ts||0));
  const seen=new Set(); const dedup=[];
  out.forEach(it=>{ if(seen.has(it.id)) return; seen.add(it.id); dedup.push(it); });   // sem duplicidade
  return dedup;
}
function filtrarArquivo(busca){
  const q=(busca||'').trim(), qn=_normTxt(q);
  let rs=_arquivoItens();
  if(q){
    const turmasAluno=_turmasComAluno(qn);   // casa busca por nome de aluno nos relatórios de aula
    rs=rs.filter(it=>{
      const titulo=_normTxt(it.titulo);                       // turma (aula) ou nome (aluno)
      const nomeTurma=_normTxt(turmaNome(it.turmaId));
      const dataMatch=(it.em||'').includes(q) || brDate(it.em).includes(q)
        || (it.dataAula && (it.dataAula.includes(q) || brDate(it.dataAula).includes(q)));
      const alunoMatch=it.tipo==='aluno' ? titulo.includes(qn) : turmasAluno.has(it.turmaId);
      return titulo.includes(qn) || nomeTurma.includes(qn) || alunoMatch || dataMatch;
    });
  }
  return rs;
}
function renderArquivo(){
  const box=document.getElementById('arqHist'); if(!box) return;
  const todos=filtrarArquivo(_arqBusca);
  const buscando=!!(_arqBusca||'').trim();
  const rs=buscando ? todos : todos.slice(0,ARQ_LIMITE);
  const cnt=document.getElementById('arqCount');
  if(cnt) cnt.textContent = buscando
    ? (todos.length+' resultado(s)')
    : ('mostrando os '+rs.length+' mais recentes'+(todos.length>rs.length?(' · '+todos.length+' no total'):''));
  if(!rs.length){ box.innerHTML='<p class="hint">'+(buscando?'Nenhum relatório enviado encontrado.':'Nenhum relatório enviado ainda.')+'</p>'; return; }
  box.innerHTML=rs.map(it=>{
    const t=S.turmas.find(x=>x.id===it.turmaId)||{};
    if(it.tipo==='aluno'){
      const viaTxt=it.via==='email'?'e-mail':it.via==='whatsapp'?'WhatsApp':it.via==='pdf'?'PDF':'';
      const sub=[t.nome?esc(t.nome):'', viaTxt, it.por?esc(it.por):''].filter(Boolean).join(' · ');
      return `<div class="check"><span style="flex:1">${brDate(it.em)} · 📄 <b>${esc(it.titulo)}</b> <span class="pill" style="background:#eef4ff;color:var(--azul)">aluno</span>${sub?`<br><small class="hint">${sub}</small>`:''}</span>
        <button class="btn ghost sm" onclick="verRelAlunoArquivo('${it.alunoId}','${it.ts}')">ver</button></div>`;
    }
    return `<div class="check"><span style="flex:1">${brDate(it.em)} · 🧾 <b>${esc(t.nome||'—')}</b> <span class="pill" style="background:#e7f6ef;color:var(--ok)">turma</span><br><small class="hint">aula ${brDate(it.dataAula)}${it.por?' · gerado por '+esc(it.por):''}</small></span>
      <button class="btn ghost sm" onclick="verRelArquivo('${it.id}')">ver</button>
      <button class="btn ghost sm" onclick="copiarRelatorioFamilia('${it.id}')">📋</button></div>`;
  }).join('');
}
VIEWS.arquivo=()=>{
  const v=document.getElementById('view');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Arquivo de relatórios</h2></div>
    <p class="sub">Relatórios já <b>enviados</b> às famílias — de aula (por turma) e por aluno (ficha). Ao abrir, mostra os 20 mais recentes. Pesquise por <b>turma</b>, <b>aluno</b> ou <b>data</b>.</p>
    <div class="card">
      <input type="text" id="arqBusca" placeholder="🔎 Buscar por turma, aluno ou data (ex.: A2, Maria, 10/06)" value="${escAttr(_arqBusca)}" oninput="_arqBusca=this.value;renderArquivo()">
      <div class="row" style="margin-top:10px;align-items:center">
        <span id="arqCount" class="hint" style="margin-left:auto"></span>
      </div>
      <div id="arqHist" style="margin-top:12px"></div>
    </div>`;
  renderArquivo();
};

function verRelTurma(id){const r=S.relatorios.find(x=>x.id===id);if(!r)return;const t=S.turmas.find(x=>x.id===r.turmaId)||{};
  modal(`<h3>${t.nome||'—'} · ${brDate(r.data)} <button class="close" onclick="fechar()">×</button></h3><div class="gen-box">${escAttr(r.corpo)}</div>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn amarelo" onclick="copiarRelatorioFamilia('${id}')">📋 Copiar</button>
    ${r.enviado?`<button class="btn ghost" onclick="reabrirRelatorio('${id}');fechar()">marcar como não enviado</button>`:`<button class="btn ghost" onclick="marcarRelatorioEnviado('${id}');fechar()">✓ marcar como enviado</button>`}
    <button class="btn ghost" style="color:var(--vermelho)" onclick="delRelatorio('${id}')">🗑 Apagar</button></div>`);}
// Arquivo: mostra o texto EXATO que foi enviado (snapshot congelado). Relatórios legados caem no corpo atual.
function verRelArquivo(id){
  const r=S.relatorios.find(x=>x.id===id); if(!r)return; const t=S.turmas.find(x=>x.id===r.turmaId)||{};
  const corpo=r.corpoEnviado||r.corpo||'';
  const aviso=r.corpoEnviado?'':'<p class="hint" style="margin:0 0 8px">Relatório anterior à atualização — mostrando o texto atual (sem cópia congelada).</p>';
  modal(`<h3>${esc(t.nome||'—')} · ${brDate(r.data)} <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 8px">🧾 Relatório de aula · enviado${r.enviadoEm?' em '+brDate(r.enviadoEm):''}</p>${aviso}
    <div class="gen-box">${escAttr(corpo)}</div>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn amarelo" onclick="copiarTexto(${JSON.stringify(corpo)},'Copiado!')">📋 Copiar</button></div>`);
}
function verRelAlunoArquivo(alunoId, ts){
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a)return;
  const reg=(a.relatoriosEnviados||[]).find(r=>String(r.ts)===String(ts)); if(!reg)return;
  const t=S.turmas.find(x=>x.id===a.turmaId)||{};
  const viaTxt=reg.via==='email'?'e-mail':reg.via==='whatsapp'?'WhatsApp':reg.via==='pdf'?'PDF':'';
  const corpo=reg.corpo||'';
  const aviso=corpo?'':'<p class="hint" style="margin:0 0 8px">Sem cópia congelada deste envio — use “Abrir ficha atual”.</p>';
  modal(`<h3>${esc(a.nome)} <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 8px">📄 Relatório por aluno${t.nome?' · '+esc(t.nome):''} · enviado em ${brDate(reg.em)}${viaTxt?' ('+viaTxt+')':''}</p>${aviso}
    ${corpo?`<div class="gen-box">${escAttr(corpo)}</div>`:''}
    <div class="row" style="margin-top:10px;gap:8px">${corpo?`<button class="btn amarelo" onclick="copiarTexto(${JSON.stringify(corpo)},'Copiado!')">📋 Copiar</button>`:''}
    <button class="btn ghost" onclick="fechar();abrirFicha('${alunoId}')">📇 Abrir ficha atual</button></div>`);
}
function alunosSelect(id,turmaId,sel){
  const als=alunosDa(turmaId);
  if(!als.length)return `<select id="${id}"><option value="">(sem alunos)</option></select>`;
  return `<select id="${id}">${als.map(a=>`<option value="${a.id}" ${a.id===sel?'selected':''}>${a.nome}</option>`).join('')}</select>`;
}
function temaExtraTurma(turmaId){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); _temaPlanoRef=null; modalTema(turmaId,'',hoje(),'extra'); }