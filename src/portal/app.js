const SUPA_URL='https://wkmmlbzrfkkalcsxxtze.supabase.co';
const SUPA_KEY='sb_publishable_CD6tvB_DTCH-QSfDNavreg_wtiKiWI1';
const sb=window.supabase.createClient(SUPA_URL, SUPA_KEY);
const $=id=>document.getElementById(id);
let DATA=null, USER=null;

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function brDate(s){ if(!s) return ''; const [y,m,d]=String(s).split('-'); return (d&&m&&y)?`${d}/${m}/${y}`:s; }
function printFrame(fr){ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){ alert('Use o menu do navegador para salvar em PDF.'); } }
function setDoc(fr, html){ try{ if(fr._u){URL.revokeObjectURL(fr._u);} const b=new Blob([html||''],{type:'text/html;charset=utf-8'}); fr._u=URL.createObjectURL(b); fr.src=fr._u; }catch(e){ fr.srcdoc=html||''; } }

/* ---- chips de status da aula ---- */
function aulaChips(a){
  let c='';
  if(a.cancelada) c+='<span class="chip c-gray">Aula cancelada</span>';
  else if(a.transferida) c+='<span class="chip c-gray">Transferida</span>';
  else if(a.status==='falta') c+='<span class="chip c-falta">Faltou</span>';
  else c+='<span class="chip c-ok">Presente</span>';
  if(a.atraso) c+='<span class="chip c-warn">Atrasado</span>';
  if(a.saiuCedo) c+='<span class="chip c-warn">Saiu cedo</span>';
  if(a.semMaterial) c+='<span class="chip c-warn">Sem material</span>';
  return c;
}

/* ---- render de cada aba ---- */
function renderAulas(aulas){
  if(!aulas.length) return '<div class="card vazio">Nenhuma aula registrada ainda.</div>';
  return '<div class="card">'+aulas.map((a,i)=>`
    <div class="ar${i===0?' open':''}">
      <button class="ar-h" onclick="this.parentNode.classList.toggle('open')">
        <span class="ar-d">${brDate(a.data)}</span><span class="chips">${aulaChips(a)}</span><span class="chev">▾</span>
      </button>
      <div class="ar-b">
        <div class="lbl">Conteúdo da aula</div><div>${a.descricao?esc(a.descricao):'<span class="hint">Aula não registrada no sistema.</span>'}</div>
        <div class="lbl">Tema de casa</div><div>${a.tema?esc(a.tema):'<span class="hint">Nenhum tema neste dia.</span>'}</div>
      </div>
    </div>`).join('')+'</div>';
}
function wBandCor(n){ if(n==null||n==='') return '#9aa6b6'; n=+n; if(n>=4) return '#16A07A'; if(n>=3) return '#005EAF'; if(n>=2) return '#B8860B'; return '#E52524'; }
function wChipCls(t){ t=(t||'').toUpperCase(); if(/PASS|MERIT|DISTINCT|ACHIEV/.test(t)) return 'ok'; if(/FAIL|BELOW|NOT/.test(t)) return 'bad'; return ''; }
function renderWritings(ws){
  if(!ws.length) return '<div class="card vazio">Nenhum writing avaliado ainda.</div>';
  return '<div class="card">'+ws.map((w,i)=>{
    const bandas=(w.bandas&&w.bandas.length)?w.bandas:null;
    const bars = bandas ? bandas.map(b=>{
      const c=wBandCor(b.band); const pct=(b.band==null)?0:Math.max(6,Math.min(100,(b.band/5)*100));
      return `<div class="wr-skill"><div class="wr-sk-h"><span>${esc(b.label)}</span><span class="wr-sk-v" style="color:${c}">${b.band==null?'—':b.band}<small>/5</small></span></div>
        <div class="wr-track"><div class="wr-fill" style="width:${pct}%;background:${c}"></div></div>
        ${b.justificativa?`<div class="wr-why">${esc(b.justificativa)}</div>`:''}</div>`;
    }).join('') : (w.bands?`<div class="wr-why">${esc(w.bands)}</div>`:'');
    const chips = (w.togethere?`<span class="wr-chip ${wChipCls(w.togethere)}">${esc(w.togethere)}</span>`:'')
                + (w.cefr?`<span class="wr-chip ghost">${esc(w.cefr)}</span>`:'')
                + (w.word_count!=null?`<span class="wr-chip ghost">${w.word_count} palavras</span>`:'');
    const resumo = w.resumo?`<div class="wr-resumo"><b>Para você e sua família</b>${esc(w.resumo)}</div>`:'';
    const fortes = (w.pontos_fortes&&w.pontos_fortes.length)?`<div class="wr-sec"><h4>O que funcionou bem</h4><ul>${w.pontos_fortes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`:'';
    const passos = (w.proximos_passos&&w.proximos_passos.length)?`<div class="wr-sec"><h4>Próximos passos</h4><ul>${w.proximos_passos.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`:'';
    const erros = (w.correcoes&&w.correcoes.length)?`<div class="wr-sec"><h4>Correções</h4>${w.correcoes.map(e=>`<div class="wr-err">${e.tipo?`<span class="wr-tag">${esc(e.tipo)}</span>`:''}<s>${esc(e.trecho)}</s> → <b>${esc(e.correcao)}</b>${e.explicacao?`<div class="wr-why">${esc(e.explicacao)}</div>`:''}</div>`).join('')}</div>`:'';
    const lbl=`${esc(w.nivel||'Writing')}${w.task?(' · '+esc(w.task)):''}`;
    return `<div class="ar${i===0?' open':''}">
      <button class="ar-h" onclick="this.parentNode.classList.toggle('open')">
        <span class="ar-d">${brDate(w.data)}</span>
        <span class="chips"><span style="font-weight:600;color:var(--tinta)">${lbl}</span><span class="chip" style="background:#e7f0fb;color:var(--azul)">Geral ${w.overall!=null?w.overall:'—'}/5</span></span>
        <span class="chev">▾</span>
      </button>
      <div class="ar-b" style="padding-top:6px">
        ${chips?`<div class="wr-chips" style="margin-top:0">${chips}</div>`:''}
        ${bars?`<div class="wr-bars">${bars}</div>`:''}
        ${resumo}${fortes}${passos}${erros}
      </div>
    </div>`;
  }).join('')+'</div>';
}
function banda(n){ if(n==null||n==='') return {cor:'#9aa6b6',bg:'#f1f4f8'}; n=+n;
  if(n>=90) return {cor:'#005EAF',bg:'#E7F0FB'};
  if(n>=60) return {cor:'#16A07A',bg:'#E6F6F0'};
  return {cor:'#E52524',bg:'#FDECEC'}; }
