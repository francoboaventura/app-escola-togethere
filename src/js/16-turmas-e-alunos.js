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
  const y=new Date().getFullYear();
  _fichaDe=y+'-01-01'; _fichaAte=hoje();
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
  save(); toast('E-mail do responsável atualizado');
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
  let txt=`FICHA DO ALUNO (VIP)\n${vip.nome}\n${vip.professor?('Prof. '+vip.professor+'\n'):''}Período: ${_fichaDe?brDate(_fichaDe):'início'} a ${_fichaAte?brDate(_fichaAte):'hoje'}\nGerado em ${brDate(hoje())} por ${S.usuario}\n`;
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
function renderFichaVip(v, vip){
  const inRange=d=>(!_fichaDe||d>=_fichaDe)&&(!_fichaAte||d<=_fichaAte);
  const aulas=(S.aulasVip||[]).filter(x=>x.vipId===vip.id && inRange(x.data)).sort((a,b)=>b.data.localeCompare(a.data));
  const comp=aulas.filter(a=>!a.faltou); const faltas=aulas.length-comp.length; const compMin=comp.reduce((s,a)=>s+(+a.duracaoMin||0),0);
  const wrs=(S.writings||[]).filter(w=>w.alunoId===vip.id && inRange(w.data)).sort((x,y)=>x.data.localeCompare(y.data));
  const coms=comentariosDoAluno(vip.id).filter(c=>inRange(c.data));
  const periodoTxt=(_fichaDe||_fichaAte)?(brDate(_fichaDe||'')+' a '+(_fichaAte?brDate(_fichaAte):'hoje')):'todo o histórico';
  let h=`<div class="section-title"><span class="feijao fj" style="background:#C8A200"></span><h2 class="display">Ficha do aluno</h2></div>
  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0;flex:1">${escAttr(vip.nome)}</h3><span class="pill" style="background:#fff8e0;color:#b88600">👑 Aluno VIP</span></div>
    <p class="hint" style="margin:4px 0 8px">Aula particular${vip.professor?(' · Prof. '+escAttr(vip.professor)):''}</p>
    <div style="margin-top:2px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn ghost sm" onclick="ir('vip')">👑 Abrir em Alunos VIP</button></div>
  </div>
  <div class="card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <span class="pill" style="background:#eafaf0;color:#1a8a4a">✅ ${comp.length} aula(s) com presença (${fmtDur(compMin)})</span>
    ${faltas?`<span class="pill" style="background:#fdeaea;color:var(--vermelho)">❌ ${faltas} falta(s)</span>`:''}
    ${wrs.length?`<span class="pill" style="background:#f4ecff;color:#9333c7">📝 ${wrs.length} writing(s)</span>`:''}
  </div>
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <span class="hint" style="flex:1">Período: <b>${periodoTxt}</b></span>
    <button class="btn ghost sm" onclick="setFichaPeriodo('ano')">Este ano</button>
    <button class="btn ghost sm" onclick="setFichaPeriodo('tudo')">Tudo</button>
  </div>`;
  h+=`<h3 style="margin:18px 0 6px">👑 Aulas VIP (${aulas.length})</h3>`;
  h+=aulas.length?aulas.map(a=>`<div class="card" style="padding:10px 12px"><div style="display:flex;gap:8px;flex-wrap:wrap"><b style="flex:1">${brDate(a.data)}</b><span style="color:${a.faltou?'var(--vermelho)':'#1a8a4a'};font-weight:600">${a.faltou?'❌ não compareceu':'✅ '+fmtDur(a.duracaoMin)}</span></div><p class="hint" style="margin:4px 0 0">${a.tema?('<b>'+escAttr(a.tema)+'</b> — '):''}${escAttr(a.descricao||'')}</p></div>`).join(''):'<p class="hint">Nenhuma aula no período.</p>';
  h+=`<h3 style="margin:18px 0 6px">📝 Writings (${wrs.length})</h3>`;
  h+=wrs.length?'<div class="card" style="padding:10px 12px">'+wrs.map(w=>{
    const bt=(w.subscales||Object.keys(w.bands||{})).map(k=>`${WR_LBL(k)} <b>${w.bands[k]!=null?w.bands[k]:'—'}</b>`).join(' · ');
    const ver = w.full ? `<button class="btn ghost sm" onclick="WA.verRelatorio('${w.id}')">ver relatório</button>` : '';
    const del = soLeitura() ? '' : `<button class="btn ghost sm" style="color:var(--vermelho)" onclick="excluirWriting('${w.id}')">excluir</button>`;
    return `<div style="border-top:1px solid var(--linha);padding:8px 0;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap"><span class="hint" style="flex:1;min-width:190px">${brDate(w.data)} · <b>${escAttr(w.levelLabel||w.level||'')}</b>${w.taskLabel?(' · '+escAttr(w.taskLabel)):''} — Geral <b>${w.overall_band!=null?w.overall_band:'—'}/5</b>${w.togethere_band?(' · '+escAttr(w.togethere_band)):''}${w.cefr_result?(' · '+escAttr(w.cefr_result)):''}<br>${bt}${w.word_count!=null?(' · '+w.word_count+' palavras'):''}</span>${ver}${del}</div>`;
  }).join('')+'</div>':'<p class="hint">Nenhum.</p>';
  h+=`<h3 style="margin:18px 0 6px">💬 Comentários (${coms.length})</h3>`;
  h+=coms.length?'<div class="card" style="padding:10px 12px">'+coms.map(c=>`<div class="hint" style="border-top:1px solid var(--linha);padding:6px 0"><b>${brDate(c.data)}</b> (${escAttr(c.autor||'—')}): ${escAttr(c.texto||'')}</div>`).join('')+'</div>':'<p class="hint">Nenhum.</p>';
  h+=`<div class="card" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
    <button class="btn ghost" onclick="copiarFichaVip('${vip.id}')">📋 Copiar (WhatsApp)</button>
    <button class="btn ghost" onclick="imprimirFichaVip('${vip.id}')">🖨️ Imprimir / PDF</button>
  </div>`;
  v.innerHTML=h;
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
    <div class="fx-av">${escAttr((a.nome||'·').trim()[0]||'·').toUpperCase()}</div>
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
    ${podeEnviar?`<div class="field" style="margin:0"><label class="lbl">E-mail do responsável</label><input type="email" id="fcEmail" value="${escAttr(a.email||'')}" placeholder="email@exemplo.com" onchange="fichaSetEmail()"></div>`:(a.email?`<p class="hint" style="margin:0">📧 ${escAttr(a.email)}</p>`:'')}
    ${a.fichaEnviadaEm?`<p class="hint" style="margin:8px 0 0">✓ Ficha enviada em ${brDate(a.fichaEnviadaEm)}${a.fichaEnviadaPor?(' por '+escAttr(a.fichaEnviadaPor)):''}</p>`:''}
    <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      ${!ehProfessor()?`<button class="btn ghost sm" onclick="abrirTrocarTurma('${a.id}')">🔄 Trocar de turma</button><button class="btn ghost sm" onclick="alunoParaVip('${a.id}')">⭐ Tornar VIP</button>`:''}
      <span class="hint" style="margin-left:auto">Período: <b>${periodoTxt}</b></span>
      <button class="btn ghost sm" onclick="setFichaPeriodo('ano')">Este ano</button>
      <button class="btn ghost sm" onclick="setFichaPeriodo('tudo')">Tudo</button>
    </div>
  </div>
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
