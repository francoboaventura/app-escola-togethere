/* ---- TURMAS E ALUNOS ---- */
/* ===== Comunicados por e-mail (b47) ===== */
let _cmAberto=null;
function toggleComunicado(id){ _cmAberto=(_cmAberto===id)?null:id; VIEWS.comunicados(); }
function _cmAlvos(){
  const allEl=document.getElementById('cmAll');
  const all=!!(allEl&&allEl.checked);
  const ativas=(S.turmas||[]).filter(t=>turmaStatus(t)!=='encerrada');
  let sel;
  if(all){ sel=ativas; }
  else { sel=ativas.filter(t=>{ const c=document.getElementById('cm_t_'+t.id); return !!(c&&c.checked); }); }
  const ids=sel.map(t=>t.id);
  const alunos=(S.alunos||[]).filter(a=>!a.arquivado && ids.indexOf(a.turmaId)>=0);
  const map={}; let comEmail=0;
  alunos.forEach(a=>{ const raw=(a.email||'').trim(); if(raw){ comEmail++; map[raw.toLowerCase()]=raw; } });
  return {turmas:sel, ids, alunos, emails:Object.values(map), comEmail, total:alunos.length, escolaToda:all};
}
function renderCmResumo(){
  const box=document.getElementById('cmResumo'); if(!box) return;
  const a=_cmAlvos();
  if(!a.ids.length){ box.innerHTML='<p class="hint" style="margin:0">Escolha as turmas (ou a escola toda) acima.</p>'; return; }
  let h=`<b>${a.emails.length}</b> e-mail(s) único(s) — de ${a.comEmail} aluno(s) com e-mail, num total de ${a.total} aluno(s) na seleção.`;
  if(a.total>a.comEmail) h+=` <span class="hint">(${a.total-a.comEmail} sem e-mail cadastrado ficam de fora)</span>`;
  let cor='#1a8a4a', bg='#eafaf0';
  if(a.emails.length>90){ cor='var(--vermelho)'; bg='#fdeaea'; h+=`<br><b>⚠️ Atenção:</b> o Gmail comum entrega ~100 e-mails/dia. Acima disso o envio pode falhar — divida em partes ou aguarde o Workspace.`; }
  box.innerHTML=`<div class="card" style="background:${bg};color:${cor};padding:10px 12px;margin:8px 0">${h}</div>`;
}
async function enviarComunicado(){
  if(ehProfessor()) return toast('Sem permissão');
  const assunto=(document.getElementById('cmAssunto').value||'').trim();
  const corpo=(document.getElementById('cmCorpo').value||'').trim();
  if(!assunto) return toast('Escreva o assunto');
  if(!corpo) return toast('Escreva a mensagem');
  const a=_cmAlvos();
  if(!a.ids.length) return toast('Escolha ao menos uma turma (ou a escola toda)');
  if(!a.emails.length) return toast('Nenhum responsável com e-mail cadastrado nessa seleção');
  let aviso='';
  if(a.emails.length>90) aviso='\n\nATENÇÃO: '+a.emails.length+' destinatários — acima do limite diário do Gmail comum (~100). Pode falhar.';
  const ondePara=a.escolaToda?'a ESCOLA TODA':(a.turmas.length+' turma(s)');
  if(!confirm('Enviar comunicado para '+ondePara+'?\n\nDestinatários: '+a.emails.length+' responsável(is) em cópia oculta.\nAssunto: '+assunto+aviso)) return;
  const btn=document.getElementById('cmEnviar'); if(btn){ btn.disabled=true; btn.textContent='Enviando…'; }
  const res=await cloudEmail(a.emails, assunto, corpo);
  if(btn){ btn.disabled=false; btn.textContent='✉️ Enviar comunicado'; }
  if(res && res.ok){
    S.comunicados=S.comunicados||[];
    S.comunicados.push({id:uid(),data:hoje(),ts:Date.now(),assunto,corpo,turmas:a.ids.slice(),escolaToda:a.escolaToda,enviados:res.enviados||a.emails.length,por:S.usuario});
    save();
    document.getElementById('cmAssunto').value='';
    document.getElementById('cmCorpo').value='';
    VIEWS.comunicados();
    toast('Comunicado enviado para '+(res.enviados||a.emails.length)+' e-mail(s)');
  } else {
    toast('Não foi possível enviar: '+((res&&res.erro)||'erro'));
  }
}
VIEWS.comunicados=()=>{
  const v=document.getElementById('view');
  if(ehProfessor()){ v.innerHTML='<p class="sub">Sem permissão.</p>'; return; }
  const ativas=(S.turmas||[]).filter(t=>turmaStatus(t)!=='encerrada').sort((a,b)=>a.nome.localeCompare(b.nome));
  const checks=ativas.map(t=>{
    const n=(S.alunos||[]).filter(a=>a.turmaId===t.id && !a.arquivado);
    const comE=n.filter(a=>(a.email||'').trim()).length;
    return `<label style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--linha);padding:7px 0;cursor:pointer">
      <input type="checkbox" class="cmT" id="cm_t_${t.id}" onchange="renderCmResumo()">
      <span style="flex:1">${escAttr(t.nome)} <span class="hint">(${comE}/${n.length} com e-mail)</span></span></label>`;
  }).join('')||'<p class="hint">Nenhuma turma ativa.</p>';
  const hist=(S.comunicados||[]).slice().sort((x,y)=>(y.ts||0)-(x.ts||0)).slice(0,8);
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Comunicados</h2></div>
    <p class="sub">Envie um aviso por e-mail aos responsáveis — de turmas escolhidas ou da escola toda. Cada família recebe em <b>cópia oculta</b> (um não vê o e-mail do outro).</p>
    <div class="card">
      <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-weight:600">
        <input type="checkbox" id="cmAll" onchange="renderCmResumo()"> 📣 Escola toda
      </label>
      <p class="hint" style="margin:4px 0">…ou escolha turmas específicas:</p>
      ${checks}
    </div>
    <div id="cmResumo"></div>
    <div class="card">
      <div class="field"><label class="lbl">Assunto</label><input type="text" id="cmAssunto" placeholder="Ex.: Não haverá aula na sexta-feira"></div>
      <div class="field"><label class="lbl">Mensagem</label><textarea id="cmCorpo" rows="7" placeholder="Escreva o comunicado…"></textarea></div>
      <button class="btn" id="cmEnviar" onclick="enviarComunicado()">✉️ Enviar comunicado</button>
    </div>
    ${hist.length?`<h3 style="margin:18px 0 6px">Últimos enviados</h3><p class="hint" style="margin:0 0 6px">Toque em um comunicado para ver o conteúdo e quem enviou.</p>`+hist.map(c=>{
      const ab=_cmAberto===c.id;
      const nomes=c.escolaToda?'Escola toda':((c.turmas||[]).map(id=>_turmaNomePorId(id)).filter(Boolean).join(', ')||((c.turmas||[]).length+' turma(s)'));
      return `<div class="card" style="padding:10px 12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;cursor:pointer" onclick="toggleComunicado('${c.id}')">
          <b style="flex:1">${escAttr(c.assunto)}</b><span class="hint">${brDate(c.data)}</span><span style="opacity:.5;font-size:.8rem">${ab?'▲':'▼'}</span></div>
        <p class="hint" style="margin:4px 0 0">${c.escolaToda?'Escola toda':((c.turmas||[]).length+' turma(s)')} · ${c.enviados||0} e-mail(s) · por ${escAttr(c.por||'—')}</p>
        ${ab?`<div style="margin-top:10px;border-top:1px solid var(--linha);padding-top:10px">
          <p class="hint" style="margin:0 0 8px"><b>Enviado por:</b> ${escAttr(c.por||'—')} &nbsp;·&nbsp; <b>Para:</b> ${escAttr(nomes)} &nbsp;·&nbsp; <b>${c.enviados||0}</b> e-mail(s)</p>
          <div style="white-space:pre-wrap;background:#f7f5f2;border-radius:10px;padding:10px 12px;line-height:1.5">${escAttr(c.corpo||'(sem conteúdo)')}</div>
        </div>`:''}
      </div>`;
    }).join(''):''}`;
  renderCmResumo();
};

/* ===== Ficha do Aluno (b49) ===== */
let _fichaAlunoId=null, _fichaDe='', _fichaAte='';
function _fichaTurmasDoAluno(alunoId){
  const ids={};
  const a=(S.alunos||[]).find(x=>x.id===alunoId);
  if(a && a.turmaId) ids[a.turmaId]=true;
  (S.presencas||[]).forEach(p=>{ if(p.registros && (alunoId in p.registros)) ids[p.turmaId]=true; });
  (S.turmas||[]).forEach(t=>{ if((t.alunosSnapshot||[]).some(s=>s.id===alunoId)) ids[t.id]=true; });
  return Object.keys(ids).map(id=>(S.turmas||[]).find(t=>t.id===id)).filter(Boolean);
}
function testesDoAluno(alunoId){
  return (S.testes||[]).filter(t=>t.notas && (alunoId in t.notas))
    .map(t=>({data:t.data,turmaId:t.turmaId,numero:t.numero,nota:t.notas[alunoId]}))
    .sort((a,b)=>(a.data||'').localeCompare(b.data||''));
}
function _fichaAulas(alunoId, turmaIds, de, ate){
  const inRange=d=>(!de||d>=de)&&(!ate||d<=ate);
  const out=[];
  (S.presencas||[]).forEach(p=>{
    if(turmaIds.indexOf(p.turmaId)<0) return;
    if(!p.registros || !(alunoId in p.registros)) return;
    if(!inRange(p.data)) return;
    const rel=(S.relatorios||[]).find(r=>r.turmaId===p.turmaId && r.data===p.data);
    out.push({data:p.data, turmaId:p.turmaId, status:p.registros[alunoId],
      cancelada:p.statusAula==='cancelada', transferida:p.statusAula==='transferida',
      resumo:(rel&&rel.corpo)||resumoAulaDoDia(p.turmaId,p.data)});
  });
  return out.sort((a,b)=>b.data.localeCompare(a.data));
}
function _fichaStreakFaltas(alunoId,turmaId){
  const dois=temAula2(turmaId);
  const sess=(S.presencas||[]).filter(p=>p.turmaId===turmaId && _aulaConta(p) && p.registros && (alunoId in p.registros)).sort((x,y)=>x.data.localeCompare(y.data));
  const seq=[]; sess.forEach(p=>{ const s1=p.registros[alunoId]; if(p.registros2){seq.push(s1);seq.push(p.registros2[alunoId]||'presente');} else if(dois){seq.push(s1);seq.push(s1);} else seq.push(s1); });
  let streak=0; for(let i=seq.length-1;i>=0;i--){ if(seq[i]==='falta')streak++; else break; }
  return streak;
}
function corpoFichaAluno(alunoId, de, ate){
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return '';
  const turmas=_fichaTurmasDoAluno(alunoId);
  const inRange=d=>(!de||d>=de)&&(!ate||d<=ate);
  const tatual=(S.turmas||[]).find(t=>t.id===a.turmaId);
  let txt=`FICHA DO ALUNO\n${a.nome}\n`;
  if(tatual) txt+=`Turma atual: ${tatual.nome}${tatual.professor?' · Prof. '+tatual.professor:''}\n`;
  txt+=`Período: ${de?brDate(de):'início'} a ${ate?brDate(ate):'hoje'}\nGerado em ${brDate(hoje())} por ${S.usuario}\n`;
  let totalF=Number(a.faltasRetro)||0;
  turmas.forEach(t=>{ totalF+=faltasDoAluno(alunoId,t.id).filter(inRange).length; });
  const aulas=_fichaAulas(alunoId, turmas.map(t=>t.id), de, ate);
  const pres=aulas.filter(x=>x.status==='presente'&&!x.cancelada&&!x.transferida).length;
  txt+=`\n📊 FREQUÊNCIA\n• Presenças: ${pres}\n• Faltas: ${totalF}${(Number(a.faltasRetro)||0)?` (inclui ${a.faltasRetro} retroativa(s))`:''}\n`;
  txt+=`\n📅 AULAS (${aulas.length})\n`;
  if(aulas.length) aulas.forEach(x=>{
    const tag=x.cancelada?'aula cancelada':x.transferida?'aula transferida':(x.status==='falta'?'FALTOU':'presente');
    txt+=`• ${brDate(x.data)} — ${tag}${(!x.cancelada&&!x.transferida)?` — ${x.resumo}`:''}\n`;
  }); else txt+=`• Nenhuma aula no período.\n`;
  let temas=[]; turmas.forEach(t=>{ temas=temas.concat(temasNaoFeitosDoAluno(alunoId,t.id).filter(z=>inRange(z.data))); });
  txt+=`\n📚 TEMAS NÃO FEITOS / PARCIAIS (${temas.length})\n`;
  if(temas.length) temas.forEach(z=>{ txt+=`• ${brDate(z.data)} — ${z.descricao} — ${z.status==='parcial'?'parcial':'não feito'}\n`; }); else txt+=`• Nenhum.\n`;
  let mat=[]; turmas.forEach(t=>{ mat=mat.concat(materialDoAluno(alunoId,t.id).filter(inRange)); });
  txt+=`\n🎒 MATERIAL NÃO TRAZIDO (${mat.length})\n`;
  if(mat.length) mat.sort().forEach(d=>{ txt+=`• ${brDate(d)}\n`; }); else txt+=`• Nenhum.\n`;
  const tst=testesDoAluno(alunoId).filter(z=>inRange(z.data));
  txt+=`\n📝 TESTES (${tst.length})\n`;
  if(tst.length) tst.forEach(z=>{ const tn=((S.turmas||[]).find(t=>t.id===z.turmaId)||{}).nome||''; const _no=z.nota; let _linha; if(_no && typeof _no==='object'){ const _ns=Object.keys(_no).filter(k=>_no[k]!==''&&_no[k]!=null&&!isNaN(_no[k])); const _m=_ns.length?Math.round(_ns.reduce((a,k)=>a+Number(_no[k]),0)/_ns.length):null; const _det=_ns.map(k=>k.slice(0,3)+' '+_no[k]).join(' · '); _linha='média '+(_m==null?'—':_m)+(_det?(' ('+_det+')'):''); } else { _linha='nota '+(_no==null?'—':_no); } txt+=`• ${brDate(z.data)}${z.numero?(' · teste '+z.numero):''} — ${_linha}${tn?(' — '+tn):''}\n`; }); else txt+=`• Nenhum registro.\n`;
  const wrsF=(S.writings||[]).filter(w=>w.alunoId===alunoId && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data));
  txt+=`\n📝 WRITINGS (${wrsF.length})\n`;
  if(wrsF.length) wrsF.forEach(w=>{ const bt=(w.subscales||Object.keys(w.bands||{})).map(k=>WR_LBL(k)+' '+(w.bands[k]!=null?w.bands[k]:'—')).join(', '); txt+=`• ${brDate(w.data)} — ${w.levelLabel||w.level||''}${w.taskLabel?(' · '+w.taskLabel):''} — Geral ${w.overall_band!=null?w.overall_band:'—'}/5 (${bt})${w.togethere_band?(' · '+w.togethere_band):''}${w.cefr_result?(' · '+w.cefr_result):''}\n`; }); else txt+=`• Nenhum.\n`;
  const coms=comentariosDoAluno(alunoId).filter(c=>inRange(c.data));
  txt+=`\n💬 COMENTÁRIOS (${coms.length})\n`;
  if(coms.length) coms.forEach(c=>{ txt+=`• ${brDate(c.data)} (${c.autor}): ${c.texto}\n`; }); else txt+=`• Nenhum.\n`;
  txt+=`\n—\nTogethere · inglês para chegar lá`;
  return txt;
}
function abrirFicha(alunoId){
  _fichaAlunoId=alunoId;
  const ehVip=(S.vipAlunos||[]).some(v=>v.id===alunoId);
  if(ehVip){ _fichaDe=''; _fichaAte=''; }            // VIP: mostra todo o histórico (inclui as horas consolidadas da importação)
  else { const y=new Date().getFullYear(); _fichaDe=y+'-01-01'; _fichaAte=hoje(); }
  ir('ficha');
}
function setFichaPeriodo(modo){
  const y=new Date().getFullYear();
  if(modo==='ano'){ _fichaDe=y+'-01-01'; _fichaAte=hoje(); }
  else if(modo==='tudo'){ _fichaDe=''; _fichaAte=''; }
  VIEWS.ficha();
}
function fichaSetEmail(){
  if(ehProfessor()) return;
  const a=(S.alunos||[]).find(x=>x.id===_fichaAlunoId); if(!a) return;
  a.email=(document.getElementById('fcEmail').value||'').trim();
  a.atualizadoEm=Date.now(); save(); toast('E-mail do responsável atualizado');
}
// Edita os dados cadastrais do aluno direto na ficha (secretaria + direção).
function fichaSetCampoAluno(id,campo,val){
  if(!podeCadastro()) return toast('Sem permissão para editar os dados do aluno');
  const a=(S.alunos||[]).find(x=>x.id===id); if(!a) return;
  val=(val||'').trim();
  if(campo==='nome' && !val){ toast('O nome não pode ficar vazio'); return VIEWS.ficha(); }
  a[campo]=val; a.atualizadoEm=Date.now();
  save();
  if(campo==='nome' || campo==='nascimento'){ montarNav(); VIEWS.ficha(); }   // atualiza nome/idade no topo
  else toast('Dados atualizados');
}
// Registra no histórico que um relatório por aluno (ficha) foi enviado.
// Sem duplicidade: 1 registro por aluno por dia — se reenviar no mesmo dia, atualiza via/hora.
// Só conta como "enviado à família" quando feito por secretaria/direção (não por professor).
function _registrarEnvioFicha(a, via, corpo){
  if(!a || ehProfessor()) return;
  a.relatoriosEnviados = Array.isArray(a.relatoriosEnviados) ? a.relatoriosEnviados : [];
  const em=hoje();
  let reg=a.relatoriosEnviados.find(r=>r.em===em);
  if(reg){ reg.ts=Date.now(); reg.via=via; reg.por=S.usuario; reg.de=_fichaDe||''; reg.ate=_fichaAte||''; if(corpo!=null) reg.corpo=corpo; }
  else { a.relatoriosEnviados.push({ts:Date.now(), em, por:S.usuario, via, de:_fichaDe||'', ate:_fichaAte||'', corpo:(corpo!=null?corpo:'')}); }
  if(a.relatoriosEnviados.length>200) a.relatoriosEnviados=a.relatoriosEnviados.slice(-200);
  a.atualizadoEm=Date.now();   // carimbo para a sincronização entre aparelhos
}
function copiarFicha(){
  const a=(S.alunos||[]).find(x=>x.id===_fichaAlunoId); if(!a) return;
  const corpo=corpoFichaAluno(a.id,_fichaDe,_fichaAte);
  copiarTexto(corpo,'Ficha copiada! Cole no WhatsApp');
  _registrarEnvioFicha(a,'whatsapp',corpo); save();
}
function imprimirFicha(){
  const a=(S.alunos||[]).find(x=>x.id===_fichaAlunoId); if(!a) return;
  const doc=montarFichaHTML(a.id,_fichaDe,_fichaAte);
  if(typeof imprimirDoc==='function') imprimirDoc(doc.html); else toast('Impressão indisponível');
  _registrarEnvioFicha(a,'pdf',doc.txt); save();
}
async function enviarFichaResponsavel(){
  if(ehProfessor()) return toast('Sem permissão para enviar');
  const a=(S.alunos||[]).find(x=>x.id===_fichaAlunoId); if(!a) return;
  const email=(a.email||'').trim();
  if(!email || email.indexOf('@')<1) return toast('Sem e-mail do responsável. Cadastre no topo da ficha ou use Copiar para WhatsApp.');
  if(!confirm('Enviar a ficha de '+a.nome+' para '+email+'?')) return;
    const btn=document.getElementById('fcEnviar'); if(btn){ btn.disabled=true; btn.textContent='Enviando…'; }
  const txt=corpoFichaAluno(a.id,_fichaDe,_fichaAte);
  const htmlEmail=montarFichaEmailHTML(a.id,_fichaDe,_fichaAte);
  const res=await cloudEmail([email], 'Acompanhamento de '+a.nome+' — Togethere', txt, htmlEmail);
  if(btn){ btn.disabled=false; btn.textContent='✉️ Enviar ao responsável'; }
  if(res && res.ok){ a.fichaEnviadaEm=hoje(); a.fichaEnviadaPor=S.usuario; _registrarEnvioFicha(a,'email',txt); save(); VIEWS.ficha(); toast('Ficha enviada ao responsável'); }
  else toast('Não foi possível enviar: '+((res&&res.erro)||'erro'));
}
// --- Trocar o aluno de turma (só direção). O histórico fica preservado na turma antiga. ---
function abrirTrocarTurma(alunoId){
  if(ehProfessor()) return toast('Sem permissão para trocar de turma');
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return;
  const atual=(S.turmas||[]).find(t=>t.id===a.turmaId);
  const destinos=(S.turmas||[]).filter(t=>!t.arquivada && t.id!==a.turmaId).sort((x,y)=>(x.nome||'').localeCompare(y.nome||''));
  if(!destinos.length) return toast('Não há outra turma ativa para mover');
  modal(`<h3>Trocar de turma <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 8px"><b>${esc(a.nome)}</b> está em <b>${esc(atual?atual.nome:'—')}</b>. Escolha a turma de destino:</p>
    <div class="field"><label class="lbl">Nova turma</label>
      <select id="ttDestino">${destinos.map(t=>`<option value="${t.id}">${esc(t.nome)}${t.professor?' · '+esc(t.professor):''}</option>`).join('')}</select></div>
    <p class="hint" style="margin:8px 0 0">O histórico na turma atual é preservado — faltas e registros anteriores continuam aparecendo na ficha. O aluno passa a frequentar a nova turma a partir de agora.</p>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn" onclick="confirmarTrocarTurma('${alunoId}')">Confirmar troca</button><button class="btn ghost" onclick="fechar()">Cancelar</button></div>`);
}
function confirmarTrocarTurma(alunoId){
  if(ehProfessor()) return toast('Sem permissão para trocar de turma');
  const a=(S.alunos||[]).find(x=>x.id===alunoId); if(!a) return;
  const destino=(document.getElementById('ttDestino')||{}).value;
  const t=(S.turmas||[]).find(x=>x.id===destino);
  if(!t) return toast('Selecione a turma de destino');
  if(t.id===a.turmaId) return toast('O aluno já está nessa turma');
  a.turmaId=t.id; a.atualizadoEm=Date.now();
  save(); fechar(); VIEWS.ficha(); montarNav(); toast('Aluno movido para '+t.nome);
}
function corpoFichaVip(id){
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return '';
  const inRange=d=>(!_fichaDe||d>=_fichaDe)&&(!_fichaAte||d<=_fichaAte);
  const aulas=(S.aulasVip||[]).filter(x=>x.vipId===id && inRange(x.data)).sort((a,b)=>a.data.localeCompare(b.data));
  const comp=aulas.filter(a=>!a.faltou); const faltas=aulas.length-comp.length; const compMin=comp.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const wrs=(S.writings||[]).filter(w=>w.alunoId===id && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data));
  const coms=comentariosDoAluno(id).filter(c=>inRange(c.data));
  const _idadeV=vip.nascimento?(Math.floor((Date.now()-new Date(vip.nascimento).getTime())/(365.25*864e5))):null;
  let txt=`FICHA DO ALUNO (VIP)\n${vip.nome}\n${vip.professor?('Prof. '+vip.professor+'\n'):''}`;
  if(vip.email) txt+=`E-mail: ${vip.email}\n`;
  if(vip.telefone) txt+=`Telefone/WhatsApp: ${vip.telefone}\n`;
  if(_idadeV!=null) txt+=`Idade: ${_idadeV} anos\n`;
  txt+=`Período: ${_fichaDe?brDate(_fichaDe):'início'} a ${_fichaAte?brDate(_fichaAte):'hoje'}\nGerado em ${brDate(hoje())} por ${S.usuario}\n`;
  txt+=`\n👑 AULAS VIP (${aulas.length}) — ${comp.length} com presença (${fmtDur(compMin)})${faltas?(' · '+faltas+' falta(s)'):''}\n`;
  if(aulas.length) aulas.forEach(a=>{ txt+=`• ${brDate(a.data)} — ${a.tema?a.tema+': ':''}${a.descricao} (${fmtDur(a.duracaoMin)})${a.faltou?' — NÃO COMPARECEU':''}\n`; }); else txt+=`• Nenhuma.\n`;
  txt+=`\n📝 WRITINGS (${wrs.length})\n`;
  if(wrs.length) wrs.forEach(w=>{ const bt=(w.subscales||Object.keys(w.bands||{})).map(k=>WR_LBL(k)+' '+(w.bands[k]!=null?w.bands[k]:'—')).join(', '); txt+=`• ${brDate(w.data)} — ${w.levelLabel||w.level||''}${w.taskLabel?(' · '+w.taskLabel):''} — Geral ${w.overall_band!=null?w.overall_band:'—'}/5 (${bt})${w.togethere_band?(' · '+w.togethere_band):''}\n`; }); else txt+=`• Nenhum.\n`;
  txt+=`\n💬 COMENTÁRIOS (${coms.length})\n`;
  if(coms.length) coms.forEach(c=>{ txt+=`• ${brDate(c.data)} (${c.autor}): ${c.texto}\n`; }); else txt+=`• Nenhum.\n`;
  txt+=`\n—\nTogethere · inglês para chegar lá`;
  return txt;
}
function copiarFichaVip(id){ const t=corpoFichaVip(id); if(!t) return; copiarTexto(t,'Ficha copiada! Cole no WhatsApp'); }
function imprimirFichaVip(id){ const t=corpoFichaVip(id); if(!t) return; const html=`<div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:20px"><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:13px;line-height:1.5">${escAttr(t)}</pre></div>`; if(typeof imprimirDoc==='function') imprimirDoc(html); else toast('Impressão indisponível'); }
// Acesso dos VIPs ao portal está DESLIGADO por ora (mudar para true reativa tudo).
const VIP_PORTAL_ATIVO = false;
// Material em uso do VIP: dropdown com as coleções do app + opção de digitar um material fora da lista.
function _cardMaterialVip(vip){
  const cols=(typeof colecoesTodas==='function')?colecoesTodas():((typeof TG_COLECOES_TODAS!=='undefined')?TG_COLECOES_TODAS:[]);
  const isOutro = !!(vip.material && cols.indexOf(vip.material)<0);
  return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px;font-size:1rem">📘 Material em uso</h3>
    <select onchange="_vipMaterialSel('${vip.id}',this)">
      <option value="">— sem material —</option>
      ${cols.map(c=>`<option value="${escAttr(c)}" ${vip.material===c?'selected':''}>${esc(c)}</option>`).join('')}
      <option value="__outro__" ${isOutro?'selected':''}>— Outro (digitar) —</option>
    </select>
    <input type="text" id="vipMatOutro" value="${isOutro?escAttr(vip.material):''}" placeholder="Digite o material que não está na lista" style="margin-top:8px;display:${isOutro?'block':'none'}" onchange="setVipMaterial('${vip.id}',this.value)">
  </div>`;
}
function _vipMaterialSel(id, sel){
  const out=document.getElementById('vipMatOutro');
  if(sel.value==='__outro__'){ if(out){ out.style.display='block'; out.focus(); } return; }
  if(out) out.style.display='none';
  setVipMaterial(id, sel.value);
}
function setVipMaterial(id, val){
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  vp.material=(val||'').trim(); vp.atualizadoEm=Date.now(); save(); toast('Material atualizado');
}
// Horários previstos das aulas VIP — dias da semana + horário + remanejamentos + pausa. Base do alerta.
function _cardHorariosVip(vip){
  const dias=Array.isArray(vip.dias)?vip.dias:[];
  const lbl=(typeof vipHorarioLabel==='function')?vipHorarioLabel(vip):'';
  const podePausar=!ehProfessor();
  const rem=(vip.remarcacoes||[]).slice().sort((a,b)=>(a.data||'').localeCompare(b.data||''));
  const pausas=(vip.pausas||[]).slice().sort((a,b)=>(a.de||'').localeCompare(b.de||''));
  const pausaAtiva=(typeof vipPausaAtual==='function')?vipPausaAtual(vip):null;
  const hs=(typeof vipHorarios==='function')?vipHorarios(vip):[];
  const selDia=(v,oc)=>`<select onchange="${oc}" style="max-width:110px">${[1,2,3,4,5,6,0].map(d=>`<option value="${d}" ${+v===d?'selected':''}>${DIAS_SEMANA[d]}</option>`).join('')}</select>`;
  const linhaH=(hh,i)=>`<div style="display:flex;gap:8px;align-items:flex-end;margin-top:6px;flex-wrap:wrap">
      <div class="field" style="margin:0;flex:0 0 auto"><label class="lbl">Dia</label>${selDia(hh.dia,`setVipHorarioLinha('${vip.id}',${i},'dia',this.value)`)}</div>
      <div class="field" style="margin:0;flex:0 0 auto;width:130px"><label class="lbl">Hora</label><input type="time" value="${escAttr(hh.hora||'')}" onchange="setVipHorarioLinha('${vip.id}',${i},'hora',this.value)"></div>
      <div class="field" style="margin:0;flex:0 0 auto;width:110px"><label class="lbl">Duração (min)</label><input type="number" min="30" step="5" value="${(+hh.dur>0)?+hh.dur:60}" onchange="setVipHorarioLinha('${vip.id}',${i},'dur',this.value)"></div>
      <button class="btn ghost sm" style="color:var(--vermelho);margin-bottom:2px" title="Remover este horário" onclick="delVipHorario('${vip.id}',${i})">×</button>
    </div>`;
  const linhaNova=`<div style="display:flex;gap:8px;align-items:flex-end;margin-top:6px;flex-wrap:wrap">
      <div class="field" style="margin:0;flex:0 0 auto"><label class="lbl">Dia</label>${selDia(1,`novoVipHorario('${vip.id}','dia',this.value)`)}</div>
      <div class="field" style="margin:0;flex:0 0 auto;width:130px"><label class="lbl">Hora</label><input type="time" value="" onchange="novoVipHorario('${vip.id}','hora',this.value)"></div>
      <span class="hint" style="margin-bottom:6px">← preencha para criar o 1º horário</span>
    </div>`;
  const podeHor=!ehProfessor();   // professor não altera horários previstos (só a hora real no lançamento)
  let h=`<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px;font-size:1rem">🕒 Horários previstos das aulas</h3>
    <p class="hint" style="margin:0 0 4px">${podeHor?'Cada linha é um dia com o SEU horário (os horários podem variar por dia). Passada a aula sem registro, o app avisa o professor e, após 24h, a direção.':'Definidos pela secretaria/direção. A aula aconteceu em outro horário? Ajuste o campo "Hora" ao lançar a aula.'}</p>
    ${podeHor
      ?`${hs.length?hs.map(linhaH).join(''):linhaNova}
    <div style="display:flex;gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap">
      ${hs.length?`<button class="btn ghost sm" onclick="addVipHorario('${vip.id}')">＋ Adicionar horário</button>`:''}
      <span class="hint" style="flex:1">${lbl?('Previsto: <b>'+esc(lbl)+'</b>'):''}</span>
    </div>`
      :`<p style="margin:6px 0 0;font-size:.95rem">${hs.length?hs.map(hh=>'📅 <b>'+DIAS_SEMANA[+hh.dia]+'</b>'+(hh.hora?(' · '+escAttr(hh.hora)):'')+' · '+fmtDur((+hh.dur>0)?+hh.dur:60)).join('<br>'):'<span class="hint">Nenhum horário previsto cadastrado.</span>'}</p>`}`;
  if(pausaAtiva) h+=`<p class="hint" style="margin:10px 0 0;color:#c2560b">⏸️ <b>Aulas pausadas</b> de ${brDate(pausaAtiva.de)} a ${brDate(pausaAtiva.ate)}${pausaAtiva.motivo?(' · '+esc(pausaAtiva.motivo)):''} — sem alertas nesse período.</p>`;
  // Remanejamentos (qualquer perfil que abre a ficha)
  h+=`<div style="margin-top:14px;border-top:1px solid var(--linha);padding-top:10px">
      <div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:.92rem">🔀 Remanejamentos</b>${podeHor?`<button class="btn ghost sm" onclick="abrirRemarcarVip('${vip.id}')">+ Remanejar aula</button>`:''}</div>
      ${rem.length?rem.map(r=>`<div class="check"><span style="flex:1">${r.de?(brDate(r.de)+' → '):''}<b>${brDate(r.data)}${r.hora?(' · '+esc(r.hora)):''}</b>${r.motivo?(' · '+esc(r.motivo)):''}</span>${podeHor?`<button class="btn ghost sm" style="color:var(--vermelho)" onclick="delRemarcarVip('${vip.id}','${r.id}')">remover</button>`:''}</div>`).join(''):(podeHor?'<p class="hint" style="margin:6px 0 0">Nenhum. Use quando o aluno pedir para trocar o dia/horário de uma aula (antes ou depois do previsto).</p>':'')}
    </div>`;
  // Pausa (só secretaria/direção edita; professor vê em leitura)
  if(podePausar){
    h+=`<div style="margin-top:12px;border-top:1px solid var(--linha);padding-top:10px">
      <div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:.92rem">⏸️ Pausar aulas (recesso do aluno)</b><button class="btn ghost sm" onclick="abrirPausaVip('${vip.id}')">+ Pausa</button></div>
      <p class="hint" style="margin:6px 0 0">No período de pausa não há alerta de aula não registrada.</p>
      ${pausas.map(p=>`<div class="check"><span style="flex:1"><b>${brDate(p.de)} a ${brDate(p.ate)}</b>${p.motivo?(' · '+esc(p.motivo)):''}</span><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delPausaVip('${vip.id}','${p.id}')">remover</button></div>`).join('')}
    </div>`;
  } else if(pausas.length){
    h+=`<div style="margin-top:12px;border-top:1px solid var(--linha);padding-top:10px"><b style="font-size:.92rem">⏸️ Pausas</b>${pausas.map(p=>`<p class="hint" style="margin:6px 0 0">${brDate(p.de)} a ${brDate(p.ate)}${p.motivo?(' · '+esc(p.motivo)):''}</p>`).join('')}<p class="hint" style="margin:6px 0 0">Só a secretaria/direção altera as pausas.</p></div>`;
  }
  return h+`</div>`;
}
// Seção destacada da AULA ONLINE (link Meet/Zoom) — botão grande, impossível de não ver
function _cardAulaOnlineVip(vip){
  const link=(vip.linkAula||'').trim();
  const podeEditar=!ehProfessor();   // secretaria/direção mantêm o link; o professor usa
  const prox=(typeof _vipProximaAulaTxt==='function')?_vipProximaAulaTxt(vip):'';
  const podeLancar=!soLeitura() && (!ehProfessor() || perm('prof_vip_lancar'));
  return `<div class="card" style="margin-top:12px;border-left:5px solid #0A7A3D;background:linear-gradient(135deg,rgba(10,122,61,.07),transparent 60%)">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div style="font-size:1.9rem;line-height:1">🎥</div>
      <div style="flex:1;min-width:200px">
        <h3 style="margin:0;font-size:1.02rem">${ehProfessor()?'Sua aula com este aluno':'Aula online'}</h3>
        <p class="hint" style="margin:2px 0 0">${prox?('🗓️ Próxima aula prevista: <b>'+prox+'</b>'):(link?'Sala fixa deste aluno — um toque para entrar.':(podeEditar?'Cole o link da sala (Meet/Zoom) e ele fica fixo aqui para todo mundo.':'Sem horários previstos cadastrados.'))}</p>
        ${(prox&&!link&&!podeEditar)?'<p class="hint" style="margin:2px 0 0">Aula online? Peça o link à secretaria.</p>':''}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      ${link?`<a class="btn" style="background:#0A7A3D;text-decoration:none;font-size:1.02rem;padding:12px 22px" href="${escAttr(link)}" target="_blank" rel="noopener noreferrer">🎥 Entrar na aula</a>`:''}
      ${podeLancar?`<button class="btn" style="font-size:1.02rem;padding:12px 22px" onclick="lancarAulaVip('${vip.id}')">➕ Lançar aula</button>`:''}
      ${!ehProfessor()?`<button class="btn ghost" style="color:#c2560b" onclick="registrarCancelamentoVip('${vip.id}')">🚫 Cancelou em cima da hora</button>`:''}
    </div>
    ${podeEditar?`<div style="display:flex;gap:8px;align-items:flex-end;margin-top:10px;flex-wrap:wrap">
      <div class="field" style="margin:0;flex:1;min-width:220px"><label class="lbl">Link da sala (Meet/Zoom)</label><input type="url" value="${escAttr(vip.linkAula||'')}" placeholder="https://meet.google.com/…" onchange="setVipLinkAula('${vip.id}',this.value)"></div>
      ${link?`<button class="btn ghost sm" style="color:var(--vermelho);margin-bottom:2px" onclick="setVipLinkAula('${vip.id}','')">remover</button>`:''}
    </div>`:''}
    <div style="margin-top:12px;border-top:1px solid var(--linha);padding-top:8px">
      <div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:.92rem">🔗 Links úteis</b><button class="btn ghost sm" onclick="abrirLinkVip('${vip.id}')">+ link</button></div>
      ${(vip.links||[]).length?`<div style="margin-top:4px">${_linksUteisChips(vip.links, "delLinkVip('"+vip.id+"','__ID__')")}</div>`:`<p class="hint" style="margin:4px 0 0">Materiais do aluno: jogo do Wordwall, playlist, PDF, pasta do Drive…</p>`}
    </div>
  </div>`;
}
// Próxima aula prevista do VIP (até 14 dias à frente, respeitando pausas)
function _vipProximaAulaTxt(vip){
  const hs=(typeof vipHorarios==='function')?vipHorarios(vip):[];
  if(!hs.length) return '';
  const hj=new Date(hoje()+'T12:00:00');
  for(let i=0;i<14;i++){
    const d=new Date(hj.getFullYear(),hj.getMonth(),hj.getDate()+i);
    const dow=d.getDay(); const cand=hs.filter(x=>+x.dia===dow).sort((a,b)=>(a.hora||'').localeCompare(b.hora||''))[0];
    if(!cand) continue;
    const dd=ymd(d);
    if((vip.pausas||[]).some(pz=>dd>=pz.de&&dd<=pz.ate)) continue;
    const quando=i===0?'Hoje':(i===1?'Amanhã':DIAS_SEMANA[dow]+' '+brDate(dd).slice(0,5));
    return quando+(cand.hora?(' · '+cand.hora):'')+((+cand.dur>0&&+cand.dur!==60)?(' · '+fmtDur(+cand.dur)):'');
  }
  return '';
}
// normaliza/valida URL colada (aceita sem https)
function _urlNormalizada(url){
  url=(url||'').trim();
  if(!url) return '';
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  if(!/^https?:\/\/[^\s]+\.[^\s]{2,}/i.test(url)) return null;
  return url;
}
// chips de links úteis (usado no VIP e nos planos de aula)
function _linksUteisChips(links, delFnJs){
  return (links||[]).map(l=>`<span style="display:inline-flex;align-items:center;gap:4px;background:#eef2f8;border-radius:16px;padding:4px 6px 4px 12px;margin:3px 4px 0 0;max-width:100%">
    <a href="${escAttr(l.url)}" target="_blank" rel="noopener noreferrer" style="font-size:.85rem;text-decoration:none;color:var(--azul);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">🔗 ${esc(l.titulo||l.url)}</a>
    ${delFnJs?`<button class="btn ghost sm" style="color:var(--vermelho);padding:0 6px" title="Remover link" onclick="${delFnJs.replace('__ID__',l.id)}">×</button>`:''}
  </span>`).join('');
}
// ----- links úteis do aluno VIP -----
function abrirLinkVip(vid){
  modal(`<h3>🔗 Novo link útil <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Nome do link</label><input type="text" id="lv_titulo" placeholder="Ex: Wordwall — Past Simple, playlist, PDF da apostila"></div>
    <div class="field"><label class="lbl">Endereço (URL)</label><input type="url" id="lv_url" placeholder="https://…"></div>
    <button class="btn block" onclick="salvarLinkVip('${vid}')">Salvar link</button>`);
  setTimeout(()=>{const i=document.getElementById('lv_titulo'); if(i)i.focus();},60);
}
function salvarLinkVip(vid){
  const vp=(S.vipAlunos||[]).find(x=>x.id===vid); if(!vp) return;
  const titulo=((document.getElementById('lv_titulo')||{}).value||'').trim();
  const url=_urlNormalizada((document.getElementById('lv_url')||{}).value);
  if(url===null||!url) return toast('Cole um endereço válido (ex.: youtube.com/…)');
  vp.links=vp.links||[]; vp.links.push({id:uid(), titulo:titulo||url.replace(/^https?:\/\//,'').slice(0,40), url});
  vp.atualizadoEm=Date.now(); save(); fechar(); VIEWS.ficha&&VIEWS.ficha(); toast('Link salvo 🔗');
}
function delLinkVip(vid, lid){
  const vp=(S.vipAlunos||[]).find(x=>x.id===vid); if(!vp) return;
  vp.links=(vp.links||[]).filter(l=>l.id!==lid); vp.atualizadoEm=Date.now(); save(); VIEWS.ficha&&VIEWS.ficha(); toast('Link removido');
}
function setVipLinkAula(id, url){
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  url=(url||'').trim();
  if(url && !/^https?:\/\//i.test(url)) url='https://'+url;   // aceita colar sem o https
  if(url && !/^https?:\/\/[^\s]+\.[^\s]{2,}/i.test(url)) return toast('Link inválido — cole o endereço da sala (Meet, Zoom…)');
  vp.linkAula=url; vp.atualizadoEm=Date.now(); save();
  toast(url?'Link da aula online salvo 🎥':'Link removido'); VIEWS.ficha&&VIEWS.ficha();
}
function _vipGravarHorarios(vp, hs){
  vp.horarios=hs;
  vp.dias=[...new Set(hs.map(x=>+x.dia))].sort((a,b)=>a-b);      // compat com o formato antigo
  vp.horaPrev=(hs[0]&&hs[0].hora)||'';
  vp.atualizadoEm=Date.now(); save();
}
function addVipHorario(id){
  if(ehProfessor()) return toast('Horários previstos são definidos pela secretaria');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  const hs=vipHorarios(vp).slice(); hs.push({dia:1, hora:'', dur:60});
  _vipGravarHorarios(vp, hs); VIEWS.ficha(); toast('Linha adicionada — escolha o dia e a hora');
}
function novoVipHorario(id, campo, val){   // 1ª linha (quando ainda não há nenhum horário)
  if(ehProfessor()) return toast('Horários previstos são definidos pela secretaria');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  const h={dia:1, hora:''}; if(campo==='dia') h.dia=+val; else h.hora=val||'';
  _vipGravarHorarios(vp, [h]); VIEWS.ficha(); toast('Horário criado');
}
function setVipHorarioLinha(id, i, campo, val){
  if(ehProfessor()) return toast('Horários previstos são definidos pela secretaria');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  const hs=vipHorarios(vp).slice(); if(!hs[i]) return;
  if(campo==='dia') hs[i]=Object.assign({},hs[i],{dia:+val});
  else if(campo==='dur') hs[i]=Object.assign({},hs[i],{dur:Math.max(30,Math.round(+val||60))});
  else hs[i]=Object.assign({},hs[i],{hora:val||''});
  _vipGravarHorarios(vp, hs); VIEWS.ficha(); toast('Horários atualizados');
}
function delVipHorario(id, i){
  if(ehProfessor()) return toast('Horários previstos são definidos pela secretaria');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  const hs=vipHorarios(vp).slice(); if(!hs[i]) return;
  hs.splice(i,1);
  _vipGravarHorarios(vp, hs); VIEWS.ficha(); toast(hs.length?'Horário removido':'Sem horários previstos — os alertas de aula param');
}
// --- Remanejar uma aula VIP para outro dia/horário (antes ou depois do previsto) ---
function abrirRemarcarVip(id){
  if(ehProfessor()) return toast('Remanejamentos são registrados pela secretaria');
  if(ehProfessor() && !perm('prof_vip_remanejar')) return toast('A direção desativou o remanejo de aulas para professores');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  const temHorario=(typeof vipTemHorario==='function')&&vipTemHorario(vip);
  let opts=temHorario?'<option value="">— escolha o dia previsto —</option>':'<option value="">— (opcional) dia originalmente previsto —</option>';
  if(typeof _datasPrevistasVip==='function'){ try{ const ds=_datasPrevistasVip(vip,2,1).filter(d=>!(typeof _vipRemarcadaDe==='function' && _vipRemarcadaDe(vip,d))); opts+=ds.map(d=>`<option value="${d}">${brDate(d)}</option>`).join(''); }catch(e){} }
  modal(`<h3>🔀 Remanejar aula VIP <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">Quando o aluno pede para trocar o dia/horário de uma aula. O app deixa de cobrar no dia original e passa a esperar no novo dia.</p>
    <div class="field"><label class="lbl">Dia originalmente previsto${temHorario?'':' (opcional)'}</label><select id="rmDe">${opts}</select></div>
    ${temHorario?'<p class="hint" style="margin:-4px 0 8px">Obrigatório: sem o dia original, o app cobraria a aula duas vezes (no dia antigo e no novo).</p>':''}
    <div class="row"><div class="field"><label class="lbl">Novo dia</label><input type="date" id="rmData" value="${hoje()}"></div>
      <div class="field"><label class="lbl">Novo horário</label><input type="time" id="rmHora" value="${escAttr(vip.horaPrev||'')}"></div></div>
    <div class="field"><label class="lbl">Motivo (opcional)</label><input type="text" id="rmMotivo" placeholder="Ex: aluno viajou; pediu para adiantar"></div>
    <button class="btn block" onclick="salvarRemarcarVip('${id}')">Salvar remanejamento</button>`);
}
function salvarRemarcarVip(id){
  if(ehProfessor() && !perm('prof_vip_remanejar')) return toast('Sem permissão');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  const data=(document.getElementById('rmData').value||''); if(!data) return toast('Escolha o novo dia');
  const de=(document.getElementById('rmDe').value||'');
  if(!de && typeof vipTemHorario==='function' && vipTemHorario(vip)) return toast('Escolha o dia originalmente previsto — senão a aula seria cobrada em dobro');
  const r={ id:uid(), de, data, hora:(document.getElementById('rmHora').value||''), motivo:(document.getElementById('rmMotivo').value||'').trim() };
  vip.remarcacoes=vip.remarcacoes||[]; vip.remarcacoes.push(r); vip.atualizadoEm=Date.now(); save(); fechar(); VIEWS.ficha(); toast('Aula remanejada');
}
function delRemarcarVip(id, rid){
  if(ehProfessor()) return toast('Remanejamentos são registrados pela secretaria');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  vip.remarcacoes=(vip.remarcacoes||[]).filter(r=>r.id!==rid); vip.atualizadoEm=Date.now(); save(); VIEWS.ficha(); toast('Remanejamento removido');
}
// --- Pausar as aulas do VIP num período (só secretaria/direção) ---
function abrirPausaVip(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_pausa_vip'))) return toast('Sem permissão para pausar aulas');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  modal(`<h3>⏸️ Pausar aulas do aluno <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">No período de pausa não há alerta de aula não registrada (viagem, recesso do aluno, etc.).</p>
    <div class="row"><div class="field"><label class="lbl">De</label><input type="date" id="pzDe" value="${hoje()}"></div>
      <div class="field"><label class="lbl">Até</label><input type="date" id="pzAte" value="${hoje()}"></div></div>
    <div class="field"><label class="lbl">Motivo (opcional)</label><input type="text" id="pzMotivo" placeholder="Ex: viagem de férias"></div>
    <button class="btn block" onclick="salvarPausaVip('${id}')">Salvar pausa</button>`);
}
function salvarPausaVip(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_pausa_vip'))) return toast('Sem permissão');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  const de=(document.getElementById('pzDe').value||''), ate=(document.getElementById('pzAte').value||'');
  if(!de||!ate) return toast('Preencha as duas datas');
  if(ate<de) return toast('A data final deve ser depois da inicial');
  vip.pausas=vip.pausas||[]; vip.pausas.push({ id:uid(), de, ate, motivo:(document.getElementById('pzMotivo').value||'').trim() }); vip.atualizadoEm=Date.now(); save(); fechar(); VIEWS.ficha(); toast('Aulas pausadas nesse período');
}
function delPausaVip(id, pid){
  if(ehProfessor() || (soLeitura()&&!perm('sec_pausa_vip'))) return toast('Sem permissão');
  const vip=(S.vipAlunos||[]).find(x=>x.id===id); if(!vip) return;
  vip.pausas=(vip.pausas||[]).filter(p=>p.id!==pid); vip.atualizadoEm=Date.now(); save(); VIEWS.ficha(); toast('Pausa removida');
}
// Lançar aula VIP direto da ficha (professor + direção; secretaria não lança).
function lancarAulaVip(vid){
  if(soLeitura()) return toast('A secretaria não lança aulas VIP');
  if(ehProfessor() && !perm('prof_vip_lancar')) return toast('A direção desativou o lançamento de aulas VIP para professores');
  modal(`<h3>+ Lançar aula VIP <button class="close" onclick="fechar()">×</button></h3>
    <div class="field"><label class="lbl">Tema</label><input type="text" id="laTema" placeholder="Ex: Simple Past · entrevista de emprego"></div>
    <div class="field"><label class="lbl">Descrição da aula</label><textarea id="laDesc" style="min-height:120px" placeholder="O que foi trabalhado na aula"></textarea></div>
    <div class="field"><label class="lbl">📚 Tema de casa (opcional)</label><input type="text" id="laTemaCasa" placeholder="Ex: Unit 4 · ex. 3 a 6"></div>
    <div class="row"><div class="field"><label class="lbl">Data</label><input type="date" id="laData" value="${hoje()}" onchange="_laSugerir('${vid}')"></div>
      <div class="field"><label class="lbl">Hora em que aconteceu</label><input type="time" id="laHora" value="${escAttr((typeof vipHoraDoDia==='function'&&_laVip(vid))?vipHoraDoDia(_laVip(vid),weekdayOf(hoje())):'')}"></div>
      <div class="field"><label class="lbl">Duração (min)</label><input type="number" id="laDur" value="${(typeof vipDurDoDia==='function'&&_laVip(vid))?vipDurDoDia(_laVip(vid),weekdayOf(hoje())):60}" min="30" step="5"></div></div>
    <p class="hint" style="margin:0 0 8px">A hora prevista vem preenchida — ajuste se a aula aconteceu em outro horário. Duração mínima: 30 minutos.</p>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:2px 0 6px"><input type="checkbox" id="laFaltou" onchange="document.getElementById('laCobrarW').style.display=this.checked?'block':'none'"> ❌ Aluno não compareceu</label>
    ${ehProfessor()
      ?`<div id="laCobrarW" style="display:none;margin:0 0 8px 22px"><p class="hint" style="margin:0;color:#b8860b">💳 A hora é descontada do pacote (regra da escola).</p></div>`
      :`<div id="laCobrarW" style="display:none;margin:0 0 8px 22px"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;color:#b8860b"><input type="checkbox" id="laCobrar" checked> 💳 Descontar a hora do pacote (padrão da escola)</label></div>`}
    <p class="hint" style="margin:0 0 12px">🚫 O aluno <b>cancelou com menos de 12h</b> e o professor foi liberado? ${ehProfessor()?'Não registre nada — a <b>secretaria</b> registra o cancelamento (a hora é descontada).':'Use o botão "🚫 Cancelou em cima da hora" na ficha.'}</p>
    <button class="btn block" onclick="salvarAulaVipFicha('${vid}')">Lançar aula</button>`);
  setTimeout(()=>{const i=document.getElementById('laDesc'); if(i)i.focus();},60);
}
function salvarAulaVipFicha(vid){
  if(soLeitura()) return toast('A secretaria não lança aulas VIP');
  if(ehProfessor() && !perm('prof_vip_lancar')) return toast('Sem permissão');
  const desc=(document.getElementById('laDesc').value||'').trim(); if(!desc) return toast('Descreva a aula');
  const data=document.getElementById('laData').value; if(!data) return toast('Escolha a data');
  const dur=+document.getElementById('laDur').value||0; if(dur<30) return toast('Duração mínima de uma aula VIP: 30 minutos');
  const faltou=!!document.getElementById('laFaltou').checked;
  const cobrar = faltou && (ehProfessor() ? true : !!(document.getElementById('laCobrar')||{}).checked);   // regra da escola: falta desconta a hora
  S.aulasVip.push({ id:uid(), vipId:vid, data, hora:((document.getElementById('laHora')||{}).value||''), tema:(document.getElementById('laTema').value||'').trim(), temaCasa:(document.getElementById('laTemaCasa').value||'').trim(), descricao:desc,
    duracaoMin:dur, faltou, cobrarFalta:cobrar, atualizadoEm:Date.now() });
  save(); fechar(); VIEWS.ficha(); toast(faltou?(cobrar?'Falta lançada — hora descontada do pacote':'Falta lançada (sem débito)'):'Aula lançada ✅');
}
function _laVip(vid){ return (S.vipAlunos||[]).find(x=>x.id===vid)||null; }
function _laSugerir(vid){
  const vip=_laVip(vid); if(!vip) return;
  const d=(document.getElementById('laData')||{}).value; if(!d) return;
  const eh=document.getElementById('laHora'); if(eh && typeof vipHoraDoDia==='function') eh.value=vipHoraDoDia(vip,weekdayOf(d))||'';
  const ed=document.getElementById('laDur'); if(ed && typeof vipDurDoDia==='function') ed.value=vipDurDoDia(vip,weekdayOf(d))||60;
}
// 🚫 Cancelamento em cima da hora (<12h): registrado pela SECRETARIA (ou direção).
// O professor é liberado e NÃO registra; a hora é descontada do pacote do aluno.
function registrarCancelamentoVip(vid){
  if(ehProfessor()) return toast('Cancelamento em cima da hora é registrado pela secretaria');
  const vip=(S.vipAlunos||[]).find(x=>x.id===vid); if(!vip) return;
  const d=hoje();
  modal(`<h3>🚫 Cancelamento em cima da hora <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">O aluno avisou com <b>menos de 12h</b> de antecedência e o professor foi liberado. A aula fica registrada como <b>não realizada</b> e a hora é <b>descontada do pacote</b>.</p>
    <div class="row"><div class="field"><label class="lbl">Data da aula</label><input type="date" id="cz_data" value="${d}" onchange="_czDurSugerir('${vid}')"></div>
      <div class="field"><label class="lbl">Duração a descontar (min)</label><input type="number" id="cz_dur" value="${(typeof vipDurDoDia==='function'?vipDurDoDia(vip,weekdayOf(d)):60)||60}" min="30" step="5"></div></div>
    <div class="field"><label class="lbl">Observação (opcional)</label><input type="text" id="cz_obs" placeholder="Ex: avisou 1h antes pelo WhatsApp"></div>
    <button class="btn block" style="background:#c2560b" onclick="salvarCancelamentoVip('${vid}')">Registrar e descontar a hora</button>`);
}
function _czDurSugerir(vid){
  const vip=(S.vipAlunos||[]).find(x=>x.id===vid); if(!vip) return;
  const d=(document.getElementById('cz_data')||{}).value; if(!d) return;
  const e=document.getElementById('cz_dur'); if(e && typeof vipDurDoDia==='function') e.value=vipDurDoDia(vip,weekdayOf(d))||60;
}
function salvarCancelamentoVip(vid){
  if(ehProfessor()) return toast('Sem permissão');
  const data=(document.getElementById('cz_data')||{}).value; if(!data) return toast('Escolha a data');
  const dur=+(document.getElementById('cz_dur')||{}).value||60; if(dur<30) return toast('Duração mínima: 30 minutos');
  const obs=((document.getElementById('cz_obs')||{}).value||'').trim();
  S.aulasVip.push({ id:uid(), vipId:vid, data, tema:'Cancelamento em cima da hora',
    descricao:obs||'Aluno cancelou com menos de 12h de antecedência — professor liberado, hora descontada.',
    duracaoMin:dur, faltou:true, cobrarFalta:true, cancel12h:true, por:S.usuario||'', atualizadoEm:Date.now() });
  save(); fechar(); if(VIEWS.ficha) VIEWS.ficha();
  toast('Cancelamento registrado — hora descontada do pacote');
}
function renderFichaVip(v, vip){
  const inRange=d=>(!_fichaDe||d>=_fichaDe)&&(!_fichaAte||d<=_fichaAte);
  const aulasTodas=(S.aulasVip||[]).filter(x=>x.vipId===vip.id && !x.ajusteManual && inRange(x.data)).sort((a,b)=>b.data.localeCompare(a.data));
  let aulas=aulasTodas.filter(a=>a.tema!=='Importação');          // aulas de verdade lançadas no app
  if(ehProfessor()) aulas=aulas.filter(a=>!a.cancel12h);          // professor não vê cancelamentos/motivos (registro da secretaria)
  const consol=aulasTodas.filter(a=>a.tema==='Importação');       // consolidação da importação (não conta como aula com presença)
  const consolMin=consol.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const comp=aulas.filter(a=>!a.faltou); const faltas=aulas.length-comp.length; const compMin=comp.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const wrs=(S.writings||[]).filter(w=>w.alunoId===vip.id && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data));
  const coms=comentariosDoAluno(vip.id).filter(c=>inRange(c.data));
  const periodoTxt=(_fichaDe||_fichaAte)?(brDate(_fichaDe||'')+' a '+(_fichaAte?brDate(_fichaAte):'hoje')):'todo o histórico';
  const idade=vip.nascimento?(Math.floor((Date.now()-new Date(vip.nascimento).getTime())/(365.25*864e5))):null;
  const podeEd=!ehProfessor();
  const portalURL=(typeof PORTAL_ALUNO_URL!=='undefined'?PORTAL_ALUNO_URL:'https://app.togethere.com.br/portal-aluno.html');
  const tile=(val,l,c)=>`<div class="fx-tile"><div class="v" style="color:${c}">${val==null?'—':val}</div><div class="l">${l}</div></div>`;
  let h=`<div class="section-title"><span class="feijao fj" style="background:#C8A200"></span><h2 class="display">Ficha do aluno</h2></div>
  <div class="fx-hero">
    ${avatarFoto('fx-av', vip.foto, ((vip.nome||'·').trim()[0]||'·').toUpperCase(), "enviarFoto('vip','"+vip.id+"')")}
    <div style="flex:1;min-width:150px"><div class="fx-hnm">${escAttr(vip.nome)}</div>
      <div class="fx-htu">Aula particular${vip.professor?(' · Prof. '+escAttr(vip.professor)):''}${idade!=null?(' · '+idade+' anos'):''}${(ehProfessor()&&vip.material)?(' · 📘 '+escAttr(vip.material)):''}</div></div>
    <span class="pill" style="background:#fff8e0;color:#b88600">👑 Aluno VIP</span>
  </div>
  ${ehProfessor()?'':`<div class="fx-tiles">
    ${tile(comp.length,'Aulas c/ presença','var(--ok)')}
    ${tile(faltas,'Faltas',faltas>0?'var(--vermelho)':'var(--tinta)')}
    ${tile(fmtDur(compMin),'Tempo total','#005EAF')}
    ${tile(wrs.length,'Writings',wrs.length>0?'#9333c7':'var(--tinta)')}
  </div>`}
  ${(consolMin>0&&!ehProfessor())?`<p class="hint" style="margin:8px 0 0">🕓 Fora as aulas com presença acima, há <b>${fmtDur(consolMin)}</b> de <b>aulas anteriores</b> (consolidação da importação). Elas somam no pacote de horas, mas <b>não contam</b> como aulas com presença aqui.</p>`:''}
  ${(typeof _cardAulaOnlineVip==='function')?_cardAulaOnlineVip(vip):''}
  ${_cardPacoteVip(vip.id)}`;
  if(!ehProfessor()){
  h+=`<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px">Contato${VIP_PORTAL_ATIVO?' & portal':''}</h3>`;
  if(podeEd){
    h+=`<div class="row" style="flex-wrap:wrap">
      <div class="field" style="flex:2;min-width:210px;margin:0"><label class="lbl">E-mail (responsável / aluno)</label><input type="email" value="${escAttr(vip.email||'')}" placeholder="email@exemplo.com" onchange="setVipCampo('${vip.id}','email',this.value)"></div>
      <div class="field" style="flex:1;min-width:150px;margin:0"><label class="lbl">Telefone / WhatsApp</label><input type="text" value="${escAttr(vip.telefone||'')}" placeholder="(51) 9…" onchange="setVipCampo('${vip.id}','telefone',this.value)"></div>
      <div class="field" style="min-width:150px;margin:0"><label class="lbl">Nascimento</label><input type="date" value="${escAttr(vip.nascimento||'')}" onchange="setVipCampo('${vip.id}','nascimento',this.value)"></div>
    </div>`;
  } else {
    h+=`<p class="hint" style="margin:0">${vip.email?('📧 '+escAttr(vip.email)):'Sem e-mail cadastrado'}${vip.telefone?(' · 📱 '+escAttr(vip.telefone)):''}${idade!=null?(' · 🎂 '+idade+' anos'):''}</p>`;
  }
  h+=`${VIP_PORTAL_ATIVO?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--linha)">
      <p class="hint" style="margin:0">🎫 <b>Portal do aluno:</b> <a href="${portalURL}" target="_blank" style="color:var(--azul);word-break:break-all">${escAttr(portalURL.replace(/^https?:\/\//,''))}</a></p>
    </div>`:''}
  </div>`;
  }
  h+=`
  ${ehProfessor()?'':_cardMaterialVip(vip)}
  ${_cardHorariosVip(vip)}
  ${(VIP_PORTAL_ATIVO&&!ehProfessor())?_cardAcessoPortal(vip.id):''}
  ${(!ehProfessor()&&typeof _cardLivrosAluno==='function')?_cardLivrosAluno(vip.id,true):''}
  ${(typeof _cardContratoOficialVip==='function')?_cardContratoOficialVip(vip):''}
  ${_cardContratos(vip.id)}
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <span class="hint" style="flex:1">Período: <b>${periodoTxt}</b></span>
    <button class="btn ghost sm" onclick="setFichaPeriodo('ano')">Este ano</button>
    <button class="btn ghost sm" onclick="setFichaPeriodo('tudo')">Tudo</button>
  </div>`;
  h+=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:18px 0 6px"><h3 style="margin:0;flex:1">👑 Aulas VIP (${aulas.length})</h3>${!ehProfessor()?`<button class="btn ghost sm" style="color:#c2560b" onclick="registrarCancelamentoVip('${vip.id}')">🚫 Cancelou em cima da hora</button>`:''}${!soLeitura()?`<button class="btn ghost sm" onclick="lancarAulaVip('${vip.id}')">+ Lançar aula</button>`:''}</div>`;
  h+=aulas.length?aulas.map(a=>`<div class="card" style="padding:10px 12px"><div style="display:flex;gap:8px;flex-wrap:wrap"><b style="flex:1">${brDate(a.data)}${a.hora?(' · '+escAttr(a.hora)):''}</b><span style="color:${a.faltou?(a.cancel12h?'#c2560b':'var(--vermelho)'):'#1a8a4a'};font-weight:600">${a.faltou?(a.cancel12h?'🚫 cancelou em cima da hora · hora descontada':('❌ não compareceu'+(a.cobrarFalta?' · hora descontada':''))):'✅ '+fmtDur(a.duracaoMin)}</span></div><p class="hint" style="margin:4px 0 0">${a.tema?('<b>'+escAttr(a.tema)+'</b> — '):''}${escAttr(a.descricao||'')}</p>${a.temaCasa?`<p class="hint" style="margin:4px 0 0">📚 <b>Tema de casa:</b> ${escAttr(a.temaCasa)}</p>`:''}</div>`).join(''):'<p class="hint">Nenhuma aula lançada no app ainda.</p>';
  // Bloco separado: consolidação de horas anteriores (não conta como aula com presença)
  if(consol.length && !ehProfessor()) h+=`<div style="margin:12px 0 0">${consol.map(a=>`<div class="card" style="padding:10px 12px;background:#f4f7fb;border:1px dashed var(--linha)"><div style="display:flex;gap:8px;flex-wrap:wrap"><b style="flex:1">🕓 Aulas anteriores (consolidação)</b><span style="color:#005EAF;font-weight:600">${fmtDur(a.duracaoMin)}</span></div><p class="hint" style="margin:4px 0 0">Horas já realizadas antes do registro no app, trazidas da planilha só para o controle do saldo${a.data?(' · ref. '+brDate(a.data)):''}. Não conta como aula com presença.</p></div>`).join('')}</div>`;
  h+=`<h3 style="margin:18px 0 6px">📝 Writings (${wrs.length})</h3>`;
  h+=wrs.length?'<div class="card" style="padding:10px 12px">'+wrs.map(w=>{
    const bt=(w.subscales||Object.keys(w.bands||{})).map(k=>`${WR_LBL(k)} <b>${w.bands[k]!=null?w.bands[k]:'—'}</b>`).join(' · ');
    const ver = w.full ? `<button class="btn ghost sm" onclick="WA.verRelatorio('${w.id}')">ver relatório</button>` : '';
    const del = soLeitura() ? '' : `<button class="btn ghost sm" style="color:var(--vermelho)" onclick="excluirWriting('${w.id}')">excluir</button>`;
    return `<div style="border-top:1px solid var(--linha);padding:8px 0;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap"><span class="hint" style="flex:1;min-width:190px">${brDate(w.data)} · <b>${escAttr(w.levelLabel||w.level||'')}</b>${w.taskLabel?(' · '+escAttr(w.taskLabel)):''} — Geral <b>${w.overall_band!=null?w.overall_band:'—'}/5</b>${w.togethere_band?(' · '+escAttr(w.togethere_band)):''}${w.cefr_result?(' · '+escAttr(w.cefr_result)):''}<br>${bt}${w.word_count!=null?(' · '+w.word_count+' palavras'):''}</span>${ver}${del}</div>`;
  }).join('')+'</div>':'<p class="hint">Nenhum.</p>';
  h+=`<h3 style="margin:18px 0 6px">💬 Comentários (${coms.length})</h3>`;
  h+=coms.length?'<div class="card" style="padding:10px 12px">'+coms.map(c=>`<div class="hint" style="border-top:1px solid var(--linha);padding:6px 0"><b>${brDate(c.data)}</b> (${escAttr(c.autor||'—')}): ${escAttr(c.texto||'')}</div>`).join('')+'</div>':'<p class="hint">Nenhum.</p>';
  h+=`<div class="card" style="margin-top:8px"><div class="field" style="margin:0"><label class="lbl">Adicionar comentário</label><textarea id="vfCom" style="min-height:70px" placeholder="Observação sobre o aluno (visível na ficha e no relatório)"></textarea></div>
    <button class="btn ghost sm" style="margin-top:8px" onclick="addComentarioVip('${vip.id}')">+ Comentário</button></div>`;
  h+=`<div class="card" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
    ${podeEd?`<button class="btn" id="vfEnviar" onclick="enviarFichaVipResponsavel('${vip.id}')">✉️ Enviar ao responsável</button>`:''}
    <button class="btn ghost" onclick="copiarFichaVip('${vip.id}')">📋 Copiar (WhatsApp)</button>
    <button class="btn ghost" onclick="imprimirFichaVip('${vip.id}')">🖨️ Imprimir / PDF</button>
  </div>`;
  v.innerHTML=h;
}
function setVipCampo(id,campo,val){
  if(!podeCadastro()) return toast('Sem permissão para editar dados');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  vp[campo]=(val||'').trim(); vp.atualizadoEm=Date.now(); save();
  if(campo==='nascimento') VIEWS.ficha(); else toast('Atualizado');
}
function addComentarioVip(id){
  const el=document.getElementById('vfCom'); const txt=((el&&el.value)||'').trim();
  if(!txt) return toast('Escreva o comentário');
  S.comentarios.push({id:uid(),alunoId:id,data:hoje(),texto:txt,autor:S.usuario});
  save(); VIEWS.ficha(); toast('Comentário adicionado');
}
async function enviarFichaVipResponsavel(id){
  if(ehProfessor()) return toast('Sem permissão para enviar');
  const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(!vp) return;
  const email=(vp.email||'').trim();
  if(!email || email.indexOf('@')<1) return toast('Cadastre o e-mail no topo da ficha ou use Copiar para WhatsApp.');
  if(!confirm('Enviar a ficha de '+vp.nome+' para '+email+'?')) return;
  const btn=document.getElementById('vfEnviar'); if(btn){ btn.disabled=true; btn.textContent='Enviando…'; }
  const txt=corpoFichaVip(id);
  const htmlEmail='<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:13px;line-height:1.5">'+escAttr(txt)+'</pre>';
  const res=await cloudEmail([email], 'Aulas VIP de '+vp.nome+' — Togethere', txt, htmlEmail);
  if(btn){ btn.disabled=false; btn.textContent='✉️ Enviar ao responsável'; }
  if(res && res.ok){ toast('Ficha enviada ao responsável'); }
  else toast('Não foi possível enviar: '+((res&&res.erro)||'erro'));
}
// ===== Acesso ao portal (gestão de credenciais) — direção + secretaria =====
// Cartão reutilizado na ficha do aluno de turma e na ficha VIP.
function _cardAcessoPortal(id){
  if(ehProfessor()) return '';
  return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px;font-size:1rem">🔑 Acesso ao portal do aluno</h3>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="btn ghost sm" id="acNovaSenha" onclick="acessoNovaSenha('${id}')">🔑 Gerar senha nova</button>
      <button class="btn ghost sm" onclick="acessoTrocarUsuario('${id}')">✏️ Trocar nome de usuário</button>
      <button class="btn ghost sm" onclick="acessoEnviarReset('${id}')">✉️ Enviar link por e-mail</button>
    </div>
    <div id="fcAcessoBox"></div>
    <p class="hint" style="margin:8px 0 0">"Gerar senha nova" cria o acesso (se ainda não existir) e define uma senha nova — o aluno cria a dele no 1º acesso. O link por e-mail vai para o e-mail do responsável cadastrado na ficha.</p>
  </div>`;
}
async function acessoNovaSenha(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_acessos'))) return toast('Sem permissão');
  const btn=document.getElementById('acNovaSenha'); if(btn){ btn.disabled=true; btn.textContent='Gerando…'; }
  try{
    const { data, error }=await sb.functions.invoke('acesso-aluno', { body:{ alunoId:id, acao:'nova_senha' } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    const box=document.getElementById('fcAcessoBox');
    if(box) box.innerHTML=`<div class="card" style="background:#eef6ff;border:1px solid #d4e6ff;margin-top:10px;padding:12px 14px">
      <p class="hint" style="margin:0 0 4px"><b>Acesso ${data.novo?'criado ✅':'com senha nova ✅'}</b></p>
      <p class="hint" style="margin:0">Login: <b>${escAttr(data.email||'—')}</b><br>Senha: <b>${escAttr(data.senha||'—')}</b></p>
      <p class="hint" style="margin:6px 0 8px">No 1º acesso o aluno cria a própria senha.</p>
      <button class="btn ghost sm" onclick="imprimirCardAcesso('${escAttr(data.email||'')}','${escAttr(data.senha||'')}','${escAttr(data.nome||'')}')">🖨️ Imprimir card</button></div>`;
    toast('Senha nova gerada');
  }catch(e){ toast('Não consegui: '+((e&&e.message)||e)); }
  finally{ if(btn){ btn.disabled=false; btn.textContent='🔑 Gerar senha nova'; } }
}
async function acessoTrocarUsuario(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_acessos'))) return toast('Sem permissão');
  const novo=prompt('Novo nome de usuário do portal (só o começo, sem espaços — ex.: joaosilva). O sistema completa com @tgt.app.');
  if(novo==null) return;
  const v=(novo||'').trim(); if(!v) return toast('Digite o novo nome de usuário');
  try{
    const { data, error }=await sb.functions.invoke('acesso-aluno', { body:{ alunoId:id, acao:'trocar_usuario', novoUsuario:v } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    const box=document.getElementById('fcAcessoBox');
    if(box) box.innerHTML=`<div class="card" style="background:#eef6ff;border:1px solid #d4e6ff;margin-top:10px;padding:12px 14px"><p class="hint" style="margin:0">Novo login: <b>${escAttr(data.email||'')}</b></p></div>`;
    toast('Nome de usuário atualizado');
  }catch(e){ toast('Não consegui: '+((e&&e.message)||e)); }
}
async function acessoEnviarReset(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_acessos'))) return toast('Sem permissão');
  if(!confirm('Enviar por e-mail (ao responsável) o link para o aluno criar uma nova senha?')) return;
  try{
    const { data, error }=await sb.functions.invoke('acesso-aluno', { body:{ alunoId:id, acao:'enviar_reset' } });
    if(error) throw new Error(error.message||'falha');
    if(!data || data.ok===false) throw new Error((data&&data.error)||'falha');
    toast('Link enviado para '+(data.enviadoPara||'o e-mail de contato'));
  }catch(e){ toast('Não consegui: '+((e&&e.message)||e)); }
}
function imprimirCardAcesso(email,senha,nome){
  if(typeof _abrirCardsImpressao!=='function') return toast('Impressão indisponível');
  _abrirCardsImpressao([{nome,email,senha}], true, null);
}
// ===== Contratos (PDF assinado) — direção + secretaria =====
function _cardContratos(alunoId){
  if(ehProfessor()) return '';
  const cs=(S.contratos||[]).filter(c=>c.alunoId===alunoId && !c.excluido).sort((a,b)=>(b.ts||0)-(a.ts||0));
  return `<div class="card" style="margin-top:12px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0;flex:1;font-size:1rem">📄 Contrato</h3><button class="btn ghost sm" onclick="subirContrato('${alunoId}')">⬆️ Subir PDF assinado</button></div>
    ${cs.length?cs.map(c=>`<div style="border-top:1px solid var(--linha);padding:8px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1">📄 ${escAttr(c.nome||'contrato.pdf')}<br><span class="hint">${_dataContrato(c.ts)}${c.por?(' · '+escAttr(c.por)):''}</span></span><button class="btn ghost sm" onclick="verContrato('${escAttr(c.path)}')">👁️ Ver / imprimir</button><button class="btn ghost sm" style="color:var(--vermelho)" onclick="delContrato('${c.id}')">excluir</button></div>`).join(''):'<p class="hint" style="margin:8px 0 0">Nenhum contrato anexado. Suba o PDF assinado para consultar e imprimir aqui.</p>'}
  </div>`;
}
function _dataContrato(ts){ try{ return new Date(ts).toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
function subirContrato(alunoId){
  if(ehProfessor() || (soLeitura()&&!perm('sec_contratos'))) return toast('Sem permissão');
  const inp=document.createElement('input'); inp.type='file'; inp.accept='application/pdf,.pdf';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return; if(f.type!=='application/pdf' && !/\.pdf$/i.test(f.name||'')) return toast('Envie um arquivo PDF'); _enviarContrato(alunoId,f); };
  inp.click();
}
async function _enviarContrato(alunoId,f){
  if(typeof sb==='undefined' || !sb.storage) return toast('Sem conexão para enviar');
  toast('Enviando contrato…');
  try{
    const path='alunos/'+alunoId+'-'+Date.now()+'.pdf';
    const { error }=await sb.storage.from('contratos').upload(path, f, { contentType:'application/pdf', upsert:true });
    if(error){ toast('Não consegui subir: '+(error.message||'')); return; }
    S.contratos=S.contratos||[];
    S.contratos.push({ id:uid(), alunoId, path, nome:(f.name||'contrato.pdf'), ts:Date.now(), por:S.usuario });
    save(); VIEWS.ficha(); toast('Contrato anexado ✅');
  }catch(e){ toast('Erro ao enviar o contrato'); }
}
async function verContrato(path){
  if(typeof sb==='undefined' || !sb.storage) return toast('Sem conexão');
  try{
    const { data, error }=await sb.storage.from('contratos').createSignedUrl(path, 3600);
    if(error || !data || !data.signedUrl){ toast('Não consegui abrir o contrato'); return; }
    window.open(data.signedUrl, '_blank');
  }catch(e){ toast('Erro ao abrir o contrato'); }
}
function delContrato(id){
  if(ehProfessor() || (soLeitura()&&!perm('sec_contratos'))) return toast('Sem permissão');
  const c=(S.contratos||[]).find(x=>x.id===id); if(!c) return;
  if(!confirm('Remover este contrato?')) return;
  try{ if(typeof sb!=='undefined' && sb.storage) sb.storage.from('contratos').remove([c.path]); }catch(e){}
  S.contratos=(S.contratos||[]).filter(x=>x.id!==id); marcarExcluido('contratos',id);
  save(); VIEWS.ficha(); toast('Contrato removido');
}
VIEWS.ficha=()=>{
  const v=document.getElementById('view');
  const _vipF=(S.vipAlunos||[]).find(x=>x.id===_fichaAlunoId);
  if(_vipF){ return renderFichaVip(v, _vipF); }
  const a=(S.alunos||[]).find(x=>x.id===_fichaAlunoId);
  if(!a){ v.innerHTML='<p class="sub">Abra uma ficha pela busca em <b>Turmas e alunos</b>.</p>'; return; }
  const turmas=_fichaTurmasDoAluno(a.id);
  const tatual=(S.turmas||[]).find(t=>t.id===a.turmaId);
  const inRange=d=>(!_fichaDe||d>=_fichaDe)&&(!_fichaAte||d<=_fichaAte);
  const aulas=_fichaAulas(a.id, turmas.map(t=>t.id), _fichaDe, _fichaAte);
  let totalF=Number(a.faltasRetro)||0; turmas.forEach(t=>{ totalF+=faltasDoAluno(a.id,t.id).filter(inRange).length; });
  const pres=aulas.filter(x=>x.status==='presente'&&!x.cancelada&&!x.transferida).length;
  const streak=tatual?_fichaStreakFaltas(a.id,tatual.id):0;
  const idade=a.nascimento?(Math.floor((Date.now()-new Date(a.nascimento).getTime())/(365.25*864e5))):null;
  let temas=[]; turmas.forEach(t=>{ temas=temas.concat(temasNaoFeitosDoAluno(a.id,t.id).filter(z=>inRange(z.data))); });
  let mat=[]; turmas.forEach(t=>{ mat=mat.concat(materialDoAluno(a.id,t.id).filter(inRange)); });
  const tst=testesDoAluno(a.id).filter(z=>inRange(z.data));
  const coms=comentariosDoAluno(a.id).filter(c=>inRange(c.data));
  const podeEnviar=!ehProfessor();
  const periodoTxt=(_fichaDe||_fichaAte)?(brDate(_fichaDe||'')+' a '+(_fichaAte?brDate(_fichaAte):'hoje')):'todo o histórico';
  const aulasDet=_fichaAulasDet(a.id, turmas.map(t=>t.id), _fichaDe, _fichaAte);
  const wrs=(S.writings||[]).filter(w=>w.alunoId===a.id && inRange(w.data)).sort((x,y)=>y.data.localeCompare(x.data));
  const multi=turmas.length>1;
  // abas
  const ABAS=[
    {id:'aulas', label:'Aulas', n:aulasDet.length},
    {id:'testes', label:'Testes', n:tst.length},
    {id:'writings', label:'Writings', n:wrs.length},
    {id:'temas', label:'Temas', n:temas.length},
    {id:'material', label:'Material', n:mat.length},
    {id:'comentarios', label:'Comentários', n:coms.length},
  ];
  if(!ABAS.some(x=>x.id===_fichaAba)) _fichaAba='aulas';
  const pane = _fichaAba==='aulas'?_fxAulas(aulasDet,multi)
    : _fichaAba==='testes'?_fxTestes(tst)
    : _fichaAba==='writings'?_fxWritings(wrs)
    : _fichaAba==='temas'?_fxTemas(temas)
    : _fichaAba==='material'?_fxMaterial(mat)
    : _fxComentarios(coms);
  const tile=(v2,l,c)=>`<div class="fx-tile"><div class="v" style="color:${c}">${v2==null?'—':v2}</div><div class="l">${l}</div></div>`;
  let h=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Ficha do aluno</h2></div>
  <div class="fx-hero">
    ${avatarFoto('fx-av', a.foto, ((a.nome||'·').trim()[0]||'·').toUpperCase(), "enviarFoto('aluno','"+a.id+"')")}
    <div style="flex:1;min-width:150px"><div class="fx-hnm">${escAttr(a.nome)}</div>
      <div class="fx-htu">${tatual?escAttr(tatual.nome):'sem turma atual'}${tatual&&tatual.professor?(' · Prof. '+escAttr(tatual.professor)):''}${idade!=null?(' · '+idade+' anos'):''}${multi?(' · histórico em '+turmas.length+' turmas'):''}</div></div>
    ${tatual?statusPill(tatual):''}
  </div>
  <div class="fx-tiles">
    ${tile(pres,'Presenças','var(--ok)')}
    ${tile(totalF,'Faltas',totalF>0?'var(--vermelho)':'var(--tinta)')}
    ${tile(temas.length,'Temas pend.',temas.length>0?'#B8860B':'var(--tinta)')}
    ${tile(mat.length,'Material',mat.length>0?'#B8860B':'var(--tinta)')}
  </div>
  ${streak>=3?`<div class="card" style="border-left:4px solid var(--vermelho);margin-top:12px"><b style="color:var(--vermelho)">🚨 ${streak} faltas seguidas</b> <span class="hint">— atenção para contato com o responsável.</span></div>`:''}
  <div class="card" style="margin-top:12px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:${podeEnviar?'8px':'2px'}">
      <h3 style="margin:0;flex:1;font-size:1rem">Dados do aluno</h3>
      ${podeEnviar?'<span class="pill" style="background:#eafaf0;color:#1a8a4a">✏️ editável</span>':'<span class="pill" style="background:#eef;color:#667">somente leitura</span>'}
    </div>
    ${podeEnviar?`
      <div class="row" style="flex-wrap:wrap">
        <div class="field" style="flex:2;min-width:200px;margin:0"><label class="lbl">Nome completo</label><input type="text" value="${escAttr(a.nome||'')}" onchange="fichaSetCampoAluno('${a.id}','nome',this.value)"></div>
        <div class="field" style="min-width:150px;margin:0"><label class="lbl">🎂 Nascimento</label><input type="date" value="${escAttr(a.nascimento||'')}" onchange="fichaSetCampoAluno('${a.id}','nascimento',this.value)"></div>
      </div>
      <div class="row" style="flex-wrap:wrap;margin-top:10px">
        <div class="field" style="flex:1;min-width:170px;margin:0"><label class="lbl">📱 Telefone / WhatsApp</label><input type="text" value="${escAttr(a.telefone||'')}" placeholder="(51) 9…" onchange="fichaSetCampoAluno('${a.id}','telefone',this.value)"></div>
        <div class="field" style="flex:2;min-width:200px;margin:0"><label class="lbl">📧 E-mail do responsável</label><input type="email" id="fcEmail" value="${escAttr(a.email||'')}" placeholder="email@exemplo.com" onchange="fichaSetCampoAluno('${a.id}','email',this.value)"></div>
      </div>
      <p class="hint" style="margin:8px 0 0">As alterações salvam sozinhas ao sair do campo e sincronizam entre os aparelhos.</p>
    `:`<p class="hint" style="margin:0">${a.nascimento?('🎂 '+brDate(a.nascimento)):''}${a.telefone?((a.nascimento?' · ':'')+'📱 '+escAttr(a.telefone)):''}${a.email?(((a.nascimento||a.telefone)?' · ':'')+'📧 '+escAttr(a.email)):''}${(!a.nascimento&&!a.telefone&&!a.email)?'Sem dados de contato cadastrados.':''}</p>`}
    ${a.fichaEnviadaEm?`<p class="hint" style="margin:8px 0 0">✓ Ficha enviada em ${brDate(a.fichaEnviadaEm)}${a.fichaEnviadaPor?(' por '+escAttr(a.fichaEnviadaPor)):''}</p>`:''}
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--linha);display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      ${!ehProfessor()?`<button class="btn ghost sm" onclick="abrirTrocarTurma('${a.id}')">🔄 Trocar de turma</button><button class="btn ghost sm" onclick="alunoParaVip('${a.id}')">⭐ Tornar VIP</button>`:''}
      <span class="hint" style="margin-left:auto">Período: <b>${periodoTxt}</b></span>
      <button class="btn ghost sm" onclick="setFichaPeriodo('ano')">Este ano</button>
      <button class="btn ghost sm" onclick="setFichaPeriodo('tudo')">Tudo</button>
    </div>
  </div>
  ${_cardAcessoPortal(a.id)}
  ${(typeof _cardLivrosAluno==='function')?_cardLivrosAluno(a.id,false):''}
  ${_cardContratos(a.id)}
  <div class="fx-tabs">${ABAS.map(x=>`<button class="fx-tab${x.id===_fichaAba?' on':''}" onclick="fichaAba('${x.id}')">${x.label}${x.n!=null?` <span class="n">${x.n}</span>`:''}</button>`).join('')}</div>
  <div>${pane}</div>
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
    ${podeEnviar?`<button class="btn" id="fcEnviar" onclick="enviarFichaResponsavel()">✉️ Enviar ao responsável</button>`:''}
    <button class="btn ghost" onclick="abrirBoletimDoAluno('${a.id}')">📊 Gerar boletim</button>
    <button class="btn ghost" onclick="copiarFicha()">📋 Copiar (WhatsApp)</button>
    <button class="btn ghost" onclick="imprimirFicha()">🖨️ Imprimir / PDF</button>
  </div>`;
  v.innerHTML=h;
};
let _fichaAba='aulas';
function fichaAba(k){ _fichaAba=k; VIEWS.ficha(); }
function _fichaAulasDet(alunoId, tids, de, ate){
  const inR=d=>(!de||d>=de)&&(!ate||d<=ate);
  const out=[];
  (S.presencas||[]).forEach(p=>{
    if(tids.indexOf(p.turmaId)<0) return;
    if(!p.registros || !(alunoId in p.registros)) return;
    if(!inR(p.data)) return;
    const rel=(S.relatorios||[]).find(r=>r.turmaId===p.turmaId && r.data===p.data);
    const tema=(S.temas||[]).find(t=>t.turmaId===p.turmaId && t.data===p.data);
    const semMat=(S.material||[]).some(m=>m.turmaId===p.turmaId && m.data===p.data && (m.faltantes||[]).includes(alunoId));
    let desc=(rel&&rel.corpo)||''; if(!desc){ try{ desc=resumoAulaDoDia(p.turmaId,p.data)||''; }catch(e){} }
    out.push({ data:p.data, turmaId:p.turmaId, status:p.registros[alunoId],
      cancelada:p.statusAula==='cancelada', transferida:p.statusAula==='transferida',
      atraso:(p.atrasados||[]).includes(alunoId), saiuCedo:(p.saiuCedo||[]).includes(alunoId),
      semMaterial:semMat, descricao:desc, tema: tema?(tema.descricao||''):'' });
  });
  return out.sort((a,b)=>b.data.localeCompare(a.data));
}
function _fxBanda(n){ if(n==null||n==='') return {cor:'#9aa6b6',bg:'#f1f4f8'}; n=+n; if(n>=90) return {cor:'#005EAF',bg:'#E7F0FB'}; if(n>=60) return {cor:'#16A07A',bg:'#E6F6F0'}; return {cor:'#E52524',bg:'#FDECEC'}; }
function _wBandCor(n){ if(n==null||n==='') return '#9aa6b6'; n=+n; if(n>=4) return '#16A07A'; if(n>=3) return '#005EAF'; if(n>=2) return '#B8860B'; return '#E52524'; }
function _wChipCls(t){ t=(t||'').toUpperCase(); if(/PASS|MERIT|DISTINCT|ACHIEV/.test(t)) return 'ok'; if(/FAIL|BELOW|NOT/.test(t)) return 'bad'; return ''; }
function _fxAulaChips(a){
  let c='';
  if(a.cancelada) c+='<span class="fx-chip fx-c-gray">Cancelada</span>';
  else if(a.transferida) c+='<span class="fx-chip fx-c-gray">Transferida</span>';
  else if(a.status==='falta') c+='<span class="fx-chip fx-c-falta">Faltou</span>';
  else c+='<span class="fx-chip fx-c-ok">Presente</span>';
  if(a.atraso) c+='<span class="fx-chip fx-c-warn">Atrasado</span>';
  if(a.saiuCedo) c+='<span class="fx-chip fx-c-warn">Saiu cedo</span>';
  if(a.semMaterial) c+='<span class="fx-chip fx-c-warn">Sem material</span>';
  return c;
}
function _fxAulas(aulas, multi){
  if(!aulas.length) return '<div class="card fx-vazio">Nenhuma aula no período.</div>';
  return '<div class="card">'+aulas.map((a,i)=>{
    const tn=multi?(((S.turmas||[]).find(t=>t.id===a.turmaId)||{}).nome||''):'';
    return `<div class="fx-ar${i===0?' open':''}"><button class="fx-ar-h" onclick="this.parentNode.classList.toggle('open')"><span class="fx-ar-d">${brDate(a.data)}</span><span class="fx-chips">${_fxAulaChips(a)}</span><span class="fx-chev">▾</span></button>
      <div class="fx-ar-b">${(multi&&tn)?`<div class="lbl2">Turma</div><div>${escAttr(tn)}</div>`:''}
        <div class="lbl2">Conteúdo da aula</div><div>${a.descricao?escAttr(a.descricao):'<span class="hint">Aula não registrada no sistema.</span>'}</div>
        <div class="lbl2">Tema de casa</div><div>${a.tema?escAttr(a.tema):'<span class="hint">Nenhum tema neste dia.</span>'}</div></div></div>`;
  }).join('')+'</div>';
}
function _fxTestes(tst){
  if(!tst.length) return '<div class="card fx-vazio">Nenhum teste registrado ainda.</div>';
  return tst.slice().sort((a,b)=>b.data.localeCompare(a.data)).map(z=>{
    const no=z.nota||{};
    const ns=SKILLS.filter(k=>no[k]!==''&&no[k]!=null&&!isNaN(no[k]));
    const media=ns.length?Math.round(ns.reduce((s,k)=>s+Number(no[k]),0)/ns.length):null;
    const mb=_fxBanda(media);
    const bars=SKILLS.map(k=>{ const val=(no[k]!==''&&no[k]!=null&&!isNaN(no[k]))?Number(no[k]):null; const b=_fxBanda(val); const w=val==null?0:Math.max(4,Math.min(100,val)); return `<div class="fx-skill"><span class="fx-sk-n">${k}</span><div class="fx-sk-bar"><div class="fx-sk-fill" style="width:${w}%;background:${b.cor}"></div></div><span class="fx-sk-v" style="color:${b.cor}">${val==null?'—':val}</span></div>`; }).join('');
    const tn=((S.turmas||[]).find(t=>t.id===z.turmaId)||{}).nome||'';
    return `<div class="card fx-tcard"><div class="fx-th"><div><b>${z.numero?('Teste '+z.numero):'Teste'}</b><div style="color:#5b6b7c;font-size:.85rem;margin-top:2px">${brDate(z.data)}${tn?(' · '+escAttr(tn)):''}</div></div><div class="fx-media" style="color:${mb.cor};background:${mb.bg}">${media!=null?media:'—'}<span class="ml">média</span></div></div><div class="fx-skills">${bars}</div></div>`;
  }).join('');
}
function _fxWritings(wrs){
  if(!wrs.length) return '<div class="card fx-vazio">Nenhum writing avaliado ainda.</div>';
  return '<div class="card">'+wrs.map((w,i)=>{
    const f=w.full||{};
    const subs=w.subscales||Object.keys(w.bands||{});
    const oc=_wBandCor(w.overall_band);
    const bars=subs.map(k=>{ const band=(w.bands&&w.bands[k]!=null)?w.bands[k]:((f[k]&&f[k].band!=null)?f[k].band:null); const c=_wBandCor(band); const pct=band==null?0:Math.max(6,Math.min(100,(band/5)*100)); const just=(f[k]&&f[k].justification)||''; return `<div class="wr-skill"><div class="wr-sk-h"><span>${escAttr(WR_LBL(k))}</span><span class="wr-sk-v" style="color:${c}">${band==null?'—':band}<small>/5</small></span></div><div class="wr-track"><div class="wr-fill" style="width:${pct}%;background:${c}"></div></div>${just?`<div class="wr-why">${escAttr(just)}</div>`:''}</div>`; }).join('');
    const chips=(w.togethere_band?`<span class="wr-chip ${_wChipCls(w.togethere_band)}">${escAttr(w.togethere_band)}</span>`:'')+(w.cefr_result?`<span class="wr-chip ghost">${escAttr(w.cefr_result)}</span>`:'')+(w.word_count!=null?`<span class="wr-chip ghost">${w.word_count} palavras</span>`:'');
    const resumo=f.summary_pt?`<div class="wr-resumo"><b>Para o aluno e a família</b>${escAttr(f.summary_pt)}</div>`:'';
    const fortes=(f.strengths&&f.strengths.length)?`<div class="wr-sec"><h4>O que funcionou bem</h4><ul>${f.strengths.map(s=>`<li>${escAttr(s)}</li>`).join('')}</ul></div>`:'';
    const passos=(f.next_steps&&f.next_steps.length)?`<div class="wr-sec"><h4>Próximos passos</h4><ul>${f.next_steps.map(s=>`<li>${escAttr(s)}</li>`).join('')}</ul></div>`:'';
    const erros=(f.errors&&f.errors.length)?`<div class="wr-sec"><h4>Correções</h4>${f.errors.map(e=>`<div class="wr-err">${e.type?`<span class="wr-tag">${escAttr(e.type)}</span>`:''}<s>${escAttr(e.excerpt||'')}</s> → <b>${escAttr(e.correction||'')}</b>${e.explanation?`<div class="wr-why">${escAttr(e.explanation)}</div>`:''}</div>`).join('')}</div>`:'';
    const ver = w.full ? `<button class="btn ghost sm" onclick="WA.verRelatorio('${w.id}')">🔍 Ver relatório completo</button>` : '';
    const del = soLeitura() ? '' : `<button class="btn ghost sm" style="color:var(--vermelho)" onclick="excluirWriting('${w.id}')">excluir</button>`;
    const acoes=(ver||del)?`<div class="row" style="justify-content:flex-end;gap:6px;margin-top:12px">${ver}${del}</div>`:'';
    const lbl=`${escAttr(w.levelLabel||w.level||'Writing')}${w.taskLabel?(' · '+escAttr(w.taskLabel)):''}`;
    return `<div class="fx-ar${i===0?' open':''}">
      <button class="fx-ar-h" onclick="this.parentNode.classList.toggle('open')">
        <span class="fx-ar-d">${brDate(w.data)}</span>
        <span class="fx-chips"><span style="font-weight:600">${lbl}</span><span class="fx-chip" style="background:#e7f0fb;color:var(--azul)">Geral ${w.overall_band!=null?w.overall_band:'—'}/5</span></span>
        <span class="fx-chev">▾</span>
      </button>
      <div class="fx-ar-b" style="padding-top:8px">${chips?`<div class="wr-chips" style="margin-top:0">${chips}</div>`:''}${bars?`<div class="wr-bars">${bars}</div>`:''}${resumo}${fortes}${passos}${erros}${acoes}</div>
    </div>`;
  }).join('')+'</div>';
}
function _fxTemas(temas){
  if(!temas.length) return '<div class="card fx-vazio">Nenhum tema pendente. 👏</div>';
  return '<div class="card">'+temas.slice().sort((x,y)=>y.data.localeCompare(x.data)).map(z=>`<div class="fx-li"><b>${escAttr(z.descricao||'Tema')}</b><div style="color:#5b6b7c;font-size:.85rem;margin-top:2px">${brDate(z.data)} · <span style="color:#B8860B;font-weight:700">${z.status==='parcial'?'parcial':'não feito'}</span></div></div>`).join('')+'</div>';
}
function _fxMaterial(mat){
  if(!mat.length) return '<div class="card fx-vazio">Nenhum registro de material não trazido.</div>';
  return '<div class="card"><div class="fx-li" style="border-top:0"><div class="hint" style="margin:0"><b>Datas sem material:</b> '+mat.slice().sort().map(d=>brDate(d)).join(' · ')+'</div></div></div>';
}
function _fxComentarios(coms){
  if(!coms.length) return '<div class="card fx-vazio">Nenhum comentário ainda.</div>';
  return '<div class="card">'+coms.slice().sort((a,b)=>b.data.localeCompare(a.data)).map(c=>`<div class="fx-li"><div>${escAttr(c.texto||'')}</div><div style="color:#5b6b7c;font-size:.85rem;margin-top:2px">${brDate(c.data)}${c.autor?(' · '+escAttr(c.autor)):''}</div></div>`).join('')+'</div>';
}

