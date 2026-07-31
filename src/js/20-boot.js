/* =========================================================================
   BOOT
   ========================================================================= */

/* =========================================================================
   b22 — Trocar/criar turma + aniversariantes
   ========================================================================= */
const TRILHAS={
  kids:{label:'KIDS', niveis:['Pré A1','Pré A1+','A1','A1+']},
  junior:{label:'JUNIOR', niveis:['A1','A1+','A2','A2+']},
  teens:{label:'TEENS', niveis:['A1','A2','B1','B1+']},
  adults:{label:'ADULTS', niveis:['Pré A1','A1','A2','B1','B1+']},
  avancado:{label:'Sem faixa etária', niveis:['B2','C1','C1+','C2']}
};
function _selTurmasOpts(sel){ return turmasVisiveis().slice().sort((a,b)=>a.nome.localeCompare(b.nome)).map(t=>`<option value="${t.id}" ${t.id===sel?'selected':''}>${t.nome}</option>`).join(''); }
/* ===== Varredura de duplicidades (b44) ===== */
function _normTxt(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim(); }
function _normNomeAluno(s){ return _normTxt(s); }
function _normNomeTurma(s){ return _normTxt(s).replace(/\([^)]*\)/g,'').replace(/[^a-z0-9+]+/g,''); }
function _refsDaTurma(tid){
  const c={alunos:0,presencas:0,planos:0,temas:0,testes:0,material:0,relatorios:0};
  (S.alunos||[]).forEach(a=>{ if(a.turmaId===tid) c.alunos++; });
  ['presencas','planos','temas','testes','material','relatorios'].forEach(col=>{ (S[col]||[]).forEach(r=>{ if(r&&r.turmaId===tid) c[col]++; }); });
  return c;
}
function _turmaNomePorId(tid){ const t=(S.turmas||[]).find(x=>x.id===tid); return t?t.nome:'(turma inexistente)'; }
function escanearDuplicidades(){
  const turmas=S.turmas||[], alunos=S.alunos||[];
  const tg={};
  turmas.forEach(t=>{ const nk=_normNomeTurma(t.nome); if(!nk) return; const k=nk+'|'+((t.dias||[]).slice().sort((x,y)=>x-y).join(',')); (tg[k]=tg[k]||[]).push(t); });
  const turmasDup=Object.values(tg).filter(g=>g.length>1);
  const ag={};
  alunos.forEach(a=>{ if(a.arquivado) return; const k=_normNomeAluno(a.nome); if(!k) return; (ag[k]=ag[k]||[]).push(a); });
  const alunosDup=Object.values(ag).filter(g=>g.length>1);
  const idsT=new Set(turmas.map(t=>t.id));
  const cols=['presencas','material','temas','testes','planos','relatorios'];
  const orfaos={};
  cols.forEach(c=>{ const arr=(S[c]||[]).filter(r=>r&&r.turmaId && !idsT.has(r.turmaId)); if(arr.length) orfaos[c]=arr; });
  const alunosOrfaos=alunos.filter(a=>a.turmaId && !idsT.has(a.turmaId));
  return {turmasDup, alunosDup, orfaos, alunosOrfaos};
}
function dupDelAluno(id){
  if(ehProfessor()) return toast('Sem permissão');
  const a=(S.alunos||[]).find(x=>x.id===id); if(!a) return;
  if(!confirm('Apagar o aluno duplicado "'+a.nome+'"?\n\nIsto remove SOMENTE este registro. A outra cópia continua no app.')) return;
  S.alunos=(S.alunos||[]).filter(x=>x.id!==id); marcarExcluido('alunos',id);
  save(); VIEWS.dupes(); toast('Aluno duplicado removido');
}
function dupDelTurma(id){
  if(ehProfessor()) return toast('Sem permissão');
  const t=(S.turmas||[]).find(x=>x.id===id); if(!t) return;
  const r=_refsDaTurma(id);
  const temReg=r.alunos||r.presencas||r.planos||r.temas||r.testes||r.material||r.relatorios;
  let msg='Apagar a turma duplicada "'+t.nome+'"?';
  if(temReg){
    msg+='\n\nEsta turma ainda tem:\n• '+r.alunos+' aluno(s)\n• '+r.presencas+' chamada(s)\n• '+r.planos+' plano(s) · '+r.temas+' tema(s) · '+r.testes+' teste(s)\n• '+r.relatorios+' relatório(s)\n\nTUDO isso será apagado junto. Não dá para desfazer.\n\nDica: apague a turma ANTIGA (a que não tem o "(2026)" ou tem menos registros).';
  }
  if(!confirm(msg)) return;
  S.turmas=(S.turmas||[]).filter(x=>x.id!==id); marcarExcluido('turmas',id);
  (S.alunos||[]).filter(a=>a.turmaId===id).forEach(a=>marcarExcluido('alunos',a.id));
  S.alunos=(S.alunos||[]).filter(a=>a.turmaId!==id);
  ['presencas','planos','temas','testes','material','relatorios'].forEach(col=>{
    (S[col]||[]).filter(rr=>rr&&rr.turmaId===id).forEach(rr=>marcarExcluido(col,rr.id));
    S[col]=(S[col]||[]).filter(rr=>!(rr&&rr.turmaId===id));
  });
  save(); montarNav(); VIEWS.dupes(); toast('Turma duplicada removida');
}
function dupDelOrfao(col,id){
  if(ehProfessor()) return toast('Sem permissão');
  if(!confirm('Apagar este registro órfão?\n\nEle pertence a uma turma que não existe mais no app.')) return;
  S[col]=(S[col]||[]).filter(r=>!(r&&r.id===id)); marcarExcluido(col,id);
  save(); VIEWS.dupes(); toast('Registro órfão removido');
}
VIEWS.dupes=()=>{
  const v=document.getElementById('view');
  if(ehProfessor()){ v.innerHTML='<p class="sub">Sem permissão.</p>'; return; }
  const d=escanearDuplicidades();
  const nT=d.turmasDup.length, nA=d.alunosDup.length;
  const nOrf=Object.values(d.orfaos).reduce((s,a)=>s+a.length,0)+d.alunosOrfaos.length;
  const COLLBL={presencas:'Chamada',material:'Material',temas:'Tema',testes:'Teste',planos:'Plano',relatorios:'Relatório'};
  let h=`<div class="section-title"><span class="feijao fj" style="background:var(--azul)"></span><h2 class="display">Limpar duplicidades</h2></div>
    <p class="sub">Procura turmas e alunos repetidos (mesma pessoa/turma cadastrada duas vezes) e registros "soltos". Apague a cópia que sobrou para manter cada um único.</p>
    <div class="card" style="display:flex;gap:10px;flex-wrap:wrap">
      <span class="pill" style="background:${nT?'#fdeaea':'#eafaf0'};color:${nT?'var(--vermelho)':'#1a8a4a'}">🏫 Turmas duplicadas: <b>${nT}</b></span>
      <span class="pill" style="background:${nA?'#fdeaea':'#eafaf0'};color:${nA?'var(--vermelho)':'#1a8a4a'}">👤 Alunos duplicados: <b>${nA}</b></span>
      <span class="pill" style="background:${nOrf?'#fff8e0':'#eafaf0'};color:${nOrf?'#b88600':'#1a8a4a'}">🧩 Registros órfãos: <b>${nOrf}</b></span>
    </div>`;
  if(!nT && !nA && !nOrf){ h+='<div class="card" style="text-align:center;padding:24px"><h3 style="margin:0">✅ Nenhuma duplicidade encontrada</h3><p class="hint" style="margin:8px 0 0">Está tudo limpo por aqui.</p></div>'; v.innerHTML=h; return; }
  // TURMAS
  if(nT){
    h+='<h3 style="margin:18px 0 6px">🏫 Turmas duplicadas</h3>';
    d.turmasDup.forEach(g=>{
      h+='<div class="card" style="padding:12px 14px"><p class="hint" style="margin:0 0 8px">Mesma turma cadastrada '+g.length+' vezes:</p>';
      g.forEach(t=>{
        const r=_refsDaTurma(t.id);
        h+=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--linha);padding:8px 0">
          <div style="flex:1;min-width:160px"><b>${escAttr(t.nome)}</b><br>
            <span class="hint">${escAttr(t.cefr||'')} · ${escAttr(t.professor||'—')} · ${escAttr(t.horario||'')}</span><br>
            <span class="hint">${r.alunos} aluno(s) · ${r.presencas} chamada(s) · ${r.planos} plano(s) · ${r.relatorios} relatório(s)</span></div>
          <button class="btn ghost sm" style="color:var(--vermelho)" onclick="dupDelTurma('${t.id}')">Apagar esta</button>
        </div>`;
      });
      h+='</div>';
    });
  }
  // ALUNOS
  if(nA){
    h+='<h3 style="margin:18px 0 6px">👤 Alunos duplicados</h3>';
    d.alunosDup.forEach(g=>{
      h+='<div class="card" style="padding:12px 14px"><p class="hint" style="margin:0 0 8px"><b>'+escAttr(g[0].nome)+'</b> aparece '+g.length+' vezes:</p>';
      g.forEach(a=>{
        const sal=a.saldo?`${a.saldo.presencas||0}P/${a.saldo.faltas||0}F`:'sem saldo';
        h+=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--linha);padding:8px 0">
          <div style="flex:1;min-width:160px">📍 ${escAttr(_turmaNomePorId(a.turmaId))}<br>
            <span class="hint">${sal} · faltas retro: ${a.faltasRetro||0}</span></div>
          <button class="btn ghost sm" style="color:var(--vermelho)" onclick="dupDelAluno('${a.id}')">Apagar este</button>
        </div>`;
      });
      h+='</div>';
    });
  }
  // ÓRFÃOS
  if(nOrf){
    h+='<h3 style="margin:18px 0 6px">🧩 Registros órfãos</h3><p class="hint" style="margin:0 0 8px">Registros que apontam para uma turma que não existe mais.</p>';
    if(d.alunosOrfaos.length){
      h+='<div class="card" style="padding:12px 14px"><b>Alunos sem turma válida</b>';
      d.alunosOrfaos.forEach(a=>{ h+=`<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--linha);padding:7px 0"><span style="flex:1">${escAttr(a.nome)}</span><button class="btn ghost sm" style="color:var(--vermelho)" onclick="dupDelAluno('${a.id}')">Apagar</button></div>`; });
      h+='</div>';
    }
    Object.keys(d.orfaos).forEach(col=>{
      h+='<div class="card" style="padding:12px 14px"><b>'+(COLLBL[col]||col)+' ('+d.orfaos[col].length+')</b>';
      d.orfaos[col].forEach(r=>{ h+=`<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--linha);padding:7px 0"><span style="flex:1" class="hint">${escAttr(r.data||'')} · turma ${escAttr(r.turmaId||'')}</span><button class="btn ghost sm" style="color:var(--vermelho)" onclick="dupDelOrfao('${col}','${r.id}')">Apagar</button></div>`; });
      h+='</div>';
    });
  }
  v.innerHTML=h;
};
