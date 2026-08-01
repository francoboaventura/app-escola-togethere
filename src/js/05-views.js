/* =========================================================================
   VIEWS
   ========================================================================= */
const VIEWS={};

/* ---- PAINEL ---- */
// ===================== PENDÊNCIAS (chamada / plano / relatório) =====================
const PEND_JANELA_DIAS = 14;                 // só olha aulas dos últimos N dias
let   PEND_INICIO      = '2026-06-22';       // pendências só valem a partir desta data (aulas anteriores não contam)
const PEND_PRAZO_PROF  = 2*3600*1000;        // +2h após o fim da aula → avisa o professor
const PEND_PRAZO_DIR   = 26*3600*1000;       // +24h sobre isso → escala para a direção
const PEND_PRAZO_SECR  = 24*3600*1000;       // relatório gerado e não enviado por 24h → escala p/ direção
const PEND_ROTULO = { chamada:'Chamada não feita', plano:'Plano de aula não preenchido', relatorio:'Relatório da aula não gerado', enviar:'Relatório aguardando envio aos pais' };
function _horaFimTurma(t){
  const m=String((t&&t.horario)||'').match(/(\d{1,2}):(\d{2})/g);
  if(m&&m.length){ const p=m[m.length-1].split(':'); return {h:+p[0], mi:+p[1]}; }
  return {h:23, mi:59};
}
function _fimAulaTs(turmaId,data){
  const t=S.turmas.find(x=>x.id===turmaId)||{}; const f=_horaFimTurma(t);
  const a=String(data).split('-').map(Number);
  return new Date(a[0], a[1]-1, a[2], f.h, f.mi, 0).getTime();
}
function _ymdToTs(d){ const a=String(d||'').split('-').map(Number); if(a.length<3||!a[0]) return Date.now(); return new Date(a[0],a[1]-1,a[2],12,0,0).getTime(); }
function _nivelPend(fimTs){
  const dt=Date.now()-fimTs;
  if(dt < PEND_PRAZO_PROF) return null;      // ainda no prazo (professor tem tempo)
  if(dt < PEND_PRAZO_DIR)  return 'prof';    // avisa o professor
  return 'dir';                              // escala para a direção
}
// pendências de AULA de uma turma (chamada / plano / relatório-gerado), passado o prazo de 2h
function pendenciasAulaTurma(turmaId){
  const out=[]; const hojeY=hoje();
  const c=new Date(); c.setDate(c.getDate()-PEND_JANELA_DIAS); const corteY=ymd(c);
  datasAula(turmaId, Math.ceil(PEND_JANELA_DIAS/7)+1, 0).forEach(data=>{
    if(data<corteY || data>hojeY) return;
    if(data<PEND_INICIO) return;   // aulas anteriores ao início não geram pendência
    if(_emRecessoISO(data) || _emFeriasFixas(data)) return;   // dia dentro de recesso/férias não gera pendência
    const _rd=S.presencas.find(p=>p.turmaId===turmaId && p.data===data);
    if(_rd && (_rd.statusAula==='cancelada'||_rd.statusAula==='transferida')) return;  // aula cancelada/transferida não gera pendência
    const nivel=_nivelPend(_fimAulaTs(turmaId,data));
    if(!nivel) return;
    const presOk = S.presencas.some(p=>p.turmaId===turmaId && p.data===data && p.fechada);
    const _transf= !!(_rd && _rd.planoTransferido);   // plano transferido p/ próxima aula: não cobra plano/relatório nesta data
    const planoOk= _transf || S.planos.some(p=>p.turmaId===turmaId && p.data===data && p.realizado);
    const relOk  = _transf || S.relatorios.some(r=>r.turmaId===turmaId && r.data===data);
    if(!presOk)  out.push({turmaId,data,tipo:'chamada',  nivel,fimTs:_fimAulaTs(turmaId,data)});
    if(!planoOk) out.push({turmaId,data,tipo:'plano',    nivel,fimTs:_fimAulaTs(turmaId,data)});
    if(!relOk)   out.push({turmaId,data,tipo:'relatorio',nivel,fimTs:_fimAulaTs(turmaId,data)});
  });
  return out;
}
// relatórios gerados e ainda não enviados (passo da secretaria; escala p/ direção após 24h)
function pendenciasEnviarTurma(turmaId){
  return S.relatorios.filter(r=>r.turmaId===turmaId && !r.enviado && !(_emRecessoISO(r.data)||_emFeriasFixas(r.data))).map(r=>{
    const ts=r.atualizadoEm||_ymdToTs(r.criadoEm);
    return {turmaId, data:r.data, tipo:'enviar', relId:r.id, fimTs:ts, nivel:(Date.now()-ts>=PEND_PRAZO_SECR)?'dir':'sec'};
  });
}
function _souProfDaTurma(t){ return _normTxt((t&&t.professor)||'')===_normTxt(S.usuario||''); }
function _meuEnsina(){ const u=(S.usuarios||[]).find(x=>x.nome===S.usuario); return (u&&u.ensina)||''; }   // nome "de ensino" do professor logado
// o que o perfil atual deve ver para uma turma
function pendenciasDaTurmaParaMim(turmaId){
  const t=S.turmas.find(x=>x.id===turmaId); if(!t||t.arquivada) return [];
  if(S.perfil==='professor')  return _souProfDaTurma(t)? pendenciasAulaTurma(turmaId):[];
  if(S.perfil==='direcao'){    // escaladas (+24h): aula (professor) + envio pendente (secretaria)
    const corte=ymd(new Date(Date.now()-PEND_JANELA_DIAS*864e5));
    const aula=pendenciasAulaTurma(turmaId).filter(p=>p.nivel==='dir');
    const env =pendenciasEnviarTurma(turmaId).filter(p=>p.nivel==='dir' && p.data>=corte && p.data>=PEND_INICIO);
    return aula.concat(env);
  }
  return [];   // secretaria: o passo de "enviar" já aparece em "Relatórios para enviar"
}
function todasMinhasPendencias(){
  let out=[]; S.turmas.forEach(t=>{ if(!t.arquivada) out=out.concat(pendenciasDaTurmaParaMim(t.id)); }); return out;
}
// atalho: leva direto pra onde resolve a pendência
function irPendencia(turmaId,data,tipo){
  painelTurma=turmaId; presTurma=matTurma=temaTurma=testeTurma=relTurma=turmaId;
  if(tipo==='chamada'){ presData=data; ir('presenca'); }
  else if(tipo==='plano'){ ir('planos'); }
  else if(tipo==='relatorio'){ presData=data; ir('relatorio'); }
  else { ir('alertas'); }
  if(typeof fechar==='function') fechar();
}
// quem é o responsável por resolver uma pendência (para agrupar a visão da direção)
function _responsavelPend(p){
  if(p.tipo==='enviar') return 'Secretaria';
  const t=S.turmas.find(x=>x.id===p.turmaId)||{};
  return (t.professor && String(t.professor).trim()) ? String(t.professor).trim() : '(sem professor)';
}
// card de pendências (usado no Painel e nos Avisos)
function renderPendenciasCard(){
  const ps=todasMinhasPendencias(); if(!ps.length) return '';
  const temDir=ps.some(p=>p.nivel==='dir');
  let blocos;
  if(S.perfil==='direcao'){
    // agrupado por RESPONSÁVEL (cada professor + a secretaria)
    const porResp={}; ps.forEach(p=>{ const r=_responsavelPend(p); (porResp[r]=porResp[r]||[]).push(p); });
    const chaves=Object.keys(porResp).filter(k=>k!=='Secretaria').sort((a,b)=>a.localeCompare(b));
    if(porResp['Secretaria']) chaves.push('Secretaria');   // secretaria sempre por último
    blocos=chaves.map(resp=>{
      const icone = resp==='Secretaria' ? '🗂️' : '👩‍🏫';
      const linhas=porResp[resp].sort((a,b)=>b.fimTs-a.fimTs).map(p=>{
        const tagDir=(p.nivel==='dir')?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">⏱ +24h</span>':'';
        return `<div class="check"><span style="flex:1">${brDate(p.data)} · ${esc(turmaNome(p.turmaId))} · <b>${PEND_ROTULO[p.tipo]}</b>${tagDir}</span>
          <button class="btn ghost sm" onclick="irPendencia('${p.turmaId}','${p.data}','${p.tipo}')">resolver ›</button></div>`;
      }).join('');
      return `<div style="margin-top:12px"><div style="font-weight:600">${icone} ${esc(resp)}</div>${linhas}</div>`;
    }).join('');
  } else {
    // professor: agrupado por turma (comportamento original)
    const porTurma={}; ps.forEach(p=>{ (porTurma[p.turmaId]=porTurma[p.turmaId]||[]).push(p); });
    blocos=Object.keys(porTurma).map(tid=>{
      const t=S.turmas.find(x=>x.id===tid)||{};
      const linhas=porTurma[tid].sort((a,b)=>b.fimTs-a.fimTs).map(p=>{
        const tagDir=(p.nivel==='dir')?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">⏱ +24h</span>':'';
        return `<div class="check"><span style="flex:1">${brDate(p.data)} · <b>${PEND_ROTULO[p.tipo]}</b>${tagDir}</span>
          <button class="btn ghost sm" onclick="irPendencia('${tid}','${p.data}','${p.tipo}')">resolver ›</button></div>`;
      }).join('');
      return `<div style="margin-top:10px"><div style="font-weight:600">${esc(t.nome||'—')}</div>${linhas}</div>`;
    }).join('');
  }
  const sub = S.perfil==='professor' ? 'Resolva o quanto antes — após 24h a direção é avisada.'
            : S.perfil==='secretaria' ? 'Relatórios aguardando envio aos pais.'
            : 'Organizadas por professor e secretaria. Inclui relatórios já gerados, aguardando envio às famílias.';
  return `<div class="card" style="border-left:4px solid ${temDir?'var(--vermelho)':'var(--laranja)'}">
    <h3>⚠️ ${ps.length} pendência(s)${S.perfil==='direcao'?' para a direção':''}</h3>
    <p class="hint">${sub}</p>${blocos}</div>`;
}
// banner compacto de pendências de UMA turma (usado no painel da turma)
function bannerPendTurma(id){
  const ps=pendenciasDaTurmaParaMim(id); if(!ps.length) return '';
  const linhas=ps.sort((a,b)=>b.fimTs-a.fimTs).map(p=>`<div class="check"><span style="flex:1">${brDate(p.data)} · <b>${PEND_ROTULO[p.tipo]}</b>${p.nivel==='dir'?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">⏱ +24h</span>':''}</span><button class="btn ghost sm" onclick="event.stopPropagation();irPendencia('${id}','${p.data}','${p.tipo}')">resolver ›</button></div>`).join('');
  return `<div class="card" style="border-left:4px solid var(--laranja)"><h3>⚠️ ${ps.length} pendência(s) nesta turma</h3>${linhas}</div>`;
}

