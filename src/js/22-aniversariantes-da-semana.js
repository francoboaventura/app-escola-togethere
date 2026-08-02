/* ---- Aniversariantes da semana (pop-up) ---- */
function aniversariantesSemana(){
  const hoje=new Date(); hoje.setHours(0,0,0,0); const res=[];
  let ids;
  if(S.perfil==='professor'){ const u=S.usuarios.find(x=>x.nome===S.usuario); ids=new Set(S.turmas.filter(t=>!t.arquivada && t.professor===(u&&u.ensina)).map(t=>t.id)); }
  else { ids=new Set(S.turmas.filter(t=>!t.arquivada).map(t=>t.id)); }
  (S.alunos||[]).forEach(a=>{
    if(a.arquivado || !a.nascimento || !ids.has(a.turmaId)) return;
    const p=String(a.nascimento).split('-').map(Number); if(p.length<3||!p[1]||!p[2]) return;
    const yy=p[0],mm=p[1],dd=p[2];
    for(let i=0;i<7;i++){ const d=new Date(hoje); d.setDate(hoje.getDate()+i);
      if(d.getMonth()+1===mm && d.getDate()===dd){ const t=S.turmas.find(x=>x.id===a.turmaId);
        res.push({nome:a.nome, turma:t?t.nome:'', dia:new Date(d), faz:d.getFullYear()-yy}); break; }
    }
  });
  res.sort((a,b)=>a.dia-b.dia);
  return res;
}
let _avisoAniv=false;
function mostrarAniversariantes(){
  if(_avisoAniv) return; _avisoAniv=true;
  const lista=aniversariantesSemana(); if(!lista.length) return;
  modal(`<h3>🎂 Aniversariantes da semana <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:10px">Alunos que fazem aniversário nos próximos 7 dias:</p>
    ${lista.map(o=>`<div class="check"><span>🎉 <b>${esc(o.nome)}</b> — ${brDate(ymd(o.dia))} (${DIAS_SEMANA[o.dia.getDay()]})${(o.faz>0&&o.faz<130)?` · faz ${o.faz}`:''} <span class="pill">${esc(o.turma)}</span></span></div>`).join('')}
    <button class="btn block" onclick="fechar()" style="margin-top:12px">Fechar</button>`);
}

(async function boot(){
  const av=document.getElementById('appVer'); if(av) av.textContent=APP_VERSAO;
  _iniciarFilaSync();                       // fila de sincronização offline (reenvia ao voltar a conexão)
  // existe sessão guardada neste aparelho?
  let tk=null,tuser=null,tperfil=null;
  try{ tk=localStorage.getItem(TKEY); tuser=localStorage.getItem(UKEY); tperfil=localStorage.getItem(PKEY); }catch(e){}
  if(tk && tuser && tperfil){
    CLOUD_TOKEN=tk;
    const lp=document.getElementById('loginPanel'); if(lp) lp.innerHTML='<p class="hint" style="text-align:center">Reconectando…</p>';
    const res=await cloudGet(8000);
    if(res.ok && res.state && res.state.usuarios && res.state.usuarios.length){
      let temPend=false; try{ temPend=!!localStorage.getItem(PEND_KEY); }catch(e){}
      let nova=migrar(res.state);
      if(temPend){                           // havia edições offline não enviadas → MESCLA (local vence), não perde
        let loc=null; try{ loc=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
        if(loc){ nova=mergeEstados(nova, migrar(loc)); _pendenteSync=true; }
      }
      S=nova;
      try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
      marcarSync(_pendenteSync?'...':'ok');
    } else if(res.auth){
      // token expirado/cancelado → limpa a sessão e pede login
      CLOUD_TOKEN=null;
      try{ localStorage.removeItem(TKEY); localStorage.removeItem(UKEY); localStorage.removeItem(PKEY); }catch(e){}
      S.usuario=null; S.perfil=null; renderLogin(); return;
    } else {
      try{ if(localStorage.getItem(PEND_KEY)) _pendenteSync=true; }catch(e){}
      marcarSync('off');                     // offline → entra com o estado local (NUNCA sobrescreve a nuvem)
    }
    const u=(S.usuarios||[]).find(x=>x.nome===tuser) || {nome:tuser, perfil:tperfil, ensina:null};
    S.usuario=u.nome; S.perfil=tperfil;
    aplicarLogin(u);
    if(_pendenteSync) setTimeout(flushSync,1200);   // sobe o que ficou pendente do offline
    return;
  }
  // sem sessão → tela de login
  S.usuario=null; S.perfil=null;
  renderLogin();
})();
