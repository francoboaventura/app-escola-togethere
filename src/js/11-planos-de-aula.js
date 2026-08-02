/* ---- PLANOS DE AULA ---- */
VIEWS.planos=()=>{
  const v=document.getElementById('view');
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Planos de aula</h2></div>
    <p class="sub">Lista dos planos por data. <b>Clique para abrir</b> e ler os itens, o tema e as anotações. Use a busca para ver os já realizados.</p>
    ${soLeitura()?'':`<button class="btn" style="margin-bottom:14px" onclick="novoPlano(painelTurma||'')">+ Novo plano de aula</button>`}
    <div class="card" style="padding:14px 18px"><input type="text" id="buscaPlano" placeholder="🔎 Buscar plano (título, conteúdo, turma ou data)" value="${escAttr(_buscaPlano)}" oninput="_buscaPlano=this.value;renderPlanos()"></div>
    <div id="plList"></div>`;
  renderPlanos();
};
let _buscaPlano='';
function itensPendentesAnteriores(turmaId){
  const planos=S.planos.filter(p=>p.turmaId===turmaId).sort((a,b)=>b.data.localeCompare(a.data)||b.id.localeCompare(a.id));
  const ult=planos[0];
  if(!ult) return [];
  return (ult.itens||[]).filter(i=>!i.done && !i.virouTema).map(i=>i.txt);
}
function atalhoNovoPlano(){ ir('planos'); setTimeout(()=>novoPlano(painelTurma||''),120); }
// painel-guia mostrado ao criar um plano: última aula dada, próximas 3 e onde a turma deveria estar
function _planGuiaHTML(turmaId){
  const t=(S.turmas||[]).find(x=>x.id===turmaId); if(!t) return '';
  const col=planColecaoDe(t); const les=_plLessons(col);
  if(!les) return '<div class="card" style="padding:10px;margin:0 0 10px"><p class="hint" style="margin:0">📚 Planejamento: '+(col?('a coleção <b>'+esc(col)+'</b> ainda não foi publicada no app.'):'turma sem coleção definida.')+'</p></div>';
  const fi=_frontierIdx(les,_dadasDe(turmaId));
  const ult=fi>0?les[fi-1]:null, prox=les.slice(fi,fi+3), esp=semanaEsperada(turmaId);
  const atual=prox.length?prox[0].s:null;
  let st='';
  if(atual!=null){
    if(atual<esp)      st=' <span class="pill" style="background:#fdeaea;color:var(--vermelho)">atrasada '+(esp-atual)+' sem</span>';
    else if(atual>esp) st=' <span class="pill" style="background:#eaf6ea;color:var(--verde)">adiantada '+(atual-esp)+' sem</span>';
    else               st=' <span class="pill" style="background:#eaf6ea;color:var(--verde)">em dia</span>';
  }
  const lin=l=>'Sem '+l.s+' · Aula '+l.a+(l.u?(' — '+esc(l.u)):'')+(l.sec?(' · '+esc(l.sec)):'')+(l.pg&&l.pg!=='—'?(' <span class="hint">(pág '+esc(l.pg)+')</span>'):'');
  return '<div class="card" style="padding:10px;margin:0 0 10px">'+
    '<p class="hint" style="margin:0 0 6px"><b>📚 Planejamento · '+esc(col)+'</b></p>'+
    '<p style="margin:0 0 5px;font-size:13px">✅ <b>Última aula dada:</b> '+(ult?lin(ult):'<span class="hint">nenhuma ainda</span>')+'</p>'+
    '<p style="margin:0 0 2px;font-size:13px">➡️ <b>Próximas:</b></p>'+
    (prox.length?prox.map((l,i)=>'<p style="margin:0 0 2px 14px;font-size:13px">'+(i===0?('<b>'+lin(l)+'</b>'):lin(l))+'</p>').join(''):'<p class="hint" style="margin:0 0 2px 14px;font-size:13px">plano concluído 🎉</p>')+
    '<p style="margin:6px 0 0;font-size:13px">🎯 <b>Deveria estar na:</b> Semana '+esp+st+'</p>'+
  '</div>';
}
function novoPlano(turmaPreset){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const tp=turmaPreset||primeiraTurma();
  const sug=itensPendentesAnteriores(tp);
  modal(`<h3>🗒️ Novo plano de aula <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Título</label><input type="text" id="plTit" placeholder="Ex: Present Perfect — experiências"></div>
    <div class="row"><div class="field"><label class="lbl">Turma</label>${selectTurma('plTurma',tp)}</div>
    <div class="field"><label class="lbl">Data da aula</label><span id="plDataWrap">${selectDataAula('plData',tp)}</span></div></div>
    <div id="plGuia">${_planGuiaHTML(tp)}</div>
    <div class="field"><label class="lbl">Itens do plano (um por linha)</label>
      <p class="hint" id="plSugHint" style="margin:0 0 6px;${sug.length?'':'display:none'}">↩️ Itens não concluídos da última aula já vêm como sugestão. Edite à vontade.</p>
      <textarea id="plItens" placeholder="Warm-up&#10;Apresentar estrutura&#10;Listening&#10;Speaking em duplas&#10;Tema de casa">${sug.join('\n')}</textarea></div>
    <button class="btn block" onclick="salvarPlano()">Criar plano</button>`);
  setTimeout(()=>{const s=document.getElementById('plTurma'); if(s) s.onchange=e=>{
    document.getElementById('plDataWrap').innerHTML=selectDataAula('plData',e.target.value);
    const _g=document.getElementById('plGuia'); if(_g) _g.innerHTML=_planGuiaHTML(e.target.value);
    const novos=itensPendentesAnteriores(e.target.value);
    const ta=document.getElementById('plItens'); if(ta) ta.value=novos.join('\n');
    const hint=document.getElementById('plSugHint'); if(hint) hint.style.display=novos.length?'block':'none';
  };},60);
}
function salvarPlano(){
  const tit=document.getElementById('plTit').value.trim();
  if(!tit)return toast('Dê um título');
  const data=document.getElementById('plData').value;
  if(!data)return toast('Selecione a data da aula (defina os dias da turma, se necessário)');
  const itens=document.getElementById('plItens').value.split('\n').map(s=>s.trim()).filter(Boolean).map(t=>({txt:t,done:false}));
  S.planos.push({id:uid(),titulo:tit,turmaId:document.getElementById('plTurma').value,data,itens,anotacoes:'',conteudo:'',realizado:false,atualizadoEm:Date.now()});
  save();fechar();renderPlanos();toast('Plano criado');
}
let _planoAberto=null;
function togglePlanoAberto(id){ _planoAberto = (_planoAberto===id)?null:id; renderPlanos(); }
function planoCard(p){
  const feitos=p.itens.filter(i=>i.done).length;
  const naofeitos=p.itens.length-feitos;
  const temasEntrega=S.temas.filter(t=>t.turmaId===p.turmaId && (t.dataEntrega||t.data)===p.data);
  const temasPassados=S.temas.filter(t=>t.turmaId===p.turmaId && t.data===p.data);
  const entregasAula=temasEntregaDaAula(p.turmaId,p.data);
  const atrasPend=entregasAula.filter(e=>e.atrasada).length;
  const aberto=_planoAberto===p.id;
  const ro=soLeitura();
  const statusPill=p.realizado?`<span class="pill" style="background:#e7f6ef;color:var(--ok)">✓ realizado</span>`:`<span class="pill" style="background:#fff7e6;color:var(--laranja)">pendente</span>`;
  return `<div class="card" style="padding:0;overflow:hidden">
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px;cursor:pointer" onclick="togglePlanoAberto('${p.id}')">
      <div style="flex:1;min-width:140px"><b>${brDate(p.data)}</b> · ${esc(p.titulo)}<div class="hint" style="margin-top:2px">${turmaNome(p.turmaId)} · ${feitos}/${p.itens.length} itens · ${statusPill}${p.transferidoDe?' · <span class="pill" style="background:#fff7e6;color:var(--laranja)">↪ transferido</span>':''}${temasEntrega.length?` · 📚 ${temasEntrega.length} p/ entregar`:''}${atrasPend?` · ⏰ ${atrasPend} atrasado(s)`:''}${temasPassados.length?` · 📩 ${temasPassados.length} passado(s)`:''}</div></div>
      ${ro?'':`<button class="btn ghost sm" onclick="event.stopPropagation();editarPlano('${p.id}')">✏️ editar</button>`}
      <span style="opacity:.5;font-size:.8rem">${aberto?'▲':'▼'}</span>
    </div>
    ${aberto?`<div style="padding:0 16px 16px">
      <p class="hint" style="margin:0 0 6px">✅ ${feitos} feito(s) · ⭕ ${naofeitos} não feito(s)</p>
      <div>${p.itens.map((it,i)=>`<div class="check ${it.done?'done':''}"><input type="checkbox" ${it.done?'checked':''} ${ro?'disabled':''} onchange="togglePlano('${p.id}',${i})"><span>${esc(it.txt)}${it.virouTema?' <span class="pill" style="background:#fff0f6;color:var(--rosa)">📩 virou tema</span>':''}</span>${ro?'':it.virouTema?`<button class="btn ghost sm" style="margin-left:auto;color:var(--laranja)" title="Desfazer: volta a ser item do plano e apaga o tema criado" onclick="desfazerTemaDoPlano('${p.id}',${i})">↩︎ desfazer tema</button>`:`<button class="btn ghost sm" style="margin-left:auto" title="Transformar em tema de casa" onclick="temaDoPlano('${p.id}',${i})">📩 tema</button>`}</div>`).join('')||'<p class="hint">Plano sem itens.</p>'}</div>
      <div class="card" style="background:#fff0f6;margin-top:12px;border:1px solid #ffd9ea"><h4 style="margin:0 0 8px">📚 Temas para entregar nesta aula</h4>
        ${entregasAula.length?entregasAula.map(e=>{const t=e.tema;return `<div style="border-bottom:1px solid #ffd9ea;padding-bottom:10px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px"><b style="flex:1">${escAttr(t.descricao)}</b>${e.atrasada?`<span class="pill" style="background:#fff0e6;color:var(--laranja)">⏰ atrasado · entrega era ${brDate(e.entregaEra)}</span>`:`<span class="pill">passado ${brDate(t.data)}</span>`}</div>
          ${e.aids.map(aid=>{const a=S.alunos.find(x=>x.id===aid);const st=t.entregas[aid];const atras=st==='atrasado';
            return `<div class="check" style="${atras?'background:#fff7f0;border:1px solid #ffd9b8;border-radius:10px;padding:6px 8px':''}"><span style="flex:1">${a?a.nome:'—'}${atras?' <span class="pill" style="background:#fff0e6;color:var(--laranja)">⏰ atrasado</span>':''}</span>
              <div class="seg"><button class="${st===true?'on-ok':''}" onclick="setTema('${t.id}','${aid}',true)">feito</button>
              <button class="${st==='parcial'?'on-mid':''}" onclick="setTema('${t.id}','${aid}','parcial')">parcial</button>
              <button class="${st===false?'on-no':''}" onclick="setTema('${t.id}','${aid}',false)">não feito</button></div></div>`;}).join('')}
        </div>`;}).join(''):'<p class="hint" style="margin:0">Nenhum tema com entrega nesta aula.</p>'}
      </div>
      <div class="card" style="background:#f7f3ff;margin-top:10px;border:1px solid #e6d9ff"><h4 style="margin:0 0 8px">📩 Temas passados nesta aula</h4>
        ${temasPassados.length?temasPassados.map(t=>`<div class="check"><span style="flex:1">${escAttr(t.descricao)} <span class="pill">entrega ${brDate(t.dataEntrega||t.data)}</span></span>
          ${ro?'':`<button class="btn ghost sm" title="Trocar data de entrega" onclick="trocarEntregaTema('${t.id}')">📅</button>
          <button class="btn ghost sm" onclick="editarTema('${t.id}')">✏️</button>`}
          ${(ehProfessor()||ro)?'':`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="delTema('${t.id}')">🗑</button>`}</div>`).join(''):'<p class="hint" style="margin:0 0 8px">Nenhum tema passado nesta aula.</p>'}
        ${ro?'':`<button class="btn ghost sm" style="margin-top:8px;color:var(--rosa)" onclick="abrirTemasHub('${p.turmaId}','${p.data}')">📚 Temas</button>`}</div>
      <div class="field" style="margin-top:12px"><label class="lbl">Anotações</label><textarea ${ro?'readonly':''} onchange="setPlanoCampo('${p.id}','anotacoes',this.value)" placeholder="Observações sobre a aula...">${esc(p.anotacoes||'')}</textarea></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">
        ${ro?'':p.realizado?`<button class="btn ghost sm" onclick="reabrirPlano('${p.id}')">↩︎ reabrir</button>`:`<button class="btn sm" onclick="marcarPlanoFeito('${p.id}')">✓ marcar como feito</button> <button class="btn ghost sm" style="color:var(--laranja)" title="A aula conta e as faltas ficam, mas o plano vai para a próxima data — sem relatório nem alerta" onclick="transferirPlanoProximaAula('${p.id}')">↪️ Transferir p/ próxima aula</button>`}
        <button class="btn amarelo sm" onclick="gerarRelatorioDoPlano('${p.id}')">🧾 Gerar relatório</button>
        ${(ro || (ehProfessor()&&p.realizado))?'':`<button class="btn ghost sm" style="color:var(--vermelho);margin-left:auto" onclick="delPlano('${p.id}')">🗑 Excluir</button>`}
      </div>
    </div>`:''}
  </div>`;
}
function renderPlanos(){
  const list=document.getElementById('plList');
  const raw=(_buscaPlano||'').trim(), q=_normTxt(raw);
  const base=(painelTurma?S.planos.filter(p=>p.turmaId===painelTurma):[...S.planos]);
  if(q){
    const ps=base.filter(p=> _normTxt(p.titulo).includes(q) || _normTxt(p.conteudo||'').includes(q) || _normTxt(turmaNome(p.turmaId)).includes(q) || p.data.includes(raw) || brDate(p.data).includes(raw)).sort((a,b)=>b.data.localeCompare(a.data));
    list.innerHTML = ps.length ? ps.map(planoCard).join('') : `<div class="card empty"><div class="big">🔎</div>Nenhum plano encontrado.</div>`;
    return;
  }
  const pend=base.filter(p=>!p.realizado).sort((a,b)=>a.data.localeCompare(b.data));
  const feitos=base.filter(p=>p.realizado).sort((a,b)=>b.data.localeCompare(a.data));
  if(!pend.length && !feitos.length){ list.innerHTML=`<div class="card empty"><div class="big">✅</div>Nenhum plano de aula ainda. Crie um novo no botão acima.</div>`; return; }
  let html=`<p style="font-weight:700;margin:4px 0 8px;opacity:.7">⏳ Pendentes (${pend.length})</p>`;
  html += pend.length ? pend.map(planoCard).join('') : '<p class="hint" style="margin:0 0 8px">Nenhum plano pendente.</p>';
  html += `<p style="font-weight:700;margin:20px 0 8px;opacity:.7">✓ Realizados (${feitos.length})</p>`;
  html += feitos.length ? feitos.map(planoCard).join('') : '<p class="hint" style="margin:0">Nenhum plano realizado ainda.</p>';
  list.innerHTML=html;
}
function marcarPlanoFeito(pid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const p=S.planos.find(p=>p.id===pid);if(!p)return;p.realizado=true;p.realizadoEm=hoje();p.atualizadoEm=Date.now();save();renderPlanos();toast('Plano marcado como feito');}
function gerarRelatorioDoPlano(pid){
  const p=S.planos.find(x=>x.id===pid); if(!p)return;
  upsertRelatorio(p.turmaId,p.data,corpoRelatorioDia(p.turmaId,p.data));
  save(); toast('Relatório gerado — veja em Avisos');
}
function transferirPlanoProximaAula(pid){
  if(soLeitura())return toast('Somente leitura — a secretaria não edita planos');
  const p=S.planos.find(p=>p.id===pid); if(!p)return;
  if(p.realizado)return toast('Este plano já foi marcado como realizado');
  const t=S.turmas.find(x=>x.id===p.turmaId);
  if(!t||!t.dias||!t.dias.length)return toast('Defina os dias de aula da turma para poder transferir');
  const origem=p.data;
  const prox=proximaEntrega(p.turmaId,origem);
  if(!prox||prox<=origem)return toast('Não encontrei uma próxima data de aula para esta turma');
  if(!confirm('Transferir este plano para a próxima aula?\n\nDe '+brDate(origem)+'  →  para '+brDate(prox)+'\n\nA aula de '+brDate(origem)+' continua valendo (as faltas ficam registradas), mas o plano passa para a próxima data — sem gerar relatório nem cobrança para aquele dia.'))return;
  let rec=S.presencas.find(x=>x.turmaId===p.turmaId && x.data===origem);
  if(!rec){ rec={id:uid(),turmaId:p.turmaId,data:origem,registros:{},fechada:false,atualizadoEm:Date.now()}; S.presencas.push(rec); }
  rec.planoTransferido=true; rec.planoTransferidoPara=prox; rec.atualizadoEm=Date.now();
  p.transferidoDe=origem; p.data=prox; p.atualizadoEm=Date.now();
  save(); montarNav(); if(typeof renderPlanos==='function') renderPlanos();
  toast('Plano transferido para '+brDate(prox));
}
function reabrirPlano(pid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const p=S.planos.find(p=>p.id===pid);if(!p)return;p.realizado=false;p.realizadoEm=null;p.atualizadoEm=Date.now();save();renderPlanos();toast('Plano reaberto');}
function togglePlano(pid,i){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const p=S.planos.find(p=>p.id===pid);p.itens[i].done=!p.itens[i].done;p.atualizadoEm=Date.now();save();renderPlanos();}
function setPlanoCampo(pid,campo,val){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const p=S.planos.find(p=>p.id===pid);p[campo]=val;save();}
function delPlano(pid){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');const _p=S.planos.find(x=>x.id===pid);if(ehProfessor() && !perm('prof_del_plano'))return toast('A direção desativou a exclusão de planos para professores');if(ehProfessor() && _p && _p.realizado)return toast('Você só pode excluir planos ainda NÃO realizados');if(confirm('Excluir este plano?')){S.planos=S.planos.filter(p=>p.id!==pid);marcarExcluido('planos',pid);save();renderPlanos();toast('Plano excluído');}}
function editarPlano(id){
  const p=S.planos.find(x=>x.id===id); if(!p)return;
  modal(`<h3>✏️ Editar plano <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Título</label><input type="text" id="epTit" value="${escAttr(p.titulo)}"></div>
    <div class="row"><div class="field"><label class="lbl">Data da aula</label>${selectDataAula('epData',p.turmaId,p.data)}</div>
    <div class="field"><label class="lbl">Conteúdo da aula</label><input type="text" id="epCont" value="${escAttr(p.conteudo||'')}" placeholder="Ex: Present perfect"></div></div>
    <div class="field"><label class="lbl">Itens (um por linha)</label><textarea id="epItens">${escAttr((p.itens||[]).map(i=>i.txt).join('\n'))}</textarea></div>
    <div class="field"><label class="lbl">Anotações</label><textarea id="epNotas">${escAttr(p.anotacoes||'')}</textarea></div>
    <button class="btn block" onclick="salvarEdicaoPlano('${id}')">Salvar alterações</button>`);
}
function salvarEdicaoPlano(id){
  const p=S.planos.find(x=>x.id===id); if(!p)return;
  const tit=document.getElementById('epTit').value.trim(); if(!tit)return toast('Dê um título');
  const antigos={}; (p.itens||[]).forEach(i=>antigos[i.txt]=i.done);
  p.itens=document.getElementById('epItens').value.split('\n').map(s=>s.trim()).filter(Boolean).map(txt=>({txt,done:!!antigos[txt]}));
  p.titulo=tit; p.data=document.getElementById('epData').value;
  p.conteudo=document.getElementById('epCont').value.trim(); p.anotacoes=document.getElementById('epNotas').value; p.atualizadoEm=Date.now();
  save(); fechar(); renderPlanos(); toast('Plano atualizado');
}
