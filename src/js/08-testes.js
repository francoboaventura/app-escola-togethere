/* ---- TESTES ---- */
/* ===== TESTES E BOLETIM ===== */
const SKILLS=['Grammar','Vocabulary','Listening','Reading','Writing','Speaking'];
function cefrFromNome(nome){ const m=(nome||'').toUpperCase().match(/\b([ABC][12]\+?)\b/); return m?m[1]:''; }
function cefrRank(c){ const o=['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2']; const i=o.indexOf((c||'').toUpperCase()); return i<0?-1:i; }
function numTestes(turma){
  if(!turma) return 3;
  if(turma.nivel==='kids') return 0;                 // KIDS: sem teste formal
  if(cefrRank(turma.cefr)>=cefrRank('B2')) return 2;  // B2, B2+, C1, C2 → 2 testes
  return 3;                                           // júnior, teens até B1+, demais → 3 testes
}
function bandaConceito(n){
  if(n===''||n==null||isNaN(n)) return {label:'—',cor:'#9aa6b6',bg:'transparent'};
  n=+n;
  if(n>=90) return {label:'merit',cor:'var(--azul)',bg:'#E7F0FB'};       // 90–100 merit (azul)
  if(n>=60) return {label:'pass',cor:'var(--ok)',bg:'#E6F6F0'};          // 60–89 pass (verde)
  return {label:'in need of improvement',cor:'var(--vermelho)',bg:'#FDECEC'}; // 0–59 (vermelho)
}
const DIST_COR='#B8860B', DIST_BG='#FBF3D6';
function legendaConceitos(){
  const it=(c,t)=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:.76rem;margin:0 10px 4px 0"><span style="width:12px;height:12px;border-radius:3px;background:${c};display:inline-block"></span>${t}</span>`;
  return `<div style="display:flex;flex-wrap:wrap;align-items:center;margin-top:4px">${it('var(--vermelho)','0–59 in need of improvement')}${it('var(--ok)','60–89 pass')}${it('var(--azul)','90–100 merit')}${it(DIST_COR,'★ distinction (acima do nível, sem nota)')}</div>`;
}
function testeDaTurma(turmaId,numero,criar){
  let t=S.testes.find(x=>x.turmaId===turmaId && x.numero===numero);
  if(!t && criar){ t={id:uid(),turmaId,numero,data:hoje(),notas:{},atualizadoEm:Date.now()}; S.testes.push(t); }
  return t;
}
function notaSkill(t,aid,skill){ return (t&&t.notas&&t.notas[aid]&&t.notas[aid][skill]!=null)?t.notas[aid][skill]:''; }
function mediaTesteAluno(t,aid){
  if(!t||!t.notas||!t.notas[aid]) return null;
  const v=SKILLS.map(s=>t.notas[aid][s]).filter(x=>x!==''&&x!=null&&!isNaN(x)).map(Number);
  return v.length?v.reduce((a,n)=>a+n,0)/v.length:null;
}
function testeRealizado(t){
  if(!t || !t.notas) return false;
  return Object.keys(t.notas).some(aid=>{ const o=t.notas[aid]||{}; return SKILLS.some(sk=>{ const v=o[sk]; return v!==''&&v!=null&&!isNaN(v); }); });
}
function mediaSkillAno(turmaId,aid,skill){
  // Regra Togethere: num teste JÁ REALIZADO, nota em branco conta como 0.
  const tests=(S.testes||[]).filter(t=>t.turmaId===turmaId && testeRealizado(t));
  if(!tests.length) return null;
  const vals=tests.map(t=>{ const v=t.notas&&t.notas[aid]?t.notas[aid][skill]:''; return (v!==''&&v!=null&&!isNaN(v))?Number(v):0; });
  return Math.round(vals.reduce((a,n)=>a+n,0)/vals.length);
}
function boletimDe(turmaId,aid,criar){
  let b=S.boletins.find(x=>x.turmaId===turmaId && x.alunoId===aid);
  if(!b && criar){ b={id:uid(),turmaId,alunoId:aid,ano:new Date().getFullYear(),conceitos:{},distincao:{},distincaoGeral:false,parecer:'',conceitoGeral:'',criadoEm:hoje(),criadoPor:S.usuario}; S.boletins.push(b); }
  if(b) b.distincao=b.distincao||{};
  return b;
}