/* =====================================================================
   FOTOS (b106) — alunos e equipe. Bucket privado "fotos" no Supabase.
   Guarda só o caminho no registro (a.foto / u.foto); exibe via link
   temporário (signed URL). Redimensiona no navegador mantendo qualidade
   (máx 1600px, JPEG 0.9) para servir também aos cartões.
   ===================================================================== */
const _fotoCache = {};   // path -> { url, exp }
function avatarFoto(cls, foto, inicial, addOnclick){
  return `<div class="${cls} fotoav" data-foto="${escAttr(foto||'')}">`
    + `<span class="fotoav-ini">${escAttr(inicial)}</span>`
    + (addOnclick?`<button class="fotoav-add" onclick="${addOnclick}" title="Adicionar/trocar foto" aria-label="Adicionar foto">📷</button>`:'')
    + `</div>`;
}
async function _hidratarFotos(){
  if(typeof sb==='undefined' || !sb.storage) return;
  const els = Array.from(document.querySelectorAll('.fotoav[data-foto]')).filter(e=>e.dataset.foto && !e.dataset.hid);
  if(!els.length) return;
  const paths = [...new Set(els.map(e=>e.dataset.foto))].filter(p=>!(_fotoCache[p]&&_fotoCache[p].url));
  for(const p of paths){
    try{
      // download direto: baixa os bytes pela sessão logada (RLS) e monta a imagem localmente.
      // Evita qualquer problema de link assinado/relativo entre navegadores.
      const { data, error } = await sb.storage.from('fotos').download(p);
      if(!error && data) _fotoCache[p] = { url: URL.createObjectURL(data) };
    }catch(e){}
  }
  els.forEach(e=>{
    const c=_fotoCache[e.dataset.foto];
    if(c && c.url){
      // define tamanho/posição inline também: o atalho "background:cor" usado no avatar
      // zera o background-size da classe, então garantimos "cover" aqui.
      e.style.backgroundImage=`url("${c.url}")`;
      e.style.backgroundSize='cover';
      e.style.backgroundPosition='center';
      e.classList.add('com-foto'); e.dataset.hid='1';
    }
  });
}
function enviarFoto(tipo, id){
  modal(`<h3>📷 Foto <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:12px">Boa qualidade — dá pra usar depois nos cartões. Máx 8&nbsp;MB.</p>
    <div class="row" style="gap:10px">
      <button class="btn block" onclick="_fotoPick('${tipo}','${escAttr(id)}',true)">📷 Tirar foto</button>
      <button class="btn ghost block" onclick="_fotoPick('${tipo}','${escAttr(id)}',false)">🖼️ Escolher arquivo</button>
    </div>
    <input type="file" id="_fotoInput" accept="image/*" style="display:none">`);
}
function _fotoPick(tipo,id,camera){
  const inp=document.getElementById('_fotoInput'); if(!inp) return;
  if(camera) inp.setAttribute('capture','user'); else inp.removeAttribute('capture');
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(f) _fotoProcessar(f,tipo,id); };
  inp.click();
}
function _fotoResize(file, max, q){
  return new Promise((res,rej)=>{
    const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{
      let w=img.naturalWidth, h=img.naturalHeight;
      if(Math.max(w,h)>max){ const s=max/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s); }
      const c=document.createElement('canvas'); c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      c.toBlob(b=>b?res(b):rej(new Error('toBlob')), 'image/jpeg', q);
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src=url;
  });
}
async function _fotoProcessar(file,tipo,id){
  try{
    toast('Preparando a foto…');
    const blob = await _fotoResize(file, 1600, 0.9);
    const path = (tipo==='aluno'?'alunos/':tipo==='vip'?'vip/':'equipe/') + _slugFoto(id) + '-' + Date.now() + '.jpg';
    const { error } = await sb.storage.from('fotos').upload(path, blob, { contentType:'image/jpeg', upsert:true });
    if(error){ toast('Não deu para enviar: '+(error.message||'')); return; }
    if(tipo==='aluno'){ const a=S.alunos.find(x=>x.id===id); if(a){ a.foto=path; a.atualizadoEm=Date.now(); } }
    else if(tipo==='vip'){ const vp=(S.vipAlunos||[]).find(x=>x.id===id); if(vp){ vp.foto=path; vp.atualizadoEm=Date.now(); } }
    else { const u=(S.usuarios||[]).find(x=>x.nome===id); if(u){ u.foto=path; } }
    save();
    delete _fotoCache[path];
    if(tipo==='usuario' && id===S.usuario){ const md=document.getElementById('meDot'); if(md){ md.dataset.foto=path; delete md.dataset.hid; md.style.backgroundImage=''; } }
    fechar(); toast('Foto salva ✅');
    if(typeof rota!=='undefined' && VIEWS[rota]) VIEWS[rota]();
    setTimeout(_hidratarFotos, 120);
  }catch(e){ toast('Erro ao processar a foto'); }
}
function _slugFoto(s){ return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'').slice(0,40) || 'x'; }