function renderTestes(ts){
  if(!ts.length) return '<div class="card vazio">Nenhum teste registrado ainda.</div>';
  return ts.map(t=>{
    const mb=banda(t.media);
    const bars=(t.skills||[]).map(sk=>{
      const b=banda(sk.nota); const w=(sk.nota==null?0:Math.max(4,Math.min(100,sk.nota)));
      return `<div class="skill"><span class="sk-n">${esc(sk.sk)}</span>
        <div class="sk-bar"><div class="sk-fill" style="width:${w}%;background:${b.cor}"></div></div>
        <span class="sk-v" style="color:${b.cor}">${sk.nota==null?'—':sk.nota}</span></div>`;
    }).join('');
    return `<div class="card tcard">
      <div class="t-h">
        <div><b>${t.numero?('Teste '+t.numero):'Teste'}</b><div class="sub">${brDate(t.data)}${t.turma?(' · '+esc(t.turma)):''}</div></div>
        <div class="media" style="color:${mb.cor};background:${mb.bg}">${t.media!=null?t.media:'—'}<span class="mlbl">média</span></div>
      </div>
      ${bars?('<div class="skills">'+bars+'</div>'):''}
    </div>`;
  }).join('');
}
function renderTemas(tm){
  if(!tm.length) return '<div class="card vazio">Nenhum tema pendente. 👏</div>';
  return '<div class="card">'+tm.map(z=>`<div class="li">
    <b>${esc(z.descricao||'Tema')}</b>
    <div class="sub">${brDate(z.data)} · <span style="color:var(--ouro);font-weight:700">${z.status==='parcial'?'parcial':'não feito'}</span></div></div>`).join('')+'</div>';
}
function renderComentarios(cs){
  if(!cs.length) return '<div class="card vazio">Nenhum comentário ainda.</div>';
  return '<div class="card">'+cs.map(c=>`<div class="li">
    <div class="txt">${esc(c.texto)}</div>
    <div class="sub">${brDate(c.data)}${c.autor?(' · '+esc(c.autor)):''}</div></div>`).join('')+'</div>';
}

