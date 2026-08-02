/* ---- LOGIN ---- */
function renderLogin(){
  S.usuario=null; S.perfil=null;
  const tit=document.getElementById('loginTitulo'); if(tit) tit.textContent='Entrar';
  document.getElementById('loginPanel').innerHTML=`
    <div class="field"><label class="lbl">Usuário</label>
      <input type="text" id="loginUser" placeholder="Seu nome de acesso" autocomplete="off"
             onkeydown="if(event.key==='Enter'){var s=document.getElementById('loginSenha');s&&s.focus();}"></div>
    <div class="field"><label class="lbl">Senha</label>
      <div style="position:relative">
        <input type="password" id="loginSenha" placeholder="Sua senha" autocomplete="off" style="padding-right:46px"
               onkeydown="if(event.key==='Enter')fazerLogin()">
        <button type="button" onclick="toggleSenhaLogin(this,'loginSenha')" aria-label="Mostrar senha" title="Mostrar senha"
                style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:1.15rem;cursor:pointer;padding:6px;line-height:1">👁️</button>
      </div></div>
    <button class="btn block" onclick="fazerLogin()">Entrar</button>
    <p class="hint" style="margin-top:16px;text-align:center">Esqueceu a senha? Fale com a direção.</p>`;
  setTimeout(function(){var i=document.getElementById('loginUser'); if(i) i.focus();},80);
}
/* Mostrar/ocultar a senha digitada (usado no login e na tela de writings) */
function toggleSenhaLogin(btn, id){
  const i=document.getElementById(id||'loginSenha'); if(!i) return;
  const mostra = i.type==='password';
  i.type = mostra ? 'text' : 'password';
  btn.textContent = mostra ? '🙈' : '👁️';
  btn.setAttribute('aria-label', mostra ? 'Ocultar senha' : 'Mostrar senha');
  btn.setAttribute('title', mostra ? 'Ocultar senha' : 'Mostrar senha');
  i.focus();
}
async function fazerLogin(){
  const nome=(document.getElementById('loginUser').value||'').trim();
  const senha=(document.getElementById('loginSenha').value||'').trim();
  if(!nome||!senha) return toast('Preencha usuário e senha');
  const btn=document.querySelector('#loginPanel .btn.block'); if(btn){ btn.disabled=true; btn.textContent='Entrando…'; }
  const resp=await cloudLogin(nome, senha);
  if(btn){ btn.disabled=false; btn.textContent='Entrar'; }
  if(!resp || resp.ok!==true){
    if(resp && (resp.erro==='usuario'||resp.erro==='senha')) toast('Usuário ou senha incorretos');
    else if(resp && resp.erro==='nuvem') toast('Nuvem não configurada');
    else toast('Sem conexão com o servidor. Tente de novo.');
    return;
  }
  // login aceito → guarda a sessão (token) neste aparelho
  CLOUD_TOKEN=resp.token;
  S.usuario=resp.usuario; S.perfil=resp.perfil;
  try{ localStorage.setItem(TKEY,resp.token); localStorage.setItem(UKEY,resp.usuario); localStorage.setItem(PKEY,resp.perfil); }catch(e){}
  // puxa o estado da nuvem já com o token recém-obtido
  const res=await cloudGet(8000);
  if(res.ok && res.state && res.state.usuarios && res.state.usuarios.length){
    let nova=migrar(res.state);
    let temPend=false; try{ temPend=!!localStorage.getItem(PEND_KEY); }catch(e){}
    if(temPend){   // edições offline não enviadas → mescla (igual ao boot), não descarta
      let loc=null; try{ loc=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
      if(loc){ nova=mergeEstados(nova, migrar(loc)); _pendenteSync=true; }
    }
    S=nova; S.usuario=resp.usuario; S.perfil=resp.perfil;
    try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
    marcarSync(_pendenteSync?'...':'ok');
  } else if(res.ok && !res.state){
    marcarSync('ok');   // nuvem vazia: mantém a base local; save/boot cuidam de enviar
  } else {
    marcarSync('off');  // offline: entra com o estado local que já está carregado
  }
  const u=(S.usuarios||[]).find(x=>x.nome===resp.usuario) || {nome:resp.usuario, perfil:resp.perfil, ensina:null};
  aplicarLogin(u);
}
const _SPONTE_RETRO={"mqei3xy8hpcn":2,"mqei3xy89yst":1,"mqei3xy8rbiu":0,"mqei3xy8icmh":0,"mqei3xy8mp7w":1,"mqei3xy8z9bo":1,"mqei3xy85rj8":3,"mqei3xy8olkq":1,"mqei3xy8oc3p":1,"mqei3xy8p3id":2,"mqei3xy89zca":3,"mqei3xy8x0dw":0,"mqei3xy8a4uc":0,"mqei3xy8n7dz":2,"mqei3xy8mkgw":1,"mqei3xy8d85f":2,"mqei3xy8nopt":2,"mqlaibbq5h7a":1,"mqlaibbqq6hg":0,"mqlaibbq5g1b":0,"mqlaibbqz7vn":1,"mqlaibbr6bbf":2,"mqlaibbrww44":1,"mqlaibbrsp7b":1,"mqlaibbr5d11":0,"mqlaibbrgcxo":1,"mqlaibbrx6xh":2,"mqlaibbrn6u4":0,"mqlaibbr5slp":1,"mqlaibbr20k0":6,"mqlaibbr35tt":11,"mqlaibbresu5":2,"mqlaibbrtxps":8,"mqlaibbr81nb":2,"mqlaibbrgtnq":5,"mqlaibbrfdi5":4,"mqlaibbr8uew":3,"mqlaibbr38uw":5,"mqlaibbrs4zu":2,"mqlaibbrnspk":4,"mqlaibbr0h47":4,"mqlaibbr1lc8":1,"mqlaibbryj2v":2,"mqlaibbrjxez":0,"mqlaibbrpug3":1,"mqlaibbrmksv":0,"mqlaibbrni7a":0,"mqlaibbrzlbd":1,"mqlaibbrfp9h":1,"mqlaibbr5n9t":0,"mqlaibbrhm28":0,"mqlaibbr36m3":3,"mqlaibbrdwqi":3,"mqlaibbrt999":2,"mqlaibbrg38t":3,"mqlaibbrnyz7":1,"mqlaibbriq0g":1,"mqlaibbrfrqt":2,"mqlaibbr8w41":1,"mqlaibbr5usx":1,"mqlaibbrcvku":3,"mqlaibbrdqm8":1,"mqlaibbrs47k":3,"mqlaibbrxj2i":1,"mqlaibbr1fna":1,"mqlaibbrbme3":0,"mqlaibbrnkqu":3,"mqlaibbrvw6r":0,"mqlaibbrqit0":0,"mqlaibbrhfy5":0,"mqlaibbsv3k4":0,"mqlaibbsujx5":1,"mqlaibbswkn1":3,"mqlaibbskrlk":0,"mqlaibbs3agw":0,"mqlaibbsz91q":0,"mqlaibbs1nx8":1,"mqlaibbseynr":5,"mqlaibbsmqah":1,"mqlaibbsr2iz":1,"mqlaibbs23ii":2,"mqlaibbsp4ms":1,"mqlaibbsdkfx":1,"mqlaibbs5ptz":1,"mqlaibbsud4z":0,"mqlaibbscxvl":2,"mqlaibbsrrf6":1,"mqlaibbsir0i":1,"mqlaibbspwks":4,"mqlaibbsevys":0,"mqlaibbs30qa":2,"mqlaibbsr502":0,"mqlaibbsygl7":1,"mqlaibbswx3x":2,"mqlaibbsrk5x":2,"mqlaibbspqt2":0,"mqlaibbs306t":1,"mqlaibbs9cjz":0,"mqlaibbshqy0":0,"mqlaibbs098l":0,"mqlaibbsinbx":4,"mqlaibbss0ge":4,"mqlaibbs2dn2":3,"mqlaibbsfhnz":4,"mqlaibbsousq":3,"mqlaibbsdatv":7,"mqlaibbs67h1":2,"mqliytzdoutr":5};
const _NASC_MAP={"mqei3xy8hpcn":"2014-06-18","mqei3xy89yst":"2014-12-11","mqei3xy8rbiu":"2014-08-22","mqei3xy8icmh":"2015-06-05","mqei3xy8mp7w":"2014-10-27","mqei3xy8z9bo":"2014-07-20","mqei3xy85rj8":"2015-06-08","mqei3xy8olkq":"2014-10-11","mqei3xy8oc3p":"2013-10-01","mqei3xy8p3id":"2015-07-10","mqei3xy89zca":"2014-10-09","mqei3xy8x0dw":"2007-09-17","mqei3xy8a4uc":"2009-12-11","mqei3xy8n7dz":"2008-03-31","mqei3xy8mkgw":"2007-12-20","mqei3xy8d85f":"2009-12-16","mqei3xy8nopt":"2008-10-26","mqlaibbq5h7a":"2016-10-25","mqlaibbqq6hg":"2017-03-08","mqlaibbq5g1b":"2017-12-23","mqlaibbqz7vn":"2016-06-16","mqlaibbr6bbf":"2017-04-03","mqlaibbrww44":"2017-03-19","mqlaibbrsp7b":"2016-04-11","mqlaibbr5d11":"2012-09-10","mqlaibbrgcxo":"2012-04-19","mqlaibbrx6xh":"2011-06-29","mqlaibbrn6u4":"2013-10-05","mqlaibbr5slp":"2012-10-08","mqlaibbr20k0":"2011-08-25","mqlaibbr35tt":"2015-03-13","mqlaibbresu5":"2015-03-01","mqlaibbrtxps":"2014-09-05","mqlaibbr81nb":"2014-08-04","mqlaibbrgtnq":"2014-07-23","mqlaibbrfdi5":"2014-05-26","mqlaibbr8uew":"2014-10-01","mqlaibbr38uw":"2014-06-17","mqlaibbrs4zu":"2014-04-22","mqlaibbrnspk":"2014-05-24","mqlaibbr0h47":"2015-01-06","mqlaibbr1lc8":"2014-07-01","mqlaibbryj2v":"2015-04-06","mqlaibbrjxez":"2015-11-16","mqlaibbrpug3":"2016-02-29","mqlaibbrmksv":"2009-07-05","mqlaibbrni7a":"2013-05-11","mqlaibbrzlbd":"2010-06-07","mqlaibbrfp9h":"2008-08-18","mqlaibbr5n9t":"2007-10-29","mqlaibbrhm28":"2012-09-24","mqlaibbr36m3":"2010-09-17","mqlaibbrdwqi":"2010-11-28","mqlaibbrt999":"2011-07-05","mqlaibbrg38t":"2012-05-11","mqlaibbrnyz7":"2011-08-04","mqlaibbriq0g":"2011-01-19","mqlaibbrfrqt":"2011-11-20","mqlaibbr8w41":"2013-01-30","mqlaibbr5usx":"2011-06-08","mqlaibbrcvku":"2011-05-27","mqlaibbrdqm8":"2011-01-02","mqlaibbrs47k":"2012-04-20","mqlaibbrxj2i":"2010-03-31","mqlaibbr1fna":"2012-12-19","mqlaibbrbme3":"2011-08-26","mqlaibbrnkqu":"2012-08-02","mqlaibbrvw6r":"2013-06-20","mqlaibbrqit0":"2012-03-04","mqlaibbrhfy5":"2012-08-21","mqlaibbsv3k4":"2012-06-20","mqlaibbsujx5":"2013-03-04","mqlaibbswkn1":"2011-12-08","mqlaibbskrlk":"2011-02-04","mqlaibbs3agw":"2012-12-16","mqlaibbsz91q":"2011-11-11","mqlaibbs9cjz":"2019-03-27","mqlaibbshqy0":"2019-12-26","mqlaibbs098l":"2017-10-27","mqlaibbsinbx":"2017-09-27","mqlaibbss0ge":"2015-02-01","mqlaibbs2dn2":"2017-10-25","mqlaibbsfhnz":"2018-11-03","mqlaibbsousq":"2018-05-04","mqlaibbsdatv":"2016-12-26","mqlaibbs67h1":"2017-05-14","mqliytzejt4j":"2010-03-18","mqliytzejjhh":"2012-05-19","mqliytzeq6fw":"2012-03-12","mqliytzeb432":"2010-06-25","mqliytzelcw7":"2011-11-09","mqppb99khut7":"2011-10-01","mqppbpowhjkh":"2013-01-11","mqppbxbcj0ig":"2013-02-25","mqppchzcm7k0":"2011-05-01","mqppco9s5xag":"2012-11-28","mqppctm8ad0z":"2013-09-25","mqppd4ps50em":"2014-11-19","mqppdq804ltp":"2014-03-06","mqppdw08exjg":"2011-11-09","mqpq6qu8tt7y":"2013-08-01","mqpq6vs0kuuy":"2015-02-09","mqpq70l4tlm6":"2015-01-06"};
function _aplicarNascimento(){
  try{
    S.config=S.config||{};
    if(S.config._nascAplicado) return;
    let mudou=0;
    (S.alunos||[]).forEach(a=>{ if(Object.prototype.hasOwnProperty.call(_NASC_MAP,a.id) && !a.nascimento){ a.nascimento=_NASC_MAP[a.id]; mudou++; } });
    S.config._nascAplicado='2026-07-25';
    if(typeof save==='function') save();
    try{ toast('Datas de nascimento importadas: '+mudou); }catch(e){}
  }catch(e){ console.error('nasc',e); }
}
function _aplicarSponteRetro(){
  try{
    S.config=S.config||{};
    if(S.config._sponteRetro) return;
    let mudou=0;
    (S.alunos||[]).forEach(a=>{ if(Object.prototype.hasOwnProperty.call(_SPONTE_RETRO,a.id)){ a.faltasRetro=_SPONTE_RETRO[a.id]; mudou++; } });
    S.config._sponteRetro='2026-07-25';
    if(typeof save==='function') save();
    try{ toast('Faltas do Sponte aplicadas: '+mudou+' alunos'); }catch(e){}
  }catch(e){ console.error('sponte retro',e); }
}
function aplicarLogin(u){
  S.perfil=u.perfil;
  _aplicarSponteRetro();
  _aplicarNascimento();
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='block';
  const meta=PERFIS[u.perfil];
  document.getElementById('meName').textContent=u.nome;
  const _md=document.getElementById('meDot');
  _md.classList.add('fotoav'); _md.style.background=meta.cor;
  _md.innerHTML='<span class="fotoav-ini">'+escAttr((u.nome[0]||'·'))+'</span>';
  if(u.foto) _md.dataset.foto=u.foto; else { delete _md.dataset.foto; delete _md.dataset.hid; _md.style.backgroundImage=''; }
  document.getElementById('perfilLabel').innerHTML='Conectado como <b>'+escAttr(u.nome)+'</b> · '+meta.nome;
  montarNav(); ir(NAV.find(n=>n.roles.includes(u.perfil)).id);
  _tickRelogio(); if(!window._relInt) window._relInt=setInterval(_tickRelogio, 15000);
  setTimeout(function(){ mostrarAniversariantes(); }, 600);
}
// Relógio (horário tradicional) no cabeçalho
function _tickRelogio(){
  const el=document.getElementById('tbRelogio'); if(!el) return;
  const d=new Date();
  const dia=d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');
  const hh=String(d.getHours()).padStart(2,'0'), mm=String(d.getMinutes()).padStart(2,'0');
  el.innerHTML='<span class="rel-d">'+dia+'</span>'+hh+':'+mm;
}
async function logout(){
  try{ await Promise.race([cloudLogout(), new Promise(r=>setTimeout(r,2500))]); }catch(e){}   // garante o signOut antes de recarregar
  try{ localStorage.removeItem(TKEY); localStorage.removeItem(UKEY); localStorage.removeItem(PKEY); }catch(e){}
  CLOUD_TOKEN=null;
  location.reload();
}

// ===== Menu no TOPO (b105): "Início" como botões diretos; demais grupos como menus suspensos =====
function _navBadge(n){
  if(n.badge) return totalAlertas();
  if(n.badgeApoio) return apoioBadge();
  if(n.badgeFormacao) return formacaoBadge();
  if(n.id==='painel' && S.perfil==='professor') return todasMinhasPendencias().length;
  return 0;
}
function _navItemBtn(n, cls){
  const b=document.createElement('button'); b.className=cls+' navbtn'; b.dataset.id=n.id;
  const bn=_navBadge(n);
  b.innerHTML=`<span class="em">${n.em}</span> <span class="lb">${n.label}</span>`+(bn?`<span class="badge">${bn}</span>`:'');
  b.onclick=()=>ir(n.id);
  return b;
}
function montarNav(){
  const nav=document.getElementById('nav'); if(!nav) return; nav.innerHTML='';
  const itens=NAV.filter(n=>n.menu!==false && n.roles.includes(S.perfil) && _navPermOk(n));
  const grupos=[]; itens.forEach(n=>{ let g=grupos.find(x=>x.grp===n.grp); if(!g){g={grp:n.grp,itens:[]}; grupos.push(g);} g.itens.push(n); });
  grupos.forEach(g=>{
    if(g.grp==='Início'){ g.itens.forEach(n=>nav.appendChild(_navItemBtn(n,'tnav-item'))); return; }
    const wrap=document.createElement('div'); wrap.className='tnav-grp';
    const top=document.createElement('button'); top.className='tnav-top';
    let gb=0; g.itens.forEach(n=>gb+=_navBadge(n));
    top.innerHTML=`<span class="lb">${g.grp}</span> <span class="cx">▾</span>`+(gb?`<span class="badge">${gb}</span>`:'');
    top.onclick=(e)=>{ e.stopPropagation(); _toggleGrp(wrap); };
    const dd=document.createElement('div'); dd.className='tnav-dd';
    g.itens.forEach(n=>dd.appendChild(_navItemBtn(n,'tnav-di')));
    wrap.appendChild(top); wrap.appendChild(dd); nav.appendChild(wrap);
  });
  montarNavMobile();
}
/* ===== Menu inferior no CELULAR (b107) — resolve a status bar e fica no polegar ===== */
const NAV_MOBILE_PRIOR=['painel','presenca','alunos','alertas','resumo','planejamento','turmas','writings'];
const _BNAV_LBL={presenca:'Chamada',alertas:'Avisos',resumo:'Relatórios',planejamento:'Planejam.',painel:'Painel',alunos:'Alunos',turmas:'Turmas',writings:'Writings'};
function montarNavMobile(){
  const bn=document.getElementById('bnav'); if(!bn) return; bn.innerHTML='';
  const cand=NAV_MOBILE_PRIOR.map(id=>NAV.find(n=>n.id===id)).filter(n=>n && n.roles.includes(S.perfil) && _navPermOk(n)).slice(0,4);
  cand.forEach(n=>{
    const b=document.createElement('button'); b.className='bnav-i'; b.dataset.id=n.id;
    const bd=_navBadge(n);
    b.innerHTML=`<span class="e">${n.em}</span><span class="bl">${_BNAV_LBL[n.id]||n.label}</span>`+(bd?`<span class="badge">${bd}</span>`:'');
    b.onclick=()=>ir(n.id); bn.appendChild(b);
  });
  const mais=document.createElement('button'); mais.className='bnav-i';
  mais.innerHTML='<span class="e">☰</span><span class="bl">Mais</span>';
  mais.onclick=(e)=>{ e.stopPropagation(); _abrirMais(); };
  bn.appendChild(mais);
  _montarMais();
}
function _abrirMais(){ const m=document.getElementById('maisMenu'); if(m) m.classList.toggle('open'); }
function _montarMais(){
  const m=document.getElementById('maisMenu'); if(!m) return;
  const itens=NAV.filter(n=>n.menu!==false && n.roles.includes(S.perfil) && _navPermOk(n));
  const grupos=[]; itens.forEach(n=>{ let g=grupos.find(x=>x.grp===n.grp); if(!g){g={grp:n.grp,itens:[]}; grupos.push(g);} g.itens.push(n); });
  let html='<div class="mais-head">Menu <button class="mais-x" onclick="_abrirMais()" aria-label="Fechar">×</button></div>';
  grupos.forEach(g=>{ html+=`<div class="mais-grp">${g.grp}</div>`+g.itens.map(n=>{const bd=_navBadge(n);return `<button class="mais-i" data-id="${n.id}" onclick="ir('${n.id}')"><span class="em">${n.em}</span> ${n.label}${bd?`<span class="badge">${bd}</span>`:''}</button>`;}).join(''); });
  m.innerHTML=html;
}
function _toggleGrp(wrap){
  const open=wrap.classList.contains('open');
  document.querySelectorAll('.tnav-grp.open').forEach(w=>w.classList.remove('open'));
  if(!open) wrap.classList.add('open');
}
function _togglePerfil(e){ if(e) e.stopPropagation(); const m=document.getElementById('perfilMenu'); if(m) m.classList.toggle('open'); }
function _toggleMenu(e){ if(e) e.stopPropagation(); const a=document.getElementById('app'); if(a) a.classList.toggle('menu-open'); }
function _fecharMenus(){
  document.querySelectorAll('.tnav-grp.open').forEach(w=>w.classList.remove('open'));
  const m=document.getElementById('perfilMenu'); if(m) m.classList.remove('open');
  const mm=document.getElementById('maisMenu'); if(mm) mm.classList.remove('open');
  const a=document.getElementById('app'); if(a) a.classList.remove('menu-open');
}
document.addEventListener('click',()=>_fecharMenus());
function ir(id){
  rota=id; const n=NAV.find(x=>x.id===id);
  document.getElementById('pageTitle').textContent=n.label;
  document.getElementById('crumb').textContent=n.grp;
  document.querySelectorAll('#nav button, #bnav button, .mais-i').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
  _fecharMenus();
  VIEWS[id]();
  if(typeof _hidratarFotos==='function') setTimeout(_hidratarFotos,50);
  if(id==='alertas') _refreshAvisosNuvem();   // ao abrir Avisos, já puxa o que houver de novo
  else if(id==='relturma'||id==='arquivo'||id==='painel') _pullSilencioso(true);   // listas: pode redesenhar
  else if(id==='resumo'||id==='ficha'||id==='vip') _pullSilencioso(false);         // têm campos de digitação: só atualiza os dados
  window.scrollTo(0,0);
}

/* utils UI */
function _normTxt(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function logoFallback(img){const s=document.createElement('span');s.className='wm';s.innerHTML='to<b>gethere</b>';img.replaceWith(s);}
function el(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild;}
function toast(msg){const t=document.getElementById('toast');t.innerHTML='✓ '+msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}
function modal(html){const m=document.getElementById('modal');m.innerHTML=html;document.getElementById('modalBg').classList.add('show');}
function fechar(){document.getElementById('modalBg').classList.remove('show');}
function modalTemConteudo(){
  const m=document.getElementById('modal'); if(!m) return false;
  const campos=m.querySelectorAll('input, textarea, select');
  for(const c of campos){
    if(c.type==='checkbox'||c.type==='radio'){ if(c.checked) return true; }
    else if((c.value||'').trim()!=='') return true;
  }
  return false;
}
function fecharFora(){
  if(modalTemConteudo()){ if(confirm('Você ainda não salvou. Fechar e descartar o que digitou?')) fechar(); }
  else fechar();
}
document.getElementById('modalBg').onclick=e=>{if(e.target.id==='modalBg')fecharFora();};
function turmaNome(id){const t=S.turmas.find(t=>t.id===id);return t?t.nome:'—';}
function nivelTag(n){return `<span class="tag ${n}">${n}</span>`;}
function alunosDa(turmaId){return S.alunos.filter(a=>a.turmaId===turmaId && (_verArquivadas || !a.arquivado));}
function idadeDe(nasc){ if(!nasc) return null; const p=String(nasc).split('-').map(Number); if(p.length<3||!p[0]) return null; const [y,m,d]=p; const h=new Date(); let a=h.getFullYear()-y; if((h.getMonth()+1)<m || ((h.getMonth()+1)===m && h.getDate()<d)) a--; return (a>=0&&a<130)?a:null; }
function brDate(d){if(!d)return'';const[y,m,dd]=d.split('-');return`${dd}/${m}/${y}`;}
function _navItemDe(rid){ return NAV.find(n=>n.id===rid)||null; }
function selectTurma(id,sel){
  const ts=turmasVisiveis();
  return `<select id="${id}">${ts.map(t=>`<option value="${t.id}" ${t.id===sel?'selected':''}>${esc(t.nome)}</option>`).join('')}</select>`;
}
function primeiraTurma(){return (turmasVisiveis()[0]||{}).id;}
