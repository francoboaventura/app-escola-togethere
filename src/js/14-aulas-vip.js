/* ===== AULAS VIP (aulas avulsas por aluno) ===== */
let vipSel=null;
function fmtDur(min){ min=+min||0; const h=Math.floor(min/60), m=min%60; if(!min)return '0min'; return (h?h+'h':'')+(m?(h?' ':'')+m+'min':''); }

/* ===== Pacotes de horas (VIP) ===== */
// Consumo: aulas dadas (presente) + faltas em que se optou por debitar (professor disponível).
function vipConsumoMin(vid){ return (S.aulasVip||[]).filter(a=>a.vipId===vid && (!a.faltou || a.cobrarFalta)).reduce((s,a)=>s+(+a.duracaoMin||0),0); }
function vipContratadoMin(vid){ return (S.pacotesVip||[]).filter(p=>p.vipId===vid && !p.arquivado).reduce((s,p)=>s+((+p.horas||0)*60),0); }
function vipSaldoMin(vid){ return vipContratadoMin(vid)-vipConsumoMin(vid); }
function vipVigenciaFim(vid){ const fs=(S.pacotesVip||[]).filter(p=>p.vipId===vid && !p.arquivado && p.fim).map(p=>p.fim).sort(); return fs.length?fs[fs.length-1]:''; }
function vipDiasVigencia(vid){ const f=vipVigenciaFim(vid); if(!f) return null; return Math.round((new Date(f+'T23:59:59').getTime()-Date.now())/864e5); }
function vipAlertaPacote(vid){
  const pac=(S.pacotesVip||[]).filter(p=>p.vipId===vid && !p.arquivado);
  if(!pac.length) return null;
  const saldoMin=vipSaldoMin(vid), saldoH=saldoMin/60, dias=vipDiasVigencia(vid);
  const esgotado=saldoMin<=0, baixo=saldoMin>0 && saldoH<5, vencendo=dias!=null&&dias<=30&&dias>=0, vencido=dias!=null&&dias<0;
  if(esgotado||baixo||vencendo||vencido) return {saldoH,saldoMin,dias,esgotado,baixo,vencendo,vencido,fim:vipVigenciaFim(vid)};
  return null;
}
function _vipAlertaTxt(al){
  const m=[];
  if(al.esgotado) m.push('saldo esgotado'); else if(al.baixo) m.push('saldo baixo ('+fmtDur(al.saldoMin)+')');
  if(al.vencido) m.push('vigência vencida'); else if(al.vencendo) m.push('vigência acaba em '+al.dias+' dia'+(al.dias===1?'':'s'));
  return m.join(' · ');
}
function _cardPacoteVip(vid){
  if(ehProfessor()) return '';   // professor VIP só lança aulas/tema; controle de horas é da secretaria/direção
  const ehGestor=(S.perfil==='direcao'||soLeitura());
  const contr=vipContratadoMin(vid), usado=vipConsumoMin(vid), saldo=contr-usado;
  const pac=(S.pacotesVip||[]).filter(p=>p.vipId===vid && !p.arquivado).sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||''));
  const fim=vipVigenciaFim(vid), dias=vipDiasVigencia(vid), al=vipAlertaPacote(vid);
  const tile=(v,l,c)=>`<div class="fx-tile"><div class="v" style="color:${c}">${v}</div><div class="l">${l}</div></div>`;
  let h=`<div class="card"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0;flex:1">⏱️ Pacote de horas</h3>${ehGestor?`<button class="btn ghost sm" onclick="addPacoteVip('${vid}')">+ Novo pacote</button>`:''}</div>`;
  if(!pac.length && !usado){ return h+`<p class="hint" style="margin:8px 0 0">Nenhum pacote cadastrado.${ehGestor?' Clique em “+ Novo pacote” quando o aluno contratar horas.':''}</p></div>`; }
  h+=`<div class="fx-tiles" style="margin-top:10px">
    ${tile(fmtDur(contr),'Contratadas','#005EAF')}
    ${tile(fmtDur(usado),'Utilizadas','#b8860b')}
    ${tile(fmtDur(Math.max(0,saldo)),'Saldo',saldo<=0?'var(--vermelho)':'var(--ok)')}
    ${tile(fim?brDate(fim):'—','Válido até',(dias!=null&&dias<=30)?'#c2560b':'var(--tinta)')}
  </div>`;
  if(ehGestor) h+=`<div class="row" style="flex-wrap:wrap;margin-top:10px">
      <div class="field" style="flex:1;min-width:150px;margin:0"><label class="lbl">✏️ Horas contratadas</label><input type="number" min="0" step="1" value="${contr/60}" onchange="setVipContratadas('${vid}',this.value)"></div>
      <div class="field" style="flex:1;min-width:150px;margin:0"><label class="lbl">✏️ Horas utilizadas</label><input type="number" min="0" step="0.25" value="${(usado/60)}" onchange="setVipUtilizadas('${vid}',this.value)"></div>
    </div>
    <p class="hint" style="margin:6px 0 0">Editar aqui ajusta o total na hora. As aulas lançadas continuam contando; o valor de "utilizadas" que você digitar prevalece como ajuste.</p>`;
  if(al) h+=`<div class="card" style="background:#fff1e6;border:1px solid #ffd9bf;margin-top:10px;padding:10px 12px"><b style="color:#c2560b">⚠️ Atenção:</b> <span class="hint">${_vipAlertaTxt(al)}. Renovar ou avisar o responsável.</span></div>`;
  h+=pac.map(p=>{
    const d=p.fim?Math.round((new Date(p.fim+'T23:59:59').getTime()-Date.now())/864e5):null;
    return `<div style="border-top:1px solid var(--linha);padding:8px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1"><b>${(+p.horas||0)}h</b>${p.inicio?(' · de '+brDate(p.inicio)):''}${p.fim?(' até '+brDate(p.fim)):''}${p.obs?(' · '+escAttr(p.obs)):''}${d!=null&&d<0?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">vencido</span>':''}</span>${ehGestor?`<button class="btn ghost sm" onclick="editarPacoteVip('${p.id}')">✏️</button><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delPacoteVip('${p.id}')">excluir</button>`:''}</div>`;
  }).join('');
  return h+`</div>`;
}
function addPacoteVip(vid){ if(!(S.perfil==='direcao'||soLeitura())) return toast('Sem permissão'); _modalPacoteVip(vid,null); }
function editarPacoteVip(id){ const p=(S.pacotesVip||[]).find(x=>x.id===id); if(!p) return; _modalPacoteVip(p.vipId,p); }
function _modalPacoteVip(vid,p){
  modal(`<h3>${p?'Editar':'Novo'} pacote de horas <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Horas contratadas</label><input type="number" id="pkHoras" min="1" step="1" value="${p?(+p.horas||''):''}" placeholder="Ex: 20"></div>
    <div class="row" style="margin-top:10px"><div class="field" style="flex:1"><label class="lbl">Início da vigência</label><input type="date" id="pkInicio" value="${p?escAttr(p.inicio||''):hoje()}"></div>
      <div class="field" style="flex:1"><label class="lbl">Fim da vigência</label><input type="date" id="pkFim" value="${p?escAttr(p.fim||''):''}"></div></div>
    <div class="field" style="margin-top:10px"><label class="lbl">Observação (opcional)</label><input type="text" id="pkObs" value="${p?escAttr(p.obs||''):''}" placeholder="Ex: pago via PIX, contrato #123"></div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn" onclick="salvarPacoteVip('${vid}','${p?p.id:''}')">Salvar</button><button class="btn ghost" onclick="fechar()">Cancelar</button></div>`);
}
function salvarPacoteVip(vid,id){
  if(!(S.perfil==='direcao'||soLeitura())) return toast('Sem permissão');
  const horas=+document.getElementById('pkHoras').value||0;
  if(horas<=0) return toast('Informe as horas contratadas');
  const inicio=document.getElementById('pkInicio').value||'';
  const fim=document.getElementById('pkFim').value||'';
  const obs=(document.getElementById('pkObs').value||'').trim();
  if(id){ const p=(S.pacotesVip||[]).find(x=>x.id===id); if(p){ p.horas=horas; p.inicio=inicio; p.fim=fim; p.obs=obs; p.atualizadoEm=Date.now(); } }
  else { S.pacotesVip.push({id:uid(), vipId:vid, horas, inicio, fim, obs, criadoEm:Date.now(), atualizadoEm:Date.now()}); }
  save(); fechar(); VIEWS.vip(); toast('Pacote salvo ✅');
}
function delPacoteVip(id){
  if(!(S.perfil==='direcao'||soLeitura())) return toast('Sem permissão');
  if(!confirm('Excluir este pacote de horas?')) return;
  S.pacotesVip=(S.pacotesVip||[]).filter(x=>x.id!==id); marcarExcluido('pacotesVip',id);
  save(); VIEWS.vip(); toast('Pacote excluído');
}
// Secretaria/direção editam as horas contratadas direto na ficha.
function setVipContratadas(vid, val){
  if(!(S.perfil==='direcao'||soLeitura())) return toast('Sem permissão');
  const alvoH=Math.max(0, Math.round(parseFloat(String(val||'0').replace(',','.'))||0));
  const pac=(S.pacotesVip||[]).filter(p=>p.vipId===vid && !p.arquivado).sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||''));
  if(!pac.length){ S.pacotesVip.push({id:uid(), vipId:vid, horas:alvoH, inicio:hoje(), fim:'', obs:'', criadoEm:Date.now(), atualizadoEm:Date.now()}); }
  else { const outros=pac.slice(1).reduce((s,p)=>s+(+p.horas||0),0); pac[0].horas=Math.max(0, alvoH-outros); pac[0].atualizadoEm=Date.now(); }
  save(); VIEWS.ficha(); toast('Horas contratadas atualizadas');
}
// Editar "utilizadas": mantém as aulas lançadas e guarda um ajuste único para bater o total.
function setVipUtilizadas(vid, val){
  if(!(S.perfil==='direcao'||soLeitura())) return toast('Sem permissão');
  const alvoMin=Math.max(0, Math.round((parseFloat(String(val||'0').replace(',','.'))||0)*60));
  const conta=a=>a.vipId===vid && (!a.faltou || a.cobrarFalta);
  const baseMin=(S.aulasVip||[]).filter(a=>conta(a) && !a.ajusteManual).reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const delta=alvoMin-baseMin;
  const aj=(S.aulasVip||[]).find(a=>a.vipId===vid && a.ajusteManual);
  if(delta===0){ if(aj) S.aulasVip=S.aulasVip.filter(a=>a!==aj); }
  else if(aj){ aj.duracaoMin=delta; aj.atualizadoEm=Date.now(); }
  else { S.aulasVip.push({id:uid(), vipId:vid, data:hoje(), tema:'Ajuste', descricao:'Ajuste manual de horas utilizadas', duracaoMin:delta, faltou:false, cobrarFalta:false, ajusteManual:true, atualizadoEm:Date.now()}); }
  save(); VIEWS.ficha(); toast('Horas utilizadas atualizadas');
}
function _bannerAlertasVip(lista){
  const avisos=(lista||[]).filter(a=>vipAlertaPacote(a.id));
  if(!avisos.length) return '';
  return `<div class="card" style="background:#fff1e6;border:1px solid #ffd9bf"><b style="color:#c2560b">⚠️ Pacotes de horas — atenção (${avisos.length})</b>${avisos.map(a=>`<p class="hint" style="margin:6px 0 0"><b>${esc(a.nome)}</b>: ${_vipAlertaTxt(vipAlertaPacote(a.id))}</p>`).join('')}</div>`;
}
// =========================================================================
//  Horários previstos das aulas VIP + alerta de aula não registrada.
//  Espelha o comportamento das turmas: passada a aula prevista, se +2h sem
//  registro avisa o professor; após ~24h escala para a direção.
// =========================================================================
function vipTemHorario(vip){ return !!(vip && Array.isArray(vip.dias) && vip.dias.length); }
function vipHorarioLabel(vip){
  if(!vipTemHorario(vip)) return '';
  const ds=vip.dias.slice().sort((a,b)=>a-b).map(d=>DIAS_SEMANA[d]).join(', ');
  return ds + (vip.horaPrev?(' · '+vip.horaPrev):'');
}
function _fimAulaVipTs(data, hora){
  const a=String(data).split('-').map(Number);
  const m=String(hora||'').match(/(\d{1,2}):(\d{2})/);
  const h=m?+m[1]:23, mi=m?+m[2]:0;
  return new Date(a[0], a[1]-1, a[2], h, mi, 0).getTime();
}
function _datasPrevistasVip(vip, atras, frente){
  if(!vipTemHorario(vip)) return [];
  atras=atras==null?3:atras; frente=frente==null?0:frente;
  const out=[]; const dias=vip.dias;
  const a=new Date(); a.setDate(a.getDate()-atras*7);
  const b=new Date(); b.setDate(b.getDate()+frente*7);
  for(let d=new Date(a); d<=b; d.setDate(d.getDate()+1)){ if(dias.indexOf(d.getDay())>=0) out.push(ymd(new Date(d))); }
  return out;
}
// conta como "registrada" se há aula VIP na data ou ±1 dia (VIPs remarcam com frequência)
function _vipTemAulaPerto(vid, data){
  const alvo=new Date(data+'T12:00:00').getTime();
  return (S.aulasVip||[]).some(x=>x.vipId===vid && !x.ajusteManual && Math.abs(new Date(x.data+'T12:00:00').getTime()-alvo)<=864e5);
}
function pendenciasAulaVip(vid){
  const vip=(S.vipAlunos||[]).find(v=>v.id===vid); if(!vipTemHorario(vip)) return [];
  const out=[]; const hojeY=hoje();
  const c=new Date(); c.setDate(c.getDate()-PEND_JANELA_DIAS); const corteY=ymd(c);
  _datasPrevistasVip(vip, Math.ceil(PEND_JANELA_DIAS/7)+1, 0).forEach(data=>{
    if(data<corteY || data>hojeY) return;
    if(data<PEND_INICIO) return;
    if((typeof _emRecessoISO==='function' && _emRecessoISO(data)) || (typeof _emFeriasFixas==='function' && _emFeriasFixas(data))) return;
    if(_vipTemAulaPerto(vid, data)) return;
    const nivel=_nivelPend(_fimAulaVipTs(data, vip.horaPrev)); if(!nivel) return;
    out.push({ vipId:vid, nome:vip.nome, data, tipo:'aulavip', nivel, fimTs:_fimAulaVipTs(data, vip.horaPrev) });
  });
  return out;
}
function _souProfVip(vip){
  const e=(typeof _meuEnsina==='function')?_meuEnsina():'';
  const alvo=_normTxt((vip&&vip.professor)||'');
  return !!alvo && (alvo===_normTxt(e||'') || alvo===_normTxt(S.usuario||''));
}
function pendenciasVipParaMim(){
  // (recesso/férias já são tratados por data em pendenciasAulaVip — mesmo critério das turmas)
  if(S.perfil==='professor'){
    let out=[]; (S.vipAlunos||[]).forEach(v=>{ if(!v.arquivado && _souProfVip(v)) out=out.concat(pendenciasAulaVip(v.id)); }); return out;
  }
  if(S.perfil==='direcao'){
    let out=[]; (S.vipAlunos||[]).forEach(v=>{ if(!v.arquivado) out=out.concat(pendenciasAulaVip(v.id).filter(p=>p.nivel==='dir')); }); return out;
  }
  return [];   // secretaria não recebe pendência de lançamento de aula
}
function renderPendenciasVipCard(){
  const ps=pendenciasVipParaMim(); if(!ps.length) return '';
  const temDir=ps.some(p=>p.nivel==='dir');
  const porVip={}; ps.forEach(p=>{ (porVip[p.vipId]=porVip[p.vipId]||[]).push(p); });
  const blocos=Object.keys(porVip).map(vid=>{
    const nome=(porVip[vid][0]||{}).nome||'—';
    const linhas=porVip[vid].sort((a,b)=>b.fimTs-a.fimTs).map(p=>{
      const tagDir=(p.nivel==='dir')?' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">⏱ +24h</span>':'';
      return `<div class="check"><span style="flex:1">${brDate(p.data)} · <b>aula VIP não registrada</b>${tagDir}</span>
        <button class="btn ghost sm" onclick="abrirFicha('${vid}')">lançar ›</button></div>`;
    }).join('');
    return `<div style="margin-top:10px"><div style="font-weight:600">👑 ${esc(nome)}</div>${linhas}</div>`;
  }).join('');
  const sub = S.perfil==='professor' ? 'Aula particular prevista sem registro. Lance a aula (ou marque a falta) — após 24h a direção é avisada.'
            : 'Aulas particulares previstas e ainda não registradas pelo professor (mais de 24h).';
  return `<div class="card" style="border-left:4px solid ${temDir?'var(--vermelho)':'var(--laranja)'}">
    <h3>👑 ${ps.length} aula(s) VIP pendente(s)</h3><p class="hint">${sub}</p>${blocos}</div>`;
}
VIEWS.vip=()=>{
  const v=document.getElementById('view');
  const ehDir=S.perfil==='direcao';
  const ehSec=soLeitura();               // secretaria: gestão (vê todos, troca professor, converte), mas não lança aula
  const ehGestor=ehDir||ehSec;
  const meuEns=_meuEnsina();
  const profs=[...new Set((S.usuarios||[]).filter(u=>u.ensina).map(u=>u.ensina).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const lista=S.vipAlunos.filter(a=>!a.arquivado && (ehGestor || a.professor===meuEns)).sort((a,b)=>a.nome.localeCompare(b.nome));
  if(vipSel && !lista.some(a=>a.id===vipSel)) vipSel=null;
  vipSel=vipSel||(lista[0]&&lista[0].id)||null;
  const vObj=lista.find(a=>a.id===vipSel)||{};
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:#C8A200"></span><h2 class="display">👑 Alunos VIP</h2></div>
    <p class="sub">${ehSec?'Gestão dos alunos particulares — vincule cada um a um professor ou converta para turma.':ehDir?'Aulas particulares, uma a uma. Cadastre o aluno, vincule a um professor e lance cada aula.':'Seus alunos particulares — cadastre, lance cada aula e tire o relatório.'}</p>
    ${ehGestor?_bannerAlertasVip(lista):''}
    <div class="card"><h3>Alunos VIP</h3>
      ${!ehSec?`<div class="row"><div style="flex:3"><input type="text" id="vipNome" placeholder="Nome do aluno VIP" onkeydown="if(event.key==='Enter')addVipAluno()"></div>
      ${ehDir?`<div style="flex:2"><select id="vipProf"><option value="">— professor…</option>${profs.map(p=>`<option value="${escAttr(p)}">${esc(p)}</option>`).join('')}</select></div>`:''}
      <button class="btn ghost" onclick="addVipAluno()">+ Aluno VIP</button></div>`:''}
      ${lista.length?`<div class="field" style="margin-top:12px"><label class="lbl">Selecionar aluno (abre a ficha completa)</label><select id="vipSelAluno" onchange="if(this.value)abrirFicha(this.value)"><option value="">— escolha um aluno…</option>${lista.map(a=>`<option value="${a.id}">${a.nome}${ehGestor?(a.professor?' · '+esc(a.professor):' · (sem professor)'):''}</option>`).join('')}</select></div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${lista.map(a=>`<button class="btn ghost sm" onclick="abrirFicha('${a.id}')">${esc(a.nome)}</button>`).join('')}</div>`:`<p class="hint" style="margin:10px 0 0">${ehGestor?'Nenhum aluno VIP cadastrado ainda.':'Você ainda não tem alunos VIP.'}</p>`}
      ${vipSel&&ehGestor?`<div class="row" style="margin-top:10px;align-items:flex-end;gap:8px">
        <div style="flex:1"><label class="lbl">Professor(a) responsável</label><select id="vipTrocaProf" onchange="trocarProfVip('${vipSel}',this.value)"><option value="">— sem professor</option>${profs.map(p=>`<option value="${escAttr(p)}" ${vObj.professor===p?'selected':''}>${esc(p)}</option>`).join('')}</select></div>
        <button class="btn ghost sm" onclick="vipParaAluno('${vipSel}')">🎓 Mover para turma</button></div>`:''}
    </div>
    ${vipSel?_cardPacoteVip(vipSel):''}
    ${vipSel&&!ehSec?`<div class="card"><h3>Lançar aula</h3>
      <div class="field"><label class="lbl">Tema</label><input type="text" id="vipTema" placeholder="Ex: Simple Past · entrevista de emprego"></div>
      <div class="field"><label class="lbl">Descrição da aula</label><textarea id="vipDesc" style="min-height:130px" placeholder="Ex: Conversação — entrevista de emprego. Descreva com detalhes o que foi trabalhado na aula."></textarea></div>
      <div class="field"><label class="lbl">📚 Tema de casa (opcional)</label><input type="text" id="vipTemaCasa" placeholder="Ex: Unit 4 · ex. 3 a 6"></div>
      <div class="row">
        <div class="field"><label class="lbl">Data</label><input type="date" id="vipData" value="${hoje()}"></div>
        <div class="field"><label class="lbl">Duração (min)</label><input type="number" id="vipDur" value="60" min="5" step="5"></div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:2px 0 6px"><input type="checkbox" id="vipFaltou" onchange="document.getElementById('vipCobrarWrap').style.display=this.checked?'flex':'none'"> ❌ Aluno não compareceu</label>
      <label id="vipCobrarWrap" style="display:none;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:0 0 12px 22px;color:#b8860b"><input type="checkbox" id="vipCobrarFalta"> 💳 Debitar a hora mesmo assim (o professor estava disponível)</label>
      <button class="btn" onclick="addAulaVip()">+ Lançar aula</button></div>
      <div class="card" id="vipBox"></div>`:''}`;
  renderVipLista();
};
// --- Converter entre aluno de turma e VIP (só direção). Preserva o histórico arquivando a origem. ---
function alunoParaVip(alunoId){
  if(ehProfessor()) return toast('Sem permissão para alterar a modalidade do aluno');
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return;
  if(!confirm('Transformar "'+a.nome+'" em aluno VIP? Ele sai da turma (o histórico é preservado) e passa a ter aulas VIP individuais.')) return;
  const tOrig=(S.turmas||[]).find(x=>x.id===a.turmaId);
  S.vipAlunos.push({id:uid(), nome:a.nome, professor:(tOrig&&tOrig.professor)||''});
  vipSel=S.vipAlunos[S.vipAlunos.length-1].id;
  a.arquivado=true; a.atualizadoEm=Date.now();
  save(); montarNav(); toast(a.nome+' agora é aluno VIP'); ir('vip');
}
function vipParaAluno(vipId){
  if(ehProfessor()) return toast('Sem permissão para alterar a modalidade do aluno');
  const v=(S.vipAlunos||[]).find(x=>x.id===vipId); if(!v) return;
  const destinos=(S.turmas||[]).filter(t=>!t.arquivada).sort((x,y)=>(x.nome||'').localeCompare(y.nome||''));
  if(!destinos.length) return toast('Crie uma turma ativa primeiro');
  modal(`<h3>Mover VIP para turma <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 8px"><b>${esc(v.nome)}</b> deixará de ser VIP e entrará como aluno de turma. O histórico das aulas VIP é preservado.</p>
    <div class="field"><label class="lbl">Turma de destino</label>
      <select id="vpDestino">${destinos.map(t=>`<option value="${t.id}">${esc(t.nome)}${t.professor?' · '+esc(t.professor):''}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn" onclick="confirmarVipParaAluno('${vipId}')">Confirmar</button><button class="btn ghost" onclick="fechar()">Cancelar</button></div>`);
}
function confirmarVipParaAluno(vipId){
  if(ehProfessor()) return toast('Sem permissão para alterar a modalidade do aluno');
  const v=(S.vipAlunos||[]).find(x=>x.id===vipId); if(!v) return;
  const destino=(document.getElementById('vpDestino')||{}).value;
  const t=(S.turmas||[]).find(x=>x.id===destino); if(!t) return toast('Selecione a turma de destino');
  S.alunos.push({id:uid(), nome:v.nome, turmaId:t.id});
  v.arquivado=true; v.atualizadoEm=Date.now();
  if(vipSel===vipId) vipSel=null;
  save(); fechar(); montarNav(); toast(v.nome+' movido para '+t.nome); ir('turmas');
}
function addVipAluno(){
  const nome=(document.getElementById('vipNome').value||'').trim(); if(!nome)return toast('Digite o nome');
  let professor;
  if(S.perfil==='direcao'){ professor=((document.getElementById('vipProf')||{}).value||'').trim(); if(!professor) return toast('Escolha o professor responsável'); }
  else { professor=_meuEnsina(); }
  const a={id:uid(),nome,professor}; S.vipAlunos.push(a); vipSel=a.id; save(); VIEWS.vip(); toast('Aluno VIP cadastrado');
}
function trocarProfVip(vipId, prof){
  if(ehProfessor()) return;
  const v=(S.vipAlunos||[]).find(x=>x.id===vipId); if(!v) return;
  v.professor=(prof||'').trim(); v.atualizadoEm=Date.now();
  save(); toast(v.professor?('VIP agora é de '+v.professor):'Professor removido do VIP');
}
function delVipAluno(id){
  if(!confirm('Excluir este aluno VIP e todas as suas aulas?'))return;
  S.aulasVip.filter(x=>x.vipId===id).forEach(x=>marcarExcluido('aulasVip',x.id)); marcarExcluido('vipAlunos',id);
  S.vipAlunos=S.vipAlunos.filter(a=>a.id!==id); S.aulasVip=S.aulasVip.filter(x=>x.vipId!==id);
  if(vipSel===id)vipSel=null; save(); VIEWS.vip(); toast('Aluno VIP excluído');
}
function addAulaVip(){
  const vid=vipSel; if(!vid)return toast('Selecione um aluno VIP');
  const tema=(document.getElementById('vipTema').value||'').trim();
  const temaCasa=(document.getElementById('vipTemaCasa').value||'').trim();
  const desc=document.getElementById('vipDesc').value.trim(); if(!desc)return toast('Descreva a aula');
  const data=document.getElementById('vipData').value; if(!data)return toast('Escolha a data');
  const dur=+document.getElementById('vipDur').value||0;
  const faltou=!!document.getElementById('vipFaltou').checked;
  const cobrarFalta=faltou && !!((document.getElementById('vipCobrarFalta')||{}).checked);
  S.aulasVip.push({id:uid(),vipId:vid,data,tema,temaCasa,descricao:desc,duracaoMin:dur,faltou,cobrarFalta,atualizadoEm:Date.now()});
  save(); VIEWS.vip();   // re-renderiza p/ atualizar o saldo do pacote
  toast(faltou?(cobrarFalta?'Falta lançada e hora debitada':'Falta lançada (sem débito)'):'Aula lançada');
}
function delAulaVip(id){ if(!confirm('Excluir esta aula VIP?'))return; S.aulasVip=S.aulasVip.filter(x=>x.id!==id); marcarExcluido('aulasVip',id); save(); renderVipLista(); }
function editarAulaVip(id){
  if(soLeitura())return toast('Somente leitura — a secretaria não edita aulas VIP');
  const a=S.aulasVip.find(x=>x.id===id); if(!a)return;
  modal(`<h3>✏️ Editar aula VIP <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Tema</label><input type="text" id="evTema" value="${escAttr(a.tema||'')}" placeholder="Ex: Simple Past · entrevista de emprego"></div>
    <div class="field"><label class="lbl">Descrição da aula</label><textarea id="evDesc" style="min-height:150px" placeholder="O que foi trabalhado na aula">${escAttr(a.descricao||'')}</textarea></div>
    <div class="row"><div class="field"><label class="lbl">Data</label><input type="date" id="evData" value="${escAttr(a.data||'')}"></div>
      <div class="field"><label class="lbl">Duração (min)</label><input type="number" id="evDur" value="${+a.duracaoMin||0}" min="5" step="5"></div></div>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:2px 0 6px"><input type="checkbox" id="evFaltou" ${a.faltou?'checked':''} onchange="document.getElementById('evCobrarWrap').style.display=this.checked?'flex':'none'"> ❌ Aluno não compareceu</label>
    <label id="evCobrarWrap" style="display:${a.faltou?'flex':'none'};align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:0 0 12px 22px;color:#b8860b"><input type="checkbox" id="evCobrarFalta" ${a.cobrarFalta?'checked':''}> 💳 Debitar a hora mesmo assim (professor estava disponível)</label>
    <button class="btn block" onclick="salvarEdicaoAulaVip('${id}')">Salvar alterações</button>`);
  setTimeout(()=>{const i=document.getElementById('evDesc'); if(i)i.focus();},60);
}
function salvarEdicaoAulaVip(id){
  if(soLeitura())return toast('Somente leitura — a secretaria não edita aulas VIP');
  const a=S.aulasVip.find(x=>x.id===id); if(!a)return;
  const desc=(document.getElementById('evDesc').value||'').trim(); if(!desc)return toast('Descreva a aula');
  a.tema=(document.getElementById('evTema').value||'').trim();
  a.descricao=desc;
  a.data=document.getElementById('evData').value||a.data;
  a.duracaoMin=+document.getElementById('evDur').value||0;
  a.faltou=!!document.getElementById('evFaltou').checked;
  a.cobrarFalta=a.faltou && !!((document.getElementById('evCobrarFalta')||{}).checked);
  a.atualizadoEm=Date.now();                 // carimbo para a sincronização entre aparelhos
  save(); fechar(); VIEWS.vip(); toast('Aula atualizada');
}
function renderVipLista(){
  const box=document.getElementById('vipBox'); if(!box)return;
  const vid=vipSel, al=S.vipAlunos.find(a=>a.id===vid);
  if(!vid||!al){ box.innerHTML=''; return; }
  const aulas=S.aulasVip.filter(x=>x.vipId===vid && !x.ajusteManual).sort((a,b)=>b.data.localeCompare(a.data));
  const comp=aulas.filter(a=>!a.faltou); const compMin=comp.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const faltas=aulas.length-comp.length;
  let h=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0;flex:1">Aulas de ${al.nome}</h3>
    <button class="btn ghost sm" onclick="abrirFicha('${vid}')">📇 Ficha</button>
    <button class="btn amarelo sm" ${aulas.length?'':'disabled style="opacity:.5;cursor:not-allowed"'} onclick="copiarRelatorioVip()">📋 Copiar relatório</button>
    <button class="btn ghost sm" style="color:var(--vermelho)" onclick="delVipAluno('${vid}')">excluir aluno</button></div>`;
  if(!aulas.length){ box.innerHTML=h+'<p class="hint" style="margin:8px 0 0">Nenhuma aula lançada ainda.</p>'; return; }
  h+=`<p class="hint" style="margin:8px 0 10px"><b>${comp.length}</b> aula(s) com presença (${fmtDur(compMin)})${faltas?` · <b>${faltas}</b> falta(s)`:''}</p>`;
  h+=aulas.map(a=>`<div class="check"><span style="flex:1">${brDate(a.data)} · ${a.tema?`<b>${esc(a.tema)}</b> — `:''}<span style="white-space:pre-wrap">${esc(a.descricao)}</span> <span class="pill">${fmtDur(a.duracaoMin)}</span>${a.faltou?(' <span class="pill" style="background:#ffe9e9;color:var(--vermelho)">não compareceu</span>'+(a.cobrarFalta?' <span class="pill" style="background:#fff3cf;color:#8a6d00">hora debitada</span>':' <span class="pill" style="background:#eef1f6;color:#66788c">sem débito</span>')):''}</span><button class="btn ghost sm" onclick="editarAulaVip('${a.id}')">✏️ editar</button><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delAulaVip('${a.id}')">excluir</button></div>`).join('');
  box.innerHTML=h;
}
function corpoRelatorioVip(vid){
  const al=S.vipAlunos.find(a=>a.id===vid); if(!al)return'';
  const aulas=S.aulasVip.filter(x=>x.vipId===vid).sort((a,b)=>a.data.localeCompare(b.data));
  const comp=aulas.filter(a=>!a.faltou); const compMin=comp.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const faltas=aulas.length-comp.length;
  let b=`Relatório de aulas VIP — ${al.nome}\n`;
  if(aulas.length) b+=`Período: ${brDate(aulas[0].data)} a ${brDate(aulas[aulas.length-1].data)}\n`;
  b+=`\n`+aulas.map(a=>`• ${brDate(a.data)} — ${a.tema?a.tema+': ':''}${a.descricao} (${fmtDur(a.duracaoMin)})${a.faltou?' — NÃO COMPARECEU':''}`).join('\n');
  b+=`\n\nAulas com presença: ${comp.length} (${fmtDur(compMin)})${faltas?` · Faltas: ${faltas}`:''}\n`;
  b+=`\n${(S.config&&S.config.assinatura)||ASSINATURA_PADRAO}`;
  return b;
}
function copiarRelatorioVip(){ const txt=corpoRelatorioVip(vipSel); if(!txt)return toast('Nada para copiar'); copiarTexto(txt,'Relatório VIP copiado'); }
function gerarResumo(){
  const turmaId=document.getElementById('rT').value, data=document.getElementById('rD').value;
  const turma=S.turmas.find(t=>t.id===turmaId);
  const plano=S.planos.find(p=>p.turmaId===turmaId&&p.data===data);
  const tema=S.temas.find(t=>t.turmaId===turmaId&&t.data===data);
  const feitos=plano?plano.itens.filter(i=>i.done).map(i=>i.txt):[];
  let txt=`Olá, famílias! 👋\n\nResumo da aula de hoje (${brDate(data)}) — ${turma.nome}:\n\n`;
  if(plano){
    txt+=`📖 Conteúdo: ${plano.conteudo||plano.titulo}\n`;
    if(feitos.length)txt+=`✅ Trabalhamos: ${feitos.join(', ')}.\n`;
  }else{
    txt+=`📖 Tivemos mais um dia de aprendizado de inglês!\n`;
  }
  if(tema)txt+=`\n📚 Tema de casa: ${tema.descricao}\n`;
  else txt+=`\n📚 Hoje não passamos tema de casa.\n`;
  txt+=`\nQualquer dúvida, estamos à disposição.\nEquipe Togethere 💙\ninglês para chegar lá`;
  document.getElementById('rOut').textContent=txt;
}
function copiarResumo(){
  const t=document.getElementById('rOut').textContent;
  if(t.startsWith('Clique'))return toast('Gere o resumo primeiro');
  copiarTexto(t,'Texto copiado!');
}
// resumo do que foi dado numa aula (para os dias de falta)
function resumoAulaDoDia(turmaId,data){
  const plano=S.planos.find(p=>p.turmaId===turmaId&&p.data===data);
  const tema=S.temas.find(t=>t.turmaId===turmaId&&t.data===data);
  let s='';
  if(plano){ s=plano.conteudo||plano.titulo; const f=plano.itens.filter(i=>i.done).map(i=>i.txt); if(f.length)s+=' (trabalhado: '+f.join(', ')+')'; }
  if(tema) s+=(s?' | ':'')+'Tema passado: '+tema.descricao;
  return s||'aula não registrada no sistema';
}
function corpoRelatorioAluno(alunoId,turmaId,de,ate){
  const inRange=d=> (!de||d>=de) && (!ate||d<=ate);
  const aluno=S.alunos.find(a=>a.id===alunoId), turma=S.turmas.find(t=>t.id===turmaId);
  const faltas=faltasDoAluno(alunoId,turmaId).filter(inRange), mat=materialDoAluno(alunoId,turmaId).filter(inRange);
  const temas=temasNaoFeitosDoAluno(alunoId,turmaId).filter(t=>inRange(t.data)), coms=comentariosDoAluno(alunoId).filter(c=>inRange(c.data));
  const atrasos=atrasosDoAluno(alunoId,turmaId).filter(inRange), saidas=saidasCedoDoAluno(alunoId,turmaId).filter(inRange);
  const peso=pesoFalta(turmaId);
  const baseF=Number(aluno.faltasRetro)||0, totalF=baseF+faltas.length;
  let txt=`RELATÓRIO DO ALUNO\n${aluno.nome}\nTurma: ${turma.nome}${turma.professor?' · Prof. '+turma.professor:''}\nPeríodo: ${de?brDate(de):'início'} a ${ate?brDate(ate):'hoje'}\nGerado em ${brDate(hoje())} por ${S.usuario}\n`;
  txt+=`\n📋 FALTAS (${totalF}${peso===2?` — turma com 2 aulas por encontro`:''})\n`;
  if(baseF) txt+=`• ${baseF} falta(s) retroativas (registro manual)\n`;
  if(faltas.length) faltas.forEach(d=>{ txt+=`• ${brDate(d)} — conteúdo da aula: ${resumoAulaDoDia(turmaId,d)}\n`; });
  if(!totalF) txt+=`• Nenhuma falta registrada.\n`;
  txt+=`\n⏰ CHEGOU ATRASADO (${atrasos.length})\n`;
  if(atrasos.length) atrasos.forEach(d=>{ txt+=`• ${brDate(d)}\n`; }); else txt+=`• Nenhum registro.\n`;
  txt+=`\n🚪 SAIU MAIS CEDO (${saidas.length})\n`;
  if(saidas.length) saidas.forEach(d=>{ txt+=`• ${brDate(d)}\n`; }); else txt+=`• Nenhum registro.\n`;
  txt+=`\n🎒 MATERIAL NÃO TRAZIDO (${mat.length})\n`;
  if(mat.length) mat.forEach(d=>{ txt+=`• ${brDate(d)}\n`; }); else txt+=`• Nenhum registro.\n`;
  txt+=`\n📚 TEMAS DE CASA NÃO FEITOS / PARCIAIS (${temas.length})\n`;
  if(temas.length) temas.forEach(t=>{ txt+=`• ${brDate(t.data)} — ${t.descricao}${t.origem==='plano'?' (do plano de aula)':' (extra)'} — ${t.status==='parcial'?'parcialmente feito':'não feito'}\n`; }); else txt+=`• Nenhum registro.\n`;
  const wrsR=(S.writings||[]).filter(w=>w.alunoId===alunoId && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data));
  txt+=`\n📝 WRITINGS (${wrsR.length})\n`;
  if(wrsR.length) wrsR.forEach(w=>{ const bt=(w.subscales||Object.keys(w.bands||{})).map(k=>WR_LBL(k)+' '+(w.bands[k]!=null?w.bands[k]:'—')).join(', '); txt+=`• ${brDate(w.data)} — ${w.levelLabel||w.level||''}${w.taskLabel?(' · '+w.taskLabel):''} — Geral ${w.overall_band!=null?w.overall_band:'—'}/5 (${bt})${w.togethere_band?(' · '+w.togethere_band):''}\n`; }); else txt+=`• Nenhum.\n`;
  txt+=`\n💬 COMENTÁRIOS (${coms.length})\n`;
  if(coms.length) coms.forEach(c=>{ txt+=`• ${brDate(c.data)} (${c.autor}): ${c.texto}\n`; }); else txt+=`• Nenhum comentário.\n`;
  txt+=`\n—\nTogethere · inglês para chegar lá`;
  return txt;
}
let _relatorioHTML='', _relatorioTxt='';
function montarRelatorioHTML(alunoId, turmaId, de, ate){
  const turma=S.turmas.find(t=>t.id===turmaId)||{}, aluno=S.alunos.find(a=>a.id===alunoId)||{};
  const esc=s=>(s==null?'':s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inRange=d=>(!de||d>=de)&&(!ate||d<=ate);
  const faltas=faltasDoAluno(alunoId,turmaId).filter(inRange);
  const atrasos=atrasosDoAluno(alunoId,turmaId).filter(inRange);
  const saidas=saidasCedoDoAluno(alunoId,turmaId).filter(inRange);
  const mat=materialDoAluno(alunoId,turmaId).filter(inRange);
  const temas=temasNaoFeitosDoAluno(alunoId,turmaId).filter(t=>inRange(t.data));
  const coms=comentariosDoAluno(alunoId).filter(c=>inRange(c.data));
  const peso=pesoFalta(turmaId);
  const baseF=Number(aluno.faltasRetro)||0;
  const totalF=baseF+faltas.length;
  const testes=S.testes.filter(t=>t.turmaId===turmaId && t.notas && t.notas[alunoId] && SKILLS.some(s=>t.notas[alunoId][s]!==''&&t.notas[alunoId][s]!=null)).sort((a,b)=>(a.numero||0)-(b.numero||0));
  const tile=(v,k)=>`<div class="st"><div class="v">${v}</div><div class="k">${k}</div></div>`;
  const statsHTML=`<div class="stats">${tile(totalF,'Faltas')}${tile(atrasos.length,'Atrasos')}${tile(saidas.length,'Saídas antecip.')}${tile(mat.length,'Aulas sem material')}${tile(temas.length,'Temas pendentes')}</div>`;
  let notasHTML;
  if(testes.length){
    notasHTML=`<table class="tnotas"><thead><tr><th class="s">Habilidade</th>${testes.map(t=>`<th>${t.numero}º teste</th>`).join('')}</tr></thead><tbody>`+
      SKILLS.map(s=>`<tr><td class="s">${s}</td>${testes.map(t=>{const v=t.notas[alunoId][s];const bd=bandaConceito(v===''||v==null?'':v);return `<td><span class="num" style="color:${bd.cor}">${v===''||v==null?'—':v}</span></td>`;}).join('')}</tr>`).join('')+
      `</tbody></table>`;
  } else notasHTML='<div class="okline">Ainda não há notas de teste lançadas.</div>';
  const lista=(arr,fmt)=>arr.length?('<ul class="lst">'+arr.map(fmt).join('')+'</ul>'):'<div class="okline">Nenhum registro ✓</div>';
  const periodo=`${de?brDate(de):'início'} — ${ate?brDate(ate):'hoje'}`;
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório — ${esc(aluno.nome)}</title>
<style>${DOC_CSS}</style></head>
<body><div class="page">
  <div class="hd"><img src="${LOGO_B64}" alt="Togethere">
    <div><div class="nm">Togethere</div><div class="tg">inglês para chegar lá</div></div>
    <div class="doc"><b>Relatório</b><span>do aluno</span></div></div>
  <div class="who"><div class="al">${esc(aluno.nome)}</div>
    <div class="meta">${esc(turma.nome)}${turma.cefr?' · Nível '+esc(turma.cefr):''}${turma.professor?' · Prof. '+esc(turma.professor):''}<br>Período: ${periodo} · Emitido em ${brDate(hoje())} por ${esc(S.usuario)}</div></div>
  <div class="sec"><h2>Resumo do período</h2>${statsHTML}${peso===2?`<div class="leg">Turma de 1 encontro por semana, com 2 aulas no mesmo dia: cada aula conta como uma presença.</div>`:''}</div>
  <div class="sec"><h2>Resultados de testes</h2>${notasHTML}</div>
  ${(function(){ const wrs=(S.writings||[]).filter(w=>w.alunoId===alunoId && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data)); if(!wrs.length) return ''; const rows=wrs.map(w=>`<li><span class="d">${brDate(w.data)}</span><span>${esc(w.levelLabel||w.level||'')}${w.taskLabel?(' · '+esc(w.taskLabel)):''} — Geral <b>${w.overall_band!=null?w.overall_band:'—'}/5</b>${w.togethere_band?(' · '+esc(w.togethere_band)):''} — ${(w.subscales||Object.keys(w.bands||{})).map(k=>WR_LBL(k)+' '+(w.bands[k]!=null?w.bands[k]:'—')).join(', ')}</span></li>`).join(''); return `<div class="sec"><h2>Writings (${wrs.length})</h2><ul class="lst">${rows}</ul></div>`; })()}
  <div class="sec"><h2>Faltas — com o conteúdo da aula (${totalF})</h2>${baseF?`<div class="leg" style="margin-bottom:8px">Inclui <b>${baseF} falta(s) retroativas</b> (registro manual). As datas abaixo são as faltas registradas no app durante o período.</div>`:''}${lista(faltas,d=>`<li><span class="d">${brDate(d)}</span><span>${esc(resumoAulaDoDia(turmaId,d))}</span></li>`)}</div>
  <div class="sec"><h2>Atrasos (${atrasos.length}) e saídas antecipadas (${saidas.length})</h2>
    <div class="skills"><div><div class="leg" style="margin:0 0 6px">Atrasos</div>${lista(atrasos,d=>`<li><span class="d">${brDate(d)}</span></li>`)}</div><div><div class="leg" style="margin:0 0 6px">Saídas antecipadas</div>${lista(saidas,d=>`<li><span class="d">${brDate(d)}</span></li>`)}</div></div></div>
  <div class="sec"><h2>Material não trazido (${mat.length})</h2>${lista(mat,d=>`<li><span class="d">${brDate(d)}</span></li>`)}</div>
  <div class="sec"><h2>Temas de casa não feitos / parciais (${temas.length})</h2>${lista(temas,t=>`<li><span class="d">${brDate(t.data)}</span><span>${esc(t.descricao)}${t.origem==='plano'?' (do plano de aula)':''} — ${t.status==='parcial'?'parcialmente feito':'não feito'}</span></li>`)}</div>
  <div class="sec"><h2>Comentários (${coms.length})</h2>${lista(coms,c=>`<li><span class="d">${brDate(c.data)}</span><span><b>${esc(c.autor)}:</b> ${esc(c.texto)}</span></li>`)}</div>
  <div class="ft"><div>${esc((S.config&&S.config.assinatura)||'Equipe Togethere').replace(/\n/g,'<br>')}<br><small>Documento interno · emitido em ${brDate(hoje())}</small></div><div class="tag">Togethere</div></div>
</div></body></html>`;
  return {html, txt:corpoRelatorioAluno(alunoId,turmaId,de,ate)};
}
function gerarRelatorioAluno(){
  const turmaId=document.getElementById('relT').value, alunoId=document.getElementById('relA').value;
  if(!alunoId)return toast('Escolha o aluno');
  const de=(document.getElementById('relDe')||{}).value||'', ate=(document.getElementById('relAte')||{}).value||'';
  if(de&&ate&&de>ate)return toast('A data inicial é maior que a final');
  const r=montarRelatorioHTML(alunoId,turmaId,de,ate);
  _relatorioHTML=r.html; _relatorioTxt=r.txt;
  const fr=document.getElementById('relFrame'), vz=document.getElementById('relVazio');
  _setDocIframe(fr, r.html);
  if(vz) vz.style.display='none';
}
function addComentario(){
  const alunoId=document.getElementById('relA').value;
  if(!alunoId)return toast('Escolha o aluno');
  const txt=document.getElementById('relCom').value.trim();
  if(!txt)return toast('Escreva o comentário');
  S.comentarios.push({id:uid(),alunoId,data:hoje(),texto:txt,autor:S.usuario});
  document.getElementById('relCom').value=''; save(); toast('Comentário adicionado');
  if(_relatorioHTML) gerarRelatorioAluno();
}
function copiarRelatorio(){ if(!_relatorioTxt)return toast('Gere o relatório primeiro'); copiarTexto(_relatorioTxt,'Relatório copiado!'); }
function imprimirRelatorio(){ if(!_relatorioHTML)return toast('Gere o relatório primeiro'); imprimirDoc(_relatorioHTML); }
