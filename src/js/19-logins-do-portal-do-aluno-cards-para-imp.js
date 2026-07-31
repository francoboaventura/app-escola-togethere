/* ===== Logins do portal do aluno + cards para imprimir (b93) ===== */
let LOGINS_ALUNOS=[], LOGINS_TURMA='';
const PORTAL_ALUNO_URL='https://francoboaventura.github.io/app-escola-togethere/portal-aluno.html';

async function criarLoginsAlunos(){
  const sel=document.getElementById('alSelTurma'); const turmaId=sel&&sel.value; if(!turmaId) return;
  const btn=document.getElementById('alBtnCriar'); const st=document.getElementById('alStatus');
  btn.disabled=true; const txtOrig=btn.textContent; btn.textContent='Criando…';
  st.style.color=''; st.textContent='Criando logins… pode levar alguns segundos.';
  try{
    const { data, error }=await sb.functions.invoke('criar-logins-alunos', { body:{ turmaId } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    LOGINS_ALUNOS=data.criados||[]; LOGINS_TURMA=data.turma||'';
    st.style.color='#0b6b50';
    st.textContent=`Turma ${LOGINS_TURMA}: ${LOGINS_ALUNOS.length} login(s) criado(s), ${(data.jaTinham||[]).length} já tinham, ${(data.erros||[]).length} erro(s).`;
    renderLoginsAlunos(data);
    const ta=document.getElementById('alCards');
    if(ta && LOGINS_ALUNOS.length){ ta.value=LOGINS_ALUNOS.map(c=>`${c.nome}\t${c.email}\t${c.senha}`).join('\n'); }
  }catch(e){ st.style.color='var(--vermelho)'; st.textContent='Não consegui: '+((e&&e.message)||e); }
  finally{ btn.disabled=false; btn.textContent=txtOrig; }
}
function renderLoginsAlunos(data){
  const box=document.getElementById('alResultado'); if(!box) return;
  let h='';
  if(LOGINS_ALUNOS.length){
    h+='<div class="row" style="justify-content:flex-end;gap:8px;margin:12px 0 4px">'
      +'<button class="btn sm ghost" onclick="copiarLoginsAlunos()">📋 Copiar</button>'
      +'<button class="btn sm ghost" onclick="baixarCSVLoginsAlunos()">⬇️ Baixar CSV</button>'
      +'<button class="btn sm" onclick="gerarCardsDaTurma()">🖨️ Gerar cards</button></div>';
    h+='<table><thead><tr><th>Aluno</th><th>E-mail (login)</th><th>Senha</th></tr></thead><tbody>'
      +LOGINS_ALUNOS.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.email)}</td><td><b>${esc(c.senha)}</b></td></tr>`).join('')
      +'</tbody></table>';
  } else { h+='<p class="hint" style="margin-top:10px">Nenhum login novo criado (todos já tinham). Para gerar cards de quem já tem login, cole a lista salva no campo de cards abaixo.</p>'; }
  if((data.jaTinham||[]).length) h+=`<p class="hint" style="margin-top:10px"><b>Já tinham login:</b> ${data.jaTinham.map(esc).join(', ')}</p>`;
  if((data.erros||[]).length) h+=`<p class="hint" style="margin-top:10px;color:var(--vermelho)"><b>Erros:</b> ${data.erros.map(e=>esc(e.nome)+' ('+esc(e.erro)+')').join('; ')}</p>`;
  box.innerHTML=h;
}
function copiarLoginsAlunos(){ if(!LOGINS_ALUNOS.length) return; const t='Aluno\tE-mail\tSenha\n'+LOGINS_ALUNOS.map(c=>`${c.nome}\t${c.email}\t${c.senha}`).join('\n'); navigator.clipboard.writeText(t).then(()=>toast('Lista copiada')); }
function baixarCSVLoginsAlunos(){ if(!LOGINS_ALUNOS.length) return; const csv='Aluno,E-mail,Senha\n'+LOGINS_ALUNOS.map(c=>`"${(c.nome||'').replace(/"/g,'""')}","${c.email}","${c.senha}"`).join('\n'); const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='logins-'+(LOGINS_TURMA||'turma').replace(/[^a-z0-9]+/gi,'-')+'.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},200); }
function carregarCSVCards(input){ const f=input.files&&input.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const ta=document.getElementById('alCards'); if(ta) ta.value=r.result; toast('CSV carregado'); }; r.readAsText(f,'utf-8'); input.value=''; }

