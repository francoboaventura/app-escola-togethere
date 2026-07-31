/* ============== NUVEM — sincronização com o Google Apps Script ==============
   Segurança: o segredo fixo saiu do código. O acesso agora é por LOGIN → TOKEN.
   Cada pessoa entra com a sua senha (guardada com hash no servidor) e recebe um
   token de sessão, que é o que viaja nas chamadas — nunca mais uma chave fixa. */
const CLOUD_URL    = 'https://script.google.com/macros/s/AKfycbylxwXqDh5ohAL4qLTn7WBQAu4juwt2bwgdiuGHDl1Ll3d1ViK-mdbeMghnG4UH3GNH/exec';
const TKEY='togethere_token', UKEY='togethere_user', PKEY='togethere_perfil';
/* ==== SUPABASE (produção) ==== */
const SUPA_URL='https://wkmmlbzrfkkalcsxxtze.supabase.co';
const SUPA_KEY='sb_publishable_CD6tvB_DTCH-QSfDNavreg_wtiKiWI1';
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
function normNome(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,''); }
let CLOUD_TOKEN = (function(){ try{ return localStorage.getItem(TKEY)||null; }catch(e){ return null; } })();
const APP_VERSAO = '2026.07.31 · b110 (Supabase)';   // aparece no rodapé; mude a cada publicação no GitHub
const LOGO_B64 = 'data:image/png;base64,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';
/* ============================================================================ */
let _syncTimer=null;
function cloudOn(){ return CLOUD_URL && CLOUD_URL.indexOf('/exec')>0; }
function marcarSync(st){
  const e=document.getElementById('syncDot');
  if(e) e.textContent = st==='ok' ? '☁️ sincronizado' : st==='off' ? (_pendenteSync?'⏳ alterações aguardando conexão':'⚠️ sem conexão') : '☁️ sincronizando…';
}
async function cloudGet(timeout){
  if(!CLOUD_TOKEN) return {ok:false, auth:true};
  try{
    const { data:{ session } }=await sb.auth.getSession();
    if(!session) return {ok:false, auth:true};
    const { data, error }=await sb.from('estado').select('dados').eq('id','app').maybeSingle();
    if(error) return {ok:false};
    const st=(data && data.dados && Object.keys(data.dados).length)? data.dados : null;
    return {ok:true, state:st};
  }catch(e){ return {ok:false}; }
}
function temAtividade(s){
  if(!s) return false;
  return ['presencas','material','temas','testes','contatos','planos','comentarios','atas','tarefas','relatorios','vipAlunos','aulasVip','boletins']
    .some(k=>Array.isArray(s[k]) && s[k].length);
}
const MERGE_COLS=['usuarios','turmas','alunos','presencas','material','temas','testes','contatos','planos','comentarios','atas','tarefas','relatorios','vipAlunos','aulasVip','boletins','eventos','comunicados','planejamento','recessos','alertas','apoios','writings','formacao','formacaoReg','formacaoSessoes'];
function marcarExcluido(col,id){
  if(id==null) return;
  S.exclusoes=S.exclusoes||[];
  S.exclusoes.push({col,id,ts:Date.now()});
  if(S.exclusoes.length>3000) S.exclusoes=S.exclusoes.slice(-3000);
}
function _keyItem(col,it){
  if(col==='usuarios') return 'u:'+((it&&it.nome)||'');
  if(it && it.id!=null) return 'i:'+it.id;
  return 'j:'+JSON.stringify(it);
}
// Junta o estado da nuvem com o local SEM perder dados de outros aparelhos:
// união por id. Em registros com carimbo 'atualizadoEm', vence quem editou por último
// (evita um aparelho com cópia antiga reverter, ex.: relatório voltar de "enviado" para pendente).
// Sem carimbo, mantém o comportamento antigo (local vence). Respeita as marcas de exclusão.
function mergeEstados(cloud, local){
  const out=Object.assign({}, cloud, local);   // campos simples: local vence
  const tomb={};
  [].concat(cloud.exclusoes||[], local.exclusoes||[]).forEach(t=>{ (tomb[t.col]=tomb[t.col]||new Set()).add(t.id); });
  MERGE_COLS.forEach(col=>{
    const map=new Map();
    (Array.isArray(cloud[col])?cloud[col]:[]).forEach(it=>map.set(_keyItem(col,it),it));
    (Array.isArray(local[col])?local[col]:[]).forEach(it=>{
      const k=_keyItem(col,it), ex=map.get(k);
      if(!ex){ map.set(k,it); return; }
      if(col==='relatorios'){
        const base=Object.assign({}, (it.atualizadoEm||0)>=(ex.atualizadoEm||0) ? it : ex);   // corpo: o mais recente vence
        const eI=it.enviadoTs||0, eE=ex.enviadoTs||0;
        if(eI||eE){                                          // "enviado" tem carimbo próprio → independe da edição do corpo
          const w=eI>=eE ? it : ex;
          base.enviado=!!w.enviado; base.enviadoEm=w.enviadoEm; base.enviadoQtd=w.enviadoQtd; base.enviadoTs=Math.max(eI,eE);
        } else if(ex.enviado||it.enviado){                   // relatórios antigos (sem carimbo): "enviado" não volta atrás
          base.enviado=true; base.enviadoEm=ex.enviadoEm||it.enviadoEm; base.enviadoQtd=ex.enviadoQtd||it.enviadoQtd;
        }
        map.set(k, base); return;
      }
      if(col==='alunos'){
        const win=Object.assign({}, (it.atualizadoEm||0)>=(ex.atualizadoEm||0) ? it : ex);   // recência vence (igual ao critério geral)
        // histórico de relatórios enviados é append-only → une os dois lados para nunca perder um registro.
        // Mantém a mesma regra do app: 1 registro por aluno por dia (vence o de envio mais recente).
        const hist=[].concat(Array.isArray(ex.relatoriosEnviados)?ex.relatoriosEnviados:[], Array.isArray(it.relatoriosEnviados)?it.relatoriosEnviados:[]);
        if(hist.length){
          const byDay=new Map();
          hist.forEach(r=>{ const day=r&&(r.em||('t'+r.ts)); if(day==null)return; const cur=byDay.get(day); if(!cur || (r.ts||0)>=(cur.ts||0)) byDay.set(day,r); });
          win.relatoriosEnviados=[...byDay.values()].sort((x,y)=>(x.ts||0)-(y.ts||0));
        }
        map.set(k, win); return;
      }
      if(col==='presencas' || col==='planos'){
        const sI=it.atualizadoEm||0, sE=ex.atualizadoEm||0;
        if(sI||sE){ map.set(k, sI>=sE ? it : ex); }            // alguém carimbou → recência vence
        else {                                                  // legado sem carimbo: "feito" não regride
          const done = (col==='presencas') ? (it.fechada?it:(ex.fechada?ex:it))
                                            : (it.realizado?it:(ex.realizado?ex:it));
          map.set(k, done);
        }
        return;
      }
      if(ex.atualizadoEm!=null || it.atualizadoEm!=null){
        map.set(k, (it.atualizadoEm||0) >= (ex.atualizadoEm||0) ? it : ex);   // recência vence
      } else { map.set(k, it); }                                              // sem carimbo: local vence
    });
    let arr=[...map.values()];
    if(tomb[col]) arr=arr.filter(it=>!(it && it.id!=null && tomb[col].has(it.id)));
    out[col]=arr;
  });
  const seen=new Set(), mt=[];
  [].concat(cloud.exclusoes||[], local.exclusoes||[]).forEach(t=>{ const k=t.col+'|'+t.id; if(!seen.has(k)){ seen.add(k); mt.push(t); } });
  out.exclusoes=mt.slice(-3000);
  return out;
}
async function cloudPut(force){
  if(!cloudOn()) return;
  if(!CLOUD_TOKEN) return;                      // só sincroniza quem está logado
  marcarSync('...');
  if(!force){
    try{
      const cur=await cloudGet(7000);
      if(cur.ok && cur.state && Array.isArray(cur.state.usuarios) && cur.state.usuarios.length){
        const u=S.usuario, p=S.perfil;
        S=mergeEstados(cur.state, S); S.usuario=u; S.perfil=p;
        localStorage.setItem(KEY,JSON.stringify(S));
      } else if(cur.auth){ marcarSync('off'); toast('Sessão expirada. Saia e entre novamente.'); return {ok:false,erro:'auth'}; }
      else if(cur.ok && !cur.state){ /* nuvem REALMENTE vazia (primeira carga) → pode enviar o local */ }
      else {
        // Erro de rede ao LER a nuvem antes de gravar. NÃO enviar o estado local agora:
        // ele pode estar desatualizado e sobrescreveria (apagaria) o que outro aparelho
        // acabou de salvar — ex.: um relatório do professor que a secretaria ainda não viu.
        // Fica pendente e reenvia sozinho quando a conexão voltar (online/visibility/heartbeat).
        marcarSync('off'); return {ok:false, adiado:true};
      }
    }catch(e){ marcarSync('off'); return {ok:false, adiado:true}; }
  }
  const limpo=Object.assign({},S,{usuario:null,perfil:null});   // sessão não vai para a nuvem
  try{
    const { error }=await sb.from('estado').upsert({ id:'app', dados:limpo, atualizado_em:Date.now() });
    if(error){ marcarSync('off'); return {ok:false, adiado:true}; }
    marcarSync('ok'); _marcarPendente(false); return {ok:true};
  }catch(e){ marcarSync('off'); return {ok:false, adiado:true}; }
}
let _pendenteSync=false, _sincronizando=false, _filaSyncOn=false;
const PEND_KEY=KEY+'_pend';
function _marcarPendente(v){
  _pendenteSync=v;
  try{ if(v) localStorage.setItem(PEND_KEY,'1'); else localStorage.removeItem(PEND_KEY); }catch(e){}
}
// Tenta enviar o que está pendente. Reusa cloudPut (puxa→mescla→envia). Não roda em paralelo.
async function flushSync(){
  if(!cloudOn()||!CLOUD_TOKEN) return;
  if(!_pendenteSync || _sincronizando) return;
  _sincronizando=true;
  try{ await cloudPut(); }catch(e){}
  finally{ _sincronizando=false; }
}
// Registra os gatilhos que reenviam sozinhos quando dá: volta da conexão, app reabre, e a cada 25s.
function _iniciarFilaSync(){
  if(_filaSyncOn) return; _filaSyncOn=true;
  try{ if(localStorage.getItem(PEND_KEY)) _pendenteSync=true; }catch(e){}
  window.addEventListener('online', function(){ flushSync(); });
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='visible'){ flushSync(); _refreshAvisosNuvem(); } });
  const _hb=setInterval(function(){ if(!('onLine' in navigator) || navigator.onLine!==false) flushSync(); }, 25000);
  if(_hb && _hb.unref) _hb.unref();
  const _av=setInterval(_refreshAvisosNuvem, 20000);   // Avisos se atualizam sozinhos a cada 20s
  if(_av && _av.unref) _av.unref();
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(S));
  _marcarPendente(true);                  // marca que há algo a enviar (some quando a nuvem confirmar)
  clearTimeout(_syncTimer);
  _syncTimer=setTimeout(flushSync,800);   // agrupa edições rápidas antes de enviar
}
async function puxarDaNuvem(){
  marcarSync('...');
  const res=await cloudGet(8000);
  if(res.ok && res.state && res.state.usuarios && res.state.usuarios.length){
    const u=S.usuario, p=S.perfil;
    S=migrar(res.state); S.usuario=u; S.perfil=p;
    localStorage.setItem(KEY,JSON.stringify(S));
    marcarSync('ok'); toast('Dados atualizados da nuvem ✓');
    try{ if(typeof rota!=='undefined' && rota && VIEWS[rota]) VIEWS[rota](); montarNav(); }catch(e){}
  } else if(res.ok && !res.state){
    marcarSync('ok'); toast('A nuvem ainda está vazia');
  } else {
    marcarSync('off'); toast('Sem conexão com a nuvem agora');
  }
}
// ---- Auto-refresh dos Avisos: puxa em silêncio e só redesenha se algo mudou ----
// Assinatura do que a tela de Avisos mostra (relatórios pendentes + faltas/material/contatos).
function _sigAvisos(){
  try{ return JSON.stringify({
    r:(S.relatorios||[]).filter(x=>!x.enviado).map(x=>x.id).sort(),
    p:S.presencas||[], m:S.material||[], c:S.contatos||[]
  }); }catch(e){ return ''; }
}
let _avisosBusy=false;
async function _refreshAvisosNuvem(){
  if(rota!=='alertas') return;                                            // só quando está nos Avisos
  if(document.visibilityState && document.visibilityState!=='visible') return;
  if(!cloudOn()||!CLOUD_TOKEN) return;
  if(('onLine' in navigator) && navigator.onLine===false) return;
  if(_avisosBusy || _sincronizando || _pendenteSync) return;              // não concorre com o envio (push)
  _avisosBusy=true;
  try{
    const res=await cloudGet(7000);
    if(res.ok && res.state && res.state.usuarios && res.state.usuarios.length){
      const antes=_sigAvisos();
      const u=S.usuario, p=S.perfil;
      S=mergeEstados(migrar(res.state), S); S.usuario=u; S.perfil=p;      // mescla (não perde edição local)
      localStorage.setItem(KEY,JSON.stringify(S));
      if(_sigAvisos()!==antes && rota==='alertas' && !modalTemConteudo()){ VIEWS.alertas(); montarNav(); }  // redesenha só se mudou e sem modal aberto
    }
  }catch(e){}
  finally{ _avisosBusy=false; }
}
// Puxa a nuvem em silêncio ao abrir telas de consulta (relatórios/painel/ficha/VIP),
// para que a secretaria/direção vejam o que os professores acabaram de enviar sem
// precisar tocar em "Atualizar". Mescla (não perde edição local) e, se pedido,
// redesenha a tela atual — só quando não há modal aberto (não atrapalha digitação).
async function _pullSilencioso(reRender){
  if(!cloudOn()||!CLOUD_TOKEN) return;
  if(('onLine' in navigator) && navigator.onLine===false) return;
  if(_sincronizando || _pendenteSync || _avisosBusy) return;   // não concorre com envio/refresh de avisos
  try{
    const res=await cloudGet(7000);
    if(res.ok && res.state && res.state.usuarios && res.state.usuarios.length){
      const u=S.usuario, p=S.perfil;
      S=mergeEstados(migrar(res.state), S); S.usuario=u; S.perfil=p;
      localStorage.setItem(KEY,JSON.stringify(S));
      marcarSync('ok');
      if(reRender && typeof rota!=='undefined' && VIEWS[rota] && !modalTemConteudo()){ VIEWS[rota](); montarNav(); }
    }
  }catch(e){}
}
async function cloudEmail(to, subject, body, html, attachments){
  try{
    const dest = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if(!dest.length) return {ok:false, erro:'sem destinatários'};
    const payload = { to: dest, subject: subject||'Togethere', text: body||'', html: html||'' };
    if(Array.isArray(attachments) && attachments.length) payload.attachments = attachments;
    const { data, error } = await sb.functions.invoke('enviar-email', { body: payload });
    if(error) return {ok:false, erro:(error.message||'falha no envio')};
    if(data && data.ok===false) return {ok:false, erro:(data.error||'falha no envio')};
    return {ok:true, data:data};
  }catch(e){ return {ok:false, erro:(e && e.message) || 'rede'}; }
}