let testeTurma=null, boletimAluno=null;
VIEWS.testes=()=>{
  testeTurma=testeTurma||primeiraTurma();
  const v=document.getElementById('view');
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--roxo)"></span><h2 class="display">Testes e boletim</h2></div>
    <p class="sub">Notas por habilidade em cada teste e o boletim de fim de ano com parecer e relatório individual.</p>
    <div class="card"><label class="lbl">Turma</label>${selectTurma('teT',testeTurma)}<div id="teInfo" style="margin-top:8px"></div></div>
    <div id="teTestes"></div>
    <div id="teBoletim"></div>`;
  document.getElementById('teT').onchange=e=>{testeTurma=e.target.value;boletimAluno=null;VIEWS.testes();};
  renderTestesArea(); renderBoletimArea();
};
function setTesteData(num,val){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas'); const t=testeDaTurma(testeTurma,num,true); t.data=val; t.atualizadoEm=Date.now(); save(); }
function setTesteNota(num,aid,skill,el){if(soLeitura())return toast('Somente leitura — a secretaria não edita turmas');
  const t=testeDaTurma(testeTurma,num,true);
  let val=el.value===''?'':Math.max(0,Math.min(100,Math.round(+el.value)));
  if(el.value!==''&&val!==+el.value) el.value=val;
  t.notas[aid]=t.notas[aid]||{}; t.notas[aid][skill]=val; t.atualizadoEm=Date.now(); save();
  const b=bandaConceito(val); el.style.background=b.bg; el.style.color=b.cor;
  const m=mediaTesteAluno(t,aid), mc=document.getElementById(`tm_${num}_${aid}`);
  if(mc){ const mb=bandaConceito(m==null?'':Math.round(m)); mc.textContent=m==null?'—':Math.round(m); mc.style.color=mb.cor; }
}
function renderTestesArea(){
  const box=document.getElementById('teTestes'); if(!box)return;
  const turma=S.turmas.find(t=>t.id===testeTurma)||{};
  const n=numTestes(turma);
  const info=document.getElementById('teInfo');
  if(info) info.innerHTML=`${turma.nivel?nivelTag(turma.nivel):''} ${turma.cefr?`<span class="tag teens">${turma.cefr}</span>`:''} <span class="hint">· ${n===0?'<b>sem testes formais</b> — avaliação por desempenho em aula':'<b>'+n+' testes</b> no ano'}</span>`;
  if(n===0){
    box.innerHTML=`<div class="card" style="background:#fff7fb"><p class="hint" style="margin:0">Turmas <b>KIDS</b> não têm testes formais. A avaliação é por desempenho em aula — registre os conceitos por habilidade direto no <b>boletim de fim de ano</b> abaixo.</p></div>`;
    return;
  }
  const als=alunosDa(testeTurma);
  let h=`<div class="card" style="padding:12px 16px">${legendaConceitos()}</div>`;
  for(let num=1;num<=n;num++){
    const t=testeDaTurma(testeTurma,num,false);
    h+=`<div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
        <h3 style="margin:0;flex:1">${num}º Teste</h3>
        <label class="lbl" style="margin:0">Data</label><input type="date" value="${t?t.data:''}" onchange="setTesteData(${num},this.value)" style="width:auto"></div>`;
    if(!als.length){ h+='<p class="hint">Nenhum aluno na turma.</p></div>'; continue; }
    h+=`<div style="overflow-x:auto"><table style="border-collapse:collapse;min-width:100%"><thead><tr>
      <th style="text-align:left;position:sticky;left:0;background:#fff;padding:4px 8px;font-size:.78rem">Aluno</th>
      ${SKILLS.map(s=>`<th style="padding:4px 6px;font-size:.72rem" title="${s}">${s.slice(0,4)}</th>`).join('')}
      <th style="padding:4px 6px;font-size:.72rem">Média</th></tr></thead><tbody>`;
    h+=als.map(a=>{
      const m=mediaTesteAluno(t,a.id), mb=bandaConceito(m==null?'':Math.round(m));
      return `<tr><td style="text-align:left;position:sticky;left:0;background:#fff;white-space:nowrap;padding:4px 8px;font-size:.84rem">${a.nome}</td>
        ${SKILLS.map(s=>{ const val=notaSkill(t,a.id,s), b=bandaConceito(val);
          return `<td style="padding:2px 3px"><input type="number" min="0" max="100" value="${val}" ${soLeitura()?'disabled':''} onchange="setTesteNota(${num},'${a.id}','${s}',this)" style="width:48px;text-align:center;background:${b.bg};color:${b.cor};font-weight:600;border-radius:8px;padding:6px 2px"></td>`; }).join('')}
        <td id="tm_${num}_${a.id}" style="text-align:center;font-weight:700;color:${mb.cor}">${m==null?'—':Math.round(m)}</td></tr>`;
    }).join('');
    h+=`</tbody></table></div></div>`;
  }
  box.innerHTML=h;
}
function setBoletimConceito(skill,el){
  const b=boletimDe(testeTurma,boletimAluno,true);
  let val=el.value===''?'':Math.max(0,Math.min(100,Math.round(+el.value)));
  if(el.value!==''&&val!==+el.value) el.value=val;
  b.conceitos[skill]=val; _boletimRevoga(b); save(); _refreshPilulaBoletim();
  const bd=bandaConceito(val); el.style.background=bd.bg; el.style.color=bd.cor;
  const lc=document.getElementById('bcl_'+skill); if(lc){ lc.textContent=bd.label; lc.style.color=bd.cor; }
  const g=document.getElementById('bGeral'); if(g) g.placeholder=(mediaConceitosBoletim()??'')+'';
}
function setBoletimDistincao(skill,el){ const b=boletimDe(testeTurma,boletimAluno,true); b.distincao[skill]=el.checked; _boletimRevoga(b); save(); renderBoletimArea(); }
function setBoletimDistincaoGeral(el){ const b=boletimDe(testeTurma,boletimAluno,true); b.distincaoGeral=el.checked; _boletimRevoga(b); save(); renderBoletimArea(); }
function setBoletimGeral(val){ const b=boletimDe(testeTurma,boletimAluno,true); b.conceitoGeral= val===''?'':Math.max(0,Math.min(100,Math.round(+val))); _boletimRevoga(b); save(); _refreshPilulaBoletim(); }
function setBoletimParecer(val){ const b=boletimDe(testeTurma,boletimAluno,true); b.parecer=val; _boletimRevoga(b); save(); _refreshPilulaBoletim(); }
function mediaConceitosBoletim(){
  if(!boletimAluno) return null;
  const b=boletimDe(testeTurma,boletimAluno,false)||{conceitos:{},distincao:{}};
  const v=SKILLS.filter(s=>!(b.distincao&&b.distincao[s]))
    .map(s=>(b.conceitos&&b.conceitos[s]!=null&&b.conceitos[s]!=='')?b.conceitos[s]:mediaSkillAno(testeTurma,boletimAluno,s))
    .filter(x=>x!==''&&x!=null&&!isNaN(x)).map(Number);
  return v.length?Math.round(v.reduce((a,n)=>a+n,0)/v.length):null;
}
function ehDirecao(){ return S.perfil==='direcao'; }
function boletimAtual(criar){ return boletimAluno ? boletimDe(testeTurma, boletimAluno, !!criar) : null; }
function _boletimRevoga(b){
  if(!b) return;
  if(b.aprovado){ b.aprovado=false; b.aprovadoPor=null; b.aprovadoEm=null; }
  // editar um boletim reprovado limpa a reprovação (o professor está refazendo)
  if(b.reprovado){ b.reprovado=false; b.motivoReprovacao=''; b.reprovadoPor=null; b.reprovadoEm=null; }
}
function _boletimAprovadoOuAvisa(){
  const b=boletimAtual(false);
  if(!b || !b.aprovado){ toast('Este boletim precisa ser APROVADO pela direção antes de enviar, imprimir ou publicar.'); return false; }
  return true;
}
function boAprovBarHTML(){
  const b=boletimAtual(false);
  const aprovado=!!(b && b.aprovado);
  const reprovado=!!(b && b.reprovado);
  const pill = aprovado
    ? `<span class="pill" style="background:#e7f6ef;color:var(--ok)">✅ Aprovado${b.aprovadoPor?(' por '+escAttr(b.aprovadoPor)):''}${b.aprovadoEm?(' · '+brDate(b.aprovadoEm)):''}</span>`
    : reprovado
      ? `<span class="pill" style="background:#fdeaea;color:var(--vermelho)">✖ Reprovado${b.reprovadoPor?(' por '+escAttr(b.reprovadoPor)):''}${b.reprovadoEm?(' · '+brDate(b.reprovadoEm)):''}</span>`
      : (b&&b.gerado)
        ? `<span class="pill" style="background:#fff7e6;color:var(--laranja)">⏳ Aguardando aprovação da direção</span>`
        : `<span class="pill" style="background:#eef2f7;color:#5b6b7c">Rascunho — gere para enviar à aprovação</span>`;
  let acao='';
  if(ehDirecao()){
    acao = aprovado
      ? `<button class="btn ghost sm" onclick="revogarAprovacaoBoletim()">↩︎ Revogar aprovação</button>`
      : `<button class="btn sm" onclick="aprovarBoletim()">✅ Aprovar boletim</button>`;
  } else if(!aprovado){
    acao = `<span class="hint">Só a direção aprova. Enviar/Imprimir/Publicar liberam após a aprovação.</span>`;
  }
  let extra='';
  if(reprovado && b.motivoReprovacao){
    extra = `<div style="flex-basis:100%;background:#fdeaea;border:1px solid #f3c2c2;border-radius:10px;padding:10px 12px;margin-top:4px;font-size:.9rem"><b style="color:var(--vermelho)">Motivo da reprovação:</b> ${escAttr(b.motivoReprovacao)}<div class="hint" style="margin-top:4px">Ajuste o boletim e gere de novo para reenviar à aprovação.</div></div>`;
  }
  const del = (b && (b.gerado||boletimTemConteudo(b))) ? `<button class="btn ghost sm" onclick="apagarBoletimAtual()">🗑️ Apagar boletim</button>` : '';
  return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${pill}${acao}${del}${extra}</div>`;
}
function _refreshPilulaBoletim(){ const el=document.getElementById('boAprovBar'); if(el) el.innerHTML=boAprovBarHTML(); }
function aprovarBoletim(){
  if(!ehDirecao()) return toast('Só a direção pode aprovar o boletim.');
  const b=boletimAtual(true); if(!b) return toast('Escolha o aluno.');
  b.aprovado=true; b.aprovadoPor=S.usuario; b.aprovadoEm=hoje(); b.gerado=true;
  b.reprovado=false; b.motivoReprovacao=''; b.reprovadoPor=null; b.reprovadoEm=null;
  try{ const r=montarBoletimHTML(b.turmaId, b.alunoId); b.htmlAprovado=r.html; b.txtAprovado=r.txt; }catch(e){}
  b.atualizadoEm=Date.now(); save();
  _refreshPilulaBoletim();
  toast('Boletim aprovado ✓ — já pode enviar/imprimir/publicar.');
}
function revogarAprovacaoBoletim(){
  if(!ehDirecao()) return toast('Só a direção pode revogar a aprovação.');
  const b=boletimAtual(false); if(!b || !b.aprovado) return;
  _boletimRevoga(b); b.atualizadoEm=Date.now(); save();
  _refreshPilulaBoletim();
  toast('Aprovação revogada.');
}
function boletimTemConteudo(b){
  if(!b) return false;
  const c=b.conceitos||{}, d=b.distincao||{};
  const temC=SKILLS.some(s=>c[s]!=null && c[s]!=='');
  const temD=SKILLS.some(s=>d[s]);
  return temC || temD || !!(b.parecer && b.parecer.trim()) || (b.conceitoGeral!=null && b.conceitoGeral!=='') || !!b.distincaoGeral;
}
function boletinsParaAprovar(){
  const pend=[], aprov=[], reprov=[];
  (S.boletins||[]).forEach(b=>{
    // aparece se foi GERADO (enviado), ou aprovado/reprovado, ou já tem conteúdo digitado
    if(!(b.gerado || b.aprovado || b.reprovado || boletimTemConteudo(b))) return;
    const a=(S.alunos||[]).find(x=>x.id===b.alunoId); if(!a || a.arquivado) return;
    const t=(S.turmas||[]).find(x=>x.id===b.turmaId)||{};
    const item={ b, nome:a.nome, turma:t.nome||'—', turmaId:b.turmaId, alunoId:b.alunoId };
    if(b.aprovado) aprov.push(item);
    else if(b.reprovado) reprov.push(item);
    else pend.push(item);
  });
  const ord=(x,y)=> (x.turma||'').localeCompare(y.turma) || (x.nome||'').localeCompare(y.nome);
  pend.sort(ord); aprov.sort(ord); reprov.sort(ord);
  return { pend, aprov, reprov };
}
function aprovarPelaLista(turmaId, alunoId, aprovar){
  if(!ehDirecao()) return toast('Só a direção pode aprovar.');
  const b=boletimDe(turmaId, alunoId, false); if(!b) return toast('Boletim não encontrado.');
  if(aprovar){ b.aprovado=true; b.aprovadoPor=S.usuario; b.aprovadoEm=hoje(); b.gerado=true; b.reprovado=false; b.motivoReprovacao=''; b.reprovadoPor=null; b.reprovadoEm=null; try{ const r=montarBoletimHTML(turmaId, alunoId); b.htmlAprovado=r.html; b.txtAprovado=r.txt; }catch(e){} }
  else { b.aprovado=false; b.aprovadoPor=null; b.aprovadoEm=null; }
  b.atualizadoEm=Date.now(); save(); VIEWS.aprovacoes();
  toast(aprovar?'Boletim aprovado ✓':'Aprovação revogada.');
}
VIEWS.aprovacoes=()=>{
  const v=document.getElementById('view');
  if(!ehDirecao()){ v.innerHTML='<p class="sub">Somente a direção acessa a aprovação de boletins.</p>'; return; }
  const {pend, aprov, reprov}=boletinsParaAprovar();
  const linha=(it,estado)=>`<div class="wa-hist-item" style="align-items:center;gap:8px">
    <span style="flex:1;min-width:170px"><b>${escAttr(it.nome)}</b> <span class="hint">· ${escAttr(it.turma)}</span>
      ${estado==='aprov'?`<br><span class="hint" style="color:var(--ok)">✅ ${escAttr(it.b.aprovadoPor||'')}${it.b.aprovadoEm?(' · '+brDate(it.b.aprovadoEm)):''}</span>`:''}
      ${estado==='reprov'?`<br><span class="hint" style="color:var(--vermelho)">✖ ${escAttr(it.b.reprovadoPor||'')}${it.b.reprovadoEm?(' · '+brDate(it.b.reprovadoEm)):''} — ${escAttr(it.b.motivoReprovacao||'')}</span>`:''}</span>
    <button class="btn ghost sm" onclick="abrirBoletimDoAluno('${it.alunoId}','${it.turmaId}')">Abrir</button>
    ${estado==='aprov'
      ? `<button class="btn ghost sm" onclick="aprovarPelaLista('${it.turmaId}','${it.alunoId}',false)">↩︎ Revogar</button>`
      : estado==='reprov'
        ? `<button class="btn sm" onclick="aprovarPelaLista('${it.turmaId}','${it.alunoId}',true)">✅ Aprovar</button>`
        : `<button class="btn sm" onclick="aprovarPelaLista('${it.turmaId}','${it.alunoId}',true)">✅ Aprovar</button>
           <button class="btn sm" style="background:var(--vermelho)" onclick="reprovarBoletimModal('${it.turmaId}','${it.alunoId}')">✖ Reprovar</button>`}
    <button class="btn ghost sm" title="Apagar boletim" onclick="apagarBoletim('${it.turmaId}','${it.alunoId}')">🗑️</button>
  </div>`;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Aprovar boletins</h2></div>
    <p class="sub">Boletins gerados pelos professores. <b>Abra para conferir</b> e aprove — só depois de aprovado o boletim pode ser enviado, impresso ou publicado. Ao reprovar, escreva o motivo: ele vira um aviso para o professor. Editar um boletim aprovado cancela a aprovação.</p>
    <div class="card"><h3>⏳ Aguardando aprovação (${pend.length})</h3>${pend.length?pend.map(it=>linha(it,'pend')).join(''):'<p class="hint" style="margin:0">Nenhum boletim aguardando aprovação.</p>'}</div>
    ${reprov.length?`<div class="card"><h3>✖ Reprovados — com o professor (${reprov.length})</h3>${reprov.map(it=>linha(it,'reprov')).join('')}</div>`:''}
    <div class="card"><h3>✅ Aprovados (${aprov.length})</h3>${aprov.length?aprov.map(it=>linha(it,'aprov')).join(''):'<p class="hint" style="margin:0">Nenhum aprovado ainda.</p>'}</div>`;
};
function renderBoletimArea(){
  const box=document.getElementById('teBoletim'); if(!box)return;
  const als=alunosDa(testeTurma);
  let h=`<div class="section-title" style="margin-top:26px"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Boletim de fim de ano</h2></div>
    <p class="sub">Conceitos finais por habilidade, parecer descritivo e conceito geral — acompanha o relatório individual completo do aluno.</p>
    <div class="card"><label class="lbl">Aluno</label>
      <select id="boAluno"><option value="">— escolha o aluno —</option>${als.map(a=>`<option value="${a.id}" ${a.id===boletimAluno?'selected':''}>${a.nome}</option>`).join('')}</select></div>`;
  if(boletimAluno){
    const b=boletimDe(testeTurma,boletimAluno,false)||{conceitos:{},distincao:{},parecer:'',conceitoGeral:''};
    h+=`<div class="card"><h3>Conceitos finais por habilidade</h3>${legendaConceitos()}
      <p class="hint" style="margin:6px 0">Sugeridos pela média dos testes do ano — ajuste como quiser. Marque <b style="color:${DIST_COR}">★</b> quando o aluno superar o esperado para o nível (distinction, sem nota).</p>
      <table style="border-collapse:collapse"><tbody>${SKILLS.map(s=>{
        const dist=!!(b.distincao&&b.distincao[s]);
        const sug=mediaSkillAno(testeTurma,boletimAluno,s);
        const val=(b.conceitos&&b.conceitos[s]!=null&&b.conceitos[s]!=='')?b.conceitos[s]:(sug==null?'':sug);
        const bd=bandaConceito(val);
        return `<tr><td style="text-align:left;padding:5px 10px 5px 0">${s}</td>
          <td style="padding:3px 0"><input type="number" min="0" max="100" value="${val}" ${dist?'disabled':''} onchange="setBoletimConceito('${s}',this)" style="width:72px;text-align:center;background:${dist?'#f1f3f6':bd.bg};color:${dist?'#9aa6b6':bd.cor};font-weight:600;border-radius:8px;padding:7px 4px;opacity:${dist?'.55':'1'}"></td>
          <td id="bcl_${s}" style="padding:5px 0 5px 12px;color:${dist?DIST_COR:bd.cor};font-weight:600;font-size:.86rem">${dist?'★ distinction':bd.label}</td>
          <td style="padding:5px 0 5px 14px"><label style="display:inline-flex;align-items:center;gap:5px;font-size:.82rem;color:${DIST_COR};white-space:nowrap;cursor:pointer"><input type="checkbox" ${dist?'checked':''} onchange="setBoletimDistincao('${s}',this)"> ★</label></td></tr>`;
      }).join('')}</tbody></table>
      <div class="field" style="margin-top:14px"><label class="lbl">Conceito final geral</label>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <input type="number" min="0" max="100" id="bGeral" value="${b.conceitoGeral??''}" ${b.distincaoGeral?'disabled':''} placeholder="${mediaConceitosBoletim()??''}" onchange="setBoletimGeral(this.value)" style="width:90px;text-align:center;opacity:${b.distincaoGeral?'.55':'1'}">
          <label style="display:inline-flex;align-items:center;gap:6px;color:${DIST_COR};font-weight:600;font-size:.9rem;cursor:pointer"><input type="checkbox" ${b.distincaoGeral?'checked':''} onchange="setBoletimDistincaoGeral(this)"> ★ Distinction</label></div>
        <span class="hint">deixe em branco para usar a média das habilidades, ou marque ★ Distinction</span></div>
      <div class="field" style="margin-top:12px"><label class="lbl">Parecer descritivo geral</label>
        <textarea id="bParecer" placeholder="Comentário geral sobre o desempenho e a evolução do aluno no nível…" oninput="setBoletimParecer(this.value)">${escAttr(b.parecer||'')}</textarea></div>
      <div style="margin-top:12px"><button class="btn" onclick="gerarBoletim()">📄 Gerar boletim completo</button></div></div>
    <div class="card"><h3>Boletim gerado</h3><p class="hint">Pré-visualização na identidade Togethere. Imprima ou salve em PDF para entregar à família; ou copie o texto para o WhatsApp.</p>
      <iframe id="boFrame" title="Boletim" style="width:100%;height:600px;border:1px solid var(--linha);border-radius:14px;background:#fff;display:none"></iframe>
      <div class="gen-box" id="boVazio">Clique em “Gerar boletim completo”.</div>
      <div id="boAprovBar" style="margin:14px 0 2px">${boAprovBarHTML()}</div>
      <div class="row" style="margin-top:12px"><button class="btn" onclick="imprimirBoletim()">🖨️ Imprimir / PDF</button>
      <button class="btn amarelo" onclick="copiarBoletim()">📋 Copiar texto</button>
      <button class="btn" onclick="enviarBoletimEmail()">✉️ Enviar por e-mail</button></div></div>`;
  }
  box.innerHTML=h;
  const sel=document.getElementById('boAluno'); if(sel) sel.onchange=e=>{ boletimAluno=e.target.value||null; renderBoletimArea(); };
}
let _boletimHTML='', _boletimTxt='';
function _setDocIframe(fr, html){
  if(!fr) return;
  try{
    if(fr._docUrl){ URL.revokeObjectURL(fr._docUrl); fr._docUrl=null; }
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    fr._docUrl=URL.createObjectURL(blob);
    fr.removeAttribute('srcdoc');
    fr.src=fr._docUrl;
  }catch(e){ try{ fr.srcdoc=html; }catch(_){ } }
  fr.style.display='block';
}
function gerarBoletim(){
  if(!boletimAluno) return toast('Escolha o aluno');
  const r=montarBoletimHTML(testeTurma, boletimAluno);
  _boletimHTML=r.html; _boletimTxt=r.txt;
  const fr=document.getElementById('boFrame'), vz=document.getElementById('boVazio');
  _setDocIframe(fr, r.html);
  if(vz) vz.style.display='none';
  // gerar = enviar para a aba "Aprovar boletins" (a menos que já esteja aprovado)
  const b=boletimDe(testeTurma, boletimAluno, true);
  if(b && !b.gerado){ b.gerado=true; b.atualizadoEm=Date.now(); save(); if(!b.aprovado) toast('Boletim gerado e enviado para a aprovação da direção ✓'); }
  _refreshPilulaBoletim();
}
function apagarBoletim(turmaId, alunoId){
  const b=boletimDe(turmaId, alunoId, false); if(!b) return toast('Boletim não encontrado.');
  if(b.aprovado && !confirm('Este boletim está APROVADO. Apagar assim mesmo?')) return;
  if(!confirm('Apagar este boletim? Não dá para desfazer.')) return;
  S.boletins=(S.boletins||[]).filter(x=>x.id!==b.id);
  marcarExcluido('boletins', b.id);
  save();
  if(typeof rota!=='undefined' && rota==='aprovacoes') VIEWS.aprovacoes();
  else if(typeof renderBoletimArea==='function') renderBoletimArea();
  toast('Boletim apagado.');
}
function apagarBoletimAtual(){ if(boletimAluno) apagarBoletim(testeTurma, boletimAluno); }
function reprovarBoletimModal(turmaId, alunoId){
  if(!ehDirecao()) return toast('Só a direção pode reprovar.');
  const a=(S.alunos||[]).find(x=>x.id===alunoId)||{};
  modal(`<h3 style="margin-bottom:4px">Reprovar boletim <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin-bottom:12px">${escAttr(a.nome||'Aluno')} — escreva o motivo. Ele vai como aviso para o professor.</p>
    <div class="field"><label class="lbl">Motivo da reprovação</label>
      <textarea id="repMotivo" placeholder="Ex.: rever o conceito de Speaking e completar o parecer descritivo…" style="min-height:110px"></textarea></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn ghost sm" onclick="fechar()">Cancelar</button>
      <button class="btn sm" style="background:var(--vermelho)" onclick="confirmarReprovacao('${turmaId}','${alunoId}')">✖ Reprovar e avisar</button>
    </div>`);
  setTimeout(()=>{ const el=document.getElementById('repMotivo'); if(el) el.focus(); }, 60);
}
function confirmarReprovacao(turmaId, alunoId){
  if(!ehDirecao()) return toast('Só a direção pode reprovar.');
  const motivo=(document.getElementById('repMotivo')||{}).value||'';
  if(!motivo.trim()) return toast('Escreva o motivo da reprovação.');
  const b=boletimDe(turmaId, alunoId, false); if(!b){ fechar(); return toast('Boletim não encontrado.'); }
  b.aprovado=false; b.aprovadoPor=null; b.aprovadoEm=null;
  b.reprovado=true; b.motivoReprovacao=motivo.trim(); b.reprovadoPor=S.usuario; b.reprovadoEm=hoje();
  b.atualizadoEm=Date.now(); save(); fechar();
  if(typeof rota!=='undefined' && rota==='aprovacoes') VIEWS.aprovacoes();
  toast('Boletim reprovado — o professor foi avisado.');
}
// Aviso ao professor: boletins reprovados das turmas dele (aparece no Painel)
function renderBoletinsReprovadosCard(){
  if(S.perfil!=='professor') return '';
  const meus=turmasVisiveis().map(t=>t.id);
  const reps=(S.boletins||[]).filter(b=>b.reprovado && meus.indexOf(b.turmaId)>=0);
  if(!reps.length) return '';
  const linhas=reps.map(b=>{
    const a=(S.alunos||[]).find(x=>x.id===b.alunoId)||{};
    const t=(S.turmas||[]).find(x=>x.id===b.turmaId)||{};
    return `<div class="li" style="padding:10px 0">
      <b>${escAttr(a.nome||'Aluno')}</b> <span class="hint">· ${escAttr(t.nome||'')}</span>
      <div style="margin-top:4px;font-size:.9rem"><b style="color:var(--vermelho)">Motivo:</b> ${escAttr(b.motivoReprovacao||'')}</div>
      <div class="hint" style="margin-top:2px">Reprovado por ${escAttr(b.reprovadoPor||'')}${b.reprovadoEm?(' · '+brDate(b.reprovadoEm)):''}</div>
      <div style="margin-top:6px"><button class="btn ghost sm" onclick="abrirBoletimDoAluno('${b.alunoId}','${b.turmaId}')">Abrir e corrigir</button></div>
    </div>`;
  }).join('');
  return `<div class="card" style="border-left:4px solid var(--vermelho)">
    <div class="section-title"><span class="feijao fj" style="background:var(--vermelho)"></span><h3 class="display">Boletins reprovados (${reps.length})</h3></div>
    <p class="hint" style="margin:2px 0 6px">A direção reprovou estes boletins. Ajuste e gere de novo para reenviar à aprovação.</p>
    ${linhas}</div>`;
}
const DOC_CSS=`
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Urbanist:ital,wght@0,400;0,500;0,600;1,400&family=Zilla+Slab:ital,wght@1,600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--azul:#005EAF;--amarelo:#FFC800;--vermelho:#E52524;--ok:#16A07A;--tinta:#10243a;--linha:#e7eef6}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Urbanist',system-ui,sans-serif;color:var(--tinta);background:#eef3f8;padding:24px;line-height:1.5}
.page{max-width:760px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(0,40,90,.12)}
.hd{background:linear-gradient(135deg,#0a6dc4,var(--azul));color:#fff;padding:26px 32px;display:flex;align-items:center;gap:16px}
.hd img{width:58px;height:58px;border-radius:14px;flex:none;box-shadow:0 4px 14px rgba(0,0,0,.20)}
.hd .nm{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.5rem;letter-spacing:-.5px;line-height:1}
.hd .tg{font-family:'Zilla Slab',serif;font-style:italic;font-weight:600;opacity:.95;font-size:.95rem;margin-top:4px}
.hd .doc{margin-left:auto;text-align:right;font-family:'Poppins',sans-serif;font-weight:600}
.hd .doc b{font-size:1.3rem;display:block;line-height:1}
.hd .doc span{font-size:.82rem;opacity:.92}
.who{padding:22px 32px 4px}
.who .al{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.45rem;color:var(--azul);letter-spacing:-.4px}
.who .meta{color:#5b6b7c;font-size:.9rem;margin-top:3px}
.sec{padding:14px 32px}
.sec h2{font-family:'Poppins',sans-serif;font-weight:600;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:#8595a6;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.sec h2::before{content:"";width:18px;height:4px;border-radius:3px;background:var(--amarelo);flex:none}
.geral{display:flex;align-items:center;gap:18px;background:#f6f9fd;border:1px solid var(--linha);border-radius:14px;padding:16px 22px}
.geral .num{font-family:'Poppins',sans-serif;font-weight:700;font-size:2.5rem;line-height:1}
.geral .lab{font-family:'Poppins',sans-serif;font-weight:600;font-size:1.1rem;text-transform:capitalize}
.geral .cap{font-size:.82rem;color:#5b6b7c}
.skills{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sk{border:1px solid var(--linha);border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px}
.sk .skn{font-family:'Poppins',sans-serif;font-weight:600;flex:1;font-size:.95rem}
.sk .skv{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.25rem;min-width:34px;text-align:right}
.chip{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:4px 9px;border-radius:999px;white-space:nowrap}
.sk.dist{background:#fffaf0;border-color:#E9D9A0}
.seal{font-family:'Poppins',sans-serif;font-weight:700;color:#B8860B;background:#FBF3D6;border:1px solid #E9D9A0;padding:5px 12px;border-radius:999px;font-size:.78rem;white-space:nowrap}
.geral.dist{background:#fffaf0;border-color:#E9D9A0}
.seal.big{font-size:1.15rem;padding:10px 20px}
.leg{margin-top:10px;font-size:.72rem;color:#8595a6}
.conceitos{display:grid;gap:9px}
.ci{display:flex;align-items:flex-start;gap:9px;font-size:.88rem;line-height:1.45}
.ci .dot{width:13px;height:13px;border-radius:4px;flex:none;margin-top:3px}
.ci b{font-family:'Poppins',sans-serif;font-weight:600}
.ci small{color:#8595a6;font-weight:600}
.ci .ds{color:#42525f}
.parecer{background:#fffaf0;border-left:5px solid var(--amarelo);border-radius:0 14px 14px 0;padding:20px 22px;font-size:1.02rem;line-height:1.65;white-space:pre-wrap;min-height:200px}
.parecer.vazio{color:#9aa6b6;font-style:italic}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.st{border:1px solid var(--linha);border-radius:12px;padding:14px 8px;text-align:center}
.st .v{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.7rem;line-height:1;color:var(--azul)}
.st .k{font-size:.72rem;color:#5b6b7c;margin-top:5px;line-height:1.2}
.lst{list-style:none}
.lst li{padding:7px 0;border-top:1px solid var(--linha);font-size:.9rem;color:#42525f;display:flex;gap:12px}
.lst li:first-child{border-top:0}
.lst li .d{font-family:'Poppins',sans-serif;font-weight:600;color:var(--azul);white-space:nowrap;min-width:78px}
.okline{color:var(--ok);font-weight:600;font-size:.9rem}
.tnotas{width:100%;border-collapse:collapse;font-size:.86rem}
.tnotas th,.tnotas td{padding:8px 8px;border-bottom:1px solid var(--linha);text-align:center}
.tnotas th{font-family:'Poppins',sans-serif;font-weight:600;color:#5b6b7c;font-size:.7rem;text-transform:uppercase;letter-spacing:.04em}
.tnotas td.s,.tnotas th.s{text-align:left;font-weight:600}
.tnotas .num{font-family:'Poppins',sans-serif;font-weight:700}
@media(max-width:560px){.stats{grid-template-columns:repeat(3,1fr)}.skills{grid-template-columns:1fr}}
.ft{padding:18px 32px 26px;border-top:1px solid var(--linha);margin-top:10px;color:#5b6b7c;font-size:.85rem;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.ft .tag{font-family:'Zilla Slab',serif;font-style:italic;font-weight:600;color:var(--azul);font-size:1.05rem;white-space:nowrap}
@media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;max-width:100%}}
@page{margin:12mm}`;
function montarBoletimHTML(turmaId, alunoId){
  const turma=S.turmas.find(t=>t.id===turmaId)||{}, aluno=S.alunos.find(a=>a.id===alunoId)||{};
  const b=boletimDe(turmaId,alunoId,true);
  const esc=s=>(s==null?'':s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const ano=b.ano||new Date().getFullYear();
  // conceitos finais por habilidade
  const concs=SKILLS.map(s=>{
    const dist=!!(b.distincao&&b.distincao[s]);
    let v=(b.conceitos[s]!=null&&b.conceitos[s]!=='')?b.conceitos[s]:mediaSkillAno(turmaId,alunoId,s);
    return {s, dist, v:(v===''||v==null?'':v), bd:bandaConceito(v===''||v==null?'':v)};
  });
  const distGeral=!!b.distincaoGeral;
  let geral=(b.conceitoGeral!=null&&b.conceitoGeral!=='')?b.conceitoGeral:mediaConceitosBoletim();
  const bg=bandaConceito(geral===''||geral==null?'':geral);
  const chip=l=> l==='in need of improvement'?'needs work':l;
  const skillsHTML=concs.map(c=> c.dist
    ? `<div class="sk dist"><span class="skn">${c.s}</span><span class="seal">★ Distinction</span></div>`
    : `<div class="sk"><span class="skn">${c.s}</span><span class="skv" style="color:${c.bd.cor}">${c.v===''?'—':c.v}</span><span class="chip" style="background:${c.bd.bg};color:${c.bd.cor}">${chip(c.bd.label)}</span></div>`).join('');
  // acompanhamento (apenas totais do ano — sem detalhar datas/itens)
  const faltas=faltasDoAluno(alunoId,turmaId), atrasos=atrasosDoAluno(alunoId,turmaId), saidas=saidasCedoDoAluno(alunoId,turmaId);
  const mat=materialDoAluno(alunoId,turmaId), temas=temasNaoFeitosDoAluno(alunoId,turmaId);
  const tile=(v,k)=>`<div class="st"><div class="v">${v}</div><div class="k">${k}</div></div>`;
  const repHTML=`<div class="stats">${tile(faltas.length,'Faltas')}${tile(atrasos.length,'Atrasos')}${tile(saidas.length,'Saídas antecip.')}${tile(mat.length,'Aulas sem material')}${tile(temas.length,'Temas pendentes')}</div>`;
  const assinatura=(S.config&&S.config.assinatura)||'Equipe Togethere';
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boletim — ${esc(aluno.nome)}</title>
<style>${DOC_CSS}</style></head>
<body><div class="page">
  <div class="hd"><img src="${LOGO_B64}" alt="Togethere">
    <div><div class="nm">Togethere</div><div class="tg">inglês para chegar lá</div></div>
    <div class="doc"><b>Boletim</b><span>${ano}</span></div></div>
  <div class="who"><div class="al">${esc(aluno.nome)}</div>
    <div class="meta">${esc(turma.nome)}${turma.cefr?' · Nível '+esc(turma.cefr):''}${turma.professor?' · Prof. '+esc(turma.professor):''} · Emitido em ${brDate(hoje())}</div></div>
  <div class="sec"><h2>Conceito final geral</h2>
    ${distGeral
      ? `<div class="geral dist"><div class="seal big">★ Distinction</div><div><div class="cap">Desempenho acima do esperado para o nível ${esc(turma.cefr||turma.nome)}</div></div></div>`
      : `<div class="geral"><div class="num" style="color:${bg.cor}">${geral===''||geral==null?'—':geral}</div>
      <div><div class="lab" style="color:${bg.cor}">${bg.label}</div><div class="cap">Resultado do aluno no nível ${esc(turma.cefr||turma.nome)}</div></div></div>`}</div>
  <div class="sec"><h2>Desempenho por habilidade</h2><div class="skills">${skillsHTML}</div></div>
  <div class="sec"><h2>O que significam os conceitos</h2><div class="conceitos">
    <div class="ci"><span class="dot" style="background:var(--vermelho)"></span><div><b style="color:var(--vermelho)">In need of improvement</b> <small>(0–59)</small> — <span class="ds">ainda não demonstrou domínio suficiente desta habilidade.</span></div></div>
    <div class="ci"><span class="dot" style="background:var(--ok)"></span><div><b style="color:var(--ok)">Pass</b> <small>(60–89)</small> — <span class="ds">demonstrou competência satisfatória no nível.</span></div></div>
    <div class="ci"><span class="dot" style="background:var(--azul)"></span><div><b style="color:var(--azul)">Merit</b> <small>(90–100)</small> — <span class="ds">demonstrou competência forte, acima do nível de aprovação.</span></div></div>
    <div class="ci"><span class="dot" style="background:#B8860B"></span><div><b style="color:#B8860B">★ Distinction</b> — <span class="ds">superou o esperado para o nível; desempenho excepcional (concedido sem nota numérica).</span></div></div>
  </div></div>
  <div class="sec"><h2>Parecer descritivo do professor</h2><div class="parecer${(b.parecer||'').trim()?'':' vazio'}">${esc((b.parecer||'').trim())||'Sem parecer registrado.'}</div></div>
  <div class="sec"><h2>Acompanhamento no ano</h2>${repHTML}</div>
  <div class="ft"><div>${esc(assinatura).replace(/\n/g,'<br>')}<br><small>Emitido por ${esc(S.usuario)} em ${brDate(hoje())}</small></div><div class="tag">Togethere</div></div>
</div></body></html>`;
  // versão texto (para copiar / WhatsApp)
  let txt=`BOLETIM ${ano}\n${aluno.nome}\nTurma: ${turma.nome}${turma.cefr?' · Nível '+turma.cefr:''}${turma.professor?' · Prof. '+turma.professor:''}\nGerado em ${brDate(hoje())} por ${S.usuario}\n`;
  txt+=`\n🎯 CONCEITOS FINAIS POR HABILIDADE\n`+concs.map(c=>`• ${c.s}: ${c.dist?'★ Distinction':(c.v===''?'—':c.v+'  ('+c.bd.label+')')}`).join('\n')+`\n`;
  txt+=`\n🏅 CONCEITO FINAL GERAL: ${distGeral?'★ Distinction':(geral===''||geral==null?'—':geral+'  ('+bg.label+')')}\n`;
  txt+=`\n📝 PARECER DESCRITIVO\n${(b.parecer||'').trim()||'(sem parecer)'}\n`;
  txt+=`\n📊 ACOMPANHAMENTO NO ANO\nFaltas: ${faltas.length} · Atrasos: ${atrasos.length} · Saídas antecipadas: ${saidas.length} · Aulas sem material: ${mat.length} · Temas pendentes: ${temas.length}\n`;
  txt+=`\n—\nTogethere · inglês para chegar lá`;
  return {html, txt};
}
function copiarBoletim(){ if(!_boletimTxt)return toast('Gere o boletim primeiro'); copiarTexto(_boletimTxt,'Boletim copiado!'); }
function imprimirDoc(html){
  // imprime sem abrir janela nova (evita ficar preso em tela cheia no PWA/iPad)
  let f=document.getElementById('printFrame'); if(f) f.remove();
  f=document.createElement('iframe'); f.id='printFrame'; f.setAttribute('aria-hidden','true');
  f.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0';
  document.body.appendChild(f);
  let feito=false;
  const go=()=>{ if(feito)return; feito=true; try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast('Não consegui abrir a impressão'); } };
  const d=f.contentWindow.document; d.open(); d.write(html); d.close();
  f.onload=()=>setTimeout(go,450);
  setTimeout(go,1200); // garantia caso o onload não dispare
}
function imprimirBoletim(){ if(!_boletimHTML)return toast('Gere o boletim primeiro'); if(!_boletimAprovadoOuAvisa()) return; imprimirDoc(_boletimHTML); }

