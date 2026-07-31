/* ---- ALERTAS ---- */
VIEWS.alertas=()=>{
  const v=document.getElementById('view');
  const fa=alertasFaltas(), ma=alertasMaterial();
  const alertasPersistidos=(S.alertas||[]).filter(a=>!a.resolvido);
  const nome=id=>{const a=S.alunos.find(a=>a.id===id);return a?a.nome:'—';};
  const turmaDe=id=>{const a=S.alunos.find(a=>a.id===id);return a?turmaNome(a.turmaId):'';};
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--vermelho)"></span><h2 class="display">Avisos</h2></div>
    <p class="sub">Relatórios de aula para enviar às famílias e alunos que precisam de contato.</p>`;
  { const _pc=renderPendenciasCard(); if(_pc) v.appendChild(el(_pc)); }   // pendências escaladas (direção)
  renderAvisoRelatorios(v);
  if(escolaEmRecesso()){ v.appendChild(el('<div class="card" style="border-left:4px solid var(--laranja)"><b>🌴 Escola em recesso</b><br>Os alertas de faltas, material e pendências (chamada, plano, relatório) estão <b>pausados</b> durante as férias e voltam sozinhos quando as aulas recomeçarem.</div>')); }
  if(!fa.length&&!ma.length){
    v.appendChild(el('<div class="card empty"><div class="big">✅</div><b>Tudo em dia!</b><br>Nenhum aluno com faltas ou material acima do limite.</div>'));
  }else{
    if(fa.length){
      v.appendChild(el(`<h3 style="margin:6px 0 12px;font-size:1rem">🚨 Faltas consecutivas (${fa.length})</h3>`));
      fa.forEach(o=>v.appendChild(el(`<div class="alert-card"><div class="ic falta">📋</div>
        <div class="info"><b>${nome(o.alunoId)}</b> <span class="pill">${turmaDe(o.alunoId)}</span><p>${o.motivo} — contatar responsável.</p></div>
        <div class="acts"><button class="btn red sm" onclick="marcarContato('${o.alunoId}','falta')">✓ Contatei</button></div></div>`)));
    }
    if(ma.length){
      v.appendChild(el(`<h3 style="margin:18px 0 12px;font-size:1rem">🎒 Material (${ma.length})</h3>`));
      ma.forEach(o=>v.appendChild(el(`<div class="alert-card mat"><div class="ic mat">🎒</div>
        <div class="info"><b>${nome(o.alunoId)}</b> <span class="pill">${turmaDe(o.alunoId)}</span><p>${o.motivo} — contatar responsável.</p></div>
        <div class="acts"><button class="btn sm" style="background:var(--laranja)" onclick="marcarContato('${o.alunoId}','material')">✓ Contatei</button></div></div>`)));
    }
  }
  // registro completo — somente para a direção
  if(S.perfil==='direcao'){
    const rf=registroGeral('falta'), rm=registroGeral('material'), rt=registroGeral('tema');
    const linhas=(arr)=>arr.length
      ? arr.map(o=>`<tr><td>${nome(o.alunoId)}</td><td><span class="pill">${turmaDe(o.alunoId)}</span></td><td>${brDate(o.data)}</td></tr>`).join('')
      : '<tr><td colspan=3 style="color:var(--tinta-suave)">Nenhum registro.</td></tr>';
    v.appendChild(el(`<div class="card" style="margin-top:28px;border-top:3px solid var(--marinho)">
      <h3>📊 Registro completo da escola</h3><p class="hint">Visão da direção: todas as ocorrências registradas pelos professores.</p>
      <div class="row" style="gap:10px;margin-bottom:18px">
        <div class="kpi"><div class="k-ic" style="background:#fdeaea;color:var(--vermelho)">📋</div><div><div class="num">${rf.length}</div><small>Faltas</small></div></div>
        <div class="kpi"><div class="k-ic" style="background:#ffeee5;color:var(--laranja)">🎒</div><div><div class="num">${rm.length}</div><small>Sem material</small></div></div>
        <div class="kpi"><div class="k-ic" style="background:#fff0f6;color:var(--rosa)">📚</div><div><div class="num">${rt.length}</div><small>Tema não feito</small></div></div>
      </div>
      <h4 style="margin:6px 0 8px;font-size:.92rem">📋 Faltas (${rf.length})</h4>
      <table><thead><tr><th>Aluno</th><th>Turma</th><th>Data</th></tr></thead><tbody>${linhas(rf)}</tbody></table>
      <h4 style="margin:18px 0 8px;font-size:.92rem">🎒 Material não trazido (${rm.length})</h4>
      <table><thead><tr><th>Aluno</th><th>Turma</th><th>Data</th></tr></thead><tbody>${linhas(rm)}</tbody></table>
      <h4 style="margin:18px 0 8px;font-size:.92rem">📚 Tema de casa não feito (${rt.length})</h4>
      <table><thead><tr><th>Aluno</th><th>Turma</th><th>Data</th></tr></thead><tbody>${linhas(rt)}</tbody></table>
    </div>`));
  }
};
function marcarContato(alunoId,tipo){
  S.contatos.push({alunoId,tipo,data:hoje()});save();montarNav();VIEWS.alertas();toast('Contato registrado');
}
function desfazerContato(i){S.contatos.splice(i,1);save();montarNav();VIEWS.alertas();}

/* =========================================================================
   AULA DE APOIO — indicação do professor → aprovação da direção → agendamento pela secretaria
   ========================================================================= */
const MOTIVOS_APOIO=[
  {k:'compreensao', t:'Dificuldade de compreensão'},
  {k:'fala',        t:'Dificuldade de fala (speaking)'},
  {k:'escrita',     t:'Dificuldade de escrita / leitura'},
  {k:'faltas',      t:'Faltas frequentes'},
  {k:'tema',        t:'Não faz o tema de casa'},
  {k:'defasagem',   t:'Defasagem em relação à turma'},
  {k:'foco',        t:'Comportamento / foco em aula'},
  {k:'recuperar',   t:'Recuperar conteúdo perdido'},
];
const APOIO_STATUS={
  pendente:{lbl:'Aguardando direção', bg:'#fff8e0', cor:'#b88600'},
  aprovado:{lbl:'Encaminhado à secretaria', bg:'#eaf3ff', cor:'var(--azul)'},
  agendado:{lbl:'Agendado', bg:'#eafaf0', cor:'#1a8a4a'},
  nao_agendado:{lbl:'Não agendada — devolvida à direção', bg:'#fff1e6', cor:'#c2560b'},
  recusado:{lbl:'Não aprovado', bg:'#fdeaea', cor:'var(--vermelho)'},
  arquivado:{lbl:'Arquivada', bg:'#eef0f4', cor:'#7a8798'},
};
function apoioMotivosTxt(m){ return (m||[]).map(k=>{const o=MOTIVOS_APOIO.find(x=>x.k===k);return o?o.t:k;}); }
function apoioAlunoNome(ap){ const a=S.alunos.find(a=>a.id===ap.alunoId); return a?a.nome:(ap.alunoNome||'—'); }
function apoioAlunoEmail(ap){ const a=S.alunos.find(a=>a.id===ap.alunoId); return a?(a.email||'').trim():''; }
function _apoioData(ts){ if(!ts) return ''; try{ return new Date(ts).toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
// indicações que exigem AÇÃO do perfil atual (para o badge do menu)
function apoioBadge(){
  const aps=(S.apoios||[]).filter(a=>!a.excluido);
  if(S.perfil==='direcao')    return aps.filter(a=>a.status==='pendente'||a.status==='nao_agendado').length;
  if(S.perfil==='secretaria') return aps.filter(a=>a.status==='aprovado').length;
  return 0;
}
// o professor só enxerga as indicações que ele mesmo criou; direção/secretaria veem todas
function apoiosVisiveis(){
  const aps=(S.apoios||[]).filter(a=>!a.excluido);
  if(S.perfil==='professor'){
    const u=S.usuarios.find(u=>u.nome===S.usuario);
    return aps.filter(a=>a.criadoPor===S.usuario || (u&&u.ensina&&a.professor===u.ensina));
  }
  return aps;
}

/* ----- modal: nova indicação (professor / direção) ----- */
function _apoioOpcoesAluno(turmaId){
  const als=S.alunos.filter(a=>a.turmaId===turmaId && !a.arquivado).sort((a,b)=>a.nome.localeCompare(b.nome));
  if(!als.length) return '<option value="">(turma sem alunos)</option>';
  return '<option value="">Selecione o aluno…</option>'+als.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('');
}
function abrirNovoApoio(){
  const ts=turmasVisiveis().filter(t=>turmaStatus(t)!=='encerrada').sort((a,b)=>a.nome.localeCompare(b.nome));
  if(!ts.length) return toast('Nenhuma turma disponível');
  const t0=ts[0].id;
  modal(`<h3 style="margin-bottom:6px">🤝 Encaminhar para aula de apoio</h3>
    <p class="hint" style="margin-bottom:14px">A direção vai analisar e, se aprovar, a secretaria agenda com o responsável.</p>
    <div class="field"><label class="lbl">Turma</label>
      <select id="apTurma" onchange="_apoioTurmaChange()">${ts.map(t=>`<option value="${t.id}">${esc(t.nome)}</option>`).join('')}</select></div>
    <div class="field"><label class="lbl">Aluno</label>
      <select id="apAluno">${_apoioOpcoesAluno(t0)}</select></div>
    <div class="field"><label class="lbl">Motivos da indicação</label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
        ${MOTIVOS_APOIO.map(m=>`<label class="check" style="cursor:pointer"><input type="checkbox" class="apMotivo" value="${m.k}" style="width:auto;margin-right:8px"> ${m.t}</label>`).join('')}
      </div></div>
    <div class="field"><label class="lbl">Observação (opcional)</label>
      <textarea id="apObs" rows="3" placeholder="Detalhe a situação do aluno para a direção…"></textarea></div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" onclick="salvarApoio()">Enviar indicação</button>
    </div>`);
}
function _apoioTurmaChange(){
  const tid=document.getElementById('apTurma').value;
  document.getElementById('apAluno').innerHTML=_apoioOpcoesAluno(tid);
}
function salvarApoio(){
  const turmaId=document.getElementById('apTurma').value;
  const alunoId=document.getElementById('apAluno').value;
  if(!alunoId) return toast('Escolha o aluno');
  const motivos=[...document.querySelectorAll('.apMotivo:checked')].map(c=>c.value);
  if(!motivos.length) return toast('Marque ao menos um motivo');
  const obs=(document.getElementById('apObs').value||'').trim();
  const t=S.turmas.find(x=>x.id===turmaId)||{};
  const now=Date.now();
  S.apoios.push({
    id:uid(), alunoId, turmaId,
    professor:(t.professor||'').trim(),
    criadoPor:S.usuario,
    motivos, obs,
    status:'pendente',
    parecer:'', decididoPor:'', decididoEm:0,
    agendaData:'', agendaHora:'', secretariaObs:'',
    criadoEm:now, atualizadoEm:now
  });
  save(); montarNav(); fechar(); VIEWS.apoio();
  toast('Indicação enviada à direção ✅');
}

/* ----- direção: aprovar / recusar ----- */
function abrirDecisaoApoio(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  modal(`<h3 style="margin-bottom:6px">Analisar indicação</h3>
    <p class="hint" style="margin-bottom:12px"><b>${esc(apoioAlunoNome(ap))}</b> · ${esc(turmaNome(ap.turmaId))}<br>
      Indicado por ${esc(ap.professor||ap.criadoPor)}</p>
    <div class="card" style="background:#f7f9fd;margin-bottom:12px">
      <b style="font-size:.9rem">Motivos</b>
      <div style="margin:6px 0">${apoioMotivosTxt(ap.motivos).map(t=>`<span class="pill">${esc(t)}</span>`).join(' ')}</div>
      ${ap.obs?`<p class="hint" style="margin-top:6px">📝 ${esc(ap.obs)}</p>`:''}
    </div>
    <div class="field"><label class="lbl">Parecer da direção (obrigatório se recusar)</label>
      <textarea id="apParecer" rows="3" placeholder="Ex.: aprovado, priorizar reforço de speaking…">${esc(ap.parecer||'')}</textarea></div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" style="background:var(--vermelho)" onclick="decidirApoio('${id}','recusado')">Não aprovar</button>
      <button class="btn" onclick="decidirApoio('${id}','aprovado')">Aprovar e encaminhar</button>
    </div>`);
}
function decidirApoio(id,decisao){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  const parecer=(document.getElementById('apParecer').value||'').trim();
  if(decisao==='recusado' && !parecer) return toast('Explique o motivo da recusa no parecer');
  ap.status=decisao; ap.parecer=parecer;
  ap.decididoPor=S.usuario; ap.decididoEm=Date.now(); ap.atualizadoEm=Date.now();
  save(); montarNav(); fechar(); VIEWS.apoio();
  toast(decisao==='aprovado'?'Aprovado e encaminhado à secretaria ✅':'Indicação não aprovada');
}

/* ----- secretaria: registrar agendamento ----- */
function abrirAgendarApoio(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  const email=apoioAlunoEmail(ap);
  modal(`<h3 style="margin-bottom:6px">📆 Agendar aula de apoio</h3>
    <p class="hint" style="margin-bottom:12px"><b>${esc(apoioAlunoNome(ap))}</b> · ${esc(turmaNome(ap.turmaId))}<br>
      Responsável: ${email?esc(email):'<span style="color:var(--vermelho)">sem e-mail cadastrado</span>'}</p>
    <div class="row">
      <div class="field" style="flex:1"><label class="lbl">Data</label><input type="date" id="apData" value="${escAttr(ap.agendaData||'')}"></div>
      <div class="field" style="flex:1"><label class="lbl">Horário</label><input type="time" id="apHora" value="${escAttr(ap.agendaHora||'')}"></div>
    </div>
    <div class="field"><label class="lbl">Observação da secretaria (opcional)</label>
      <textarea id="apSecObs" rows="2" placeholder="Ex.: responsável contatado, confirmado por WhatsApp…">${esc(ap.secretariaObs||'')}</textarea></div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" onclick="confirmarAgendaApoio('${id}')">Marcar como agendado</button>
    </div>`);
}
function confirmarAgendaApoio(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  const data=document.getElementById('apData').value;
  if(!data) return toast('Informe a data do agendamento');
  ap.agendaData=data;
  ap.agendaHora=document.getElementById('apHora').value||'';
  ap.secretariaObs=(document.getElementById('apSecObs').value||'').trim();
  ap.status='agendado'; ap.atualizadoEm=Date.now();
  save(); montarNav(); fechar(); VIEWS.apoio();
  toast('Aula de apoio agendada ✅');
}
function excluirApoio(id){
  if(!confirm('Remover esta indicação de aula de apoio?')) return;
  const ap=S.apoios.find(a=>a.id===id); if(ap) ap.excluido=true;
  marcarExcluido('apoios',id);
  save(); montarNav(); VIEWS.apoio(); toast('Indicação removida');
}
/* ----- secretaria: não consegui agendar (devolve à direção com justificativa) ----- */
function abrirNaoAgendou(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  modal(`<h3 style="margin-bottom:6px">⚠️ Não consegui agendar</h3>
    <p class="hint" style="margin-bottom:12px"><b>${esc(apoioAlunoNome(ap))}</b> · ${esc(turmaNome(ap.turmaId))}<br>
      Explique o motivo — a indicação volta para a direção decidir.</p>
    <div class="field"><label class="lbl">Justificativa (obrigatória)</label>
      <textarea id="apJust" rows="3" placeholder="Ex.: responsável não retornou os contatos; sem horário compatível; família recusou…">${esc((ap.naoAgendou&&ap.naoAgendou.justificativa)||'')}</textarea></div>
    <div class="row" style="margin-top:8px;justify-content:flex-end">
      <button class="btn ghost" onclick="fechar()">Cancelar</button>
      <button class="btn" style="background:#c2560b" onclick="confirmarNaoAgendou('${id}')">Devolver à direção</button>
    </div>`);
}
function confirmarNaoAgendou(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  const just=(document.getElementById('apJust').value||'').trim();
  if(!just) return toast('Explique por que não foi possível agendar');
  ap.naoAgendou={ justificativa:just, por:S.usuario, em:Date.now() };
  ap.status='nao_agendado'; ap.atualizadoEm=Date.now();
  save(); montarNav(); fechar(); VIEWS.apoio();
  toast('Devolvido à direção ⚠️');
}
/* ----- direção: decidir sobre indicação devolvida (reenviar ou arquivar) ----- */
function reenviarApoio(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  ap.status='aprovado'; ap.atualizadoEm=Date.now();   // volta para a fila da secretaria; mantém o histórico da devolução
  save(); montarNav(); VIEWS.apoio(); toast('Reenviado à secretaria para agendamento ✅');
}
function arquivarApoio(id){
  const ap=S.apoios.find(a=>a.id===id); if(!ap) return;
  if(!confirm('Arquivar esta indicação? Ela sai das listas ativas e fica no histórico.')) return;
  ap.status='arquivado'; ap.atualizadoEm=Date.now();
  save(); montarNav(); VIEWS.apoio(); toast('Indicação arquivada 🗄');
}

/* ----- card e view ----- */
function _apoioCard(ap,acoes){
  const st=APOIO_STATUS[ap.status]||APOIO_STATUS.pendente;
  const email=apoioAlunoEmail(ap);
  return `<div class="card" style="border-left:4px solid ${st.cor}">
    <div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px">
      <div><b>${esc(apoioAlunoNome(ap))}</b> <span class="pill">${esc(turmaNome(ap.turmaId))}</span></div>
      <span class="pill" style="background:${st.bg};color:${st.cor}">${st.lbl}</span>
    </div>
    <p class="hint" style="margin:6px 0">Indicado por ${esc(ap.professor||ap.criadoPor)} · ${_apoioData(ap.criadoEm)}</p>
    <div style="margin:4px 0">${apoioMotivosTxt(ap.motivos).map(t=>`<span class="pill">${esc(t)}</span>`).join(' ')}</div>
    ${ap.obs?`<p class="hint" style="margin-top:6px">📝 ${esc(ap.obs)}</p>`:''}
    ${ap.parecer?`<p class="hint" style="margin-top:6px;color:var(--tinta)"><b>Parecer da direção:</b> ${esc(ap.parecer)}</p>`:''}
    ${ap.naoAgendou&&ap.naoAgendou.justificativa?`<p class="hint" style="margin-top:6px;color:#c2560b"><b>⚠️ Secretaria não conseguiu agendar:</b> ${esc(ap.naoAgendou.justificativa)}${ap.naoAgendou.por?' — '+esc(ap.naoAgendou.por):''}</p>`:''}
    ${(S.perfil==='secretaria'||S.perfil==='direcao')&&(ap.status==='aprovado'||ap.status==='agendado')?`<p class="hint" style="margin-top:6px">📧 Responsável: ${email?esc(email):'<span style="color:var(--vermelho)">sem e-mail cadastrado</span>'}</p>`:''}
    ${ap.status==='agendado'?`<p class="hint" style="margin-top:6px;color:#1a8a4a"><b>📆 Agendado:</b> ${brDate(ap.agendaData)}${ap.agendaHora?' às '+ap.agendaHora:''}${ap.secretariaObs?' · '+esc(ap.secretariaObs):''}</p>`:''}
    ${acoes?`<div class="row" style="margin-top:10px;gap:8px">${acoes}</div>`:''}
  </div>`;
}
VIEWS.apoio=()=>{
  const v=document.getElementById('view');
  const aps=apoiosVisiveis().sort((a,b)=>(b.atualizadoEm||b.criadoEm)-(a.atualizadoEm||a.criadoEm));
  const podeIndicar=(S.perfil==='professor'||S.perfil==='direcao');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--rosa)"></span><h2 class="display">Aula de apoio</h2></div>
    <p class="sub">Encaminhamento de alunos para reforço — do professor à direção, e da direção à secretaria.</p>`;
  if(podeIndicar) v.appendChild(el(`<div style="margin-bottom:14px"><button class="btn" onclick="abrirNovoApoio()">➕ Nova indicação</button></div>`));

  if(S.perfil==='professor'){
    if(!aps.length){ v.appendChild(el('<div class="card empty"><div class="big">🤝</div><b>Nenhuma indicação ainda</b><br>Use o botão acima para encaminhar um aluno para aula de apoio.</div>')); return; }
    v.appendChild(el(`<h3 style="margin:6px 0 10px;font-size:1rem">Suas indicações (${aps.length})</h3>`));
    aps.forEach(ap=>v.appendChild(el(_apoioCard(ap, ap.status==='pendente'?`<button class="btn ghost sm" onclick="excluirApoio('${ap.id}')">🗑 Cancelar</button>`:''))));
    return;
  }
  if(S.perfil==='direcao'){
    const pend=aps.filter(a=>a.status==='pendente');
    const devolvidas=aps.filter(a=>a.status==='nao_agendado');
    const resto=aps.filter(a=>a.status!=='pendente' && a.status!=='nao_agendado');
    v.appendChild(el(`<h3 style="margin:6px 0 10px;font-size:1rem">⏳ Aguardando sua aprovação (${pend.length})</h3>`));
    if(!pend.length) v.appendChild(el('<div class="card"><p class="hint" style="margin:0">Nenhuma indicação pendente.</p></div>'));
    pend.forEach(ap=>v.appendChild(el(_apoioCard(ap, `<button class="btn sm" onclick="abrirDecisaoApoio('${ap.id}')">Analisar</button><button class="btn ghost sm" onclick="excluirApoio('${ap.id}')">🗑</button>`))));
    v.appendChild(el(`<h3 style="margin:22px 0 10px;font-size:1rem">↩️ Devolvidas pela secretaria (${devolvidas.length})</h3>`));
    if(!devolvidas.length) v.appendChild(el('<div class="card"><p class="hint" style="margin:0">Nenhuma indicação devolvida.</p></div>'));
    devolvidas.forEach(ap=>v.appendChild(el(_apoioCard(ap, `<button class="btn sm" onclick="reenviarApoio('${ap.id}')">↩️ Reenviar para agendamento</button><button class="btn ghost sm" onclick="arquivarApoio('${ap.id}')">🗄 Arquivar</button>`))));
    v.appendChild(el(`<h3 style="margin:22px 0 10px;font-size:1rem">📋 Histórico (${resto.length})</h3>`));
    if(!resto.length) v.appendChild(el('<div class="card"><p class="hint" style="margin:0">Sem histórico ainda.</p></div>'));
    resto.forEach(ap=>v.appendChild(el(_apoioCard(ap, `<button class="btn ghost sm" onclick="excluirApoio('${ap.id}')">🗑 Remover</button>`))));
    return;
  }
  // secretaria
  const paraAgendar=aps.filter(a=>a.status==='aprovado');
  const agendadas=aps.filter(a=>a.status==='agendado');
  v.appendChild(el(`<h3 style="margin:6px 0 10px;font-size:1rem">🔔 Para agendar (${paraAgendar.length})</h3>`));
  if(!paraAgendar.length) v.appendChild(el('<div class="card empty"><div class="big">✅</div><b>Nada para agendar</b><br>Nenhuma indicação aprovada aguardando agendamento.</div>'));
  paraAgendar.forEach(ap=>v.appendChild(el(_apoioCard(ap, `<button class="btn sm" onclick="abrirAgendarApoio('${ap.id}')">📆 Agendar</button><button class="btn ghost sm" style="color:#c2560b" onclick="abrirNaoAgendou('${ap.id}')">⚠️ Não consegui agendar</button>`))));
  v.appendChild(el(`<h3 style="margin:22px 0 10px;font-size:1rem">📆 Agendadas (${agendadas.length})</h3>`));
  if(!agendadas.length) v.appendChild(el('<div class="card"><p class="hint" style="margin:0">Nenhuma aula de apoio agendada ainda.</p></div>'));
  agendadas.forEach(ap=>v.appendChild(el(_apoioCard(ap, `<button class="btn ghost sm" onclick="abrirAgendarApoio('${ap.id}')">✏️ Reagendar</button>`))));
};
