/* =====================================================================
   RELATÓRIOS E EXPORTAÇÕES (b129)
   • Exportar consumo de horas VIP em planilha (CSV, pt-BR).
   • Relatório mensal por turma (frequência, material, atrasos, temas)
     — abrir/imprimir (PDF) ou baixar planilha (CSV). Uma turma ou todas.
   Reaproveita helpers existentes: vipContratadoMin/vipConsumoMin/…,
   faltasDoAluno, materialDoAluno, atrasosDoAluno, temAula2, _aulaConta.
   ===================================================================== */

// ---------- utilitários de arquivo/planilha ----------
function _dlArquivo(nome, conteudo, tipo){
  const blob=new Blob(['﻿'+conteudo], {type:(tipo||'text/csv;charset=utf-8')});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=nome;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200);
}
function _csvLinha(cols){ return cols.map(c=>{ let s=(c==null?'':String(c)); if(typeof c==='string' && /^[=+@]/.test(s)) s="'"+s;   // evita injeção de fórmula no Excel
  if(/[";\n]/.test(s)) s='"'+s.replace(/"/g,'""')+'"'; return s; }).join(';'); }
function _hnum(min){ return (Math.round(((+min||0)/60)*100)/100).toString().replace('.',','); }   // minutos -> horas com vírgula decimal
const _MESES_PT=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function _nomeMes(ym){ const [y,m]=ym.split('-').map(Number); return (_MESES_PT[m-1]||'')+' / '+y; }
function _mesRange(ym){ const [y,m]=ym.split('-').map(Number); const fim=new Date(y,m,0).getDate(); return {de:ym+'-01', ate:ym+'-'+String(fim).padStart(2,'0')}; }

// ---------- Exportar horas VIP (planilha) ----------
function exportarHorasVipCSV(){
  const lista=(S.vipAlunos||[]).filter(v=>!v.arquivado).sort((a,b)=>a.nome.localeCompare(b.nome));
  const rows=[_csvLinha(['Aluno','Professor','Contratadas (h)','Utilizadas (h)','Aulas no app (h)','Consolidação (h)','Saldo (h)','% consumido','Válido até','Status'])];
  let n=0;
  lista.forEach(v=>{
    const c=vipContratadoMin(v.id), u=vipConsumoMin(v.id), s=c-u;
    if(c===0 && u===0) return;
    const impMin=(S.aulasVip||[]).filter(a=>a.vipId===v.id && a.tema==='Importação' && (!a.faltou||a.cobrarFalta)).reduce((x,a)=>x+(+a.duracaoMin||0),0);
    const al=(typeof vipAlertaPacote==='function')?vipAlertaPacote(v.id):null;
    const fim=vipVigenciaFim(v.id);
    rows.push(_csvLinha([v.nome, v.professor||'', _hnum(c), _hnum(u), _hnum(u-impMin), _hnum(impMin), _hnum(Math.max(0,s)), (c>0?Math.round(u/c*100):''), fim?brDate(fim):'', al?_vipAlertaTxt(al):'ok']));
    n++;
  });
  if(!n) return toast('Nenhum pacote VIP para exportar');
  _dlArquivo('horas-vip-'+hoje()+'.csv', rows.join('\n'));
  toast('Planilha de horas VIP baixada ('+n+' alunos)');
}

// ---------- Relatório mensal por turma ----------
function _statsAlunoMes(alunoId, turmaId, de, ate){
  const inRange=d=>d>=de && d<=ate;
  const dois=(typeof temAula2==='function')?temAula2(turmaId):false;
  let ocorr=0, faltas=0;
  (S.presencas||[]).filter(p=>p.turmaId===turmaId && _aulaConta(p) && inRange(p.data) && p.registros && (alunoId in p.registros)).forEach(p=>{
    const f1=p.registros[alunoId]==='falta';
    if(p.registros2){ ocorr+=2; if(f1)faltas++; if(p.registros2[alunoId]==='falta')faltas++; }
    else if(dois){ ocorr+=2; if(f1)faltas+=2; }
    else { ocorr+=1; if(f1)faltas++; }
  });
  const mat=(materialDoAluno(alunoId,turmaId)||[]).filter(inRange).length;
  const atr=(atrasosDoAluno(alunoId,turmaId)||[]).filter(inRange).length;
  return { ocorr, pres:ocorr-faltas, faltas, mat, atr, pct: ocorr>0?Math.round((ocorr-faltas)/ocorr*100):null };
}
function _temasAlunoMes(alunoId, turmaId, de, ate){
  const ts=(S.temas||[]).filter(t=>t.turmaId===turmaId && t.entregas && (alunoId in t.entregas) && (t.data?(t.data>=de&&t.data<=ate):false));
  let feito=0; ts.forEach(t=>{ const s=t.entregas[alunoId]; if(s===true||s==='atrasado')feito++; });
  return { total:ts.length, feito };
}
function _aulasDadasMes(turmaId, de, ate){ return (S.presencas||[]).filter(p=>p.turmaId===turmaId && _aulaConta(p) && p.fechada && p.data>=de && p.data<=ate).length; }

function _htmlRelMesTurma(turmaId, ym){
  const t=S.turmas.find(x=>x.id===turmaId); if(!t) return '';
  const {de,ate}=_mesRange(ym);
  const als=alunosDa(turmaId).slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  const aulasDadas=_aulasDadasMes(turmaId,de,ate);
  const nTemas=(S.temas||[]).filter(x=>x.turmaId===turmaId && (x.data?(x.data>=de&&x.data<=ate):false)).length;
  const linhas=als.map(a=>{
    const s=_statsAlunoMes(a.id,turmaId,de,ate); const tm=_temasAlunoMes(a.id,turmaId,de,ate);
    const pctTxt=s.pct==null?'—':s.pct+'%';
    const pctCor=s.pct==null?'#888':(s.pct>=75?'#0A7A3D':(s.pct>=50?'#c2560b':'#E52524'));
    return `<tr><td>${esc(a.nome)}</td><td class="c">${s.pres}/${s.ocorr}</td><td class="c">${s.faltas||''}</td><td class="c" style="color:${pctCor};font-weight:700">${pctTxt}</td><td class="c">${s.atr||''}</td><td class="c">${s.mat||''}</td><td class="c">${tm.total?(tm.feito+'/'+tm.total):'—'}</td></tr>`;
  }).join('');
  return `<section>
    <h2>${esc(t.nome)} <span class="sub">${esc(nivelTxt(t))}${t.professor?(' · Prof. '+esc(t.professor)):''}</span></h2>
    <p class="meta">Aulas dadas no mês: <b>${aulasDadas}</b> · Temas lançados: <b>${nTemas}</b> · Alunos: <b>${als.length}</b></p>
    ${als.length? `<table><thead><tr><th>Aluno</th><th class="c">Presença</th><th class="c">Faltas</th><th class="c">% pres.</th><th class="c">Atrasos</th><th class="c">Sem mat.</th><th class="c">Temas</th></tr></thead><tbody>${linhas}</tbody></table>`
      : '<p class="vazio">Nenhum aluno nesta turma.</p>'}
    ${aulasDadas===0?'<p class="vazio">Nenhuma aula registrada neste mês.</p>':''}
  </section>`;
}
function nivelTxt(t){ return (t.nivel||'')+(t.cefr?(' '+t.cefr):''); }

function _wrapPrintRelMes(titulo, corpo){
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
@page{ margin:14mm }
*{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box }
body{ font-family:'Urbanist',system-ui,Arial,sans-serif; color:#15233b; margin:0; padding:6px 2px }
h1{ font-family:'Zilla Slab',Georgia,serif; color:#005EAF; font-size:20px; margin:0 0 2px }
.top{ display:flex; align-items:baseline; gap:10px; border-bottom:3px solid #FFC800; padding-bottom:6px; margin-bottom:14px }
.top .per{ margin-left:auto; color:#5a6b86; font-size:12px }
section{ break-inside:avoid; margin-bottom:20px }
h2{ font-family:'Zilla Slab',Georgia,serif; font-size:15px; margin:0 0 2px; color:#002B64 }
h2 .sub{ font-family:'Urbanist',sans-serif; font-weight:400; font-size:11px; color:#5a6b86 }
.meta{ font-size:11.5px; color:#5a6b86; margin:0 0 8px }
table{ width:100%; border-collapse:collapse; font-size:11.5px }
th,td{ border:1px solid #DCE4EC; padding:4px 7px; text-align:left }
th{ background:#F0F6FC; color:#002B64; font-weight:700 }
td.c,th.c{ text-align:center }
tbody tr:nth-child(even){ background:#fafcff }
.vazio{ color:#8a97a8; font-size:12px; font-style:italic }
.foot{ margin-top:16px; color:#8a97a8; font-size:10.5px; border-top:1px solid #DCE4EC; padding-top:6px }
</style></head><body>
<div class="top"><h1>Togethere</h1><div><div style="font-weight:700">${esc(titulo)}</div></div><div class="per">Gerado em ${brDate(hoje())} por ${esc(S.usuario||'')}</div></div>
${corpo}
<p class="foot">Presença = aulas presentes / total de aulas do aluno no mês. Turmas 1x/semana contam cada aula em dobro. "Sem mat." = aulas sem material. Temas = feitos / lançados no mês.</p>
</body></html>`;
}

function abrirRelatorioMensal(turmaId){
  const now=new Date();
  let opts='';
  for(let i=0;i<12;i++){ const d=new Date(now.getFullYear(), now.getMonth()-i, 1); const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); opts+=`<option value="${ym}">${_nomeMes(ym)}</option>`; }
  const nome = turmaId?turmaNome(turmaId):'';
  modal(`<h3>📄 Relatório mensal <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 10px">Frequência, material, atrasos e temas do mês${nome?(' — <b>'+esc(nome)+'</b>'):''}.</p>
    <div class="field"><label class="lbl">Mês</label><select id="rmMes">${opts}</select></div>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;margin:4px 0 12px"><input type="checkbox" id="rmTodas" ${turmaId?'':'checked'}> Gerar para <b>&nbsp;todas as turmas</b></label>
    <div class="row" style="gap:8px"><button class="btn" onclick="gerarRelatorioMensal('${turmaId||''}',document.getElementById('rmMes').value,'print')">🖨️ Abrir / PDF</button>
      <button class="btn ghost" onclick="gerarRelatorioMensal('${turmaId||''}',document.getElementById('rmMes').value,'csv')">⬇️ Planilha</button></div>`);
}
function _turmasRelMes(turmaId){
  const todas=(document.getElementById('rmTodas')||{}).checked || !turmaId;
  if(todas){ const base=(typeof turmasVisiveis==='function')?turmasVisiveis():(S.turmas||[]); return base.filter(t=>!t.arquivada).sort((a,b)=>a.nome.localeCompare(b.nome)).map(t=>t.id); }
  return [turmaId];
}
function gerarRelatorioMensal(turmaId, ym, modo){
  const ids=_turmasRelMes(turmaId);
  if(!ids.length) return toast('Nenhuma turma para o relatório');
  if(modo==='csv'){
    const {de,ate}=_mesRange(ym);
    const rows=[_csvLinha(['Turma','Aluno','Presenças','Total aulas','Faltas','% presença','Atrasos','Sem material','Temas feitos','Temas lançados'])];
    ids.forEach(tid=>{ const t=S.turmas.find(x=>x.id===tid);
      alunosDa(tid).slice().sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(a=>{ const s=_statsAlunoMes(a.id,tid,de,ate); const tm=_temasAlunoMes(a.id,tid,de,ate);
        rows.push(_csvLinha([t?t.nome:'', a.nome, s.pres, s.ocorr, s.faltas, s.pct==null?'':s.pct, s.atr, s.mat, tm.feito, tm.total])); });
    });
    _dlArquivo('relatorio-mensal-'+ym+(ids.length>1?'-todas':'')+'.csv', rows.join('\n'));
    fechar(); toast('Planilha do relatório baixada'); return;
  }
  const corpo=ids.map(tid=>_htmlRelMesTurma(tid, ym)).join('');
  fechar();
  imprimirDoc(_wrapPrintRelMes('Relatório mensal — '+_nomeMes(ym), corpo));
}

// ===================== BUSCA GLOBAL (aluno / turma / VIP) =====================
let _buscaGlobalQ='';
VIEWS.busca=()=>{
  const v=document.getElementById('view');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">🔎 Buscar</h2></div>
    <p class="sub">Ache um aluno, turma ou aluno VIP e vá direto pra ficha ou pro painel da turma.</p>
    <div class="card"><input type="text" id="buscaGlobalInp" placeholder="Digite um nome…" value="${escAttr(_buscaGlobalQ)}" oninput="_buscaGlobal(this.value)" onkeydown="if(event.key==='Escape'){this.value='';_buscaGlobal('');}" autocomplete="off" autocapitalize="off"></div>
    <div id="buscaGlobalRes"></div>`;
  setTimeout(()=>{ const i=document.getElementById('buscaGlobalInp'); if(i){ const val=i.value; i.focus(); i.value=''; i.value=val; } }, 60);
  _renderBuscaGlobal();
};
function _buscaGlobal(q){ _buscaGlobalQ=q; _renderBuscaGlobal(); }
function _renderBuscaGlobal(){
  const box=document.getElementById('buscaGlobalRes'); if(!box) return;
  const q=_normTxt(_buscaGlobalQ||'').trim();
  if(q.length<2){ box.innerHTML='<p class="hint" style="margin:12px 4px">Digite ao menos 2 letras para buscar.</p>'; return; }
  const ts=(typeof turmasVisiveis==='function')?turmasVisiveis():(S.turmas||[]);
  const MAX=25;
  const turmas=ts.filter(t=>_normTxt(t.nome).includes(q) || _normTxt(t.professor||'').includes(q) || _normTxt((t.nivel||'')+' '+(t.cefr||'')).includes(q));
  const alunos=[]; ts.forEach(t=>alunosDa(t.id).forEach(a=>{ if(_normTxt(a.nome).includes(q)) alunos.push({a,t}); }));
  alunos.sort((x,y)=>x.a.nome.localeCompare(y.a.nome));
  const gestor=(S.perfil==='direcao'||S.perfil==='secretaria');
  const meuEns=(typeof _meuEnsina==='function')?_meuEnsina():'';
  const vips=(S.vipAlunos||[]).filter(x=>!x.arquivado && (gestor || x.professor===meuEns) && _normTxt(x.nome).includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  const total=turmas.length+alunos.length+vips.length;
  if(!total){ box.innerHTML=`<div class="card empty"><div class="big">🔎</div>Nada encontrado para “${esc(_buscaGlobalQ)}”.</div>`; return; }
  const cap=(arr,fn)=>arr.slice(0,MAX).map(fn).join('')+(arr.length>MAX?`<p class="hint" style="margin:4px 0 0">+${arr.length-MAX} resultado(s)… refine a busca.</p>`:'');
  let h='';
  if(alunos.length) h+=`<div class="card"><h3 style="margin:0 0 6px">🧑‍🎓 Alunos (${alunos.length})</h3>${cap(alunos,r=>`<div class="check"><span style="flex:1">${esc(r.a.nome)} <span class="pill">${esc(r.t.nome)}</span></span><button class="btn ghost sm" onclick="abrirFicha('${r.a.id}')">📇 Ficha</button><button class="btn ghost sm" onclick="abrirTurma('${r.t.id}')">🏫 Turma</button></div>`)}</div>`;
  if(vips.length) h+=`<div class="card"><h3 style="margin:0 0 6px">👑 Alunos VIP (${vips.length})</h3>${cap(vips,v=>`<div class="check"><span style="flex:1">${esc(v.nome)}${v.professor?` <span class="pill">${esc(v.professor)}</span>`:''}</span><button class="btn ghost sm" onclick="abrirFicha('${v.id}')">📇 Ficha</button></div>`)}</div>`;
  if(turmas.length) h+=`<div class="card"><h3 style="margin:0 0 6px">🏫 Turmas (${turmas.length})</h3>${cap(turmas,t=>`<div class="check"><span style="flex:1">${esc(t.nome)}${t.professor?` <span class="pill">${esc(t.professor)}</span>`:''}${t.arquivada?' <span class="pill" style="background:#eef0f4;color:#7a8798">arquivada</span>':''}</span><button class="btn ghost sm" onclick="abrirTurma('${t.id}')">🏫 Abrir</button></div>`)}</div>`;
  box.innerHTML=h;
}

// ===================== MODO ESCURO =====================
const TEMAS_COR={
  azul:    {n:'Azul clássico', c:'#005EAF'},
  marinho: {n:'Marinho',       c:'#123A7B'},
  vermelho:{n:'Vermelho',      c:'#D31F1E'},
  rosa:    {n:'Rosa',          c:'#DE0055'},
  roxo:    {n:'Roxo',          c:'#8E2DC4'},
  verde:   {n:'Verde',         c:'#0E8A63'},
};
function _corSalva(){ try{ const c=localStorage.getItem('togethere_cor')||'azul'; return TEMAS_COR[c]?c:'azul'; }catch(e){ return 'azul'; } }
function _metaTheme(){ try{ const mc=document.querySelector('meta[name=theme-color]'); if(!mc) return; const dark=document.body.classList.contains('dark'); mc.setAttribute('content', dark?'#0f1626':(TEMAS_COR[_corSalva()]||TEMAS_COR.azul).c); }catch(e){} }
function _aplicarCor(k){
  if(!TEMAS_COR[k]) k='azul';
  if(k==='azul') delete document.body.dataset.tema; else document.body.dataset.tema=k;
  _renderCorDots(); _metaTheme();
}
function setCorTema(k){ try{ localStorage.setItem('togethere_cor',k); }catch(e){} _aplicarCor(k); if(typeof toast==='function') toast('Cor do app: '+(TEMAS_COR[k]||TEMAS_COR.azul).n); }
function _renderCorDots(){
  const box=document.getElementById('corTemas'); if(!box) return;
  const cur=_corSalva();
  box.innerHTML=Object.keys(TEMAS_COR).map(k=>`<button type="button" title="${TEMAS_COR[k].n}" aria-label="${TEMAS_COR[k].n}" onclick="setCorTema('${k}')" style="width:27px;height:27px;border-radius:50%;background:${TEMAS_COR[k].c};border:3px solid ${k===cur?'var(--tinta)':'rgba(0,0,0,.08)'};cursor:pointer;padding:0;box-shadow:${k===cur?'0 0 0 2px var(--card)':'none'}"></button>`).join('');
}
function _temaSalvo(){ try{ return localStorage.getItem('togethere_tema')||'claro'; }catch(e){ return 'claro'; } }
function _aplicarTema(t){
  document.body.classList.toggle('dark', t==='escuro');
  const b=document.getElementById('btnTema'); if(b) b.textContent = (t==='escuro'?'☀️ Modo claro':'🌙 Modo escuro');
  if(typeof _metaTheme==='function') _metaTheme();
}
function toggleTema(){ const novo=(_temaSalvo()==='escuro')?'claro':'escuro'; try{ localStorage.setItem('togethere_tema',novo); }catch(e){} _aplicarTema(novo); if(typeof toast==='function') toast(novo==='escuro'?'Modo escuro ativado':'Modo claro ativado'); }
try{ _aplicarTema(_temaSalvo()); _aplicarCor(_corSalva()); }catch(e){}