/* ---- meu perfil (dados editáveis + foto) e pacote VIP ---- */
function escA(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function setAvatarFoto(av, url, nome){
  if(!av) return;
  if(url){ av.style.backgroundImage='url("'+url+'")'; av.style.backgroundSize='cover'; av.style.backgroundPosition='center'; av.textContent=''; }
  else { av.style.backgroundImage=''; av.textContent=((nome||'·').trim()[0]||'·').toUpperCase(); }
}
function renderPerfil(al){
  const box=$('perfilBox'); if(!box) return;
  box.innerHTML=`<div class="card" style="padding:16px;margin-top:14px">
    <b style="font-size:1rem">👤 Meus dados</b>
    <p class="hint" style="margin:4px 0 12px">Mantenha seus dados atualizados — a escola usa para contato e para o seu cadastro.</p>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div class="avatar" id="perfilAv" style="width:64px;height:64px;color:var(--azul);background:#eaf2fb">${((al.nome||'·').trim()[0]||'·').toUpperCase()}</div>
      <button class="btn ghost sm" id="btnFoto" onclick="escolherFoto()">📷 Enviar / trocar foto</button>
    </div>
    <label>Nome completo</label>
    <input id="pfNome" type="text" value="${escA(al.nome)}">
    <label style="display:block;margin-top:10px">E-mail</label>
    <input id="pfEmail" type="email" autocomplete="email" value="${escA(al.email)}" placeholder="voce@exemplo.com">
    <label style="display:block;margin-top:10px">Telefone / WhatsApp</label>
    <input id="pfTel" type="text" value="${escA(al.telefone)}" placeholder="(51) 9…">
    <label style="display:block;margin-top:10px">Data de aniversário</label>
    <input id="pfNasc" type="date" value="${escA(al.nascimento)}">
    <div style="margin-top:14px"><button class="btn" id="btnSalvarPerfil" onclick="salvarPerfil()" style="width:100%">Salvar meus dados</button></div>
    <div id="perfilMsg" class="msg"></div>
  </div>`;
  if(al.fotoUrl) setAvatarFoto($('perfilAv'), al.fotoUrl, al.nome);
}
async function salvarPerfil(){
  const nome=($('pfNome').value||'').trim(), email=($('pfEmail').value||'').trim();
  const tel=($('pfTel').value||'').trim(), nasc=($('pfNasc').value||'').trim();
  const m=$('perfilMsg');
  if(!nome){ m.textContent='O nome não pode ficar vazio.'; m.className='msg err'; return; }
  if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ m.textContent='E-mail inválido.'; m.className='msg err'; return; }
  const btn=$('btnSalvarPerfil'); btn.disabled=true; const o=btn.textContent; btn.textContent='Salvando…';
  try{
    const { data, error }=await sb.functions.invoke('aluno-editar-perfil', { body:{ nome, email, telefone:tel, nascimento:nasc } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    try{ await sb.auth.updateUser({ data:{ email_contato: email } }); }catch(_e){}
    $('nm').textContent=nome; if(DATA){ DATA.nome=nome; DATA.aluno=Object.assign(DATA.aluno||{},{nome,email,telefone:tel,nascimento:nasc}); }
    m.textContent='Dados salvos! ✅'; m.className='msg ok';
  }catch(e){ m.textContent='Não consegui salvar: '+((e&&e.message)||e); m.className='msg err'; }
  finally{ btn.disabled=false; btn.textContent=o; }
}
function escolherFoto(){ const inp=$('fotoInput'); if(!inp) return; inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(f) enviarFotoPortal(f); inp.value=''; }; inp.click(); }
function _resizeFoto(file, max, q){
  return new Promise((res,rej)=>{ const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{ let w=img.naturalWidth,h=img.naturalHeight; if(Math.max(w,h)>max){ const s=max/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s); }
      const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); URL.revokeObjectURL(url);
      c.toBlob(b=>b?res(b):rej(new Error('toBlob')),'image/jpeg',q); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error('imagem inválida')); }; img.src=url; });
}
function _blobB64(blob){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result)); r.onerror=rej; r.readAsDataURL(blob); }); }
async function enviarFotoPortal(file){
  const btn=$('btnFoto'); const m=$('perfilMsg'); if(btn){ btn.disabled=true; btn.textContent='Enviando…'; }
  try{
    const blob=await _resizeFoto(file, 1200, 0.85);
    const dataUrl=await _blobB64(blob);
    const { data, error }=await sb.functions.invoke('aluno-foto', { body:{ base64:dataUrl } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    if(data.fotoUrl){ setAvatarFoto($('avatar'), data.fotoUrl, ''); setAvatarFoto($('perfilAv'), data.fotoUrl, ''); if(DATA&&DATA.aluno) DATA.aluno.fotoUrl=data.fotoUrl; }
    if(m){ m.textContent='Foto atualizada! ✅'; m.className='msg ok'; }
  }catch(e){ if(m){ m.textContent='Não consegui enviar a foto: '+((e&&e.message)||e); m.className='msg err'; } }
  finally{ if(btn){ btn.disabled=false; btn.textContent='📷 Enviar / trocar foto'; } }
}
function _fmtH(min){ min=+min||0; const h=Math.floor(min/60), mm=min%60; if(!min) return '0min'; return (h?h+'h':'')+(mm?(h?' ':'')+mm+'min':''); }
function renderPacote(isVip, pac){
  const box=$('pacoteBox'); if(!box) return;
  if(!isVip || !pac || !pac.temPacote){ box.innerHTML=''; return; }
  const saldo=pac.saldoMin;
  const tile=(v,l,c)=>`<div class="tile"><div class="v" style="color:${c}">${v}</div><div class="l">${l}</div></div>`;
  let al='';
  if(pac.alerta){ const a=pac.alerta, ms=[];
    if(a.esgotado) ms.push('saldo esgotado'); else if(a.baixo) ms.push('saldo baixo');
    if(a.vencido) ms.push('vigência vencida'); else if(a.vencendo) ms.push('vigência acaba em '+a.dias+' dia'+(a.dias===1?'':'s'));
    al=`<div style="background:#fff1e6;border:1px solid #ffd9bf;border-radius:12px;padding:10px 12px;margin-top:10px;color:#c2560b;font-size:.9rem"><b>⚠️ Atenção:</b> ${ms.join(' · ')}. Fale com a secretaria para renovar.</div>`;
  }
  box.innerHTML=`<div class="card" style="padding:16px;margin-top:14px">
    <b style="font-size:1rem">⏱️ Meu pacote de horas</b>
    <div class="tiles" style="grid-template-columns:repeat(3,1fr);margin-top:12px">
      ${tile(_fmtH(pac.contratadasMin),'Contratadas','#005EAF')}
      ${tile(_fmtH(pac.usadasMin),'Utilizadas','#B8860B')}
      ${tile(_fmtH(Math.max(0,saldo)),'Saldo',saldo<=0?'#E52524':'#16A07A')}
    </div>
    ${pac.vigenciaFim?`<p class="hint" style="margin:10px 0 0">Válido até <b>${brDate(pac.vigenciaFim)}</b>${pac.dias!=null?(pac.dias>=0?(' · '+pac.dias+' dia'+(pac.dias===1?'':'s')+' restante'+(pac.dias===1?'':'s')):' · vencido'):''}</p>`:''}
    ${al}
  </div>`;
}

/* ---- painel principal ---- */
const ABAS=[
  {id:'aulas', label:'Aulas', em:'📅'},
  {id:'writings', label:'Writings', em:'✍️'},
  {id:'testes', label:'Testes', em:'✏️'},
  {id:'temas', label:'Temas', em:'📚'},
  {id:'comentarios', label:'Comentários', em:'💬'},
  {id:'boletim', label:'Boletim', em:'🎓'},
];
function renderPainel(data){
  DATA=data;
  // Alunos VIP não têm portal por enquanto — controle de horas/pacote é só com a secretaria/direção no app da escola.
  if(data && data.vip){
    const nomeV=data.nome||'';
    $('nm').textContent=nomeV||'Aluno'; $('tu').textContent='';
    $('avatar').textContent=(nomeV.trim()[0]||'·').toUpperCase();
    ['tilesBox','tabs','panes','perfilBox','pacoteBox'].forEach(id=>{ const e=$(id); if(e){ e.innerHTML=''; e.classList.add('hide'); } });
    erro('Seu portal ainda não está disponível. Suas informações e o seu pacote de horas são acompanhados diretamente com a secretaria da escola.');
    return;
  }
  const nome=data.nome||''; $('nm').textContent=nome||'Aluno'; $('tu').textContent=data.turma||'';
  $('avatar').textContent=(nome.trim()[0]||'·').toUpperCase();
  const r=data.resumo||{};
  const tile=(v,l,c)=>`<div class="tile"><div class="v" style="color:${c}">${v==null?'—':v}</div><div class="l">${l}</div></div>`;
  $('tilesBox').innerHTML=
      tile(r.presencas,'Presenças','var(--ok)')
    + tile(r.faltas,'Faltas',(r.faltas>0)?'var(--vermelho)':'var(--tinta)')
    + tile(r.temasPend,'Temas pend.',(r.temasPend>0)?'var(--ouro)':'var(--tinta)')
    + tile(r.materialPend,'Material',(r.materialPend>0)?'var(--ouro)':'var(--tinta)');
  $('tilesBox').classList.remove('hide');

  // avatar com foto + perfil editável (o controle de horas/pacote fica oculto no portal por ora)
  const al=data.aluno||{};
  setAvatarFoto($('avatar'), al.fotoUrl, nome);
  $('pacoteBox').innerHTML='';   // renderPacote() desativado no portal (a pedido)
  renderPerfil(al);

  const bol=data.boletim||{liberado:false};
  const cont={
    aulas: renderAulas(data.aulas||[]),
    writings: renderWritings(data.writings||[]),
    testes: renderTestes(data.testes||[]),
    temas: renderTemas(data.temas||[]),
    comentarios: renderComentarios(data.comentarios||[]),
    boletim: bol.liberado && bol.html
      ? `<div class="rowbtn"><button class="btn amarelo sm" onclick="printFrame(document.getElementById('bfr'))">🖨️ Baixar PDF</button></div><iframe id="bfr" class="doc" style="margin-top:8px"></iframe>`
      : `<div class="card lock"><div class="ic">🔒</div><p style="font-weight:700;margin-top:8px">Boletim ainda não liberado</p><p class="hint" style="margin-top:4px">Assim que a direção aprovar, seu boletim aparece aqui para ver e baixar em PDF.</p></div>`
  };
  const cnt={ aulas:(data.aulas||[]).length, writings:(data.writings||[]).length, testes:(data.testes||[]).length, temas:(data.temas||[]).length, comentarios:(data.comentarios||[]).length, boletim:null };

  $('tabs').innerHTML=ABAS.map((a,i)=>{
    const badge = a.id==='boletim' ? (bol.liberado?'':' 🔒') : (cnt[a.id]!=null?` <span class="n">${cnt[a.id]}</span>`:'');
    return `<button class="tab${i===0?' on':''}" data-aba="${a.id}" onclick="mostrarAba('${a.id}')">${a.em?`<span class="tem">${a.em}</span>`:''}${a.label}${badge}</button>`;
  }).join('');
  $('tabs').classList.remove('hide');

  $('panes').innerHTML=ABAS.map(a=>`<div class="pane${a.id==='aulas'?'':' hide'}" id="pane-${a.id}">${cont[a.id]}</div>`).join('');
  if(bol.liberado && bol.html){ const fr=$('bfr'); if(fr) setDoc(fr, bol.html); }
}
function mostrarAba(id){
  ABAS.forEach(a=>{ const p=$('pane-'+a.id); if(p) p.classList.toggle('hide', a.id!==id); });
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on', b.dataset.aba===id));
  // re-render boletim iframe se necessário
  if(id==='boletim' && DATA && DATA.boletim && DATA.boletim.liberado && DATA.boletim.html){ const fr=$('bfr'); if(fr && !fr.src) setDoc(fr, DATA.boletim.html); }
}

/* ---- PDF da ficha (documento compilado) ---- */
function fichaDocHTML(){
  if(!DATA) return '';
  const r=DATA.resumo||{}; const nome=esc(DATA.nome||''), turma=esc(DATA.turma||'');
  const sec=(t,inner)=>`<div style="margin-top:16px"><div style="font-weight:bold;color:#005EAF;font-size:14px;border-bottom:2px solid #FFC800;padding-bottom:4px">${t}</div>${inner}</div>`;
  const li=(h,s)=>`<div style="padding:6px 0;border-bottom:1px solid #eef2f7;font-size:13px"><b>${h}</b>${s?('<div style="color:#5b6b7c">'+s+'</div>'):''}</div>`;
  const faltas=(DATA.aulas||[]).filter(a=>a.status==='falta'&&!a.cancelada&&!a.transferida)
    .map(a=>li(brDate(a.data)+' — Faltou', esc(a.descricao||''))).join('') || '<div style="color:#9aa6b6;font-size:13px;font-style:italic">Nenhuma.</div>';
  const temas=(DATA.temas||[]).map(z=>li(brDate(z.data)+' — '+esc(z.descricao||''), z.status==='parcial'?'parcial':'não feito')).join('')||'<div style="color:#9aa6b6;font-size:13px;font-style:italic">Nenhum.</div>';
  const testes=(DATA.testes||[]).map(t=>li((t.numero?('Teste '+t.numero+' — '):'')+'média '+(t.media!=null?t.media:'—'), brDate(t.data)+(t.det?(' · '+esc(t.det)):''))).join('')||'<div style="color:#9aa6b6;font-size:13px;font-style:italic">Nenhum.</div>';
  const wr=(DATA.writings||[]).map(w=>li(esc(w.nivel)+' — Geral '+(w.overall!=null?w.overall:'—')+'/5', brDate(w.data)+' · '+esc(w.bands))).join('')||'<div style="color:#9aa6b6;font-size:13px;font-style:italic">Nenhum.</div>';
  const coms=(DATA.comentarios||[]).map(c=>li(esc(c.texto), brDate(c.data)+(c.autor?(' · '+esc(c.autor)):''))).join('')||'<div style="color:#9aa6b6;font-size:13px;font-style:italic">Nenhum.</div>';
  const tile=(v,l,c,b)=>`<td width="25%" style="padding:5px"><table width="100%" style="background:${b};border-radius:10px"><tr><td style="padding:12px 6px;text-align:center"><div style="font-size:22px;font-weight:bold;color:${c}">${v==null?'—':v}</div><div style="font-size:10px;color:#5b6b7c;text-transform:uppercase">${l}</div></td></tr></table></td>`;
  const tiles=`<table width="100%"><tr>${tile(r.presencas,'Presenças','#16A07A','#E6F6F0')}${tile(r.faltas,'Faltas',(r.faltas>0)?'#E52524':'#5b6b7c',(r.faltas>0)?'#FDECEC':'#f1f4f8')}${tile(r.temasPend,'Temas',(r.temasPend>0)?'#B8860B':'#5b6b7c',(r.temasPend>0)?'#FBF3D6':'#f1f4f8')}${tile(r.materialPend,'Material',(r.materialPend>0)?'#B8860B':'#5b6b7c',(r.materialPend>0)?'#FBF3D6':'#f1f4f8')}</tr></table>`;
  return '<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;color:#10243a;margin:0;padding:16px;max-width:720px">'
    +`<div style="background:#005EAF;color:#fff;padding:18px 20px;border-radius:12px"><div style="font-size:20px;font-weight:bold">togeth<span style="color:#FFC800">e</span>re</div><div style="font-size:13px;opacity:.9">Ficha de acompanhamento</div></div>`
    +`<div style="padding:12px 2px;border-bottom:3px solid #FFC800;margin-bottom:6px"><b style="color:#005EAF;font-size:16px">${nome}</b> <span style="color:#5b6b7c;font-size:13px">· ${turma}</span></div>`
    +tiles + sec('📅 Faltas (com o conteúdo perdido)',faltas) + sec('📚 Temas pendentes',temas) + sec('📝 Testes',testes) + sec('✍️ Writings',wr) + sec('💬 Comentários',coms)
    +'<div style="margin-top:18px;color:#5b6b7c;font-size:12px;text-align:center;border-top:1px solid #e7eef6;padding-top:10px">Togethere · Gravataí/RS — inglês para chegar lá</div></body></html>';
}

/* ---- login / carga ---- */
function msgLogin(t){ const m=$('loginMsg'); m.textContent=t; m.className='msg err'; }
async function entrar(){
  const email=($('email').value||'').trim(), senha=$('senha').value||'';
  if(!email||!senha) return msgLogin('Preencha e-mail e senha.');
  $('btnEntrar').disabled=true; $('btnEntrar').textContent='Entrando…';
  try{ const { error }=await sb.auth.signInWithPassword({ email, password:senha });
    if(error){ msgLogin('E-mail ou senha incorretos.'); return; } await abrirApp();
  }catch(e){ msgLogin('Falha de conexão. Tente de novo.'); }
  finally{ $('btnEntrar').disabled=false; $('btnEntrar').textContent='Entrar'; }
}
async function abrirApp(){
  const { data:{ user } }=await sb.auth.getUser(); if(!user) return;
  USER=user;
  // 1º acesso: obriga trocar a senha antes de mostrar a ficha
  if(user.user_metadata && user.user_metadata.must_change_password){ mostrarTroca(); return; }
  await carregarFicha();
}
function renderEmailContato(){
  const box=$('emailBox'); if(!box) return;
  const e=(USER && USER.user_metadata && USER.user_metadata.email_contato) || '';
  if($('emailContato')) $('emailContato').value=e;
  box.classList.remove('hide');
}
async function salvarEmailContato(){
  const e=($('emailContato').value||'').trim(); const m=$('emailMsg');
  if(e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){ m.textContent='Digite um e-mail válido.'; m.className='msg err'; return; }
  $('btnEmail').disabled=true; const o=$('btnEmail').textContent; $('btnEmail').textContent='Salvando…';
  try{
    const { data, error }=await sb.auth.updateUser({ data:{ email_contato:e } });
    if(error){ m.textContent='Não consegui salvar. Tente de novo.'; m.className='msg err'; return; }
    if(data && data.user) USER=data.user;
    m.textContent=e?'E-mail salvo! ✅':'E-mail removido.'; m.className='msg ok';
  }catch(err){ m.textContent='Falha de conexão. Tente de novo.'; m.className='msg err'; }
  finally{ $('btnEmail').disabled=false; $('btnEmail').textContent=o; }
}
async function carregarFicha(){
  $('telaLogin').classList.add('hide'); $('telaTroca').classList.add('hide');
  $('app').classList.remove('hide'); $('carregando').classList.remove('hide');
  try{
    const { data, error }=await sb.functions.invoke('minha-ficha');
    if(error) throw new Error(error.message||'falha ao carregar');
    if(data && data.ok){ renderPainel(data); } else { erro('Não consegui carregar a sua ficha. Detalhe: '+((data&&data.error)||'sem resposta')); }
  }catch(e){ erro('Não consegui carregar a sua ficha. Detalhe: '+((e&&e.message)||e)); }
  $('carregando').classList.add('hide');
}
/* ---- troca de senha no 1º acesso ---- */
function mostrarTroca(){
  $('telaLogin').classList.add('hide'); $('app').classList.add('hide'); $('telaTroca').classList.remove('hide');
  const n=$('nsenha'); if(n) n.focus();
}
function msgTroca(t,ok){ const m=$('trocaMsg'); m.textContent=t; m.className='msg '+(ok?'ok':'err'); }
async function trocarSenha(){
  const a=$('nsenha').value||'', b=$('nsenha2').value||'';
  if(a.length<6) return msgTroca('A senha precisa ter ao menos 6 caracteres.');
  if(a!==b) return msgTroca('As duas senhas não são iguais.');
  $('btnTrocar').disabled=true; $('btnTrocar').textContent='Salvando…';
  try{
    const { error }=await sb.auth.updateUser({ password:a, data:{ must_change_password:false } });
    if(error){ msgTroca('Não consegui salvar: '+(error.message||'tente de novo')); return; }
    msgTroca('Senha criada! Entrando…', true);
    await carregarFicha();
  }catch(e){ msgTroca('Falha de conexão. Tente de novo.'); }
  finally{ $('btnTrocar').disabled=false; $('btnTrocar').textContent='Salvar e entrar'; }
}
function erro(t){ $('erroBox').classList.remove('hide'); $('erroTxt').textContent=t; }
async function sair(){ try{ await sb.auth.signOut(); }catch(e){} location.reload(); }

$('btnEntrar').onclick=entrar;
$('senha').addEventListener('keydown',e=>{ if(e.key==='Enter') entrar(); });
$('btnTrocar').onclick=trocarSenha;
$('nsenha2').addEventListener('keydown',e=>{ if(e.key==='Enter') trocarSenha(); });
$('btnSair').onclick=sair;
// pré-preenche o login se vier ?u=<email> (usado pelo QR do card)
(()=>{ try{ const u=new URLSearchParams(location.search).get('u'); if(u && $('email')) $('email').value=u; }catch(e){} })();
(async ()=>{ try{ const { data:{ session } }=await sb.auth.getSession(); if(session) await abrirApp(); }catch(e){} })();