// --- parsing da lista (aceita TSV do Copiar e CSV baixado) ---
function _cardsParseLinha(linha, sep){
  const out=[]; let cur='', q=false;
  for(let i=0;i<linha.length;i++){ const c=linha[i];
    if(q){ if(c==='"'){ if(linha[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=c; }
    else { if(c==='"') q=true; else if(c===sep){ out.push(cur); cur=''; } else cur+=c; } }
  out.push(cur); return out.map(s=>s.trim());
}
function _cardsParse(txt){
  txt=(txt||'').replace(/^﻿/,'');
  const linhas=txt.split(/\r?\n/).filter(x=>x.trim()); if(!linhas.length) return [];
  const l0=linhas[0]; const sep=l0.indexOf('\t')>=0?'\t':(l0.indexOf(';')>=0&&l0.indexOf(',')<0?';':',');
  let idxN=0,idxE=1,idxS=2,ini=0;
  const c0=_cardsParseLinha(l0,sep); const j0=c0.join(' ').toLowerCase();
  if(/aluno|nome|e-?mail|senha|login/.test(j0) && j0.indexOf('@')<0){
    c0.forEach((v,i)=>{ v=v.toLowerCase(); if(/aluno|nome/.test(v))idxN=i; if(/mail|login/.test(v))idxE=i; if(/senha|password/.test(v))idxS=i; });
    ini=1;
  }
  const reg=[];
  for(let i=ini;i<linhas.length;i++){ const c=_cardsParseLinha(linhas[i],sep); if(c.length<2) continue;
    let nome=(c[idxN]||'').trim(), email=(c[idxE]||'').trim(), senha=(c[idxS]||'').trim();
    if(email.indexOf('@')<0){ for(let j=0;j<c.length;j++){ if(c[j].indexOf('@')>=0){ email=c[j].trim(); break; } } }
    if(!email) continue; if(!nome) nome=email.split('@')[0];
    reg.push({nome,email,senha});
  }
  return reg;
}
function _qrSVGcard(texto){ try{ const q=qrcode(0,'M'); q.addData(texto); q.make(); return q.createSvgTag({cellSize:2,margin:0,scalable:true}); }catch(e){ return ''; } }
function _cardHTMLaluno(a, comQR){
  const url=PORTAL_ALUNO_URL+'?u='+encodeURIComponent(a.email);
  const qr=comQR?_qrSVGcard(url):'';
  const qrBloco=qr?('<div class="qr">'+qr+'</div>'):'';
  return '<div class="ctag">'+qrBloco+'<div class="info">'
    +'<div class="marca">togeth<b>e</b>re</div>'
    +'<div class="sub">meu acesso</div>'
    +'<div class="nome">'+esc(a.nome)+'</div>'
    +'<div class="kv"><span class="k">Login</span><span class="v">'+esc(a.email)+'</span></div>'
    +'<div class="kv"><span class="k">Senha</span><span class="v">'+esc(a.senha||'—')+'</span></div>'
    +'<div class="comofaz">'+(comQR?'Aponte a câmera do celular para o QR ou acesse o portal e entre com o login e a senha acima.':'Acesse o portal Togethere e entre com o login e a senha acima.')+'</div>'
    +'</div></div>';
}
const _CARDS_CSS='*{box-sizing:border-box;margin:0;padding:0}'
  +'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#10243a;background:#eef3f8}'
  +'.barra{position:sticky;top:0;background:#fff;border-bottom:1px solid #e7eef6;padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:center}'
  +'.barra b{color:#005EAF}.barra .r{color:#E52524}'
  +'.btn{font:inherit;font-weight:600;cursor:pointer;border:0;border-radius:10px;padding:10px 16px;background:#005EAF;color:#fff}'
  +'.dica{font-size:.85rem;color:#5b6b7c}'
  +'.sheet{background:#fff;width:210mm;margin:12px auto;padding:8mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm;box-shadow:0 8px 30px rgba(0,40,90,.08)}'
  +'.ctag{position:relative;border:1px dashed #c4d3e2;border-radius:10px;padding:5mm;display:flex;gap:5mm;align-items:center;min-height:38mm;overflow:hidden;background:#fff}'
  +'.ctag::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4mm;background:linear-gradient(180deg,#005EAF,#0a76d1)}'
  +'.qr{flex:0 0 auto;width:30mm;height:30mm;display:flex;align-items:center;justify-content:center;margin-left:2mm}'
  +'.qr svg{width:100%;height:100%;display:block}'
  +'.info{flex:1;min-width:0}'
  +'.info .marca{font-weight:800;font-size:3.6mm;color:#005EAF;letter-spacing:-.2px;line-height:1}.info .marca b{color:#E52524}'
  +'.info .sub{font-size:2.5mm;color:#5b6b7c;font-style:italic;margin-bottom:1.5mm}'
  +'.info .nome{font-weight:700;font-size:3.7mm;margin:1mm 0 1.5mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'.kv{font-size:2.9mm;margin:.6mm 0}.kv .k{color:#5b6b7c;display:inline-block;min-width:12mm}.kv .v{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700}'
  +'.info .comofaz{font-size:2.3mm;color:#5b6b7c;margin-top:1.5mm;line-height:1.35}'
  +'.turma{page-break-before:always}.turma:first-of-type{page-break-before:auto}'
  +'.cab{grid-column:1 / -1;display:flex;align-items:baseline;gap:10px;border-bottom:3px solid #FFC800;padding-bottom:5px;margin-bottom:2px}.cab .tt{font-weight:800;color:#005EAF;font-size:5mm}.cab .qt{color:#5b6b7c;font-size:3mm}'
  +'@media print{@page{size:A4;margin:0}body{background:#fff}.barra{display:none}.sheet{box-shadow:none;margin:0;width:210mm;page-break-after:always}.ctag{break-inside:avoid}}';
// grupos = [{label, alunos:[{nome,email,senha}]}]  (aceita também uma lista simples)
function _abrirCardsImpressao(grupos, comQR, msg){
  if(Array.isArray(grupos) && grupos.length && !grupos[0].alunos) grupos=[{label:'', alunos:grupos}];
  grupos=(grupos||[]).filter(g=>g && g.alunos && g.alunos.length);
  const total=grupos.reduce((n,g)=>n+g.alunos.length,0);
  if(!total){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Nada para gerar.'; } return; }
  let corpo='';
  grupos.forEach(g=>{
    corpo+='<div class="turma">';
    for(let i=0;i<g.alunos.length;i+=8){
      corpo+='<div class="sheet">'+(g.label?('<div class="cab"><span class="tt">'+esc(g.label)+'</span><span class="qt">'+g.alunos.length+' aluno(s)'+(g.alunos.length>8?(' · página '+(Math.floor(i/8)+1)):'')+'</span></div>'):'');
      for(let j=i;j<Math.min(i+8,g.alunos.length);j++) corpo+=_cardHTMLaluno(g.alunos[j],comQR);
      corpo+='</div>';
    }
    corpo+='</div>';
  });
  const doc='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cards de acesso · Togethere</title><style>'+_CARDS_CSS+'</style></head><body>'
    +'<div class="barra"><span style="font-weight:800">togeth<b>e</b><span class="r">re</span></span><span class="dica">'+total+' card(s) · dica: “Margens: Nenhuma” e sem cabeçalho/rodapé</span><button class="btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>'
    +corpo
    +'<script>window.onload=function(){setTimeout(function(){try{window.print();}catch(e){}},600);};<\/script>'
    +'</body></html>';
  const w=window.open('','_blank');
  if(!w){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Permita pop-ups para abrir a folha de impressão.'; } return; }
  w.document.open(); w.document.write(doc); w.document.close();
  if(msg){ msg.style.color='#0b6b50'; msg.textContent=total+' card(s) gerados na nova aba.'; }
}
function gerarCardsDaTurma(){ _abrirCardsImpressao([{label:LOGINS_TURMA, alunos:LOGINS_ALUNOS}], true, document.getElementById('alStatus')); }

/* ---- Forçar troca de senha no próximo acesso (turma) — só direção ---- */
async function forcarTrocaTurma(){
  const sel=document.getElementById('ftSelTurma'); const turmaId=sel&&sel.value; if(!turmaId) return;
  const btn=document.getElementById('ftBtn'); const st=document.getElementById('ftStatus');
  if(!confirm('Forçar a troca de senha para todos os alunos desta turma no próximo acesso?\n\nEles continuam entrando com a senha atual (do card) e criam uma senha nova ao entrar.')) return;
  btn.disabled=true; const o=btn.textContent; btn.textContent='Aplicando…'; st.style.color=''; st.textContent='Aplicando… pode levar alguns segundos.';
  try{
    const { data, error }=await sb.functions.invoke('forcar-troca-senha', { body:{ turmaId } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    st.style.color='#0b6b50';
    let m=`Turma ${data.turma}: ${data.forcados} aluno(s) vão criar uma senha nova no próximo acesso`;
    if((data.semLogin||[]).length) m+=`; ${data.semLogin.length} ainda sem login (crie o login antes)`;
    if((data.erros||[]).length) m+=`; ${data.erros.length} erro(s)`;
    st.textContent=m+'.';
  }catch(e){ st.style.color='var(--vermelho)'; st.textContent='Não consegui: '+((e&&e.message)||e); }
  finally{ btn.disabled=false; btn.textContent=o; }
}

/* ---- Aba "Cards de acesso" (secretaria + direção) ---- */
let _cdEscopo='turma', _cdTurma='', _cdAluno='';
VIEWS.cards=()=>{
  const v=document.getElementById('view');
  const cont={}; (S.alunos||[]).forEach(a=>{ if(!a.arquivado) cont[a.turmaId]=(cont[a.turmaId]||0)+1; });
  const turmas=(S.turmas||[]).slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||'')));
  if((!_cdTurma || !turmas.some(t=>t.id===_cdTurma)) && turmas.length) _cdTurma=turmas[0].id;
  const optsT=turmas.map(t=>`<option value="${escAttr(t.id)}" ${t.id===_cdTurma?'selected':''}>${esc(t.nome)} — ${cont[t.id]||0} aluno(s)</option>`).join('');
  const alunosT=(S.alunos||[]).filter(a=>!a.arquivado && a.turmaId===_cdTurma).slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||'')));
  const optsA=alunosT.map(a=>`<option value="${escAttr(a.id)}" ${a.id===_cdAluno?'selected':''}>${esc(a.nome)}</option>`).join('');
  const chip=(k,l)=>`<button class="btn ${_cdEscopo===k?'':'ghost'} sm" onclick="cdEscopo('${k}')">${l}</button>`;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Cards de acesso</h2></div>
    <p class="sub">Gere os cartõezinhos (QR + login + senha) para recortar e colar nos livros. Escolha e toque em <b>Gerar cards</b> — o app monta a folha pronta e já chama a impressão.</p>
    <div class="card"><h3>🖨️ Gerar cards</h3>
      <label class="lbl">O que gerar</label>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:4px">${chip('turma','Uma turma')}${chip('aluno','Um aluno')}${chip('todas','Todas as turmas')}</div>
      ${_cdEscopo!=='todas'?`<div class="row" style="align-items:flex-end;margin-top:10px">
        <div style="min-width:200px;flex:1"><label class="lbl">Turma</label><select id="cdSelTurma" onchange="cdTurma(this.value)">${optsT}</select></div>
        ${_cdEscopo==='aluno'?`<div style="min-width:200px;flex:1"><label class="lbl">Aluno</label><select id="cdSelAluno" onchange="_cdAluno=this.value">${optsA||'<option value="">(turma sem alunos)</option>'}</select></div>`:''}
      </div>`:`<p class="hint" style="margin:8px 0">Gera os cards de <b>todas as turmas</b> de uma vez, cada turma numa página nova.</p>`}
      <div class="row" style="align-items:center;margin-top:12px">
        <label style="display:inline-flex;align-items:center;gap:7px;font-size:.9rem;margin:0"><input type="checkbox" id="cdQR" checked> Incluir QR code</label>
        <button class="btn" id="cdBtn" onclick="gerarCardsScope()">🖨️ Gerar cards</button>
      </div>
      <div id="cdMsg" class="hint" style="margin-top:10px"></div>
      <p class="hint" style="margin-top:8px">Abre uma aba com a folha e já chama a impressão — em <b>Destino</b> escolha “Salvar como PDF” (ou a impressora), com <b>“Margens: Nenhuma”</b> e sem cabeçalho/rodapé.</p>
    </div>`;
};
function cdEscopo(k){ _cdEscopo=k; VIEWS.cards(); }
function cdTurma(id){ _cdTurma=id; _cdAluno=''; VIEWS.cards(); }
async function gerarCardsScope(){
  const msg=document.getElementById('cdMsg'); const btn=document.getElementById('cdBtn');
  const comQR=(document.getElementById('cdQR')||{checked:true}).checked;
  let body=null;
  if(_cdEscopo==='todas'){ body={todas:true}; }
  else if(_cdEscopo==='aluno'){ const a=document.getElementById('cdSelAluno'); const alunoId=(a&&a.value)||_cdAluno; if(!alunoId){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Escolha um aluno.'; } return; } body={alunoId}; }
  else { if(!_cdTurma){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Escolha uma turma.'; } return; } body={turmaId:_cdTurma}; }
  btn.disabled=true; const o=btn.textContent; btn.textContent='Gerando…';
  if(msg){ msg.style.color=''; msg.textContent=(_cdEscopo==='todas'?'Preparando todas as turmas… pode levar um pouco na 1ª vez.':'Preparando os cards…'); }
  try{
    const { data, error }=await sb.functions.invoke('cards-turma', { body });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    const n=(data.grupos||[]).reduce((s,g)=>s+((g.alunos||[]).length),0);
    if(!n){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Nada para gerar (turma sem alunos).'; } return; }
    _abrirCardsImpressao(data.grupos, comQR, null);
    let m=n+' card(s) gerados na nova aba';
    if(data.gerados) m+=' · '+data.gerados+' login(s)/senha(s) gerados agora';
    if((data.erros||[]).length) m+=' · '+data.erros.length+' erro(s)';
    if(msg){ msg.style.color='#0b6b50'; msg.textContent=m+'.'; }
  }catch(e){ if(msg){ msg.style.color='var(--vermelho)'; msg.textContent='Não consegui: '+((e&&e.message)||e); } }
  finally{ btn.disabled=false; btn.textContent=o; }
}