// ===================== OCULTAR Nº DE ALUNOS (revela com senha de diretor) =====================
let _alunosVisiveis=false;   // por sessão; volta a ocultar ao recarregar/sair
function chipAlunos(n){
  return _alunosVisiveis ? (n+' aluno(s)')
    : `<span onclick="event.stopPropagation();pedirRevelarAlunos()" style="cursor:pointer;color:var(--azul);border-bottom:1px dashed var(--azul)" title="Revelar (senha de diretor)">🔒 alunos</span>`;
}
function numAlunosMasc(n){ return _alunosVisiveis ? n : '🔒'; }
function pedirRevelarAlunos(){
  if(_alunosVisiveis) return;
  modal(`<h3>🔒 Revelar nº de alunos <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:12px">Por privacidade, a quantidade de alunos fica oculta. Digite a <b>senha de um(a) diretor(a)</b> para exibir nesta sessão.</p>
    <div class="field"><label class="lbl">Senha de diretor(a)</label><input type="password" id="revAlSenha" placeholder="senha da direção" onkeydown="if(event.key==='Enter')confirmarRevelarAlunos()"></div>
    <button class="btn block" onclick="confirmarRevelarAlunos()">Revelar</button>`);
  setTimeout(()=>{const i=document.getElementById('revAlSenha');if(i)i.focus();},60);
}
async function confirmarRevelarAlunos(){
  const senha=((document.getElementById('revAlSenha')||{}).value)||'';
  if(!senha) return toast('Digite a senha');
  if(!cloudOn()) return toast('Sem conexão para validar a senha');
  const diretores=(S.usuarios||[]).filter(u=>u.perfil==='direcao');
  let ok=false;
  for(const d of diretores){ const r=await cloudLogin(d.nome, senha); if(r && r.ok && r.perfil==='direcao'){ ok=true; break; } }
  if(!ok) return toast('Senha de diretor(a) incorreta');
  _alunosVisiveis=true; fechar(); toast('Número de alunos revelado nesta sessão');
  _reRenderAtual();
}
function ocultarAlunos(){ _alunosVisiveis=false; _reRenderAtual(); toast('Número de alunos ocultado'); }
function _reRenderAtual(){
  try{ if(painelTurma) renderPainelTurma(); else if(typeof rota!=='undefined' && VIEWS[rota]) VIEWS[rota](); }catch(e){}
}

