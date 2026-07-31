/* ---- PRESENÇA ---- */
let presTurma=null, presData=hoje(), presBusca='', presEditando=false;
VIEWS.presenca=()=>{
  presTurma=presTurma||primeiraTurma();
  if(!datasAula(presTurma).includes(presData)) presData=dataAulaPadrao(presTurma);
  presEditando=false;
  const v=document.getElementById('view');
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Chamada do dia</h2></div>
    <p class="sub">Tudo num lugar só: presença, <b>material</b> e <b>tema de casa</b> da aula. Só aparecem os dias em que a turma tem aula.</p>
    <div class="card"><div class="row">
      <div><label class="lbl">Turma</label>${selectTurma('pT',presTurma)}</div>
      <div><label class="lbl">Data da aula</label>${selectDataAula('pD',presTurma,presData)}</div>
    </div></div>
    <div class="card" id="pStatusAula" style="display:none"></div>
    <div class="card" id="pBox"></div>
    <div class="card" id="pTema"></div>
    <div class="card"><input type="text" id="pBusca" placeholder="🔎 Buscar chamada anterior por data (ex.: 10/06)" value="${escAttr(presBusca)}" oninput="presBusca=this.value;renderPresLista()"><div id="pLista" style="margin-top:8px"></div></div>`;
  document.getElementById('pT').onchange=e=>{presTurma=e.target.value;presData=dataAulaPadrao(presTurma);VIEWS.presenca();};
  document.getElementById('pD').onchange=e=>{presData=e.target.value;presEditando=false;renderPres();renderTemaChamada();};
  renderPres(); renderTemaChamada(); renderPresLista();
};
function presRec(criar){
  let rec=S.presencas.find(p=>p.turmaId===presTurma&&p.data===presData);
  if(!rec && criar){
    rec={id:uid(),turmaId:presTurma,data:presData,registros:{},atrasados:[],saiuCedo:[]};
    alunosDa(presTurma).forEach(a=>rec.registros[a.id]='presente');
    if(temAula2(presTurma)){ rec.registros2={}; alunosDa(presTurma).forEach(a=>rec.registros2[a.id]='presente'); }
    S.presencas.push(rec);
  } else if(rec && criar && temAula2(presTurma) && !rec.registros2){
    // turma 1x/semana sem aula 2 ainda: cria espelhando a aula 1 (mantém a contagem)
    rec.registros2={}; alunosDa(presTurma).forEach(a=>rec.registros2[a.id]=rec.registros[a.id]||'presente');
  }
  return rec;
}
function _aulaConta(p){ return !p.statusAula || p.statusAula==='normal'; }
function renderStatusAula(){
  const el=document.getElementById('pStatusAula'); if(!el) return;
  const recX=S.presencas.find(p=>p.turmaId===presTurma&&p.data===presData);
  const status=(recX&&recX.statusAula)||'normal';
  if(soLeitura()){
    if(status==='cancelada'){ el.style.display=''; el.innerHTML=`<b style="color:var(--vermelho)">🚫 Aula cancelada</b> <span class="hint">· ${brDate(presData)}</span>`; }
    else if(status==='transferida'){ el.style.display=''; el.innerHTML=`<b style="color:var(--laranja)">↪ Aula transferida</b> <span class="hint">· para ${recX.transfData?brDate(recX.transfData):'—'}${recX.transfHora?(' às '+escAttr(recX.transfHora)):''}</span>`; }
    else { el.style.display='none'; }
    return;
  }
  el.style.display='';
  const btn=(val,lbl)=>`<button class="btn ${status===val?'':'ghost'} sm" onclick="setStatusAula('${val}')">${lbl}</button>`;
  let html=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="hint" style="min-width:74px">Esta aula:</span>${btn('normal','✅ Aconteceu')}${btn('cancelada','🚫 Cancelada')}${btn('transferida','↪ Transferida')}</div>`;
  if(status==='transferida'){
    html+=`<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:flex-end">
      <div><label class="lbl">Nova data</label><input type="date" id="trData" value="${escAttr((recX&&recX.transfData)||'')}"></div>
      <div><label class="lbl">Novo horário</label><input type="time" id="trHora" value="${escAttr((recX&&recX.transfHora)||'')}"></div>
      <button class="btn sm" onclick="salvarTransfer()">Salvar</button></div>`;
  }
  el.innerHTML=html;
}
function setStatusAula(status){
  if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const rec=presRec(true);
  if(status==='normal'){ delete rec.statusAula; delete rec.transfData; delete rec.transfHora; }
  else { rec.statusAula=status; }
  rec.fechada=true; rec.atualizadoEm=Date.now();
  save(); montarNav(); renderPres();
  if(status==='cancelada') toast('Aula marcada como cancelada');
}
function salvarTransfer(){
  if(soLeitura())return;
  const rec=presRec(true);
  rec.statusAula='transferida';
  rec.transfData=(document.getElementById('trData')||{}).value||'';
  rec.transfHora=(document.getElementById('trHora')||{}).value||'';
  rec.fechada=true; rec.atualizadoEm=Date.now();
  save(); montarNav(); renderPres(); toast('Transferência registrada');
}
function renderPres(){
  renderStatusAula();
  const box=document.getElementById('pBox');
  const als=alunosDa(presTurma);
  const _recSt=S.presencas.find(p=>p.turmaId===presTurma&&p.data===presData);
  const _stA=(_recSt&&_recSt.statusAula)||'normal';
  if(_stA==='cancelada'||_stA==='transferida'){
    box.innerHTML = _stA==='cancelada'
      ? `<div style="text-align:center;padding:14px"><h3 style="margin:0;color:var(--vermelho)">🚫 Aula cancelada</h3><p class="hint" style="margin:6px 0 0">${brDate(presData)} — sem chamada, plano ou relatório nesta data.</p></div>`
      : `<div style="text-align:center;padding:14px"><h3 style="margin:0;color:var(--laranja)">↪ Aula transferida</h3><p class="hint" style="margin:6px 0 0">${brDate(presData)} → ${_recSt.transfData?brDate(_recSt.transfData):'(defina a data)'}${_recSt.transfHora?(' às '+escAttr(_recSt.transfHora)):''}</p></div>`;
    return;
  }
  if(!als.length){box.innerHTML='<div class="empty"><div class="big">👥</div>Nenhum aluno nesta turma ainda.</div>';return;}
  const rec=S.presencas.find(p=>p.turmaId===presTurma&&p.data===presData)||{registros:{},atrasados:[],saiuCedo:[]};
  const dois=temAula2(presTurma);
  const reg=rec.registros||{}, atr=rec.atrasados||[], cedo=rec.saiuCedo||[];
  // aula 2: se a turma é 1x/semana mas o registro ainda não tem aula 2, espelha a aula 1 (exibição)
  const reg2src = rec.registros2 || null;
  const st2De=(id)=> reg2src ? (reg2src[id]||'presente') : (reg[id]||'presente');
  const matRec=S.material.find(m=>m.turmaId===presTurma&&m.data===presData);
  const matFalt=matRec?matRec.faltantes:[];
  const temasHoje=S.temas.filter(t=>t.turmaId===presTurma && t.dataEntrega===presData);
  const entregasAula=temasEntregaDaAula(presTurma,presData);
  const travada = (rec.fechada && !presEditando) || soLeitura();
  const faltaTag='<span style="color:var(--vermelho);font-weight:600">Falta</span>';
  const presTag='<span style="color:var(--ok);font-weight:600">Presente</span>';

  // ----- MODO TRAVADO -----
  if(travada){
    const linhas=als.map(a=>{
      const s1=reg[a.id]||'presente', s2=st2De(a.id);
      const tmt=entregasAula.filter(e=>e.aids.includes(a.id)).map(e=>{const s=e.tema.entregas[a.id];return s==='atrasado'?('⏰ tema atrasado (entrega '+brDate(e.entregaEra)+')'):'📚 '+(s===true?'tema feito':s==='parcial'?'tema parcial':'tema não feito');});
      const extra=[];
      if(atr.includes(a.id))extra.push('chegou atrasado');
      if(cedo.includes(a.id))extra.push('saiu mais cedo');
      if(matFalt.includes(a.id))extra.push('🎒 sem material');
      let status;
      if(dois){ status=`Aula 1: ${s1==='falta'?faltaTag:presTag} · Aula 2: ${s2==='falta'?faltaTag:presTag}`+(extra.length?' · '+extra.join(' · '):''); }
      else if(s1==='falta'){ status=faltaTag; }
      else { status=presTag+(extra.length?' · '+extra.join(' · '):''); }
      return `<div style="padding:8px 0;border-bottom:1px dashed var(--linha)"><b>${a.nome}</b> — ${status}${tmt.length?`<div class="hint" style="margin-top:2px">${tmt.join(' · ')}</div>`:''}</div>`;
    }).join('');
    const nf= dois
      ? als.reduce((n,a)=>n+((reg[a.id]||'presente')==='falta'?1:0)+(st2De(a.id)==='falta'?1:0),0)
      : als.filter(a=>(reg[a.id]||'presente')==='falta').length;
    box.innerHTML=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:150px"><h3 style="margin:0;color:var(--ok)">✅ Chamada salva</h3><p class="hint" style="margin:2px 0 0">${brDate(presData)} · ${als.length} aluno(s) · ${nf} falta(s)${dois?' (2 aulas no dia)':''}</p></div>
        ${soLeitura()?'':`<button class="btn" onclick="editarChamada()">✏️ Editar chamada</button>`}
      </div>
      <div style="margin-top:12px">${linhas}</div>`;
    return;
  }

  // ----- MODO EDIÇÃO -----
  const temaCtrl=(a)=> entregasAula.filter(e=>e.aids.includes(a.id)).map(e=>{
    const t=e.tema, st=t.entregas[a.id], atras=st==='atrasado';
    const tag=atras?`<span class="pill" style="background:#fff0e6;color:var(--laranja)">⏰ atrasado · entrega era ${brDate(e.entregaEra)}</span>`:(e.atrasada?`<span class="pill">entrega ${brDate(e.entregaEra)}</span>`:'');
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap${atras?';background:#fff7f0;border:1px solid #ffd9b8;border-radius:10px;padding:8px':''}">
      <span style="font-size:.82rem;flex:1;min-width:120px;color:${atras?'var(--laranja)':'var(--rosa)'}">📚 ${escAttr(t.descricao)} ${tag}</span>
      <div class="seg"><button class="${st===true?'on-ok':''}" onclick="setTemaChamada('${t.id}','${a.id}',true)">feito</button>
      <button class="${st==='parcial'?'on-mid':''}" onclick="setTemaChamada('${t.id}','${a.id}','parcial')">parcial</button>
      <button class="${st===false?'on-no':''}" onclick="setTemaChamada('${t.id}','${a.id}',false)">não feito</button></div>
    </div>`;}).join('');
  const segAula=(a,aula)=>{ const cur= aula===2 ? st2De(a.id) : (reg[a.id]||'presente'); const fn= aula===2?'setPres2':'setPres';
    return `<div class="seg"><button class="${cur==='presente'?'on-p':''}" onclick="${fn}('${a.id}','presente')">Presente</button><button class="${cur==='falta'?'on-f':''}" onclick="${fn}('${a.id}','falta')">Falta</button></div>`; };
  box.innerHTML=`<h3>${als.length} alunos · ${brDate(presData)}</h3><p class="hint">Toque para alternar presença. ${dois?'Esta turma tem <b>2 aulas no mesmo dia</b> — marque Aula 1 e Aula 2 separadamente. ':''}Marque atraso, saída antecipada, <b>sem material</b> e a entrega do <b>tema</b> em cada aluno. Ao terminar, clique em <b>Salvar</b>.</p>
    ${als.map(a=>{
      const st=reg[a.id]||'presente', st2=st2De(a.id);
      const presenteAlgum = dois ? (st==='presente'||st2==='presente') : (st==='presente');
      const controles = dois
        ? `<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
             <div style="display:flex;align-items:center;gap:8px"><span class="hint" style="min-width:44px">Aula 1</span>${segAula(a,1)}</div>
             <div style="display:flex;align-items:center;gap:8px"><span class="hint" style="min-width:44px">Aula 2</span>${segAula(a,2)}</div>
           </div>`
        : segAula(a,1);
      return `<div style="padding:10px 0;border-bottom:1px dashed var(--linha)">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          ${avatarFoto('av-sm', a.foto, ((a.nome||'·').trim()[0]||'·').toUpperCase(), '')}
          <b style="flex:1;min-width:130px">${a.nome}</b>
          ${controles}
        </div>
        ${presenteAlgum?`<div style="display:flex;gap:18px;margin-top:8px;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:6px;font-size:.84rem;cursor:pointer"><input type="checkbox" ${atr.includes(a.id)?'checked':''} onchange="toggleAtraso('${a.id}')"> chegou atrasado</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:.84rem;cursor:pointer"><input type="checkbox" ${cedo.includes(a.id)?'checked':''} onchange="toggleSaiuCedo('${a.id}')"> saiu mais cedo</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:.84rem;cursor:pointer;color:var(--laranja)"><input type="checkbox" ${matFalt.includes(a.id)?'checked':''} onchange="toggleMatPres('${a.id}')"> 🎒 sem material</label>
        </div>`:''}
        ${temaCtrl(a)}
      </div>`;
    }).join('')}
    <div style="margin-top:16px"><button class="btn" onclick="salvarPres()">${rec.fechada?'Salvar alterações':'Salvar chamada e material'}</button></div>`;
}
function matRecPres(criar){
  let rec=S.material.find(m=>m.turmaId===presTurma&&m.data===presData);
  if(!rec && criar){ rec={id:uid(),turmaId:presTurma,data:presData,faltantes:[]}; S.material.push(rec); }
  return rec;
}
function toggleMatPres(aid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const rec=matRecPres(true);
  const i=rec.faltantes.indexOf(aid);
  if(i>=0)rec.faltantes.splice(i,1); else rec.faltantes.push(aid);
  renderPres();
}
function _limparExtrasSeAusente(rec,id){
  const dois=temAula2(presTurma);
  const f1=rec.registros[id]==='falta';
  const f2=dois?((rec.registros2||{})[id]==='falta'):f1;
  if(dois?(f1&&f2):f1){
    rec.atrasados=(rec.atrasados||[]).filter(x=>x!==id);
    rec.saiuCedo=(rec.saiuCedo||[]).filter(x=>x!==id);
    const mr=S.material.find(m=>m.turmaId===presTurma&&m.data===presData); if(mr) mr.faltantes=mr.faltantes.filter(x=>x!==id);
  }
}
function setPres(id,st){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const rec=presRec(true);
  rec.registros[id]=st;
  _limparExtrasSeAusente(rec,id);
  renderPres();
}
function setPres2(id,st){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const rec=presRec(true);
  rec.registros2=rec.registros2||{};
  rec.registros2[id]=st;
  _limparExtrasSeAusente(rec,id);
  renderPres();
}
function toggleAtraso(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const rec=presRec(true);rec.atrasados=rec.atrasados||[];const i=rec.atrasados.indexOf(id);if(i>=0)rec.atrasados.splice(i,1);else rec.atrasados.push(id);renderPres();}
function toggleSaiuCedo(id){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const rec=presRec(true);rec.saiuCedo=rec.saiuCedo||[];const i=rec.saiuCedo.indexOf(id);if(i>=0)rec.saiuCedo.splice(i,1);else rec.saiuCedo.push(id);renderPres();}
function salvarPres(){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const rec=presRec(true);          // garante o registro (alunos sem marcação ficam 'presente')
  rec.fechada=true; rec.atualizadoEm=Date.now(); presEditando=false;
  // Tema atrasado: quem faltou no dia e tinha tema com entrega hoje passa a 'atrasado'
  // (reaparece nas próximas aulas com destaque, até o professor marcar feito/parcial/não feito).
  S.temas.filter(t=>t.turmaId===presTurma && (t.dataEntrega||t.data)===presData).forEach(t=>{
    Object.keys(t.entregas||{}).forEach(aid=>{ if(t.entregas[aid]===true && faltouNoDia(rec,aid)) t.entregas[aid]='atrasado'; });
  });
  save();montarNav();renderPres();renderTemaChamada();renderPresLista();
  toast('Chamada salva ✓');
  window.scrollTo({top:0,behavior:'smooth'});
}
function editarChamada(){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); presEditando=true; renderPres(); renderTemaChamada(); toast('Chamada reaberta para edição'); }
function renderTemaChamada(){
  const box=document.getElementById('pTema'); if(!box)return;
  const due=S.temas.filter(t=>t.turmaId===presTurma && t.dataEntrega===presData);
  let h=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0;flex:1">📚 Tema de casa</h3>
    <button class="btn sm" style="background:var(--rosa)" onclick="temaDaChamada()">+ Lançar tema desta aula</button></div>`;
  if(!due.length){
    h+='<p class="hint" style="margin:8px 0 0">Nenhum tema com entrega marcada para este dia. Use o botão acima para lançar o tema desta aula e definir a data de entrega.</p>';
  } else {
    h+='<p class="hint" style="margin:8px 0 10px">A conferência (feito / parcial / não feito) está em cada aluno, na lista da chamada acima.</p>';
    h+=due.map(t=>`<div class="check"><span style="flex:1">📌 <b>${escAttr(t.descricao)}</b> · entrega ${brDate(t.dataEntrega||presData)}</span>
      <button class="btn ghost sm" onclick="editarTema('${t.id}')">✏️</button>
      ${ehProfessor()?'':`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="delTema('${t.id}')">🗑</button>`}</div>`).join('');
  }
  box.innerHTML=h;
}
function setTemaChamada(tid,aid,val){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const t=S.temas.find(t=>t.id===tid);if(!t)return;t.entregas[aid]=val;save();renderPres();renderTemaChamada();}
function temaDaChamada(){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); _temaPlanoRef=null; modalTema(presTurma,'',presData,'extra'); }
function carregaPres(data){presData=data;VIEWS.presenca();window.scrollTo({top:0,behavior:'smooth'});}
function renderPresLista(){
  const box=document.getElementById('pLista'); if(!box)return;
  const recs=S.presencas.filter(p=>p.turmaId===presTurma);
  const q=presBusca.trim();
  let filt,titulo;
  if(q){ filt=recs.filter(p=>p.data.includes(q)||brDate(p.data).includes(q)); titulo=`Resultados (${filt.length})`; }
  else { const lim=diasAtras(7); filt=recs.filter(p=>p.data>=lim); titulo='Chamadas dos últimos 7 dias'; }
  filt.sort((a,b)=>b.data.localeCompare(a.data));
  if(!filt.length){ box.innerHTML=`<p class="hint">${q?'Nenhuma chamada encontrada.':'Nenhuma chamada nos últimos 7 dias.'}</p>`; return; }
  box.innerHTML=`<p class="hint" style="margin:4px 0 6px">${titulo}</p>`+filt.map(p=>{
    const lbl = p.statusAula==='cancelada' ? '🚫 cancelada' : p.statusAula==='transferida' ? '↪ transferida' : (Object.values(p.registros||{}).filter(s=>s==='falta').length+' falta(s)');
    return `<div class="check"><span>${brDate(p.data)} · ${lbl}</span><button class="btn ghost sm" style="margin-left:auto" onclick="carregaPres('${p.data}')">abrir</button></div>`;
  }).join('');
}