function _presencaStats(turmaId, dias){
  const corte=diasAtras(dias||30); let pres=0, tot=0;
  (S.presencas||[]).forEach(p=>{
    if(turmaId && p.turmaId!==turmaId) return;
    if(!_aulaConta(p)) return;
    if(p.data < corte) return;
    [p.registros,p.registros2].forEach(reg=>{ if(!reg) return; Object.values(reg).forEach(s=>{ tot++; if(s==='presente') pres++; }); });
  });
  return {pres,tot,pct: tot? Math.round(pres/tot*100):null};
}
function renderPainelGestao(){
  const tv=turmasVisiveis();
  const geral=_presencaStats(null,30);
  const alertas=alertasFaltas().concat(alertasMaterial());
  const alPorTurma={};
  alertas.forEach(o=>{ const a=S.alunos.find(x=>x.id===o.alunoId); if(a) alPorTurma[a.turmaId]=(alPorTurma[a.turmaId]||0)+1; });
  const linhas=tv.map(t=>{
    const n=alunosDa(t.id).length;
    const st=_presencaStats(t.id,30);
    const al=alPorTurma[t.id]||0;
    const pct=st.pct;
    const cor = pct===null?'#94a3b8':(pct>=90?'var(--verde)':(pct>=75?'#b88600':'var(--vermelho)'));
    const barra = pct===null?'':`<div style="background:var(--linha);border-radius:6px;height:8px;width:84px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${cor}"></div></div>`;
    return `<tr style="border-bottom:1px solid var(--linha)"><td style="padding:7px 4px">${esc(t.nome)}<br><small class="hint">${esc(t.professor||'')}</small></td><td style="text-align:center">${n}</td><td><div style="display:flex;align-items:center;gap:6px">${barra}<b style="color:${cor}">${pct===null?'—':pct+'%'}</b></div></td><td style="text-align:center">${al?`<b style="color:var(--vermelho)">${al}</b>`:`<span class="hint">0</span>`}</td></tr>`;
  }).join('');
  return `<div class="card"><div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h3 class="display">Painel de gestão</h3></div><p class="hint" style="margin:2px 0 12px">Presença dos últimos 30 dias · visão da direção</p><div class="grid g2" style="margin-bottom:12px"><div class="card" style="margin:0;padding:12px;background:#f2f8ff"><div class="num" style="color:var(--azul)">${geral.pct===null?'—':geral.pct+'%'}</div><small>Presença geral (30 dias)</small></div><div class="card" style="margin:0;padding:12px;background:#fff4f4"><div class="num" style="color:var(--vermelho)">${alertas.length}</div><small>Alunos em alerta</small></div></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:#64748b;font-size:12px;border-bottom:1px solid var(--linha)"><th style="padding:4px">Turma</th><th style="text-align:center">Alunos</th><th>Presença (30d)</th><th style="text-align:center">Alertas</th></tr></thead><tbody>${linhas}</tbody></table></div></div>`;
}
VIEWS.painel=()=>{
  const v=document.getElementById('view');
  const tv=turmasVisiveis();
  const nTurmas=tv.length;
  const nAl=S.alunos.filter(a=>tv.some(t=>t.id===a.turmaId)).length;
  const nAlertas=totalAlertas();
  const planosAbertos=S.planos.filter(p=>p.itens.some(i=>!i.done)).length;
  const ehProf=S.perfil==='professor';
  const cards=[
    {ic:'👥',bg:'#eaf3ff',cor:'var(--azul)',num:numAlunosMasc(nAl),lbl:'Alunos ativos',tap:(_alunosVisiveis?'':'pedirRevelarAlunos()'),dir:true},
    {ic:'📚',bg:'#fff8e0',cor:'#b88600',num:nTurmas,lbl:ehProf?'Minhas turmas':'Turmas'},
    {ic:'🔔',bg:'#fdeaea',cor:'var(--vermelho)',num:nAlertas,lbl:'Alertas abertos',tap:(nAlertas?'verAlertas()':'')},
    {ic:'🗒️',bg:'#f4ecff',cor:'#9333c7',num:planosAbertos,lbl:'Planos em andamento'},
  ].filter(c=>!c.dir || S.perfil==='direcao');   // total de alunos só para a direção
  const paHtml=(typeof renderProximasAulas==='function')?renderProximasAulas():'';   // trilho "próximas aulas" (b104)
  v.innerHTML=`
    <div class="section-title"><span class="feijao fj" style="background:var(--amarelo)"></span><h2 class="display">Olá, ${S.usuario}!</h2></div>
    <p class="sub">Resumo rápido — ${brDate(hoje())}</p>
    ${paHtml}
    <div class="grid g4" style="margin-bottom:8px">
      ${cards.map(c=>`<div class="card" ${c.tap?`onclick="${c.tap}" style="cursor:pointer"`:''}><div class="kpi"><div class="k-ic" style="background:${c.bg};color:${c.cor}">${c.ic}</div><div><div class="num">${c.num}</div><small>${c.lbl}</small></div></div></div>`).join('')}
    </div>`;
  if(S.perfil==='direcao' && _alunosVisiveis) v.appendChild(el(`<div style="margin:-4px 0 10px"><button class="btn ghost sm" onclick="ocultarAlunos()">🔒 Ocultar total de alunos</button></div>`));
  if(S.perfil==='direcao') v.appendChild(el(renderPainelGestao()));
  if(S.perfil==='direcao'){ const _rs=(typeof renderResumoSemana==='function')?renderResumoSemana():''; if(_rs) v.appendChild(el(_rs)); }   // resumo da semana (consolida faltas/material/VIP/pendências)
  { const _pc=(S.perfil!=='direcao')?renderPendenciasCard():''; if(_pc) v.appendChild(el(_pc)); }   // pendências (chamada/plano/relatório) — direção vê no resumo
  { const _vp=(S.perfil!=='direcao' && typeof renderPendenciasVipCard==='function')?renderPendenciasVipCard():''; if(_vp) v.appendChild(el(_vp)); }   // aulas VIP previstas sem registro — direção vê no resumo
  { const _rb=renderBoletinsReprovadosCard(); if(_rb) v.appendChild(el(_rb)); }   // aviso ao professor: boletins reprovados
  { const _na=apoioBadge();
    if(_na){
      const _msg = S.perfil==='direcao' ? `${_na} indicação(ões) de aula de apoio aguardam sua aprovação.`
                 : S.perfil==='secretaria' ? `${_na} aula(s) de apoio aprovada(s) aguardam agendamento.` : '';
      if(_msg) v.appendChild(el(`<div class="card" style="border-left:4px solid var(--rosa)">
        <h3>🤝 Aula de apoio</h3><p class="hint">${_msg}</p>
        <button class="btn" style="background:var(--rosa)" onclick="ir('apoio')">Ver indicações</button></div>`));
    }
  }
  if((S.perfil==='secretaria'||S.perfil==='direcao') && nAlertas){
    v.appendChild(el(`<div class="card" style="border-left:4px solid var(--vermelho)">
      <h3>🔔 ${nAlertas} aluno(s) precisam de contato</h3>
      <p class="hint">A secretaria deve entrar em contato com os responsáveis.</p>
      <button class="btn red" onclick="ir('alertas')">Ver alertas</button></div>`));
  }
  v.appendChild(el(`<div class="card">
    <h3>Atalhos</h3><p class="hint">O que você quer fazer agora?</p>
    <div class="row">
      ${S.perfil!=='secretaria'?'<button class="btn ghost" onclick="ir(\'presenca\')">📋 Fazer chamada</button>':''}
      ${S.perfil!=='secretaria'?'<button class="btn ghost" onclick="atalhoNovoPlano()">🗒️ Criar plano de aula</button>':''}
      ${S.perfil!=='secretaria'?'<button class="btn ghost" onclick="abrirNovoApoio()">🤝 Encaminhar p/ apoio</button>':''}
      <button class="btn ghost" onclick="ir('resumo')">✉️ Relatórios</button>
      ${S.perfil!=='professor'?'<button class="btn ghost" onclick="ir(\'alertas\')">🔔 Avisos</button>':''}
      ${S.perfil==='direcao'?'<button class="btn ghost" onclick="ir(\'tarefas\')">🎯 Tarefas internas</button>':''}
    </div></div>`));
};

/* ===== Trilho "Próximas aulas" no Painel (b104) — aditivo, olhar pra frente ===== */
function _paHora(t){ const m=String((t&&t.horario)||'').match(/(\d{1,2}):(\d{2})/); return m?m[0]:''; }
function proximasAulasLista(limite){
  const tv=(typeof turmasVisiveis==='function')?turmasVisiveis():S.turmas.filter(t=>!t.arquivada);
  const h=hoje(); const itens=[];
  tv.forEach(t=>{
    if(!t.dias||!t.dias.length) return;
    const fut=datasAula(t.id,0,3).filter(d=>d>=h).sort();
    if(!fut.length) return;
    itens.push({turma:t, data:fut[0], hora:_paHora(t), nAl:S.alunos.filter(a=>a.turmaId===t.id).length});
  });
  itens.sort((a,b)=> a.data.localeCompare(b.data) || (a.hora||'').localeCompare(b.hora||''));
  return itens.slice(0, limite||6);
}
function renderProximasAulas(){
  const itens=proximasAulasLista(6); if(!itens.length) return '';
  const h=hoje();
  const cards=itens.map(it=>{
    const ehHoje=it.data===h;
    const quando= ehHoje ? ('Hoje'+(it.hora?' · '+it.hora:'')) : (DIAS_SEMANA[weekdayOf(it.data)]+' '+brDate(it.data).slice(0,5)+(it.hora?' · '+it.hora:''));
    return `<button class="pa-card${ehHoje?' hoje':''}" onclick="ir('presenca')">
      ${ehHoje?'<span class="pa-now">HOJE</span>':''}
      <div class="pa-when">${quando}</div>
      <div class="pa-turma">${escAttr(it.turma.nome)}</div>
      <div class="pa-meta">${it.nAl} aluno(s)${it.turma.professor?(' · '+escAttr(it.turma.professor)):''}</div>
      ${it.turma.nivel?('<div style="margin-top:9px">'+nivelTag(it.turma.nivel)+'</div>'):''}
    </button>`;
  }).join('');
  return `<div class="pa-wrap"><div class="pa-head">🗓️ Suas próximas aulas</div><div class="pa-rail">${cards}</div></div>`;
}

/* ===== Meu perfil (b108) — cada usuário edita os próprios dados ===== */
VIEWS.perfil=()=>{
  const v=document.getElementById('view');
  const u=(S.usuarios||[]).find(x=>x.nome===S.usuario)||{nome:S.usuario};
  const meta=(typeof PERFIS!=='undefined'&&PERFIS[S.perfil])||{cor:'var(--azul)',nome:''};
  const ini=escAttr(((u.nome||'·').trim()[0]||'·').toUpperCase());
  v.innerHTML=`
    <div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Meu perfil</h2></div>
    <p class="sub">Seus dados — só você edita o seu.</p>
    <div class="card">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px">
        <div class="fx-av fotoav" data-foto="${escAttr(u.foto||'')}" style="background:${meta.cor};width:74px;height:74px;font-size:1.9rem;overflow:visible">
          <span class="fotoav-ini" style="color:#fff">${ini}</span>
          <button class="fotoav-add" onclick="enviarFoto('usuario','${escAttr(S.usuario)}')" title="Trocar foto" aria-label="Trocar foto">📷</button>
        </div>
        <div><div style="font-family:'Poppins';font-weight:600;font-size:1.15rem">${escAttr(u.nome||'')}</div>
          <div class="hint">${escAttr(meta.nome||'')} · toque no 📷 para a foto</div></div>
      </div>
      <div class="field"><label class="lbl">Nome completo</label>
        <input type="text" id="pfNome" value="${escAttr(u.nomeCompleto||'')}" placeholder="Seu nome completo"></div>
      <div class="row">
        <div class="field"><label class="lbl">E-mail</label>
          <input type="email" id="pfEmail" value="${escAttr(u.email||'')}" placeholder="email@exemplo.com"></div>
        <div class="field"><label class="lbl">Telefone / WhatsApp</label>
          <input type="text" id="pfTel" value="${escAttr(u.telefone||'')}" placeholder="(51) 9 9999-9999"></div>
      </div>
      <div class="field" style="max-width:220px"><label class="lbl">Data de nascimento</label>
        <input type="date" id="pfNasc" value="${escAttr(u.nascimento||'')}"></div>
      <button class="btn" onclick="salvarPerfil()">💾 Salvar</button>
    </div>`;
};
function salvarPerfil(){
  const u=(S.usuarios||[]).find(x=>x.nome===S.usuario); if(!u){ toast('Usuário não encontrado'); return; }
  u.nomeCompleto=(document.getElementById('pfNome').value||'').trim();
  u.email=(document.getElementById('pfEmail').value||'').trim();
  u.telefone=(document.getElementById('pfTel').value||'').trim();
  u.nascimento=document.getElementById('pfNasc').value||'';
  save(); toast('Perfil salvo ✅');
}
